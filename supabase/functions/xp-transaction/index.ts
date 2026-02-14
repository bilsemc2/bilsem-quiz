import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface XPTransactionRequest {
    action: "gain" | "deduct";
    amount?: number;
    reason?: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Get auth token from request
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "Authorization header required" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Create Supabase client with user's token
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
        });

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Parse request body
        const body: XPTransactionRequest = await req.json();
        const { action, reason = "Sistem" } = body;
        let { amount = 1 } = body;

        // Server-side amount validation
        if (!amount || amount <= 0 || !Number.isFinite(amount)) {
            return new Response(
                JSON.stringify({ error: "Invalid amount" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }
        amount = Math.floor(amount); // Ensure integer
        const MAX_GAIN = 5;
        const MAX_DEDUCT = 100;
        if (action === "gain") amount = Math.min(amount, MAX_GAIN);
        else if (action === "deduct") amount = Math.min(amount, MAX_DEDUCT);

        // Use service role client for database operations
        const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get current profile with experience
        const { data: profile, error: profileError } = await adminSupabase
            .from("profiles")
            .select("experience")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) {
            return new Response(
                JSON.stringify({ error: "Profile not found" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const currentXP = profile.experience || 0;

        // For XP gain: Rate limiting check
        if (action === "gain") {
            // Check last XP gain time (must be at least 45 seconds ago)
            const { data: lastLog, error: logError } = await adminSupabase
                .from("experience_log")
                .select("changed_at")
                .eq("user_id", user.id)
                .eq("change_reason", "Pasif Aktivite")
                .order("changed_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (!logError && lastLog) {
                const lastGainTime = new Date(lastLog.changed_at).getTime();
                const now = Date.now();
                const timeSinceLastGain = now - lastGainTime;

                // Rate limit: 45 seconds minimum between gains
                if (timeSinceLastGain < 45000) {
                    return new Response(
                        JSON.stringify({
                            error: "Rate limited",
                            remainingSeconds: Math.ceil((45000 - timeSinceLastGain) / 1000)
                        }),
                        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }
            }
        }

        // For XP deduct: Rate limiting check (same reason within 5 minutes)
        if (action === "deduct" && reason) {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

            const { count: recentCount, error: recentError } = await adminSupabase
                .from("experience_log")
                .select("*", { count: "exact", head: true })
                .eq("user_id", user.id)
                .eq("change_reason", reason)
                .gte("changed_at", fiveMinutesAgo);

            if (!recentError && recentCount && recentCount > 0) {
                return new Response(
                    JSON.stringify({
                        success: true,
                        oldXP: currentXP,
                        newXP: currentXP,
                        change: 0,
                        throttled: true
                    }),
                    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
        }

        // Calculate new XP
        let newXP: number;
        let changeAmount: number;

        if (action === "gain") {
            newXP = currentXP + amount;
            changeAmount = amount;
        } else if (action === "deduct") {
            if (currentXP < amount) {
                return new Response(
                    JSON.stringify({ error: "Insufficient XP", currentXP, requiredXP: amount }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
            newXP = currentXP - amount;
            changeAmount = -amount;
        } else {
            return new Response(
                JSON.stringify({ error: "Invalid action" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Atomic update
        const { error: updateError } = await adminSupabase
            .from("profiles")
            .update({ experience: newXP })
            .eq("id", user.id);

        if (updateError) {
            return new Response(
                JSON.stringify({ error: "Failed to update XP" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Log the transaction
        await adminSupabase.from("experience_log").insert({
            user_id: user.id,
            change_amount: changeAmount,
            old_experience: currentXP,
            new_experience: newXP,
            change_reason: action === "gain" ? "Pasif Aktivite" : reason,
        });

        return new Response(
            JSON.stringify({
                success: true,
                oldXP: currentXP,
                newXP,
                change: changeAmount
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("XP Transaction Error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

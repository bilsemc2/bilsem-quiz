import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5MB

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Auth check — only logged-in users can use the proxy
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "Authorization required" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const body = await req.json();
        const { url } = body;

        if (!url || typeof url !== "string") {
            return new Response(
                JSON.stringify({ error: "URL is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // URL validation
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch {
            return new Response(
                JSON.stringify({ error: "Invalid URL" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Only allow HTTPS
        if (parsedUrl.protocol !== "https:") {
            return new Response(
                JSON.stringify({ error: "Only HTTPS URLs allowed" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Fetch the image with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: { "Accept": "image/*" },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return new Response(
                JSON.stringify({ error: `Upstream returned ${response.status}` }),
                { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Content-Type check
        const contentType = response.headers.get("Content-Type") || "";
        if (!contentType.startsWith("image/")) {
            return new Response(
                JSON.stringify({ error: "Response is not an image" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Size check
        const contentLength = parseInt(response.headers.get("Content-Length") || "0", 10);
        if (contentLength > MAX_RESPONSE_SIZE) {
            return new Response(
                JSON.stringify({ error: "Image too large (max 5MB)" }),
                { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const imageBuffer = await response.arrayBuffer();

        if (imageBuffer.byteLength > MAX_RESPONSE_SIZE) {
            return new Response(
                JSON.stringify({ error: "Image too large (max 5MB)" }),
                { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Return the image with proper headers
        return new Response(imageBuffer, {
            status: 200,
            headers: {
                ...corsHeaders,
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400", // 24h cache
            },
        });

    } catch (error) {
        const message = error instanceof Error && error.name === "AbortError"
            ? "Request timeout"
            : "Internal server error";

        return new Response(
            JSON.stringify({ error: message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

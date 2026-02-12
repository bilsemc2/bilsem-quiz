'use server';

import { z } from 'zod';

import { recordGamePlay } from '@/server/services/game.service';

const submitGameResultSchema = z.object({
  userId: z.string().uuid().optional(),
  gameId: z.string().min(1),
  score: z.number().int().nonnegative(),
  durationSeconds: z.number().int().nonnegative(),
  livesRemaining: z.number().int().nullable().optional(),
  workshopType: z.string().optional(),
  intelligenceType: z.string().optional(),
});

export interface SubmitGameResultState {
  ok: boolean;
  message: string;
  gamePlayId?: string;
}

export async function submitGameResultAction(
  _prevState: SubmitGameResultState,
  formData: FormData,
): Promise<SubmitGameResultState> {
  const parsed = submitGameResultSchema.safeParse({
    userId: formData.get('userId') || undefined,
    gameId: formData.get('gameId'),
    score: Number(formData.get('score')),
    durationSeconds: Number(formData.get('durationSeconds')),
    livesRemaining: formData.get('livesRemaining')
      ? Number(formData.get('livesRemaining'))
      : undefined,
    workshopType: (formData.get('workshopType') as string | null) ?? undefined,
    intelligenceType: (formData.get('intelligenceType') as string | null) ?? undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Gecersiz oyun sonucu payload.',
    };
  }

  try {
    const gamePlayId = await recordGamePlay({
      userId: parsed.data.userId ?? null,
      gameId: parsed.data.gameId,
      scoreAchieved: parsed.data.score,
      durationSeconds: parsed.data.durationSeconds,
      livesRemaining: parsed.data.livesRemaining ?? null,
      workshopType: parsed.data.workshopType ?? null,
      intelligenceType: parsed.data.intelligenceType ?? null,
      metadata: { source: 'next-app-skeleton-action' },
    });

    return {
      ok: true,
      message: `${parsed.data.gameId} sonucu kaydedildi.`,
      gamePlayId,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Beklenmeyen DB hatasi',
    };
  }
}

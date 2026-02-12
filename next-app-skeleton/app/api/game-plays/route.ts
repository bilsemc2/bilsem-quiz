import { NextResponse } from 'next/server';
import { z } from 'zod';

import { recordGamePlay } from '@/server/services/game.service';

const createGamePlaySchema = z.object({
  userId: z.string().uuid().nullable().optional(),
  gameId: z.string().min(1),
  scoreAchieved: z.number().int().nonnegative(),
  durationSeconds: z.number().int().nonnegative(),
  livesRemaining: z.number().int().nullable().optional(),
  workshopType: z.string().nullable().optional(),
  intelligenceType: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = createGamePlaySchema.parse(body);

    const id = await recordGamePlay({
      userId: payload.userId ?? null,
      gameId: payload.gameId,
      scoreAchieved: payload.scoreAchieved,
      durationSeconds: payload.durationSeconds,
      livesRemaining: payload.livesRemaining ?? null,
      workshopType: payload.workshopType ?? null,
      intelligenceType: payload.intelligenceType ?? null,
      metadata: payload.metadata,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Gecersiz game play payload',
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: 'Game play kaydedilemedi',
        detail: error instanceof Error ? error.message : 'unknown_error',
      },
      { status: 500 },
    );
  }
}

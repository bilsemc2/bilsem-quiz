import { NextResponse } from 'next/server';

import { getGameById } from '@/server/services/game.service';

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ gameId: string }>;
  },
) {
  const { gameId } = await context.params;
  const game = await getGameById(gameId);

  if (!game) {
    return NextResponse.json({ message: 'Game not found' }, { status: 404 });
  }

  return NextResponse.json(game, { status: 200 });
}

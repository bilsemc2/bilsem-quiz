import { NextResponse } from 'next/server';

import { pingDatabase } from '@/server/db/client';

export async function GET() {
  const database = await pingDatabase();

  return NextResponse.json(
    {
      status: 'ok',
      database,
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}

import { NextResponse } from 'next/server';

import { listProfileSummaries } from '@/server/services/profile.service';

export async function GET() {
  try {
    const profiles = await listProfileSummaries(50);
    return NextResponse.json(profiles, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Profiles okunamadi',
        detail: error instanceof Error ? error.message : 'unknown_error',
      },
      { status: 500 },
    );
  }
}

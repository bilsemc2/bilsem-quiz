import { NextResponse } from 'next/server';

import { listStories } from '@/server/services/story.service';

export async function GET() {
  const stories = await listStories(20);
  return NextResponse.json(stories, { status: 200 });
}

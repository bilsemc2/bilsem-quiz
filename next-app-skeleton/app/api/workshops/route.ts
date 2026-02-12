import { NextResponse } from 'next/server';

import { listWorkshops } from '@/server/services/workshop.service';

export async function GET() {
  const workshops = await listWorkshops();
  return NextResponse.json(workshops, { status: 200 });
}

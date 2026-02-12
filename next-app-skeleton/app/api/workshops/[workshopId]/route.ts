import { NextResponse } from 'next/server';

import { getWorkshopDetail } from '@/server/services/workshop.service';

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ workshopId: string }>;
  },
) {
  const { workshopId } = await context.params;
  const workshop = await getWorkshopDetail(workshopId);

  if (!workshop) {
    return NextResponse.json({ message: 'Workshop not found' }, { status: 404 });
  }

  return NextResponse.json(workshop, { status: 200 });
}

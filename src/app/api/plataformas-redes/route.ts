import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRetry, getFriendlyErrorMessage } from '@/lib/database/retry-helper';

export async function GET() {
  try {
    const plataformas = await withRetry(async () => {
      return await prisma.platform_social_networks.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          color: true,
          icon: true,
          baseUrl: true,
          order: true,
        }
      });
    });

    return NextResponse.json(plataformas);
  } catch (error) {
    console.error('Error fetching plataformas activas:', error);
    return NextResponse.json(
      { error: getFriendlyErrorMessage(error) },
      { status: 500 }
    );
  }
}

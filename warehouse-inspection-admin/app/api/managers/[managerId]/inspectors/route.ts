import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { managerId: string } }
) {
  try {
    const { managerId } = params;

    // Validate managerId
    if (!managerId || isNaN(Number(managerId))) {
      return NextResponse.json(
        { error: 'Invalid manager ID' },
        { status: 400 }
      );
    }

    // Fetch inspectors under this manager
    const inspectors = await db.user.findMany({
      where: {
        managerId: Number(managerId),
        role: 'INSPECTOR',
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        isActive: true,
        lastActive: true,
        _count: {
          select: {
            inspections: true,
            pendingInspections: {
              where: { status: 'PENDING' }
            },
            completedInspections: {
              where: { status: 'COMPLETED' }
            }
          }
        }
      },
      orderBy: {
        fullName: 'asc',
      },
    });

    // Format the response
    const formattedInspectors = inspectors.map(
      (inspector: {
        id: number;
        username: string;
        fullName: string;
        email: string;
        isActive: boolean;
        lastActive?: Date;
        _count: {
          inspections: number;
          pendingInspections: number;
          completedInspections: number;
        };
      }) => ({
        id: inspector.id,
        username: inspector.username,
        fullName: inspector.fullName,
        email: inspector.email,
        isActive: inspector.isActive,
        lastActive: inspector.lastActive?.toISOString(),
        totalInspections: inspector._count.inspections,
        pendingInspections: inspector._count.pendingInspections,
        completedInspections: inspector._count.completedInspections,
      })
    );

    return NextResponse.json(formattedInspectors);
  } catch (error) {
    console.error('Error fetching inspectors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inspectors' },
      { status: 500 }
    );
  }
}

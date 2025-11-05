import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionUsername = cookieStore.get('minecraft_username')?.value

    if (!sessionUsername) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { minecraftUsername: sessionUsername },
      select: { isAdmin: true },
    })

    if (!currentUser?.isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    // Fetch all reports with related user data
    const reports = await prisma.report.findMany({
      include: {
        reporter: {
          select: {
            minecraftUsername: true,
            realName: true,
            fullName: true,
          },
        },
        reported: {
          select: {
            minecraftUsername: true,
            realName: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Admin reports fetch error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching reports' },
      { status: 500 }
    )
  }
}

// Update report status
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionUsername = cookieStore.get('minecraft_username')?.value

    if (!sessionUsername) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { minecraftUsername: sessionUsername },
      select: { isAdmin: true },
    })

    if (!currentUser?.isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { reportId, status } = body

    if (!reportId || !status) {
      return NextResponse.json(
        { error: 'Report ID and status are required' },
        { status: 400 }
      )
    }

    await prisma.report.update({
      where: { id: reportId },
      data: { status },
    })

    return NextResponse.json({
      success: true,
      message: 'Report status updated',
    })
  } catch (error) {
    console.error('Report status update error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating report status' },
      { status: 500 }
    )
  }
}

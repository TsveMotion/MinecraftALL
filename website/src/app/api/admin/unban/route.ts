import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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
    const { minecraftUsername } = body

    if (!minecraftUsername) {
      return NextResponse.json(
        { error: 'Minecraft username is required' },
        { status: 400 }
      )
    }

    // Delete all bans for this user
    const result = await prisma.ban.deleteMany({
      where: { minecraftUsername },
    })

    return NextResponse.json({
      success: true,
      message: `${minecraftUsername} has been unbanned`,
      bansRemoved: result.count,
    })
  } catch (error) {
    console.error('Unban error:', error)
    return NextResponse.json(
      { error: 'An error occurred while unbanning player' },
      { status: 500 }
    )
  }
}

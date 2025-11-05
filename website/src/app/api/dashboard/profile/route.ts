import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // In a real app, validate session/JWT token from cookies
    const cookieStore = cookies()
    const sessionUsername = cookieStore.get('minecraft_username')?.value

    if (!sessionUsername) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { minecraftUsername: sessionUsername },
      select: {
        id: true,
        minecraftUsername: true,
        email: true,
        fullName: true,
        realName: true,
        yearGroup: true,
        rankColor: true,
        isAdmin: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching profile' },
      { status: 500 }
    )
  }
}

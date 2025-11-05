import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { isUserAdmin } from '@/lib/adminUtils'

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
      select: { id: true, email: true },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const isAdmin = await isUserAdmin(currentUser.id, currentUser.email)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    // Fetch all users with additional fields
    const users = await prisma.user.findMany({
      select: {
        id: true,
        minecraftUsername: true,
        minecraftUuid: true,
        email: true,
        fullName: true,
        realName: true,
        yearGroup: true,
        lastLoginAt: true,
        lastLoginIp: true,
        isOnline: true,
        createdAt: true,
        isAdmin: true,
        admin: true,
        roles: {
          include: {
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Admin users fetch error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching users' },
      { status: 500 }
    )
  }
}

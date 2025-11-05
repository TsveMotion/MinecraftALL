import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { isUserAdmin } from '@/lib/adminUtils'

// Assign role to user
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

    const { userId, roleId } = await request.json()

    if (!userId || !roleId) {
      return NextResponse.json(
        { error: 'User ID and Role ID are required' },
        { status: 400 }
      )
    }

    // Check if user already has this role
    const existingUserRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    })

    if (existingUserRole) {
      return NextResponse.json(
        { error: 'User already has this role' },
        { status: 400 }
      )
    }

    await prisma.userRole.create({
      data: {
        userId,
        roleId
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Role assigned successfully'
    })
  } catch (error) {
    console.error('Assign role error:', error)
    return NextResponse.json(
      { error: 'An error occurred while assigning role' },
      { status: 500 }
    )
  }
}

// Remove role from user
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const userId = parseInt(searchParams.get('userId') || '')
    const roleId = parseInt(searchParams.get('roleId') || '')

    if (!userId || !roleId) {
      return NextResponse.json(
        { error: 'User ID and Role ID are required' },
        { status: 400 }
      )
    }

    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Role removed successfully'
    })
  } catch (error) {
    console.error('Remove role error:', error)
    return NextResponse.json(
      { error: 'An error occurred while removing role' },
      { status: 500 }
    )
  }
}

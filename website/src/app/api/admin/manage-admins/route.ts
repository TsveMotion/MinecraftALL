import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { isUserAdmin } from '@/lib/adminUtils'

// Add admin
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

    // Check if requesting user is admin
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

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      )
    }

    // Check if already admin
    const existingAdmin = await prisma.admin.findUnique({
      where: { userId }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'User is already an admin' },
        { status: 400 }
      )
    }

    // Add admin
    await prisma.admin.create({
      data: { userId }
    })

    // Update isAdmin flag
    await prisma.user.update({
      where: { id: userId },
      data: { isAdmin: true }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Admin added successfully'
    })
  } catch (error) {
    console.error('Add admin error:', error)
    return NextResponse.json(
      { error: 'An error occurred while adding admin' },
      { status: 500 }
    )
  }
}

// Remove admin
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

    // Check if requesting user is admin
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

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Prevent removing hardcoded admin
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    })

    if (targetUser?.email === '20-tsvetanov-k@thestreetlyacademy.co.uk') {
      return NextResponse.json(
        { error: 'Cannot remove primary admin' },
        { status: 403 }
      )
    }

    // Remove admin record
    await prisma.admin.delete({
      where: { userId }
    }).catch(() => {}) // Ignore if doesn't exist

    // Update isAdmin flag
    await prisma.user.update({
      where: { id: userId },
      data: { isAdmin: false }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Admin removed successfully'
    })
  } catch (error) {
    console.error('Remove admin error:', error)
    return NextResponse.json(
      { error: 'An error occurred while removing admin' },
      { status: 500 }
    )
  }
}

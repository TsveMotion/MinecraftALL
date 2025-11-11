import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { isUserAdmin } from '@/lib/adminUtils'

// Get all roles
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

    const roles = await prisma.role.findMany({
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                minecraftUsername: true,
                fullName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ roles })
  } catch (error) {
    console.error('Fetch roles error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching roles' },
      { status: 500 }
    )
  }
}

// Create role
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

    const { name, description, symbol, colorHex, isFree, priceMinor, isActive } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      )
    }

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name }
    })

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      )
    }

    const role = await prisma.role.create({
      data: {
        name,
        description: description || null,
        symbol: symbol || '★',
        colorHex: colorHex || '#FFFFFF',
        isFree: isFree || false,
        priceMinor: priceMinor || 0,
        isActive: isActive !== undefined ? isActive : true,
      }
    })

    return NextResponse.json({ 
      success: true,
      role
    })
  } catch (error) {
    console.error('Create role error:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating role' },
      { status: 500 }
    )
  }
}

// Update role
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

    const { roleId, name, description, symbol, colorHex, isFree, priceMinor, isActive } = await request.json()

    if (!roleId) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (symbol !== undefined) updateData.symbol = symbol
    if (colorHex !== undefined) updateData.colorHex = colorHex
    if (isFree !== undefined) updateData.isFree = isFree
    if (priceMinor !== undefined) updateData.priceMinor = priceMinor
    if (isActive !== undefined) updateData.isActive = isActive

    const role = await prisma.role.update({
      where: { id: roleId },
      data: updateData
    })

    return NextResponse.json({ 
      success: true,
      role
    })
  } catch (error) {
    console.error('Update role error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating role' },
      { status: 500 }
    )
  }
}

// Delete role
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
    const roleId = parseInt(searchParams.get('roleId') || '')

    if (!roleId) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      )
    }

    await prisma.role.delete({
      where: { id: roleId }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Role deleted successfully'
    })
  } catch (error) {
    console.error('Delete role error:', error)
    return NextResponse.json(
      { error: 'An error occurred while deleting role' },
      { status: 500 }
    )
  }
}

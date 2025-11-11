import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionUsername = cookieStore.get('minecraft_username')?.value

    if (!sessionUsername) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { minecraftUsername: sessionUsername },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { roleId, setPrimary } = await request.json()

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 })
    }

    // Check if role exists and is free
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    if (!role.isFree) {
      return NextResponse.json({ error: 'This role is not free' }, { status: 400 })
    }

    if (!role.isActive) {
      return NextResponse.json({ error: 'This role is not available' }, { status: 400 })
    }

    // Check if user already has this role
    const hasRole = user.roles.some(ur => ur.roleId === roleId)
    if (hasRole) {
      return NextResponse.json({ error: 'You already have this role' }, { status: 400 })
    }

    // Check if user already has a free role
    const hasFreeRole = user.roles.some(ur => ur.role.isFree)
    if (hasFreeRole) {
      return NextResponse.json({ error: 'You have already claimed a free role' }, { status: 400 })
    }

    // If setting as primary, remove primary from other roles
    if (setPrimary) {
      await prisma.userRole.updateMany({
        where: { userId: user.id },
        data: { isPrimary: false }
      })
    }

    // Claim the role
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId,
        isPrimary: setPrimary || false
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'ROLE_CLAIMED',
        meta: { roleName: role.name, roleId: role.id }
      }
    }).catch(() => {
      // Audit log is optional
    })

    return NextResponse.json({ success: true, message: 'Role claimed successfully' })
  } catch (error) {
    console.error('Failed to claim role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

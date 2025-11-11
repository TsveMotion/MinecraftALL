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

    const { roleId } = await request.json()

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 })
    }

    // Check if user has this role
    const hasRole = user.roles.some(ur => ur.roleId === roleId)
    if (!hasRole) {
      return NextResponse.json({ error: 'You do not have this role' }, { status: 400 })
    }

    // Remove primary from all roles
    await prisma.userRole.updateMany({
      where: { userId: user.id },
      data: { isPrimary: false }
    })

    // Set this role as primary
    await prisma.userRole.updateMany({
      where: { 
        userId: user.id,
        roleId
      },
      data: { isPrimary: true }
    })

    // Get role name for audit log
    const role = user.roles.find(ur => ur.roleId === roleId)

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'ROLE_PRIMARY_SET',
        meta: { roleName: role?.role.name || 'Unknown', roleId }
      }
    }).catch(() => {
      // Audit log is optional
    })

    return NextResponse.json({ success: true, message: 'Primary role updated successfully' })
  } catch (error) {
    console.error('Failed to set primary role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

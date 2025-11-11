import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { roleId } = body

    if (!roleId || typeof roleId !== 'number') {
      return NextResponse.json({ error: 'Invalid roleId' }, { status: 400 })
    }

    // Get role details
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    if (role.isFree) {
      return NextResponse.json(
        { error: 'Cannot purchase free roles' },
        { status: 400 }
      )
    }

    if (!role.isActive) {
      return NextResponse.json(
        { error: 'This role is not available' },
        { status: 400 }
      )
    }

    // Check if user already has this role
    const existingRole = await prisma.userRole.findFirst({
      where: { userId: payload.userId, roleId },
    })

    if (existingRole) {
      return NextResponse.json(
        { error: 'You already have this role' },
        { status: 400 }
      )
    }

    // Create purchase with PENDING status
    const purchase = await prisma.purchase.create({
      data: {
        userId: payload.userId,
        roleId,
        amountMinor: role.priceMinor,
        status: 'PENDING',
      },
    })

    // Create audit log
    await createAuditLog({
      actorId: payload.userId,
      action: 'create_purchase',
      meta: { purchaseId: purchase.id, roleId, amount: role.priceMinor },
    })

    return NextResponse.json({
      success: true,
      purchase: {
        id: purchase.id,
        status: purchase.status,
        amountMinor: purchase.amountMinor,
      },
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { isUserAdmin } from '@/lib/adminUtils'
import { createAuditLog } from '@/lib/audit'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const sessionUsername = cookieStore.get('minecraft_username')?.value

    if (!sessionUsername) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { minecraftUsername: sessionUsername },
      select: { id: true, email: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isAdmin = await isUserAdmin(currentUser.id, currentUser.email)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const purchaseId = parseInt(params.id)

    if (isNaN(purchaseId)) {
      return NextResponse.json({ error: 'Invalid purchase ID' }, { status: 400 })
    }

    // Get purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { role: true },
    })

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }

    if (purchase.status === 'PAID') {
      return NextResponse.json(
        { error: 'Purchase already marked as paid' },
        { status: 400 }
      )
    }

    // Update purchase status
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: 'PAID' },
    })

    // Grant role to user
    const existingRole = await prisma.userRole.findFirst({
      where: {
        userId: purchase.userId,
        roleId: purchase.roleId,
      },
    })

    if (!existingRole) {
      // Check if user has any primary role
      const hasPrimary = await prisma.userRole.findFirst({
        where: { userId: purchase.userId, isPrimary: true },
      })

      await prisma.userRole.create({
        data: {
          userId: purchase.userId,
          roleId: purchase.roleId,
          isPrimary: !hasPrimary,
          grantedBy: currentUser.id,
        },
      })
    }

    // Create audit log
    await createAuditLog({
      actorId: currentUser.id,
      action: 'mark_purchase_paid',
      meta: { purchaseId, userId: purchase.userId, roleId: purchase.roleId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark paid error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

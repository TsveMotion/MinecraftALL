import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { claimFreeRole } from '@/lib/roles'
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

    const result = await claimFreeRole(payload.userId, roleId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Create audit log
    await createAuditLog({
      actorId: payload.userId,
      action: 'claim_free_role',
      meta: { roleId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Claim free role error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

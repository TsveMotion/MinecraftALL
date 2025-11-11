import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { getUserRoles } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

    const roles = await getUserRoles(payload.userId)

    return NextResponse.json({
      roles: roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        symbol: ur.role.symbol,
        colorHex: ur.role.colorHex,
        isPrimary: ur.isPrimary,
        isFree: ur.role.isFree,
        priceMinor: ur.role.priceMinor,
        grantedAt: ur.createdAt,
      })),
    })
  } catch (error) {
    console.error('Get roles error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

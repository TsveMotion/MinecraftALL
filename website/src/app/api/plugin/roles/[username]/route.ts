import { NextRequest, NextResponse } from 'next/server'
import { verifyPluginRequest } from '@/lib/hmac'
import { getRoleByUsername } from '@/lib/roles'
import { getCached, setCache } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    // Verify plugin signature
    const signature = request.headers.get('X-MC-SIGN')
    const bodyString = params.username || ''
    
    if (!verifyPluginRequest(bodyString, signature)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username } = params

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    // Try to get cached role data
    const cached = await getCached<any>(`role:${username}`)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Get role from database
    const roleData = await getRoleByUsername(username)

    if (!roleData) {
      return NextResponse.json({
        primaryRole: null,
        isAdmin: false,
      })
    }

    const response = {
      primaryRole: {
        symbol: roleData.symbol,
        colorHex: roleData.colorHex,
        isAdmin: roleData.isAdmin,
      },
    }

    // Cache for 30 seconds
    await setCache(`role:${username}`, response, 30)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Plugin roles API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

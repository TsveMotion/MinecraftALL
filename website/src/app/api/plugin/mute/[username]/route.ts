import { NextRequest, NextResponse } from 'next/server'
import { verifyPluginRequest } from '@/lib/hmac'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const signature = request.headers.get('X-MC-SIGN')
    const bodyString = params.username || ''

    if (!verifyPluginRequest(bodyString, signature || undefined)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username } = params

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    // Check if user is muted
    const mute = await prisma.mute.findUnique({
      where: { username },
    })

    if (!mute) {
      return NextResponse.json({
        muted: false,
      })
    }

    // Check if mute has expired
    if (mute.endsAt && mute.endsAt < new Date()) {
      // Mute expired, delete it
      await prisma.mute.delete({
        where: { username },
      })

      return NextResponse.json({
        muted: false,
      })
    }

    return NextResponse.json({
      muted: true,
      endsAt: mute.endsAt,
      reason: mute.reason,
    })
  } catch (error) {
    console.error('Plugin mute check API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { verifyPluginRequest } from '@/lib/hmac'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const signature = request.headers.get('X-MC-SIGN')

    if (!verifyPluginRequest(body, signature)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reporter, target, reason, server } = body

    if (!reporter || !target || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create report
    await prisma.report.create({
      data: {
        reporter,
        target,
        reason,
        server: server || null,
        status: 'open',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Plugin report API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

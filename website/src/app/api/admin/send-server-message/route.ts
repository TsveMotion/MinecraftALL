import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { isUserAdmin } from '@/lib/adminUtils'
import { executeRconCommand } from '@/lib/rcon'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionUsername = cookieStore.get('minecraft_username')?.value

    if (!sessionUsername) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }

    const { message } = await request.json()

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Send message via RCON
    try {
      const sanitizedMessage = message.replace(/"/g, '\\"')
      await executeRconCommand(`say [ADMIN] ${sanitizedMessage}`)
      
      return NextResponse.json({ success: true, message: 'Message sent to server' })
    } catch (rconError) {
      console.error('RCON error:', rconError)
      return NextResponse.json({ 
        error: 'Failed to send message to server. RCON may be unavailable.' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Failed to send server message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

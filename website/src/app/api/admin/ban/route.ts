import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { executeRconCommand } from '@/lib/rcon'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionUsername = cookieStore.get('minecraft_username')?.value

    if (!sessionUsername) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { minecraftUsername: sessionUsername },
      select: { isAdmin: true },
    })

    if (!currentUser?.isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { minecraftUsername, reason, isPermanent, durationHours } = body

    if (!minecraftUsername) {
      return NextResponse.json(
        { error: 'Minecraft username is required' },
        { status: 400 }
      )
    }

    // Calculate expiration time for temp bans
    let expiresAt = null
    if (!isPermanent && durationHours) {
      expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + durationHours)
    }

    // Store ban in database
    await prisma.ban.create({
      data: {
        minecraftUsername,
        bannedBy: sessionUsername,
        reason,
        isPermanent: !!isPermanent,
        expiresAt,
      },
    })

    const sanitizedReason = (reason?.trim() || 'No reason provided').replace(/\s+/g, ' ')
    const expiryMessage = expiresAt
      ? `Expires: ${expiresAt.toISOString().replace('T', ' ').replace('Z', ' UTC')}`
      : 'Permanent ban'
    const kickMessage = `Banned: ${sanitizedReason} | ${expiryMessage}`

    let rconBanSucceeded = false
    let rconKickSucceeded = false

    try {
      if (isPermanent) {
        const banResponse = await executeRconCommand(`ban ${minecraftUsername} ${sanitizedReason}`)
        rconBanSucceeded = !!banResponse
      }

      const kickResponse = await executeRconCommand(`kick ${minecraftUsername} ${kickMessage}`)
      rconKickSucceeded = !!kickResponse
    } catch (rconError) {
      console.error('RCON ban/kick error:', rconError)
    }

    // Send ban command to plugin via HTTP
    const pluginUrl = process.env.PLUGIN_API_URL || 'http://localhost:8080'
    const pluginApiKey = process.env.PLUGIN_API_KEY || 'your-secret-key'

    try {
      const response = await fetch(`${pluginUrl}/api/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': pluginApiKey,
        },
        body: JSON.stringify({
          username: minecraftUsername,
          reason,
          isPermanent,
          expiresAt: expiresAt?.toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Plugin API request failed')
      }

      return NextResponse.json({
        success: true,
        message: `${minecraftUsername} has been banned`,
        pluginNotified: true,
        rcon: {
          ban: rconBanSucceeded,
          kick: rconKickSucceeded,
        },
      })
    } catch (pluginError) {
      console.error('Plugin API error:', pluginError)
      return NextResponse.json({
        success: true,
        message: `${minecraftUsername} has been banned (server notification pending)` ,
        pluginNotified: false,
        warning: 'Ban saved to database but failed to communicate with game server',
        rcon: {
          ban: rconBanSucceeded,
          kick: rconKickSucceeded,
        },
      })
    }
  } catch (error) {
    console.error('Ban error:', error)
    return NextResponse.json(
      { error: 'An error occurred while banning player' },
      { status: 500 }
    )
  }
}

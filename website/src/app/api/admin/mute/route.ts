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
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { minecraftUsername: sessionUsername },
      select: { id: true, email: true },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const isAdmin = await isUserAdmin(currentUser.id, currentUser.email)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const { minecraftUsername, reason, durationHours, isPermanent } = await request.json()

    if (!minecraftUsername) {
      return NextResponse.json(
        { error: 'Minecraft username is required' },
        { status: 400 }
      )
    }

    // Calculate expiration
    let endsAt: Date | null = null
    if (!isPermanent && durationHours) {
      endsAt = new Date()
      endsAt.setHours(endsAt.getHours() + durationHours)
    }

    // Create or update mute record (upsert to handle existing mutes)
    await prisma.mute.upsert({
      where: { username: minecraftUsername },
      create: {
        username: minecraftUsername,
        reason: reason || 'No reason provided',
        endsAt,
        createdBy: currentUser.id,
      },
      update: {
        reason: reason || 'No reason provided',
        endsAt,
        createdBy: currentUser.id,
      }
    })

    const sanitizedReason = (reason?.trim() || 'No reason provided').replace(/\s+/g, ' ')
    let rconMuteCommand: string | null = null

    if (isPermanent) {
      rconMuteCommand = `mute ${minecraftUsername} ${sanitizedReason}`
    } else if (durationHours) {
      rconMuteCommand = `mute ${minecraftUsername} ${durationHours}h ${sanitizedReason}`
    }

    let rconMuted = false

    if (rconMuteCommand) {
      try {
        const rconResponse = await executeRconCommand(rconMuteCommand)
        rconMuted = !!rconResponse
      } catch (error) {
        console.error('RCON mute error:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${minecraftUsername} has been ${isPermanent ? 'permanently' : 'temporarily'} muted`,
      mute: {
        username: minecraftUsername,
        reason,
        endsAt,
        isPermanent
      },
      rconMuted,
    })
  } catch (error) {
    console.error('Mute error:', error)
    return NextResponse.json(
      { error: 'An error occurred while muting player' },
      { status: 500 }
    )
  }
}

// Unmute player
export async function DELETE(request: NextRequest) {
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
      select: { id: true, email: true },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const isAdmin = await isUserAdmin(currentUser.id, currentUser.email)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const minecraftUsername = searchParams.get('username')

    if (!minecraftUsername) {
      return NextResponse.json(
        { error: 'Minecraft username is required' },
        { status: 400 }
      )
    }

    // Delete mute by username
    await prisma.mute.delete({
      where: { username: minecraftUsername }
    })

    let rconUnmuted = false
    try {
      const response = await executeRconCommand(`unmute ${minecraftUsername}`)
      rconUnmuted = !!response
    } catch (error) {
      console.error('RCON unmute error:', error)
    }

    return NextResponse.json({
      success: true,
      message: `${minecraftUsername} has been unmuted`,
      rconUnmuted,
    })
  } catch (error) {
    console.error('Unmute error:', error)
    return NextResponse.json(
      { error: 'An error occurred while unmuting player' },
      { status: 500 }
    )
  }
}

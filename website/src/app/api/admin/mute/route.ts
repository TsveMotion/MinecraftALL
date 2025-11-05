import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { isUserAdmin } from '@/lib/adminUtils'

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

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { minecraftUsername }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    // Calculate expiration
    let expiresAt: Date | null = null
    if (!isPermanent && durationHours) {
      expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + durationHours)
    }

    // Create mute record
    await prisma.mute.create({
      data: {
        userId: targetUser.id,
        mutedBy: currentUser.id,
        reason: reason || 'No reason provided',
        expiresAt
      }
    })

    // TODO: Send RCON command to Minecraft server
    // const muteCommand = isPermanent 
    //   ? `/mute ${minecraftUsername}`
    //   : `/mute ${minecraftUsername} ${durationHours}h`
    // await sendRCONCommand(muteCommand)

    return NextResponse.json({
      success: true,
      message: `${minecraftUsername} has been ${isPermanent ? 'permanently' : 'temporarily'} muted`,
      mute: {
        username: minecraftUsername,
        reason,
        expiresAt,
        isPermanent
      }
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

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { minecraftUsername }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    // Delete active mutes
    await prisma.mute.deleteMany({
      where: {
        userId: targetUser.id,
        OR: [
          { expiresAt: null }, // Permanent mutes
          { expiresAt: { gt: new Date() } } // Active temporary mutes
        ]
      }
    })

    // TODO: Send RCON command to Minecraft server
    // await sendRCONCommand(`/unmute ${minecraftUsername}`)

    return NextResponse.json({
      success: true,
      message: `${minecraftUsername} has been unmuted`
    })
  } catch (error) {
    console.error('Unmute error:', error)
    return NextResponse.json(
      { error: 'An error occurred while unmuting player' },
      { status: 500 }
    )
  }
}

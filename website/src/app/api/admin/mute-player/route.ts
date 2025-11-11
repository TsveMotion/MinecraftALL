import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { isUserAdmin } from '@/lib/adminUtils'
import { createAuditLog } from '@/lib/audit'

export async function POST(request: NextRequest) {
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

    const { username, minutes, reason } = await request.json()

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    if (!minutes || minutes <= 0) {
      return NextResponse.json(
        { error: 'Minutes must be a positive number' },
        { status: 400 }
      )
    }

    const endsAt = new Date(Date.now() + minutes * 60 * 1000)

    // Create or update mute
    await prisma.mute.upsert({
      where: { username },
      create: {
        username,
        reason: reason || null,
        endsAt,
        createdBy: currentUser.id,
      },
      update: {
        reason: reason || null,
        endsAt,
        createdBy: currentUser.id,
      },
    })

    // Create audit log
    await createAuditLog({
      actorId: currentUser.id,
      action: 'mute_player',
      meta: { username, minutes, reason },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mute player error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    // Delete mute
    await prisma.mute.delete({
      where: { username },
    })

    // Create audit log
    await createAuditLog({
      actorId: currentUser.id,
      action: 'unmute_player',
      meta: { username },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unmute player error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

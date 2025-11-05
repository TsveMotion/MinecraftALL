import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

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
    const { minecraftUsername } = body

    if (!minecraftUsername) {
      return NextResponse.json(
        { error: 'Minecraft username is required' },
        { status: 400 }
      )
    }

    // Send kick command to plugin via HTTP
    const pluginUrl = process.env.PLUGIN_API_URL || 'http://localhost:8080'
    const pluginApiKey = process.env.PLUGIN_API_KEY || 'your-secret-key'

    try {
      const response = await fetch(`${pluginUrl}/api/kick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': pluginApiKey,
        },
        body: JSON.stringify({ username: minecraftUsername }),
      })

      if (!response.ok) {
        throw new Error('Plugin API request failed')
      }

      return NextResponse.json({
        success: true,
        message: `${minecraftUsername} has been kicked`,
      })
    } catch (pluginError) {
      console.error('Plugin API error:', pluginError)
      return NextResponse.json(
        { error: 'Failed to communicate with game server' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Kick error:', error)
    return NextResponse.json(
      { error: 'An error occurred while kicking player' },
      { status: 500 }
    )
  }
}

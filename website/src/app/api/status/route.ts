import { NextResponse } from 'next/server'
import { getRconServerStatus } from '@/lib/rcon'
import { getCached, setCache } from '@/lib/redis'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface Player {
  username: string
  role?: {
    symbol: string
    colorHex: string
  }
  online: boolean
}

export async function GET() {
  try {
    // Try to get cached status
    const cached = await getCached<any>('server:status')
    if (cached) {
      return NextResponse.json(cached)
    }

    // Get status from RCON
    const rconStatus = await getRconServerStatus()

    if (!rconStatus) {
      return NextResponse.json({
        online: false,
        error: 'Failed to connect to server',
      })
    }

    // Enrich player data with roles
    const enrichedPlayers: Player[] = []

    for (const player of rconStatus.players) {
      const user = await prisma.user.findUnique({
        where: { minecraftUsername: player.username },
        include: {
          roles: {
            where: { isPrimary: true },
            include: {
              role: true,
            },
          },
        },
      })

      enrichedPlayers.push({
        username: player.username,
        role: user?.roles[0]?.role
          ? {
              symbol: user.roles[0].role.symbol,
              colorHex: user.roles[0].role.colorHex,
            }
          : undefined,
        online: true,
      })

      // Update user's online status and last seen
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isOnline: true,
            lastSeenAt: new Date(),
          },
        })
      }
    }

    const response = {
      online: rconStatus.online,
      tps: rconStatus.tps,
      playersCount: rconStatus.playersCount,
      maxPlayers: rconStatus.maxPlayers,
      players: enrichedPlayers,
    }

    const rawData = JSON.parse(JSON.stringify(response)) as Prisma.InputJsonValue

    // Cache for 5 seconds
    await setCache('server:status', response, 5)

    // Save to database
    await prisma.serverStat.create({
      data: {
        online: response.online,
        tps: response.tps,
        players: response.playersCount,
        raw: rawData,
      },
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Status API error:', error)
    return NextResponse.json(
      { online: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

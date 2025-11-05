import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const onlinePlayers = await prisma.user.findMany({
      where: ({
        isOnline: true,
      } as Prisma.UserWhereInput),
      select: {
        id: true,
        minecraftUsername: true,
        realName: true,
        yearGroup: true,
        rankColor: true
      },
      orderBy: {
        yearGroup: 'asc'
      }
    })

    return NextResponse.json({ 
      players: onlinePlayers,
      count: onlinePlayers.length
    })
  } catch (error) {
    console.error('Online players fetch error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2022') {
      // Database schema hasn't been updated with the new is_online column yet.
      return NextResponse.json({
        players: [],
        count: 0,
        warning: 'Online tracking fields are not present in the database. Please run the pending migration.'
      })
    }

    return NextResponse.json(
      { error: 'Failed to fetch online players' },
      { status: 500 }
    )
  }
}

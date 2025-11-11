import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const roles = await prisma.role.findMany({
      where: { isActive: true },
      orderBy: [
        { isFree: 'desc' }, // Free roles first
        { name: 'asc' }
      ]
    })

    return NextResponse.json(roles)
  } catch (error) {
    console.error('Failed to fetch roles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

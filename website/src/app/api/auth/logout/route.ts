import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const cookieStore = cookies()
    const sessionUsername = cookieStore.get('minecraft_username')?.value

    // Mark user as offline before deleting cookie
    if (sessionUsername) {
      await prisma.user.update({
        where: { minecraftUsername: sessionUsername },
        data: {
          isOnline: false,
        } as any,
      }).catch((err) => console.error('Failed to update online status:', err))
    }

    cookieStore.delete('minecraft_username')

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}

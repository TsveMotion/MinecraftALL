import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    // Find the token in the database
    const registrationToken = await prisma.registrationToken.findUnique({
      where: { token },
    })

    if (!registrationToken) {
      return NextResponse.json(
        { valid: false, error: 'Invalid token' },
        { status: 404 }
      )
    }

    // Check if token has expired
    if (new Date() > registrationToken.expiresAt) {
      // Delete expired token
      await prisma.registrationToken.delete({
        where: { token },
      })

      return NextResponse.json(
        { valid: false, error: 'Token has expired. Please generate a new one.' },
        { status: 410 }
      )
    }

    // Check if username is already registered
    const existingUser = await prisma.user.findUnique({
      where: { minecraftUsername: registrationToken.minecraftUsername },
    })

    if (existingUser && existingUser.verified) {
      return NextResponse.json(
        { valid: false, error: 'This username is already registered.' },
        { status: 409 }
      )
    }

    return NextResponse.json({
      valid: true,
      minecraftUsername: registrationToken.minecraftUsername,
    })
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { valid: false, error: 'Server error occurred' },
      { status: 500 }
    )
  }
}

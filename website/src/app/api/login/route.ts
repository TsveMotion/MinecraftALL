import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { minecraftUsername, password } = body

    // Validate input
    if (!minecraftUsername || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { minecraftUsername },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Check if user is verified
    if (!user.verified) {
      return NextResponse.json(
        { error: 'Account is not verified. Please complete registration.' },
        { status: 403 }
      )
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { minecraftUsername },
      data: { lastLoginAt: new Date() },
    })

    // Set session cookie
    const cookieStore = cookies()
    cookieStore.set('minecraft_username', user.minecraftUsername, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        minecraftUsername: user.minecraftUsername,
        email: user.email,
        fullName: user.fullName,
        isAdmin: user.isAdmin || false,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}

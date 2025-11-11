import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, minecraftUsername, password } = body

    // Validate input
    if ((!email && !minecraftUsername) || !password) {
      return NextResponse.json(
        { error: 'Email/username and password are required' },
        { status: 400 }
      )
    }

    // Find the user by email or minecraftUsername
    const user = await prisma.user.findFirst({
      where: email ? { email } : { minecraftUsername },
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

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || request.ip || undefined

    // Update last login metadata (using any to bypass TypeScript until Prisma regenerates)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        isOnline: true,
        lastLoginIp: clientIp ?? null,
      } as any,
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

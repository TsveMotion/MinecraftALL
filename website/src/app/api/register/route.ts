import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { parseEmailData } from '@/lib/userUtils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, pin, fullName, email, password } = body

    // Must have either token OR pin
    if (!token && !pin) {
      return NextResponse.json(
        { error: 'Registration token or PIN is required' },
        { status: 400 }
      )
    }

    // Validate input
    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    let minecraftUsername: string

    // Handle token-based registration (Java Edition)
    if (token) {
      const registrationToken = await prisma.registrationToken.findUnique({
        where: { token },
      })

      if (!registrationToken) {
        return NextResponse.json(
          { error: 'Invalid registration token' },
          { status: 404 }
        )
      }

      // Check if token has expired
      if (new Date() > registrationToken.expiresAt) {
        await prisma.registrationToken.delete({
          where: { token },
        })

        return NextResponse.json(
          { error: 'Registration token has expired' },
          { status: 410 }
        )
      }

      minecraftUsername = registrationToken.minecraftUsername

      // Delete the used registration token
      await prisma.registrationToken.delete({
        where: { token },
      })
    }
    // Handle PIN-based registration (Bedrock Edition)
    else if (pin) {
      // Validate PIN format
      if (!/^\d{6}$/.test(pin)) {
        return NextResponse.json(
          { error: 'Invalid PIN format' },
          { status: 400 }
        )
      }

      const bedrockPin = await prisma.bedrockPin.findFirst({
        where: { pin },
      })

      if (!bedrockPin) {
        return NextResponse.json(
          { error: 'Invalid PIN' },
          { status: 404 }
        )
      }

      // Check if PIN has expired
      if (new Date() > bedrockPin.expiresAt) {
        await prisma.bedrockPin.delete({
          where: { id: bedrockPin.id },
        })

        return NextResponse.json(
          { error: 'PIN has expired' },
          { status: 410 }
        )
      }

      minecraftUsername = bedrockPin.minecraftUsername

      // Delete the used PIN
      await prisma.bedrockPin.delete({
        where: { id: bedrockPin.id },
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid registration method' },
        { status: 400 }
      )
    }

    // Check if email is already in use
    const existingEmailUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingEmailUser) {
      return NextResponse.json(
        { error: 'Email address is already registered' },
        { status: 409 }
      )
    }

    // Check if username is already registered
    const existingUsernameUser = await prisma.user.findUnique({
      where: { minecraftUsername },
    })

    if (existingUsernameUser && existingUsernameUser.verified) {
      return NextResponse.json(
        { error: 'Minecraft username is already registered' },
        { status: 409 }
      )
    }

    // Hash the password with bcrypt (cost factor 12)
    const passwordHash = await bcrypt.hash(password, 12)

    // Parse email to extract derived data
    const emailData = parseEmailData(email)
    
    // Check if this is the admin user
    const isAdminUser = email === '20-tsvetanov-k@thestreetlyacademy.co.uk'
    
    // Create or update the user
    const user = await prisma.user.upsert({
      where: { minecraftUsername },
      update: {
        email,
        passwordHash,
        fullName,
        realName: emailData?.realName || null,
        yearGroup: emailData?.yearGroup || null,
        rankColor: emailData?.rankColor || null,
        isAdmin: isAdminUser,
        verified: true,
      },
      create: {
        email,
        passwordHash,
        fullName,
        minecraftUsername,
        realName: emailData?.realName || null,
        yearGroup: emailData?.yearGroup || null,
        rankColor: emailData?.rankColor || null,
        isAdmin: isAdminUser,
        verified: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        minecraftUsername: user.minecraftUsername,
        email: user.email,
        fullName: user.fullName,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}

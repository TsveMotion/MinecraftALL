import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API endpoint to verify a 6-digit PIN for Bedrock player registration
 * 
 * Checks if the PIN exists in the database and hasn't expired,
 * then returns the associated Minecraft username
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const pin = searchParams.get('pin')

    if (!pin) {
      return NextResponse.json(
        { valid: false, error: 'PIN is required' },
        { status: 400 }
      )
    }

    // Validate PIN format (must be exactly 6 digits)
    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { valid: false, error: 'PIN must be exactly 6 digits' },
        { status: 400 }
      )
    }

    // Find the PIN in the database
    const bedrockPin = await prisma.bedrockPin.findFirst({
      where: { pin },
    })

    if (!bedrockPin) {
      return NextResponse.json(
        { valid: false, error: 'Invalid PIN. Please check your PIN and try again.' },
        { status: 404 }
      )
    }

    // Check if PIN has expired
    if (new Date() > bedrockPin.expiresAt) {
      // Delete expired PIN
      await prisma.bedrockPin.delete({
        where: { id: bedrockPin.id },
      })

      return NextResponse.json(
        { valid: false, error: 'PIN has expired. Please run /register in Minecraft to get a new one.' },
        { status: 410 }
      )
    }

    // Check if username is already registered and verified
    const existingUser = await prisma.user.findUnique({
      where: { minecraftUsername: bedrockPin.minecraftUsername },
    })

    if (existingUser && existingUser.verified) {
      return NextResponse.json(
        { valid: false, error: 'This Minecraft account is already registered.' },
        { status: 409 }
      )
    }

    // PIN is valid and not expired
    return NextResponse.json({
      valid: true,
      minecraftUsername: bedrockPin.minecraftUsername,
    })
  } catch (error) {
    console.error('PIN verification error:', error)
    return NextResponse.json(
      { valid: false, error: 'Server error occurred' },
      { status: 500 }
    )
  }
}

import { prisma } from '@/lib/prisma'

/**
 * Check if a user is an admin
 * Admin if:
 * 1. Email is 20-tsvetanov-k@thestreetlyacademy.co.uk
 * 2. OR user is in the Admin table
 */
export async function isUserAdmin(userId: number, email: string | null): Promise<boolean> {
  // Check hardcoded admin email
  if (email && email === '20-tsvetanov-k@thestreetlyacademy.co.uk') {
    return true
  }

  // Check Admin table
  const adminRecord = await prisma.admin.findUnique({
    where: { userId }
  })

  return adminRecord !== null
}

/**
 * Get admin user from cookies
 */
export async function getAdminUserFromCookies(cookies: any): Promise<{ userId: number; email: string | null } | null> {
  const sessionCookie = cookies.get('session')
  if (!sessionCookie) {
    return null
  }

  try {
    const session = JSON.parse(sessionCookie.value)
    if (!session.userId) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true }
    })

    if (!user) {
      return null
    }

    return { userId: user.id, email: user.email }
  } catch {
    return null
  }
}

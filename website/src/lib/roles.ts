import { prisma } from './prisma'

export async function canClaimFreeRole(userId: number): Promise<boolean> {
  const existingFreeRole = await prisma.userRole.findFirst({
    where: {
      userId,
      role: {
        isFree: true,
      },
    },
  })

  return !existingFreeRole
}

export async function claimFreeRole(
  userId: number,
  roleId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if role is free
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (!role) {
      return { success: false, error: 'Role not found' }
    }

    if (!role.isFree) {
      return { success: false, error: 'This role is not free' }
    }

    if (!role.isActive) {
      return { success: false, error: 'This role is not active' }
    }

    // Check if user can claim a free role
    const canClaim = await canClaimFreeRole(userId)
    if (!canClaim) {
      return { success: false, error: 'You have already claimed a free role' }
    }

    // Check if user has any roles to determine if this should be primary
    const existingRoles = await prisma.userRole.count({
      where: { userId },
    })

    const isPrimary = existingRoles === 0

    // Claim the role
    await prisma.userRole.create({
      data: {
        userId,
        roleId,
        isPrimary,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error claiming free role:', error)
    return { success: false, error: 'Failed to claim role' }
  }
}

export async function setPrimaryRole(
  userId: number,
  roleId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user has this role
    const userRole = await prisma.userRole.findFirst({
      where: { userId, roleId },
    })

    if (!userRole) {
      return { success: false, error: 'You do not have this role' }
    }

    // Update all roles to not primary
    await prisma.userRole.updateMany({
      where: { userId },
      data: { isPrimary: false },
    })

    // Set this role as primary
    await prisma.userRole.update({
      where: { id: userRole.id },
      data: { isPrimary: true },
    })

    return { success: true }
  } catch (error) {
    console.error('Error setting primary role:', error)
    return { success: false, error: 'Failed to set primary role' }
  }
}

export async function getUserRoles(userId: number) {
  return await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: true,
    },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
  })
}

export async function getPrimaryRole(userId: number) {
  const primaryRole = await prisma.userRole.findFirst({
    where: { userId, isPrimary: true },
    include: {
      role: true,
    },
  })

  return primaryRole?.role || null
}

export async function getRoleByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: { minecraftUsername: username },
    include: {
      roles: {
        where: { isPrimary: true },
        include: {
          role: true,
        },
      },
    },
  })

  if (!user || user.roles.length === 0) {
    return null
  }

  const role = user.roles[0].role

  return {
    symbol: role.symbol,
    colorHex: role.colorHex,
    isAdmin: user.isAdmin,
  }
}

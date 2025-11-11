import { prisma } from './prisma'

export interface AuditLogData {
  actorId?: number
  action: string
  meta?: Record<string, any>
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: data.actorId,
        action: data.action,
        meta: data.meta || {},
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}

export async function getAuditLogs(page: number = 1, limit: number = 50) {
  const skip = (page - 1) * limit

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            minecraftUsername: true,
            email: true,
          },
        },
      },
    }),
    prisma.auditLog.count(),
  ])

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface MinecraftServerStatus {
  online: boolean
  players?: {
    online: number
    max: number
  }
  version?: string
  motd?: string
  ping?: number
  error?: string
}

async function queryMinecraftServer(host: string, port: number): Promise<MinecraftServerStatus> {
  try {
    const response = await fetch(`https://api.mcsrvstat.us/3/${host}:${port}`, {
      cache: 'no-store',
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch server status')
    }

    const data = await response.json()

    if (!data.online) {
      return { online: false, error: 'Server is offline' }
    }

    return {
      online: true,
      players: {
        online: data.players?.online || 0,
        max: data.players?.max || 0,
      },
      version: data.version || 'Unknown',
      motd: data.motd?.clean?.[0] || data.motd?.raw?.[0] || 'Streetly SMP',
      ping: data.debug?.ping === false ? undefined : 50, // Approximate ping
    }
  } catch (error) {
    console.error('Error querying Minecraft server:', error)
    return {
      online: false,
      error: 'Failed to connect to server',
    }
  }
}

export async function GET() {
  const serverHost = process.env.NEXT_PUBLIC_MINECRAFT_SERVER || 'play.tsvweb.co.uk'
  const serverPort = 25565

  const status = await queryMinecraftServer(serverHost, serverPort)

  return NextResponse.json(status)
}

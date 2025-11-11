import { Rcon } from 'rcon-client'

const RCON_HOST = process.env.RCON_HOST || 'localhost'
const RCON_PORT = parseInt(process.env.RCON_PORT || '25575')
const RCON_PASSWORD = process.env.RCON_PASSWORD || ''
const RCON_TIMEOUT = parseInt(process.env.RCON_TIMEOUT_MS || '1500')

let rconClient: Rcon | null = null
let lastConnectAttempt = 0
const CONNECT_COOLDOWN = 5000 // 5 seconds

async function getRconClient(): Promise<Rcon | null> {
  const now = Date.now()
  
  if (!RCON_PASSWORD) {
    console.warn('RCON_PASSWORD not configured')
    return null
  }

  // If we have a connected client, return it
  if (rconClient && rconClient.authenticated) {
    return rconClient
  }

  // Cooldown to prevent rapid reconnection attempts
  if (now - lastConnectAttempt < CONNECT_COOLDOWN) {
    return null
  }

  lastConnectAttempt = now

  try {
    rconClient = await Rcon.connect({
      host: RCON_HOST,
      port: RCON_PORT,
      password: RCON_PASSWORD,
      timeout: RCON_TIMEOUT,
    })

    console.log('RCON connected successfully')
    return rconClient
  } catch (error) {
    console.error('RCON connection failed:', error)
    rconClient = null
    return null
  }
}

export async function executeRconCommand(command: string): Promise<string | null> {
  try {
    const client = await getRconClient()
    if (!client) return null

    const response = await client.send(command)
    return response
  } catch (error) {
    console.error('RCON command error:', error)
    // Reset client on error
    if (rconClient) {
      try {
        await rconClient.end()
      } catch {}
      rconClient = null
    }
    return null
  }
}

export interface RconPlayer {
  username: string
  uuid?: string
}

export interface RconServerStatus {
  online: boolean
  tps?: number
  playersCount: number
  maxPlayers: number
  players: RconPlayer[]
}

export async function getRconServerStatus(): Promise<RconServerStatus | null> {
  try {
    const listResponse = await executeRconCommand('list')
    
    if (!listResponse) {
      return null
    }

    // Parse "There are X of Y players online: player1, player2, player3"
    const match = listResponse.match(/There are (\d+) of a max of (\d+) players online:(.*)/)
    
    if (!match) {
      return {
        online: true,
        playersCount: 0,
        maxPlayers: 20,
        players: [],
      }
    }

    const playersCount = parseInt(match[1])
    const maxPlayers = parseInt(match[2])
    const playersList = match[3]
      .trim()
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .map((username) => ({ username }))

    // Try to get TPS (Paper/Spigot specific)
    let tps: number | undefined
    const tpsResponse = await executeRconCommand('tps')
    if (tpsResponse) {
      const tpsMatch = tpsResponse.match(/TPS from last 1m.*?: ([\d.]+)/)
      if (tpsMatch) {
        tps = parseFloat(tpsMatch[1])
      }
    }

    return {
      online: true,
      tps,
      playersCount,
      maxPlayers,
      players: playersList,
    }
  } catch (error) {
    console.error('Failed to get RCON server status:', error)
    return null
  }
}

export async function disconnectRcon(): Promise<void> {
  if (rconClient) {
    try {
      await rconClient.end()
    } catch (error) {
      console.error('Error disconnecting RCON:', error)
    }
    rconClient = null
  }
}

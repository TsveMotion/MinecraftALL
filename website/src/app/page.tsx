'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check, Server, ExternalLink, Shield, Zap, Users, Activity, Wifi, KeyRound, Gamepad2, Smartphone, Monitor, UserCheck } from 'lucide-react'

const SERVER_IP = process.env.NEXT_PUBLIC_MINECRAFT_SERVER || 'Play.tsvweb.co.uk'

interface ServerStatus {
  online: boolean
  players?: { online: number; max: number }
  version?: string
  ping?: number
  error?: string
}

interface OnlinePlayer {
  id: number
  minecraftUsername: string
  realName: string | null
  yearGroup: number | null
  rankColor: string | null
}

export default function Home() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [pin, setPin] = useState('')
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([])
  const [playersLoading, setPlayersLoading] = useState(true)

  useEffect(() => {
    fetchServerStatus()
    fetchOnlinePlayers()
    const statusInterval = setInterval(fetchServerStatus, 30000) // Update every 30s
    const playersInterval = setInterval(fetchOnlinePlayers, 15000) // Update every 15s
    return () => {
      clearInterval(statusInterval)
      clearInterval(playersInterval)
    }
  }, [])

  const fetchServerStatus = async () => {
    try {
      const response = await fetch('/api/server/status')
      if (response.ok) {
        const data = await response.json()
        setServerStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch server status:', error)
    } finally {
      setStatusLoading(false)
    }
  }

  const fetchOnlinePlayers = async () => {
    try {
      const response = await fetch('/api/online-players')
      if (response.ok) {
        const data = await response.json()
        setOnlinePlayers(data.players || [])
      }
    } catch (error) {
      console.error('Failed to fetch online players:', error)
    } finally {
      setPlayersLoading(false)
    }
  }

  const copyServerIP = () => {
    navigator.clipboard.writeText(SERVER_IP)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length === 6) {
      // Store PIN in sessionStorage so registration page can use it
      sessionStorage.setItem('bedrock_pin', pin)
      router.push('/register')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-5xl w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500">
            Streetly SMP
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-slate-300 font-light px-4">
            Hosted & Sponsored by TSVWEB.CO.UK
          </p>
        </div>

        {/* Server Status & IP Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Server IP Card */}
          <Card className="lg:col-span-2 bg-slate-900/70 border border-blue-500/30 backdrop-blur-md shadow-2xl shadow-blue-900/30 hover:border-blue-500/60 transition-all duration-300">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-white flex items-center justify-center gap-3 text-xl sm:text-2xl">
                <Server className="w-7 h-7 text-blue-300" />
                Server Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-950/80 p-4 sm:p-6 rounded-xl border border-blue-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <code className="text-lg sm:text-2xl md:text-3xl font-mono text-white font-semibold tracking-wide text-center sm:text-left break-all">{SERVER_IP}</code>
                  <Button
                    onClick={copyServerIP}
                    variant="outline"
                    className="w-full sm:w-auto justify-center flex items-center gap-2 bg-blue-600 hover:bg-blue-700 border-blue-500 text-white transition-all transform hover:scale-105"
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Copy IP
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-slate-300 text-xs sm:text-sm">
                <Activity className="w-4 h-4 text-blue-300" />
                <span>Java Edition • Bedrock (Port 19132)</span>
              </div>
            </CardContent>
          </Card>

          {/* Server Status Card */}
          <Card className="bg-slate-900/70 border border-emerald-500/30 backdrop-blur-md shadow-2xl shadow-emerald-900/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Wifi className="w-6 h-6 text-emerald-300" />
                Server Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {statusLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto"></div>
                </div>
              ) : serverStatus?.online ? (
                <>
                  <div className="flex items-center justify-between text-slate-200">
                    <span>Status</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-emerald-300 font-semibold">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-slate-200">
                    <span>Players</span>
                    <span className="text-white font-semibold">
                      {serverStatus.players?.online || 0}/{serverStatus.players?.max || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-200">
                    <span>Version</span>
                    <span className="text-white font-mono text-xs sm:text-sm">
                      {serverStatus.version || 'N/A'}
                    </span>
                  </div>
                  {serverStatus.ping && (
                    <div className="flex items-center justify-between text-slate-200">
                      <span>Ping</span>
                      <span className="text-emerald-300 font-semibold">{serverStatus.ping}ms</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full mx-auto"></div>
                  <span className="text-red-300 font-semibold">Offline</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Online Players List */}
        <Card className="bg-slate-900/70 border-emerald-500/30 backdrop-blur-md shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <CardTitle className="text-white text-xl">Players Online</CardTitle>
                  <CardDescription className="text-slate-400">
                    {onlinePlayers.length} {onlinePlayers.length === 1 ? 'player' : 'players'} currently playing
                  </CardDescription>
                </div>
              </div>
              <Badge variant="success" className="text-sm px-3 py-1">
                LIVE
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {playersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto"></div>
                <p className="text-slate-400 text-sm mt-3">Loading players...</p>
              </div>
            ) : onlinePlayers.length > 0 ? (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {onlinePlayers.map((player) => (
                  <div 
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <div>
                        <p className="text-white font-mono text-sm">{player.minecraftUsername}</p>
                        {player.realName && (
                          <p className="text-slate-400 text-xs">{player.realName}</p>
                        )}
                      </div>
                    </div>
                    {player.yearGroup && (
                      <Badge 
                        className="text-xs"
                        style={{
                          backgroundColor: player.rankColor ? `${player.rankColor}30` : undefined,
                          borderColor: player.rankColor ? `${player.rankColor}60` : undefined,
                          color: player.rankColor || undefined
                        }}
                      >
                        Year {player.yearGroup}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 space-y-2">
                <Users className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-slate-400">No players online right now</p>
                <p className="text-slate-500 text-sm">Be the first to join!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* How to Join - Clear Instructions for Both Editions */}
        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            How to Join
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* JAVA EDITION */}
            <Card className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border-blue-500/50 backdrop-blur-sm shadow-2xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/30 rounded-lg">
                    <Monitor className="w-6 h-6 text-blue-300" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-xl flex items-center gap-2">
                      JAVA Edition
                      <Badge variant="info" className="text-xs">PC/Mac/Linux</Badge>
                    </CardTitle>
                    <CardDescription className="text-blue-200">
                      For computers & laptops
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                    <div className="flex-1">
                      <p className="text-blue-100 font-semibold text-sm mb-1">Join the Server</p>
                      <p className="text-blue-200/80 text-sm">Add server: <code className="bg-slate-950/60 px-2 py-1 rounded text-blue-300">{SERVER_IP}</code></p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                    <div className="flex-1">
                      <p className="text-blue-100 font-semibold text-sm mb-1">Get Registration Link</p>
                      <p className="text-blue-200/80 text-sm">Type: <code className="bg-slate-950/60 px-2 py-1 rounded text-blue-300">/register</code></p>
                      <p className="text-blue-300/60 text-xs mt-1">You'll receive a clickable link in chat</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                    <div className="flex-1">
                      <p className="text-blue-100 font-semibold text-sm mb-1">Complete Registration</p>
                      <p className="text-blue-200/80 text-sm">Click the link and fill out the form</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">4</div>
                    <div className="flex-1">
                      <p className="text-blue-100 font-semibold text-sm mb-1">Start Playing!</p>
                      <p className="text-blue-200/80 text-sm">Login: <code className="bg-slate-950/60 px-2 py-1 rounded text-blue-300">/login &lt;password&gt;</code></p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* BEDROCK EDITION */}
            <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/50 backdrop-blur-sm shadow-2xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/30 rounded-lg">
                    <Smartphone className="w-6 h-6 text-purple-300" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-xl flex items-center gap-2">
                      BEDROCK Edition
                      <Badge variant="purple" className="text-xs">Mobile/Console</Badge>
                    </CardTitle>
                    <CardDescription className="text-purple-200">
                      For phones, tablets, Xbox, PlayStation, Switch
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                    <div className="flex-1">
                      <p className="text-purple-100 font-semibold text-sm mb-1">Join the Server</p>
                      <p className="text-purple-200/80 text-sm">Server: <code className="bg-slate-950/60 px-2 py-1 rounded text-purple-300">{SERVER_IP}</code></p>
                      <p className="text-purple-300/60 text-xs mt-1">Port: <code className="bg-slate-950/60 px-1 py-0.5 rounded text-purple-300">19132</code></p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                    <div className="flex-1">
                      <p className="text-purple-100 font-semibold text-sm mb-1">Get Your PIN</p>
                      <p className="text-purple-200/80 text-sm">Type: <code className="bg-slate-950/60 px-2 py-1 rounded text-purple-300">/register</code></p>
                      <p className="text-purple-300/60 text-xs mt-1">You'll receive a 6-digit PIN code</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                    <div className="flex-1">
                      <p className="text-purple-100 font-semibold text-sm mb-1">Enter PIN Below</p>
                      <form onSubmit={handlePinSubmit} className="space-y-2 mt-2">
                        <Input
                          type="text"
                          maxLength={6}
                          value={pin}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '')
                            setPin(value)
                          }}
                          placeholder="000000"
                          className="text-center text-2xl tracking-widest font-mono bg-slate-900/50 border-purple-400/50 text-white placeholder:text-slate-600"
                        />
                        <Button 
                          type="submit"
                          disabled={pin.length !== 6}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-700 disabled:to-slate-700"
                          size="sm"
                        >
                          Continue →
                        </Button>
                      </form>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">4</div>
                    <div className="flex-1">
                      <p className="text-purple-100 font-semibold text-sm mb-1">Complete & Play!</p>
                      <p className="text-purple-200/80 text-sm">Fill out the form and start playing</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Existing Players - Quick Access */}
        <Card className="bg-slate-800/40 border-green-500/30 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-xl flex items-center justify-center gap-2">
              <Shield className="w-6 h-6 text-green-400" />
              Already Registered?
            </CardTitle>
            <CardDescription className="text-slate-400">
              Access your dashboard or login in-game
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/40 p-4 rounded-lg border border-green-500/20 text-center">
                <p className="text-green-400 font-semibold mb-2">In-Game Login</p>
                <code className="text-green-300 bg-slate-950/60 px-3 py-2 rounded font-mono text-sm">/login &lt;password&gt;</code>
              </div>
              <Link href="/login" className="block">
                <Button className="w-full h-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg transform hover:scale-105 transition-all">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Web Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Features Section - Enhanced */}
        <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-xl sm:text-2xl">Why Play on Streetly SMP?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-slate-900/60 to-slate-800/60 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-all transform hover:-translate-y-1">
                <div className="inline-flex p-3 bg-blue-500/20 rounded-full mb-3">
                  <Shield className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Secure</h3>
                <p className="text-slate-400 text-sm">Military-grade bcrypt encryption protects your account</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-slate-900/60 to-slate-800/60 rounded-xl border border-slate-700/50 hover:border-purple-500/30 transition-all transform hover:-translate-y-1">
                <div className="inline-flex p-3 bg-purple-500/20 rounded-full mb-3">
                  <Zap className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Lightning Fast</h3>
                <p className="text-slate-400 text-sm">Instant authentication with optimized server performance</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-slate-900/60 to-slate-800/60 rounded-xl border border-slate-700/50 hover:border-green-500/30 transition-all transform hover:-translate-y-1">
                <div className="inline-flex p-3 bg-green-500/20 rounded-full mb-3">
                  <Users className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">User Friendly</h3>
                <p className="text-slate-400 text-sm">Simple 4-step registration gets you playing in minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer - Enhanced with link */}
        <div className="text-center space-y-2 pt-4">
          <p className="text-slate-400 text-sm">
            Powered by{' '}
            <a 
              href="https://tsvweb.co.uk" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors underline decoration-blue-400/30 hover:decoration-blue-300"
            >
              tsvweb.co.uk
            </a>
          </p>
          <p className="text-slate-500 text-xs">TSV Network © 2025 • Minecraft Authentication System</p>
        </div>
      </div>
    </main>
  )
}

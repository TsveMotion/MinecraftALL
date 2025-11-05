'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check, Server, ExternalLink, Shield, Zap, Users, Activity, Wifi, KeyRound } from 'lucide-react'

const SERVER_IP = process.env.NEXT_PUBLIC_MINECRAFT_SERVER || 'Play.tsvweb.co.uk'

interface ServerStatus {
  online: boolean
  players?: { online: number; max: number }
  version?: string
  ping?: number
  error?: string
}

export default function Home() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [pin, setPin] = useState('')

  useEffect(() => {
    fetchServerStatus()
    const interval = setInterval(fetchServerStatus, 30000) // Update every 30s
    return () => clearInterval(interval)
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

        {/* Bedrock PIN Entry - Quick Access */}
        <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-purple-500/50 backdrop-blur-sm shadow-2xl shadow-purple-900/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/30 rounded-lg">
                <KeyRound className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Bedrock Players</CardTitle>
                <CardDescription className="text-purple-200">
                  Enter your 6-digit PIN to register
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-purple-500/30">
                <Input
                  type="text"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    setPin(value)
                  }}
                  placeholder="000000"
                  className="text-center text-3xl tracking-widest font-mono bg-slate-900/50 border-purple-400/50 text-white placeholder:text-slate-600 focus:border-purple-400"
                />
              </div>
              <div className="space-y-2 text-sm text-purple-200">
                <p className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Run <code className="bg-slate-950/60 px-2 py-0.5 rounded text-purple-300">/register</code> in-game to get your PIN</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Enter the 6-digit PIN above</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Complete registration on the next page</span>
                </p>
              </div>
              <Button 
                type="submit"
                disabled={pin.length !== 6}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-700 shadow-lg shadow-purple-500/30 transform hover:scale-105 transition-all text-lg py-6"
              >
                Continue with PIN →
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Navigation Cards - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm hover:border-blue-500/50 hover:bg-slate-800/60 transition-all duration-300 transform hover:-translate-y-1 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">New Players</CardTitle>
                  <CardDescription className="text-slate-400">
                    First time joining? Start here
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                  <p className="text-slate-300 text-sm pt-1">Join the Minecraft server</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                  <p className="text-slate-300 text-sm pt-1">Type <code className="bg-slate-950 px-2 py-1 rounded text-blue-400 font-mono">/register</code></p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                  <p className="text-slate-300 text-sm pt-1">Click your unique registration link</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">4</div>
                  <p className="text-slate-300 text-sm pt-1">Complete the form and start playing!</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm hover:border-green-500/50 hover:bg-slate-800/60 transition-all duration-300 transform hover:-translate-y-1 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Existing Players</CardTitle>
                  <CardDescription className="text-slate-400">
                    Already registered? Welcome back
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="bg-slate-950/40 p-3 rounded-lg border border-green-500/20">
                  <p className="text-slate-300 text-sm mb-1">
                    <strong className="text-green-400">In-Game Login:</strong>
                  </p>
                  <code className="text-green-400 bg-slate-950/60 px-3 py-2 rounded font-mono text-sm block">/login &lt;password&gt;</code>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-lg border border-blue-500/20">
                  <p className="text-slate-300 text-sm mb-2">
                    <strong className="text-blue-400">Web Dashboard:</strong>
                  </p>
                  <Link href="/login">
                    <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/30 transform hover:scale-105 transition-all">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Access Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Server, 
  Shield, 
  Zap, 
  Users, 
  KeyRound, 
  Gamepad2, 
  UserPlus, 
  Globe,
  Activity,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

const SERVER_IP = process.env.NEXT_PUBLIC_MINECRAFT_SERVER || 'play.streetlymc.com'

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
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([])
  const [playersLoading, setPlayersLoading] = useState(true)

  useEffect(() => {
    fetchServerStatus()
    fetchOnlinePlayers()
    const statusInterval = setInterval(fetchServerStatus, 10000)
    const playersInterval = setInterval(fetchOnlinePlayers, 10000)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="container mx-auto px-4 pt-20 pb-16">
          <div className="max-w-6xl mx-auto">
            {/* Status Badge */}
            <div className="flex justify-center mb-6 animate-fade-in">
              <Badge 
                variant="outline" 
                className={cn(
                  "px-4 py-1.5 text-sm font-medium backdrop-blur-sm border-2 transition-all",
                  serverStatus?.online 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full mr-2 animate-pulse",
                  serverStatus?.online ? "bg-emerald-400" : "bg-red-400"
                )}></div>
                {serverStatus?.online ? 'Server Online' : 'Server Offline'}
                {serverStatus?.players && (
                  <span className="ml-2">• {serverStatus.players.online} Players Online</span>
                )}
              </Badge>
            </div>

            {/* Main Heading */}
            <div className="text-center space-y-6 mb-12 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm mb-4">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-300 font-medium">Premium Minecraft Network</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight">
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 animate-gradient">
                  Streetly SMP
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
                Experience Minecraft like never before on our premium network. 
                <span className="block mt-2 text-blue-300 font-medium">Join thousands of players today.</span>
              </p>
            </div>

            {/* Server IP Card - Premium Design */}
            <div className="max-w-3xl mx-auto mb-12">
              <Card className="bg-slate-900/60 border-2 border-blue-500/30 backdrop-blur-xl shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:border-blue-500/50 transition-all duration-500">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <Server className="w-6 h-6 text-blue-400" />
                    <h3 className="text-xl font-semibold text-white">Server Address</h3>
                  </div>
                  
                  <div className="bg-slate-950/80 rounded-xl p-6 border border-blue-500/20 mb-6">
                    <code className="text-3xl md:text-4xl font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300 font-bold tracking-wider block text-center">
                      {SERVER_IP}
                    </code>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg"
                      onClick={() => window.open(`minecraft://${SERVER_IP}`, '_blank')}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 text-lg px-8 py-6 group"
                    >
                      <Gamepad2 className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                      Join Server Now
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    
                    <Button 
                      size="lg"
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(SERVER_IP)}
                      className="border-2 border-blue-500/30 hover:bg-blue-500/10 text-white font-semibold px-8 py-6 text-lg"
                    >
                      Copy IP Address
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
              <Button 
                size="lg"
                onClick={() => router.push('/register')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 px-12 py-6 text-lg group"
              >
                <UserPlus className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Create Account
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                onClick={() => router.push('/login')}
                className="border-2 border-slate-600 hover:bg-slate-800 text-white font-semibold px-12 py-6 text-lg"
              >
                <KeyRound className="mr-2 h-5 w-5" />
                Login
              </Button>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {/* Feature 1 */}
              <Card className="bg-slate-900/40 border-slate-700/50 backdrop-blur-md hover:bg-slate-900/60 hover:border-blue-500/30 transition-all duration-300 group">
                <CardHeader>
                  <div className="inline-flex p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                    <Shield className="w-8 h-8 text-blue-400" />
                  </div>
                  <CardTitle className="text-white text-2xl">Secure & Protected</CardTitle>
                  <CardDescription className="text-slate-400 text-base">
                    Advanced security with verified accounts. Your data is encrypted and protected with industry-leading protocols.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Feature 2 */}
              <Card className="bg-slate-900/40 border-slate-700/50 backdrop-blur-md hover:bg-slate-900/60 hover:border-purple-500/30 transition-all duration-300 group">
                <CardHeader>
                  <div className="inline-flex p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                    <Zap className="w-8 h-8 text-purple-400" />
                  </div>
                  <CardTitle className="text-white text-2xl">Lightning Fast</CardTitle>
                  <CardDescription className="text-slate-400 text-base">
                    High-performance infrastructure with minimal latency. Experience smooth, lag-free gameplay 24/7.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Feature 3 */}
              <Card className="bg-slate-900/40 border-slate-700/50 backdrop-blur-md hover:bg-slate-900/60 hover:border-emerald-500/30 transition-all duration-300 group">
                <CardHeader>
                  <div className="inline-flex p-4 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8 text-emerald-400" />
                  </div>
                  <CardTitle className="text-white text-2xl">Active Community</CardTitle>
                  <CardDescription className="text-slate-400 text-base">
                    Join a thriving community of Minecraft enthusiasts. Make friends and build together.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* How to Join Section */}
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-slate-700/50 mb-16">
              <div className="text-center mb-10">
                <Badge variant="outline" className="mb-4 px-4 py-2 text-sm font-medium bg-blue-500/10 border-blue-500/20 text-blue-400">
                  Getting Started
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  How to Join
                </h2>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                  Follow these simple steps to start your adventure
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Step 1 */}
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-2xl font-bold mb-4 shadow-lg shadow-blue-500/30">
                    1
                  </div>
                  <h3 className="text-xl font-semibold text-white">Create Account</h3>
                  <p className="text-slate-400">
                    Register on our website with your Minecraft username and create a secure password.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white text-2xl font-bold mb-4 shadow-lg shadow-purple-500/30">
                    2
                  </div>
                  <h3 className="text-xl font-semibold text-white">Verify Account</h3>
                  <p className="text-slate-400">
                    Complete the verification process to unlock full server access.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600 to-green-600 text-white text-2xl font-bold mb-4 shadow-lg shadow-emerald-500/30">
                    3
                  </div>
                  <h3 className="text-xl font-semibold text-white">Start Playing</h3>
                  <p className="text-slate-400">
                    Join the lobby and explore our Survival server and community.
                  </p>
                </div>
              </div>

              <div className="mt-10 text-center">
                <Button 
                  size="lg"
                  onClick={() => router.push('/register')}
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 px-12 py-6 text-lg"
                >
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
              <Card className="bg-gradient-to-br from-blue-900/40 to-blue-950/40 border-blue-500/30 backdrop-blur-md text-center">
                <CardContent className="p-6">
                  <Activity className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                  <div className="text-4xl font-bold text-white mb-2">
                    {serverStatus?.players?.online || 0}
                  </div>
                  <div className="text-slate-400 font-medium">Players Online</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 border-purple-500/30 backdrop-blur-md text-center">
                <CardContent className="p-6">
                  <Globe className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                  <div className="text-4xl font-bold text-white mb-2">99.9%</div>
                  <div className="text-slate-400 font-medium">Uptime</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border-emerald-500/30 backdrop-blur-md text-center">
                <CardContent className="p-6">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <div className="text-4xl font-bold text-white mb-2">24/7</div>
                  <div className="text-slate-400 font-medium">Support</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-950/50 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center space-y-3">
              <p className="text-slate-400 text-base">
                Hosted & Sponsored by{' '}
                <a 
                  href="https://tsvweb.co.uk" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  TSVWEB.CO.UK
                </a>
              </p>
              <p className="text-slate-500 text-sm">
                © 2025 Streetly SMP Network. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 5s ease infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

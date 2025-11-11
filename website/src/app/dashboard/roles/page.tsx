'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, Check, Crown, Loader2, Lock, Star, ArrowLeft } from 'lucide-react'

interface Role {
  id: number
  name: string
  symbol: string
  colorHex: string
  isFree: boolean
  priceMinor: number
  description: string | null
  isActive: boolean
}

interface UserRole {
  role: Role
  isPrimary: boolean
}

interface User {
  id: number
  minecraftUsername: string
  roles: UserRole[]
}

export default function RolesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [freeRoles, setFreeRoles] = useState<Role[]>([])
  const [paidRoles, setPaidRoles] = useState<Role[]>([])
  const [primaryRole, setPrimaryRole] = useState<Role | null>(null)
  const [hasFreeRole, setHasFreeRole] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch current user with roles
      const userRes = await fetch('/api/user/me')
      if (!userRes.ok) {
        router.push('/login')
        return
      }
      const userData = await userRes.json()
      setUser(userData)

      // Check if user has any free role
      const hasFree = userData.roles.some((ur: UserRole) => ur.role.isFree)
      setHasFreeRole(hasFree)

      // Find primary role
      const primary = userData.roles.find((ur: UserRole) => ur.isPrimary)
      setPrimaryRole(primary?.role || null)

      // Fetch all roles
      const rolesRes = await fetch('/api/roles')
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json()
        const free = rolesData.filter((r: Role) => r.isFree && r.isActive)
        const paid = rolesData.filter((r: Role) => !r.isFree && r.isActive)
        setFreeRoles(free)
        setPaidRoles(paid)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClaimRole = async (roleId: number) => {
    if (hasFreeRole) {
      alert('You already have a free role! You can only claim one free role.')
      return
    }

    setClaiming(true)
    try {
      const res = await fetch('/api/user/claim-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId, setPrimary: true }),
      })

      const data = await res.json()
      if (res.ok) {
        alert('Role claimed successfully!')
        
        // Notify plugin to refresh roles
        await fetch('/api/plugin/notify-role-change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.id }),
        }).catch(() => {
          // Plugin notification is optional, ignore errors
        })

        fetchData()
      } else {
        alert(`Error: ${data.error || 'Failed to claim role'}`)
      }
    } catch (error) {
      alert('Failed to claim role')
    } finally {
      setClaiming(false)
    }
  }

  const handleSetPrimary = async (roleId: number) => {
    setClaiming(true)
    try {
      const res = await fetch('/api/user/set-primary-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId }),
      })

      const data = await res.json()
      if (res.ok) {
        alert('Primary role updated!')
        
        // Notify plugin
        await fetch('/api/plugin/notify-role-change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.id }),
        }).catch(() => {})

        fetchData()
      } else {
        alert(`Error: ${data.error || 'Failed to set primary role'}`)
      }
    } catch (error) {
      alert('Failed to set primary role')
    } finally {
      setClaiming(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4">
      <div className="max-w-6xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="w-10 h-10 text-purple-400" />
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Role Shop
              </h1>
              <p className="text-slate-400">Claim your identity and stand out in-game</p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Current Primary Role */}
        {primaryRole && (
          <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-400" />
                Your Primary Role
              </CardTitle>
              <CardDescription className="text-purple-200">
                This role appears in-game as your chat prefix and tab display
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-lg border border-purple-500/30">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl font-bold shadow-lg"
                  style={{ backgroundColor: primaryRole.colorHex, color: '#ffffff' }}
                >
                  {primaryRole.symbol}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white">{primaryRole.name}</h3>
                  {primaryRole.description && (
                    <p className="text-slate-300 text-sm mt-1">{primaryRole.description}</p>
                  )}
                </div>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                  <Crown className="w-3 h-3 mr-1" />
                  Primary
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Your Roles */}
        {user && user.roles.length > 0 && (
          <Card className="bg-slate-900/70 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Your Roles</CardTitle>
              <CardDescription className="text-slate-400">
                Click any role to set it as your primary role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.roles.map((userRole) => (
                  <button
                    key={userRole.role.id}
                    onClick={() => !userRole.isPrimary && handleSetPrimary(userRole.role.id)}
                    disabled={userRole.isPrimary || claiming}
                    className={`
                      relative bg-slate-800/50 border-2 rounded-lg p-4 transition-all text-left
                      ${userRole.isPrimary 
                        ? 'border-amber-500/50 shadow-lg shadow-amber-500/20' 
                        : 'border-slate-700 hover:border-purple-500/50 cursor-pointer hover:scale-105'
                      }
                      ${claiming ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {userRole.isPrimary && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                          <Crown className="w-3 h-3" />
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded flex items-center justify-center text-2xl font-bold"
                        style={{ backgroundColor: userRole.role.colorHex, color: '#ffffff' }}
                      >
                        {userRole.role.symbol}
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{userRole.role.name}</h4>
                        {userRole.role.description && (
                          <p className="text-slate-400 text-xs mt-0.5">{userRole.role.description}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Free Roles */}
        <Card className="bg-slate-900/70 border-blue-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Star className="w-6 h-6 text-blue-400" />
              Free Roles
            </CardTitle>
            <CardDescription className="text-slate-400">
              {hasFreeRole 
                ? 'You have already claimed your free role' 
                : 'Claim ONE free role to customize your in-game appearance'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {freeRoles.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No free roles available at the moment
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {freeRoles.map((role) => {
                  const hasRole = user?.roles.some(ur => ur.role.id === role.id)
                  return (
                    <Card key={role.id} className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl font-bold shadow-lg"
                            style={{ backgroundColor: role.colorHex, color: '#ffffff' }}
                          >
                            {role.symbol}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-semibold">{role.name}</h4>
                            <Badge variant="success" className="text-xs mt-1">FREE</Badge>
                          </div>
                        </div>
                        {role.description && (
                          <p className="text-slate-400 text-sm">{role.description}</p>
                        )}
                        <Button
                          onClick={() => handleClaimRole(role.id)}
                          disabled={hasFreeRole || hasRole || claiming}
                          className={`w-full ${
                            hasRole 
                              ? 'bg-green-600 hover:bg-green-600 cursor-default' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {claiming ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : hasRole ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Owned
                            </>
                          ) : hasFreeRole ? (
                            'Already Claimed Free Role'
                          ) : (
                            'Claim Role'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paid Roles - Coming Soon */}
        {paidRoles.length > 0 && (
          <Card className="bg-slate-900/70 border-amber-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="w-6 h-6 text-amber-400" />
                Premium Roles
              </CardTitle>
              <CardDescription className="text-slate-400">
                Premium roles with exclusive perks - Coming Soon!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paidRoles.map((role) => (
                  <Card key={role.id} className="bg-slate-800/50 border-slate-700 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none"></div>
                    <CardContent className="p-4 space-y-3 relative">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl font-bold shadow-lg"
                          style={{ backgroundColor: role.colorHex, color: '#ffffff' }}
                        >
                          {role.symbol}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">{role.name}</h4>
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs mt-1">
                            £{(role.priceMinor / 100).toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                      {role.description && (
                        <p className="text-slate-400 text-sm">{role.description}</p>
                      )}
                      <Button
                        disabled
                        className="w-full bg-slate-700 hover:bg-slate-700 cursor-not-allowed"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Coming Soon
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Loader2, LogOut, User, Mail, Hash, Shield, Wifi, WifiOff, Clock, MapPin, Award } from 'lucide-react'
import { getYearGroupName } from '@/lib/userUtils'

interface Role {
  role: {
    id: number
    name: string
    color: string | null
    isPaid: boolean
  }
}

interface UserProfile {
  id: number
  minecraftUsername: string
  minecraftUuid: string | null
  email: string
  fullName: string
  realName: string | null
  yearGroup: number | null
  rankColor: string | null
  isAdmin: boolean
  lastLoginAt: string | null
  lastLoginIp: string | null
  isOnline: boolean
  roles: Role[]
  admin: any
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/dashboard/profile')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long')
      return
    }

    setPasswordLoading(true)

    try {
      const response = await fetch('/api/dashboard/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordSuccess(true)
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setPasswordError(data.error || 'Failed to change password')
      }
    } catch (error) {
      setPasswordError('An error occurred. Please try again.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
      </main>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4">
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Dashboard
          </h1>
          <div className="flex gap-3">
            {user.isAdmin && (
              <Button
                onClick={() => router.push('/admin')}
                variant="outline"
                className="bg-purple-600 hover:bg-purple-700 border-purple-500 text-white"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            )}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Player Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status & Roles Row */}
            <div className="flex flex-wrap gap-2">
              {user.isOnline ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  ONLINE
                </Badge>
              ) : (
                <Badge className="flex items-center gap-1 bg-slate-700 text-slate-400">
                  <WifiOff className="w-3 h-3" />
                  OFFLINE
                </Badge>
              )}
              
              {(user.isAdmin || user.admin) && (
                <Badge variant="purple" className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  ADMIN
                </Badge>
              )}

              {user.roles && user.roles.length > 0 && user.roles.map((userRole) => (
                <Badge 
                  key={userRole.role.id}
                  className="border"
                  style={{ 
                    backgroundColor: userRole.role.color ? `${userRole.role.color}20` : undefined,
                    borderColor: userRole.role.color ? `${userRole.role.color}50` : undefined,
                    color: userRole.role.color || undefined
                  }}
                >
                  {userRole.role.name}
                </Badge>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-400 text-sm">Minecraft Username</Label>
                  <p className="text-white text-lg font-mono">{user.minecraftUsername}</p>
                </div>

                {user.minecraftUuid && (
                  <div>
                    <Label className="text-slate-400 text-sm">Minecraft UUID</Label>
                    <p className="text-slate-300 text-xs font-mono break-all">{user.minecraftUuid}</p>
                  </div>
                )}

                <div>
                  <Label className="text-slate-400 text-sm">Display Name (In-Game)</Label>
                  <p className="text-white text-lg font-semibold">
                    {user.realName && user.yearGroup && user.rankColor && (
                      <>
                        <span style={{ color: user.rankColor }}>[Year {user.yearGroup}]</span>
                        {' '}
                        <span style={{ color: user.rankColor }}>{user.realName}</span>
                        {' '}
                        <span className="text-slate-400 text-sm">({user.minecraftUsername})</span>
                      </>
                    )}
                    {!user.realName && user.minecraftUsername}
                  </p>
                </div>

                <div>
                  <Label className="text-slate-400 text-sm">Full Name</Label>
                  <p className="text-white">{user.fullName}</p>
                </div>

                <div>
                  <Label className="text-slate-400 text-sm">Email</Label>
                  <div className="flex items-center gap-2 text-white">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {user.yearGroup && (
                  <div>
                    <Label className="text-slate-400 text-sm">Year Group</Label>
                    <div 
                      className="font-semibold text-lg" 
                      style={{ color: user.rankColor || '#FFFFFF' }}
                    >
                      {getYearGroupName(user.yearGroup)}
                    </div>
                  </div>
                )}

                {user.lastLoginAt && (
                  <div>
                    <Label className="text-slate-400 text-sm">Last Login</Label>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-4 h-4 text-green-400" />
                      <span className="text-sm">
                        {new Date(user.lastLoginAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {user.lastLoginIp && (
                  <div>
                    <Label className="text-slate-400 text-sm">Last IP Address</Label>
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-mono">{user.lastLoginIp}</span>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-slate-400 text-sm">Account Created</Label>
                  <p className="text-slate-300 text-sm">
                    {new Date(user.lastLoginAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roles Card */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  Your Roles
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Customize your in-game appearance
                </CardDescription>
              </div>
              <Button
                onClick={() => router.push('/dashboard/roles')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Award className="w-4 h-4 mr-2" />
                Browse Roles
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.roles && user.roles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((role: any) => (
                    <Badge
                      key={role.id}
                      style={{
                        backgroundColor: role.color ? `${role.color}30` : undefined,
                        borderColor: role.color ? `${role.color}60` : undefined,
                        color: role.color || undefined
                      }}
                      className="px-3 py-1"
                    >
                      {role.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 text-center">
                  <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">You don't have any roles yet</p>
                  <p className="text-slate-500 text-xs mt-2">Claim a free role to customize your chat tag!</p>
                </div>
              )}
              
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-blue-400 font-semibold text-sm mb-2">✨ Role Shop Available!</h3>
                <p className="text-slate-400 text-xs">
                  Browse free and premium roles to customize your in-game appearance. Each role comes with a unique symbol and color!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Change Password</CardTitle>
            <CardDescription className="text-slate-400">
              Update your account password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-white">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-white">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>

              {passwordError && (
                <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg flex gap-2 items-start">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-green-900/20 border border-green-500/30 p-3 rounded-lg flex gap-2 items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-green-300 text-sm">Password changed successfully!</p>
                </div>
              )}

              <Button type="submit" disabled={passwordLoading} className="w-full">
                {passwordLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

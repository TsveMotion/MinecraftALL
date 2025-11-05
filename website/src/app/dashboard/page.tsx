'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Loader2, LogOut, User, Mail, Hash, Shield } from 'lucide-react'
import { getYearGroupName } from '@/lib/userUtils'

interface UserProfile {
  id: number
  minecraftUsername: string
  email: string
  fullName: string
  realName: string | null
  yearGroup: number | null
  rankColor: string | null
  isAdmin: boolean
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
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-400">Minecraft Username</Label>
                  <p className="text-white text-lg font-mono">{user.minecraftUsername}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Display Name (In-Game)</Label>
                  <p className="text-white text-lg font-semibold">
                    {user.realName && user.yearGroup && user.rankColor && (
                      <>
                        <span style={{ color: user.rankColor }}>[Year {user.yearGroup}]</span>
                        {' '}
                        <span style={{ color: user.rankColor }}>{user.realName}</span>
                        {' '}
                        <span className="text-slate-400">({user.minecraftUsername})</span>
                      </>
                    )}
                    {!user.realName && user.minecraftUsername}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-400">Email</Label>
                  <p className="text-white">{user.email}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Full Name</Label>
                  <p className="text-white">{user.fullName}</p>
                </div>
              </div>

              {user.yearGroup && (
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm">Year Group</Label>
                  <div 
                    className="font-semibold" 
                    style={{ color: user.rankColor || '#FFFFFF' }}
                  >
                    {getYearGroupName(user.yearGroup)}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-slate-400 text-sm">Email</Label>
                <div className="flex items-center gap-2 text-white">
                  <Mail className="w-4 h-4 text-green-400" />
                  <span className="text-sm">{user.email}</span>
                </div>
              </div>

              {user.isAdmin && (
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm">Role</Label>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 font-semibold">Administrator</span>
                  </div>
                </div>
              )}
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

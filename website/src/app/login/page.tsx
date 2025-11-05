'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    minecraftUsername: '',
    password: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minecraftUsername: formData.minecraftUsername,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        if (data.success) {
          // Redirect to admin panel if user is admin, otherwise dashboard
          if (data.user?.isAdmin) {
            router.push('/admin')
          } else {
            router.push('/dashboard')
          }
        }
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-400" />
            </div>
            <CardTitle className="text-white text-2xl">Login Successful!</CardTitle>
            <CardDescription className="text-slate-400">
              Welcome back, {formData.minecraftUsername}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg text-center">
              <p className="text-slate-300">
                Web dashboard features coming soon!
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-2xl">Web Dashboard Login</CardTitle>
          <CardDescription className="text-slate-400">
            Login with your Minecraft account credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="minecraftUsername" className="text-white">Minecraft Username</Label>
              <Input
                id="minecraftUsername"
                type="text"
                required
                value={formData.minecraftUsername}
                onChange={(e) => setFormData({ ...formData, minecraftUsername: e.target.value })}
                className="bg-slate-900/50 border-slate-600 text-white"
                placeholder="Steve"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-slate-900/50 border-slate-600 text-white"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg flex gap-2 items-start">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>

            <div className="bg-slate-900/50 p-4 rounded-lg">
              <p className="text-slate-400 text-sm text-center">
                Don't have an account? Join the Minecraft server and type <code className="bg-slate-800 px-2 py-1 rounded text-blue-400">/register</code>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

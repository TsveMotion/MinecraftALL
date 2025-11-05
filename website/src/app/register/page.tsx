'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    pin: '',
  })

  const [minecraftUsername, setMinecraftUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [validatingToken, setValidatingToken] = useState(true)
  const [validatingPin, setValidatingPin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [usingPin, setUsingPin] = useState(false)
  const [pinVerified, setPinVerified] = useState(false)

  // Auto-generate email when username changes
  const handleUsernameChange = (username: string) => {
    const lowerUsername = username.toLowerCase()
    setFormData({
      ...formData,
      username: lowerUsername,
      email: lowerUsername ? `${lowerUsername}@thestreetlyacademy.co.uk` : ''
    })
  }

  // Validate username pattern: YY-lastname-firstinitial
  const validateUsername = (username: string): boolean => {
    const pattern = /^(2[0-9])-([a-z]+)-([a-z])$/
    return pattern.test(username)
  }

  // Validate token on mount (if token exists) or check for PIN from homepage
  useEffect(() => {
    if (!token) {
      // No token, check if PIN was stored from homepage
      const storedPin = sessionStorage.getItem('bedrock_pin')
      if (storedPin) {
        setFormData(prev => ({ ...prev, pin: storedPin }))
        // Auto-verify the PIN
        handleAutoVerifyPin(storedPin)
      } else {
        // No token and no PIN, allow manual PIN entry
        setUsingPin(true)
        setValidatingToken(false)
      }
      return
    }

    fetch(`/api/validate-token?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setMinecraftUsername(data.minecraftUsername)
        } else {
          setError(data.error || 'Invalid or expired token')
        }
      })
      .catch(() => setError('Failed to validate token'))
      .finally(() => setValidatingToken(false))
  }, [token])

  const handleAutoVerifyPin = async (pin: string) => {
    setValidatingPin(true)
    setUsingPin(true)
    setValidatingToken(false)

    try {
      const response = await fetch(`/api/verify-pin?pin=${pin}`)
      const data = await response.json()

      if (response.ok && data.valid) {
        setMinecraftUsername(data.minecraftUsername)
        setPinVerified(true)
        setError(null)
        // Clear from sessionStorage after use
        sessionStorage.removeItem('bedrock_pin')
      } else {
        setError(data.error || 'Invalid or expired PIN')
        setValidatingToken(false)
      }
    } catch (err) {
      setError('Failed to verify PIN. Please try again.')
      setValidatingToken(false)
    } finally {
      setValidatingPin(false)
    }
  }

  const handleVerifyPin = async () => {
    if (!formData.pin || formData.pin.length !== 6) {
      setError('Please enter a valid 6-digit PIN')
      return
    }

    setValidatingPin(true)
    setError(null)

    try {
      const response = await fetch(`/api/verify-pin?pin=${formData.pin}`)
      const data = await response.json()

      if (response.ok && data.valid) {
        setMinecraftUsername(data.minecraftUsername)
        setPinVerified(true)
        setError(null)
      } else {
        setError(data.error || 'Invalid or expired PIN')
      }
    } catch (err) {
      setError('Failed to verify PIN. Please try again.')
    } finally {
      setValidatingPin(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Basic validation
    if (!formData.username || !formData.fullName || !formData.password || !formData.confirmPassword) {
      setError('All fields are required')
      setLoading(false)
      return
    }

    // For PIN-based registration, ensure PIN is verified
    if (usingPin && !pinVerified) {
      setError('Please verify your PIN first')
      setLoading(false)
      return
    }

    // Validate username pattern
    if (!validateUsername(formData.username)) {
      setError('Username must follow format: YY-lastname-firstinitial (e.g., 20-tsvetanov-k)')
      setLoading(false)
      return
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: usingPin ? undefined : token,
          pin: usingPin ? formData.pin : undefined,
          fullName: formData.fullName,
          username: formData.username,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (validatingToken) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <p className="text-slate-300">Validating registration token...</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-400" />
            </div>
            <CardTitle className="text-white text-2xl">Registration Successful!</CardTitle>
            <CardDescription className="text-slate-400">
              Your account has been created
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-900/50 p-4 rounded-lg space-y-2">
              <p className="text-slate-300">
                <strong className="text-white">Minecraft Username:</strong> {minecraftUsername}
              </p>
              <p className="text-slate-300">
                <strong className="text-white">Email:</strong> {formData.email}
              </p>
            </div>
            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2">Next Steps:</h3>
              <ol className="list-decimal list-inside text-slate-300 space-y-1 text-sm">
                <li>Return to the Minecraft server</li>
                <li>Type: <code className="bg-slate-900 px-2 py-1 rounded text-blue-400">/login &lt;your-password&gt;</code></li>
                <li>Start playing!</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (error && !minecraftUsername && !usingPin) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-16 h-16 text-red-400" />
            </div>
            <CardTitle className="text-white text-2xl">Invalid Token</CardTitle>
            <CardDescription className="text-slate-400">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 text-center text-sm">
              Please return to the Minecraft server and use <code className="bg-slate-900 px-2 py-1 rounded text-blue-400">/register</code> to get a new link.
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-2xl">Create Your Account</CardTitle>
          <CardDescription className="text-slate-400">
            {minecraftUsername ? (
              <>Complete registration for Minecraft username: <span className="text-blue-400 font-semibold">{minecraftUsername}</span></>
            ) : (
              <>Enter your 6-digit PIN from the Minecraft server to continue</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usingPin && !pinVerified ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-white">6-Digit PIN</Label>
                <Input
                  id="pin"
                  type="text"
                  required
                  maxLength={6}
                  value={formData.pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    setFormData({ ...formData, pin: value })
                  }}
                  className="bg-slate-900/50 border-slate-600 text-white text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
                <p className="text-xs text-slate-400">
                  Enter the PIN you received in Minecraft after running /register
                </p>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg flex gap-2 items-start">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <Button 
                type="button"
                onClick={handleVerifyPin}
                className="w-full" 
                disabled={validatingPin || formData.pin.length !== 6}
              >
                {validatingPin ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying PIN...
                  </>
                ) : (
                  'Verify PIN'
                )}
              </Button>

              <div className="text-center pt-4 border-t border-slate-700">
                <p className="text-slate-400 text-sm">
                  Java Edition player? <a href="/register" className="text-blue-400 hover:text-blue-300">Use token link instead</a>
                </p>
              </div>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">Username</Label>
              <Input
                id="username"
                type="text"
                required
                value={formData.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-white"
                placeholder="20-tsvetanov-k"
              />
              <p className="text-xs text-slate-400">
                Format: YY-lastname-firstinitial (e.g., 20-tsvetanov-k)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email Address (Auto-generated)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                readOnly
                className="bg-slate-900/70 border-slate-600 text-slate-400 cursor-not-allowed"
                placeholder="Email will be generated from username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-white">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="bg-slate-900/50 border-slate-600 text-white"
                placeholder="Kristiyan Tsvetanov"
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
                minLength={8}
              />
              <p className="text-xs text-slate-400">Must be at least 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

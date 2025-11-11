'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Send, Loader2, ArrowLeft, Radio } from 'lucide-react'

interface ChatMessage {
  id: string
  timestamp: string
  username: string
  displayName: string
  roleSymbol: string | null
  roleColor: string | null
  message: string
}

export default function LiveChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/plugin/chat-stream')
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!messageInput.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch('/api/admin/send-server-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageInput.trim() })
      })

      if (res.ok) {
        setMessageInput('')
      } else {
        const data = await res.json()
        alert(`Error: ${data.error || 'Failed to send message'}`)
      }
    } catch (error) {
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4">
      <div className="max-w-5xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio className="w-10 h-10 text-green-400 animate-pulse" />
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                Live Chat
              </h1>
              <p className="text-slate-400">Real-time server chat stream</p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/admin')}
            variant="outline"
            className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
        </div>

        {/* Chat Card */}
        <Card className="bg-slate-900/70 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-green-400" />
              Chat Messages
              <div className="ml-auto flex items-center gap-2 text-sm text-slate-400 font-normal">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Live
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages Container */}
            <div className="h-96 overflow-y-auto px-6 py-4 space-y-2 custom-scrollbar bg-slate-950/30">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                  <p>No messages yet</p>
                  <p className="text-sm text-slate-500">Chat messages will appear here in real-time</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors">
                    <span className="text-xs text-slate-500 font-mono mt-0.5 flex-shrink-0">
                      {formatTime(msg.timestamp)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {msg.roleSymbol && (
                          <span
                            className="text-sm font-bold"
                            style={{ color: msg.roleColor || '#94a3b8' }}
                          >
                            {msg.roleSymbol}
                          </span>
                        )}
                        <span className="text-white font-semibold text-sm">
                          {msg.displayName}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          ({msg.username})
                        </span>
                      </div>
                      <p className="text-slate-200 text-sm break-words">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Send Message Form */}
            <div className="border-t border-slate-700 p-4 bg-slate-900/50">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <Input
                  type="text"
                  placeholder="Type a server message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={sending}
                  className="flex-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                />
                <Button
                  type="submit"
                  disabled={!messageInput.trim() || sending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </form>
              <p className="text-xs text-slate-500 mt-2">
                Messages are broadcast using RCON <code className="bg-slate-800 px-1 rounded">/say</code> command
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-900/20 border-blue-500/30 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/20 rounded">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-blue-300 font-semibold mb-1">Real-time Chat Integration</h3>
                <p className="text-blue-200 text-sm">
                  This page displays live chat messages from the Minecraft server. 
                  The plugin sends chat events to <code className="bg-slate-900/50 px-1 rounded">POST /api/plugin/chat-stream</code> 
                  {' '}which are stored temporarily and displayed here. Messages refresh every 3 seconds.
                </p>
                <p className="text-blue-200 text-sm mt-2">
                  You can send server-wide announcements using the input box above.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

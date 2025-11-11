'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, Loader2, X, Radio } from 'lucide-react'

interface ChatMessage {
  id: string
  timestamp: string
  username: string
  displayName: string
  roleSymbol: string | null
  roleColor: string | null
  message: string
}

interface LiveChatPanelProps {
  onClose?: () => void
}

export default function LiveChatPanel({ onClose }: LiveChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [connected, setConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // Connect to WebSocket
    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const connectWebSocket = () => {
    try {
      // Connect to WebSocket server
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8081'
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected')
        setConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'history') {
            // Received chat history
            setMessages(data.messages || [])
          } else if (data.type === 'message') {
            // New message
            setMessages(prev => [...prev, data.data])
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnected(false)
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setConnected(false)
        
        // Reconnect after 5 seconds
        setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.CLOSED) {
            connectWebSocket()
          }
        }, 5000)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
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
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <Radio className={`w-5 h-5 ${connected ? 'text-green-400 animate-pulse' : 'text-slate-500'}`} />
          <h3 className="text-white font-semibold">Live Chat</h3>
          {connected && (
            <span className="text-xs text-green-400">Connected</span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs text-slate-500">Chat will appear here in real-time</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-1 p-2 rounded hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono">
                  {formatTime(msg.timestamp)}
                </span>
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
              </div>
              <p className="text-slate-200 text-sm break-words pl-16">
                {msg.message}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Send Message */}
      <div className="border-t border-slate-700 p-4 bg-slate-800/50">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            placeholder="Send admin message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            disabled={sending}
            className="flex-1 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
          />
          <Button
            type="submit"
            disabled={!messageInput.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-slate-500 mt-2">
          Messages sent via RCON <code className="bg-slate-900 px-1 rounded">/say</code>
        </p>
      </div>
    </div>
  )
}

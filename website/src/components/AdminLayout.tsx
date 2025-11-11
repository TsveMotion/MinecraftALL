'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Shield, MessageSquare, Users, Award, AlertCircle, Settings } from 'lucide-react'
import LiveChatPanel from '@/components/LiveChatPanel'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      {/* Top Navigation Bar */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left - Logo/Title */}
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-400" />
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Admin Panel
              </h1>
            </div>

            {/* Center - Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => router.push('/admin')}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <Users className="w-4 h-4 mr-2" />
                Players
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/admin')}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Reports
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/admin')}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <Award className="w-4 h-4 mr-2" />
                Roles
              </Button>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setChatOpen(!chatOpen)}
                className={`${
                  chatOpen
                    ? 'bg-green-900/20 text-green-400 border border-green-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Live Chat
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-white"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area with Split View */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Main Content */}
        <div className={`flex-1 overflow-auto transition-all duration-300 ${chatOpen ? 'mr-96' : ''}`}>
          {children}
        </div>

        {/* Live Chat Sidebar */}
        {chatOpen && (
          <div className="fixed right-0 top-16 bottom-0 w-96 shadow-2xl z-30">
            <LiveChatPanel onClose={() => setChatOpen(false)} />
          </div>
        )}
      </div>
    </div>
  )
}

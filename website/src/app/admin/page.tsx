'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Search, Shield, Ban, Clock, Loader2, Wifi, WifiOff, VolumeX, Users, Award, UserPlus, UserMinus, UserCheck } from 'lucide-react'
import { getYearGroupName } from '@/lib/userUtils'

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
}

interface User {
  id: number
  minecraftUsername: string
  minecraftUuid: string | null
  email: string
  fullName: string
  realName: string | null
  yearGroup: number | null
  lastLoginAt: string | null
  lastLoginIp: string | null
  isOnline: boolean
  isAdmin: boolean
  admin: any
  roles: UserRole[]
  createdAt: string
}

interface Report {
  id: number
  description: string
  status: string
  createdAt: string
  reporter: {
    minecraftUsername: string
    realName: string | null
    fullName: string
  }
  reported: {
    minecraftUsername: string
    realName: string | null
    fullName: string
  }
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [reportSearchQuery, setReportSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [reportsLoading, setReportsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<{ [key: number]: string }>({})
  const [error, setError] = useState<string | null>(null)
  const [banModalUser, setBanModalUser] = useState<User | null>(null)
  const [banDuration, setBanDuration] = useState('')
  const [banReason, setBanReason] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'roles' | 'admins'>('users')
  const [roles, setRoles] = useState<Role[]>([])
  const [muteModalUser, setMuteModalUser] = useState<User | null>(null)
  const [muteDuration, setMuteDuration] = useState('')
  const [muteReason, setMuteReason] = useState('')
  const [createRoleModal, setCreateRoleModal] = useState(false)
  const [editRoleModal, setEditRoleModal] = useState<Role | null>(null)
  const [roleFormData, setRoleFormData] = useState({ name: '', symbol: '★', colorHex: '#9333EA', description: '' })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [userDetailTab, setUserDetailTab] = useState<'roles' | 'activity'>('roles')
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditLoading, setAuditLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchReports()
    fetchRoles()
  }, [])

  useEffect(() => {
    if (selectedUser) {
      const userRoleIds = selectedUser.roles.map(ur => ur.role.id)
      setAvailableRoles(roles.filter(r => !userRoleIds.includes(r.id)))
      fetchAuditLogs(selectedUser.id)
    } else {
      setUserDetailTab('roles')
      setAuditLogs([])
    }
  }, [selectedUser, roles])

  const fetchAuditLogs = async (userId: number) => {
    setAuditLoading(true)
    try {
      const res = await fetch(`/api/admin/audit?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setAuditLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setAuditLoading(false)
    }
  }

  useEffect(() => {
    filterUsers()
  }, [searchQuery, users])

  useEffect(() => {
    filterReports()
  }, [reportSearchQuery, reports])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else if (response.status === 403) {
        router.push('/dashboard')
      } else {
        setError('Failed to load users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('An error occurred while loading users')
    } finally {
      setLoading(false)
    }
  }

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/reports')
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports)
      } else {
        console.error('Failed to load reports')
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setReportsLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles)
      } else {
        console.error('Failed to load roles')
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = users.filter(
      (user) =>
        user.minecraftUsername.toLowerCase().includes(query) ||
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.realName?.toLowerCase().includes(query)
    )
    setFilteredUsers(filtered)
  }

  const filterReports = () => {
    if (!reportSearchQuery.trim()) {
      setFilteredReports(reports)
      return
    }

    const query = reportSearchQuery.toLowerCase()
    const filtered = reports.filter(
      (report) =>
        report.reporter.minecraftUsername.toLowerCase().includes(query) ||
        report.reported.minecraftUsername.toLowerCase().includes(query) ||
        report.description.toLowerCase().includes(query)
    )
    setFilteredReports(filtered)
  }

  const updateReportStatus = async (reportId: number, status: string) => {
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status }),
      })

      if (response.ok) {
        setReports(reports.map(r => r.id === reportId ? { ...r, status } : r))
      } else {
        alert('Failed to update report status')
      }
    } catch (error) {
      alert('Error updating report status')
    }
  }

  const handleMute = async (isPermanent: boolean) => {
    if (!muteModalUser) return

    const duration = isPermanent ? 0 : parseInt(muteDuration)
    if (!isPermanent && (!duration || duration <= 0)) {
      alert('Please enter a valid duration in hours')
      return
    }

    setActionLoading({ ...actionLoading, [muteModalUser.id]: 'mute' })
    try {
      const response = await fetch('/api/admin/mute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minecraftUsername: muteModalUser.minecraftUsername,
          reason: muteReason || 'No reason provided',
          isPermanent,
          durationHours: isPermanent ? null : duration,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        alert(
          `${muteModalUser.minecraftUsername} has been ${
            isPermanent ? 'permanently muted' : `muted for ${duration} hours`
          }`
        )
        setMuteModalUser(null)
        setMuteDuration('')
        setMuteReason('')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to mute player')
    } finally {
      setActionLoading({ ...actionLoading, [muteModalUser.id]: '' })
    }
  }

  const handleBan = async (isPermanent: boolean) => {
    if (!banModalUser) return

    const duration = isPermanent ? 0 : parseInt(banDuration)
    if (!isPermanent && (!duration || duration <= 0)) {
      alert('Please enter a valid duration in hours')
      return
    }

    setActionLoading({ ...actionLoading, [banModalUser.id]: 'ban' })
    try {
      const response = await fetch('/api/admin/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minecraftUsername: banModalUser.minecraftUsername,
          reason: banReason || 'No reason provided',
          isPermanent,
          durationHours: isPermanent ? null : duration,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        alert(
          `${banModalUser.minecraftUsername} has been ${
            isPermanent ? 'permanently banned' : `banned for ${duration} hours`
          }`
        )
        setBanModalUser(null)
        setBanDuration('')
        setBanReason('')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to ban player')
    } finally {
      setActionLoading({ ...actionLoading, [banModalUser.id]: '' })
    }
  }

  const handleUnban = async (user: User) => {
    if (!confirm(`Are you sure you want to unban ${user.minecraftUsername}?`)) {
      return
    }

    setActionLoading({ ...actionLoading, [user.id]: 'unban' })
    try {
      const response = await fetch('/api/admin/unban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minecraftUsername: user.minecraftUsername }),
      })

      const data = await response.json()
      if (response.ok) {
        alert(`${user.minecraftUsername} has been unbanned`)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to unban player')
    } finally {
      setActionLoading({ ...actionLoading, [user.id]: '' })
    }
  }

  const handleCreateRole = async () => {
    if (!roleFormData.name.trim()) {
      alert('Role name is required')
      return
    }

    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleFormData.name,
          symbol: roleFormData.symbol || '★',
          colorHex: roleFormData.colorHex,
          description: roleFormData.description,
          isFree: true,
          isActive: true
        }),
      })

      const data = await response.json()
      if (response.ok) {
        alert('Role created successfully!')
        setCreateRoleModal(false)
        fetchRoles()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to create role')
    }
  }

  const handleEditRole = async () => {
    if (!editRoleModal || !roleFormData.name.trim()) {
      alert('Role name is required')
      return
    }

    try {
      const response = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: editRoleModal.id,
          name: roleFormData.name,
          symbol: roleFormData.symbol,
          colorHex: roleFormData.colorHex,
          description: roleFormData.description,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        alert('Role updated successfully!')
        setEditRoleModal(null)
        fetchRoles()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to update role')
    }
  }

  const handleAssignRole = async (userId: number, roleId: number) => {
    try {
      const response = await fetch('/api/admin/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleId }),
      })

      const data = await response.json()
      if (response.ok) {
        alert('Role assigned successfully!')
        fetchUsers()
        if (selectedUser) {
          const updated = users.find(u => u.id === selectedUser.id)
          if (updated) setSelectedUser(updated)
        }
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to assign role')
    }
  }

  const handleRemoveRole = async (userId: number, roleId: number) => {
    try {
      const response = await fetch(`/api/admin/assign-role?userId=${userId}&roleId=${roleId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (response.ok) {
        alert('Role removed successfully!')
        fetchUsers()
        if (selectedUser) {
          const updated = users.find(u => u.id === selectedUser.id)
          if (updated) setSelectedUser(updated)
        }
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to remove role')
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
      <div className="max-w-7xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Admin Panel
            </h1>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/admin/live-chat')}
              variant="outline"
              className="bg-green-900/20 hover:bg-green-900/40 border-green-500/30 text-green-400"
            >
              <Users className="w-4 h-4 mr-2" />
              Live Chat
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-white"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg flex gap-2 items-start">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex gap-2 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'users'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            Players ({filteredUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Reports ({filteredReports.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'roles'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Award className="w-4 h-4" />
            Roles
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'admins'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Shield className="w-4 h-4" />
            Admins
          </button>
        </div>

        {/* Search Bar */}
        {activeTab === 'users' && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by username, name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-600 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {activeTab === 'reports' && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search reports by username or description..."
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-600 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Users Table */}
        {activeTab === 'users' && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              All Players ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-3 text-slate-400 font-semibold">Player</th>
                    <th className="text-left p-3 text-slate-400 font-semibold">Status</th>
                    <th className="text-left p-3 text-slate-400 font-semibold">Roles</th>
                    <th className="text-left p-3 text-slate-400 font-semibold">Last Login</th>
                    <th className="text-left p-3 text-slate-400 font-semibold">IP Address</th>
                    <th className="text-right p-3 text-slate-400 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="p-3">
                        <div>
                          <div className="text-white font-mono">{user.minecraftUsername}</div>
                          <div className="text-slate-400 text-xs">{user.realName || user.fullName}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          {user.isOnline ? (
                            <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                              <Wifi className="w-3 h-3" />
                              Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-500 text-sm">
                              <WifiOff className="w-3 h-3" />
                              Offline
                            </span>
                          )}
                          {(user.isAdmin || user.admin) && (
                            <span className="inline-flex items-center gap-1 text-purple-400 text-xs">
                              <Shield className="w-3 h-3" />
                              Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((userRole) => (
                              <span 
                                key={userRole.role.id}
                                className="text-xs px-2 py-1 rounded border"
                                style={{ 
                                  backgroundColor: userRole.role.colorHex ? `${userRole.role.colorHex}20` : '#334155',
                                  borderColor: userRole.role.colorHex ? `${userRole.role.colorHex}50` : '#475569',
                                  color: userRole.role.colorHex || '#94a3b8'
                                }}
                              >
                                {userRole.role.symbol} {userRole.role.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 text-xs">No roles</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-slate-400 text-sm">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleString()
                            : 'Never'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-slate-400 text-xs font-mono">
                          {user.lastLoginIp || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUser(user)}
                            className="bg-purple-900/20 hover:bg-purple-900/40 border-purple-500/50 text-purple-400"
                          >
                            <Users className="w-4 h-4 mr-1" />
                            Manage
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setMuteModalUser(user)
                              setMuteReason('')
                              setMuteDuration('')
                            }}
                            disabled={!!actionLoading[user.id]}
                            className="bg-orange-900/20 hover:bg-orange-900/40 border-orange-500/50 text-orange-400"
                          >
                            <VolumeX className="w-4 h-4 mr-1" />
                            Mute
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setBanModalUser(user)
                              setBanReason('')
                              setBanDuration('')
                            }}
                            disabled={!!actionLoading[user.id]}
                            className="bg-red-900/20 hover:bg-red-900/40 border-red-500/50 text-red-400"
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Ban
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnban(user)}
                            disabled={!!actionLoading[user.id]}
                            className="bg-green-900/20 hover:bg-green-900/40 border-green-500/50 text-green-400"
                          >
                            {actionLoading[user.id] === 'unban' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Unban'
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  {searchQuery ? 'No users found matching your search' : 'No users registered yet'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Reports Table */}
        {activeTab === 'reports' && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              Player Reports ({filteredReports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-3 text-slate-400 font-semibold">Reporter</th>
                    <th className="text-left p-3 text-slate-400 font-semibold">Reported Player</th>
                    <th className="text-left p-3 text-slate-400 font-semibold">Description</th>
                    <th className="text-left p-3 text-slate-400 font-semibold">Date</th>
                    <th className="text-left p-3 text-slate-400 font-semibold">Status</th>
                    <th className="text-right p-3 text-slate-400 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="p-3">
                        <div>
                          <span className="text-white font-mono text-sm">{report.reporter.minecraftUsername}</span>
                          {report.reporter.realName && (
                            <div className="text-slate-400 text-xs">{report.reporter.realName}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <span className="text-white font-mono text-sm">{report.reported.minecraftUsername}</span>
                          {report.reported.realName && (
                            <div className="text-slate-400 text-xs">{report.reported.realName}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-slate-300 text-sm">{report.description}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-slate-400 text-sm">
                          {new Date(report.createdAt).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            report.status === 'open'
                              ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30'
                              : report.status === 'resolved'
                              ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                              : 'bg-gray-900/30 text-gray-400 border border-gray-500/30'
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          {report.status === 'open' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateReportStatus(report.id, 'resolved')}
                              className="bg-green-900/20 hover:bg-green-900/40 border-green-500/50 text-green-400"
                            >
                              Resolve
                            </Button>
                          )}
                          {report.status !== 'dismissed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateReportStatus(report.id, 'dismissed')}
                              className="bg-gray-900/20 hover:bg-gray-900/40 border-gray-500/50 text-gray-400"
                            >
                              Dismiss
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredReports.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  {reportSearchQuery ? 'No reports found matching your search' : 'No reports yet'}
                </div>
              )}
            </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Role Management</span>
              <Button
                onClick={() => {
                  setRoleFormData({ name: '', symbol: '★', colorHex: '#9333EA', description: '' })
                  setCreateRoleModal(true)
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create Role
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {roles.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No roles created yet</p>
                <p className="text-sm text-slate-500 mt-1">Click "Create Role" to add your first role</p>
              </div>
            ) : (
              <div className="space-y-3">
                {roles.map((role) => (
                  <div key={role.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold"
                        style={{ backgroundColor: role.colorHex || '#6B7280', color: '#ffffff' }}
                      >
                        {role.symbol}
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{role.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {role.isFree ? (
                            <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded">Free</span>
                          ) : (
                            <span className="text-xs bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded">Coming Soon</span>
                          )}
                          <span className="text-xs text-slate-400">{role.colorHex}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setRoleFormData({
                            name: role.name,
                            symbol: role.symbol,
                            colorHex: role.colorHex,
                            description: role.description || ''
                          })
                          setEditRoleModal(role)
                        }}
                        variant="outline"
                        size="sm"
                        className="bg-blue-900/20 border-blue-500/30 text-blue-400 hover:bg-blue-900/40"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={async () => {
                          if (confirm(`Delete role "${role.name}"?`)) {
                            try {
                              const response = await fetch(`/api/admin/roles?roleId=${role.id}`, {
                                method: 'DELETE',
                              })
                              if (response.ok) {
                                fetchRoles()
                              }
                            } catch (error) {
                              console.error('Failed to delete role:', error)
                            }
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="bg-red-900/20 border-red-500/30 text-red-400 hover:bg-red-900/40"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Admins Tab */}
        {activeTab === 'admins' && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Admin Management</CardTitle>
            <CardDescription className="text-slate-400">
              Manage administrator permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Primary Admin */}
              <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-lg">
                <h3 className="text-purple-400 font-semibold mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Primary Administrator
                </h3>
                <p className="text-slate-300 text-sm">
                  <strong>20-tsvetanov-k@thestreetlyacademy.co.uk</strong>
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  This account has permanent admin access and cannot be removed.
                </p>
              </div>

              {/* Admin List */}
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-400" />
                  Current Administrators
                </h3>
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg divide-y divide-slate-700">
                  {users
                    .filter(u => u.isAdmin)
                    .map((admin) => (
                      <div key={admin.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{admin.minecraftUsername}</p>
                          <p className="text-slate-400 text-sm">{admin.email}</p>
                        </div>
                        {admin.email !== '20-tsvetanov-k@thestreetlyacademy.co.uk' && (
                          <Button
                            onClick={async () => {
                              if (confirm(`Remove admin access from ${admin.minecraftUsername}?`)) {
                                try {
                                  const response = await fetch('/api/admin/manage-admins', {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ userId: admin.id }),
                                  })
                                  if (response.ok) {
                                    fetchUsers()
                                  }
                                } catch (error) {
                                  console.error('Failed to remove admin:', error)
                                }
                              }
                            }}
                            variant="outline"
                            size="sm"
                            className="bg-red-900/20 border-red-500/30 text-red-400 hover:bg-red-900/40"
                          >
                            <UserMinus className="w-4 h-4 mr-2" />
                            Remove Admin
                          </Button>
                        )}
                      </div>
                    ))}
                  {users.filter(u => u.isAdmin).length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                      No additional administrators
                    </div>
                  )}
                </div>
              </div>

              {/* Non-Admin Users */}
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-400" />
                  Regular Users
                </h3>
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg divide-y divide-slate-700 max-h-96 overflow-y-auto">
                  {users
                    .filter(u => !u.isAdmin)
                    .map((user) => (
                      <div key={user.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{user.minecraftUsername}</p>
                          <p className="text-slate-400 text-sm">{user.email}</p>
                        </div>
                        <Button
                          onClick={async () => {
                            if (confirm(`Grant admin access to ${user.minecraftUsername}?`)) {
                              try {
                                const response = await fetch('/api/admin/manage-admins', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ userId: user.id }),
                                })
                                if (response.ok) {
                                  fetchUsers()
                                }
                              } catch (error) {
                                console.error('Failed to add admin:', error)
                              }
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="bg-green-900/20 border-green-500/30 text-green-400 hover:bg-green-900/40"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Make Admin
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        )}
      </div>

      {/* Mute Modal */}
      {muteModalUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Mute {muteModalUser.minecraftUsername}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-white text-sm">Reason</label>
                <Input
                  type="text"
                  placeholder="Enter mute reason..."
                  value={muteReason}
                  onChange={(e) => setMuteReason(e.target.value)}
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm">Duration (hours)</label>
                <Input
                  type="number"
                  placeholder="Enter duration in hours (leave empty for permanent)"
                  value={muteDuration}
                  onChange={(e) => setMuteDuration(e.target.value)}
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleMute(false)}
                  disabled={!!actionLoading[muteModalUser.id] || !muteDuration}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {actionLoading[muteModalUser.id] === 'mute' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Temp Mute
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleMute(true)}
                  disabled={!!actionLoading[muteModalUser.id]}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {actionLoading[muteModalUser.id] === 'mute' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 mr-2" />
                      Permanent
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setMuteModalUser(null)}
                  variant="outline"
                  className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ban Modal */}
      {banModalUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Ban {banModalUser.minecraftUsername}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-white text-sm">Reason</label>
                <Input
                  type="text"
                  placeholder="Enter ban reason..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm">Duration (hours)</label>
                <Input
                  type="number"
                  placeholder="Enter duration in hours (leave empty for permanent)"
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleBan(false)}
                  disabled={!!actionLoading[banModalUser.id] || !banDuration}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {actionLoading[banModalUser.id] === 'ban' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Temp Ban
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleBan(true)}
                  disabled={!!actionLoading[banModalUser.id]}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {actionLoading[banModalUser.id] === 'ban' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Ban className="w-4 h-4 mr-2" />
                      Permanent
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setBanModalUser(null)}
                  variant="outline"
                  className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Role Modal */}
      {createRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Create New Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-white text-sm">Role Name *</label>
                <Input
                  type="text"
                  placeholder="Enter role name..."
                  value={roleFormData.name}
                  onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm">Symbol</label>
                <Input
                  type="text"
                  placeholder="Enter symbol (e.g., ★)"
                  value={roleFormData.symbol}
                  onChange={(e) => setRoleFormData({ ...roleFormData, symbol: e.target.value })}
                  className="bg-slate-900/50 border-slate-600 text-white"
                  maxLength={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm">Color</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={roleFormData.colorHex}
                    onChange={(e) => setRoleFormData({ ...roleFormData, colorHex: e.target.value })}
                    className="w-16 h-10 bg-slate-900/50 border-slate-600"
                  />
                  <Input
                    type="text"
                    value={roleFormData.colorHex}
                    onChange={(e) => setRoleFormData({ ...roleFormData, colorHex: e.target.value })}
                    className="flex-1 bg-slate-900/50 border-slate-600 text-white"
                    placeholder="#9333EA"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm">Description (Optional)</label>
                <Input
                  type="text"
                  placeholder="Enter role description..."
                  value={roleFormData.description}
                  onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded text-blue-300 text-sm">
                All roles are free to claim. Paid roles are coming soon!
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCreateRole}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Create Role
                </Button>
                <Button
                  onClick={() => setCreateRoleModal(false)}
                  variant="outline"
                  className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Role Modal */}
      {editRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Edit Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-white text-sm">Role Name *</label>
                <Input
                  type="text"
                  placeholder="Enter role name..."
                  value={roleFormData.name}
                  onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm">Symbol</label>
                <Input
                  type="text"
                  placeholder="Enter symbol (e.g., ★)"
                  value={roleFormData.symbol}
                  onChange={(e) => setRoleFormData({ ...roleFormData, symbol: e.target.value })}
                  className="bg-slate-900/50 border-slate-600 text-white"
                  maxLength={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm">Color</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={roleFormData.colorHex}
                    onChange={(e) => setRoleFormData({ ...roleFormData, colorHex: e.target.value })}
                    className="w-16 h-10 bg-slate-900/50 border-slate-600"
                  />
                  <Input
                    type="text"
                    value={roleFormData.colorHex}
                    onChange={(e) => setRoleFormData({ ...roleFormData, colorHex: e.target.value })}
                    className="flex-1 bg-slate-900/50 border-slate-600 text-white"
                    placeholder="#9333EA"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm">Description (Optional)</label>
                <Input
                  type="text"
                  placeholder="Enter role description..."
                  value={roleFormData.description}
                  onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleEditRole}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={() => setEditRoleModal(null)}
                  variant="outline"
                  className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Detail Panel */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="w-full max-w-2xl bg-slate-800 border-slate-700 my-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Manage {selectedUser.minecraftUsername}</span>
                <Button
                  onClick={() => setSelectedUser(null)}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Info */}
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-400">Full Name:</span>
                    <p className="text-white">{selectedUser.fullName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Email:</span>
                    <p className="text-white">{selectedUser.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">UUID:</span>
                    <p className="text-white font-mono text-xs">{selectedUser.minecraftUuid || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Last Login:</span>
                    <p className="text-white text-xs">
                      {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-slate-700">
                <button
                  onClick={() => setUserDetailTab('roles')}
                  className={`px-4 py-2 font-semibold transition-colors ${
                    userDetailTab === 'roles'
                      ? 'text-purple-400 border-b-2 border-purple-400'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Roles
                </button>
                <button
                  onClick={() => setUserDetailTab('activity')}
                  className={`px-4 py-2 font-semibold transition-colors ${
                    userDetailTab === 'activity'
                      ? 'text-purple-400 border-b-2 border-purple-400'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Activity Log
                </button>
              </div>

              {/* Roles Tab */}
              {userDetailTab === 'roles' && (
                <>
                  {/* Current Roles */}
                  <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">Current Roles</h3>
                    {selectedUser.roles.length > 0 ? (
                      <div className="space-y-2">
                        {selectedUser.roles.map((userRole) => (
                          <div key={userRole.role.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded flex items-center justify-center font-bold"
                                style={{ backgroundColor: userRole.role.colorHex, color: '#ffffff' }}
                              >
                                {userRole.role.symbol}
                              </div>
                              <span className="text-white">{userRole.role.name}</span>
                            </div>
                            <Button
                              onClick={() => {
                                if (confirm(`Remove ${userRole.role.name} from ${selectedUser.minecraftUsername}?`)) {
                                  handleRemoveRole(selectedUser.id, userRole.role.id)
                                }
                              }}
                              variant="outline"
                              size="sm"
                              className="bg-red-900/20 border-red-500/30 text-red-400 hover:bg-red-900/40"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm">No roles assigned</p>
                    )}
                  </div>

                  {/* Assign New Role */}
                  <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">Assign New Role</h3>
                    {availableRoles.length > 0 ? (
                      <div className="space-y-2">
                        {availableRoles.map((role) => (
                          <div key={role.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded flex items-center justify-center font-bold"
                                style={{ backgroundColor: role.colorHex, color: '#ffffff' }}
                              >
                                {role.symbol}
                              </div>
                              <span className="text-white">{role.name}</span>
                            </div>
                            <Button
                              onClick={() => handleAssignRole(selectedUser.id, role.id)}
                              variant="outline"
                              size="sm"
                              className="bg-green-900/20 border-green-500/30 text-green-400 hover:bg-green-900/40"
                            >
                              Assign
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm">User has all available roles</p>
                    )}
                  </div>
                </>
              )}

              {/* Activity Log Tab */}
              {userDetailTab === 'activity' && (
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">Activity Log</h3>
                  {auditLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                    </div>
                  ) : auditLogs.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto space-y-2 custom-scrollbar">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="bg-slate-800/50 p-3 rounded text-sm">
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-purple-400 font-semibold">{log.action}</span>
                            <span className="text-slate-500 text-xs">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {log.meta && (
                            <div className="text-slate-300 text-xs mt-1">
                              {typeof log.meta === 'object' ? JSON.stringify(log.meta) : log.meta}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm text-center py-8">No activity recorded yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}

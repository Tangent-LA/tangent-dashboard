'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Dashboard() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_sessions')
        .select('*')
        .order('last_update', { ascending: false })
        .limit(50)

      if (!error && data) {
        setSessions(data)
      }
    } catch (err) {
      console.error('Error fetching sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'online': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'locked': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team activity...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tangent ID Monitor</h1>
              <p className="text-sm text-gray-500 mt-1">Real-time team activity</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live</span>
              </div>
              <span className="text-sm text-gray-500">
                {sessions.length} users
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <div
              key={`${session.machine_name}-${session.windows_user}`}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              {/* User Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${getStatusColor(session.activity_state)}`}></div>
                    <h3 className="font-semibold text-gray-900 truncate">
                      {session.windows_user}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{session.machine_name}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {formatTime(session.last_update)}
                </span>
              </div>

              {/* Status Info */}
              <div className="space-y-2">
                {session.autodesk_email && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-24">Email:</span>
                    <span className="text-gray-900 truncate text-xs">{session.autodesk_email}</span>
                  </div>
                )}
                
                {session.current_project && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-24">Project:</span>
                    <span className="text-cyan-600 font-medium truncate text-xs">{session.current_project}</span>
                  </div>
                )}

                {session.revit_version && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-24">Revit:</span>
                    <span className="text-gray-700 text-xs">{session.revit_version}</span>
                  </div>
                )}

                {session.is_in_meeting && (
                  <div className="flex items-center text-sm">
                    <span className="text-red-500 w-24">📞 In meeting</span>
                    {session.meeting_app && (
                      <span className="text-gray-700 text-xs">({session.meeting_app})</span>
                    )}
                  </div>
                )}

                {session.idle_seconds > 300 && (
                  <div className="text-sm text-yellow-600">
                    ⏱️ Idle: {Math.floor(session.idle_seconds / 60)}m
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>Client v{session.client_version || '4.0'}</span>
                {session.is_logged_in && (
                  <span className="text-green-600">✓ Logged in</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {sessions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No active sessions</p>
          </div>
        )}
      </div>
    </div>
  )
}

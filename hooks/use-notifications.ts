'use client'

import { useState, useEffect } from 'react'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  userId?: string
  category?: string
}

export interface NotificationStats {
  total: number
  unread: number
  today: number
  thisWeek: number
  byType: {
    info: number
    success: number
    warning: number
    error: number
  }
}

export interface UseNotificationsReturn {
  notifications: Notification[]
  stats: NotificationStats
  isLoading: boolean
  error: string | null
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  sendNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>
  testNotification: (type: 'email' | 'discord' | 'telegram') => Promise<void>
  refreshNotifications: () => Promise<void>
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculate stats from notifications
  const calculateStats = (notifications: Notification[]): NotificationStats => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000))

    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      today: notifications.filter(n => n.timestamp >= today).length,
      thisWeek: notifications.filter(n => n.timestamp >= thisWeek).length,
      byType: {
        info: notifications.filter(n => n.type === 'info').length,
        success: notifications.filter(n => n.type === 'success').length,
        warning: notifications.filter(n => n.type === 'warning').length,
        error: notifications.filter(n => n.type === 'error').length,
      }
    }
  }

  const stats = calculateStats(notifications)

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/notifications')
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      const data = await response.json()
      setNotifications(data.notifications || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      })
      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
    } catch (err) {
      console.error('Error marking notification as read:', err)
      setError(err instanceof Error ? err.message : 'Failed to mark as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      })
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      )
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      setError(err instanceof Error ? err.message : 'Failed to mark all as read')
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      console.error('Error deleting notification:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete notification')
    }
  }

  const sendNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      })
      if (!response.ok) {
        throw new Error('Failed to send notification')
      }
      await fetchNotifications() // Refresh the list
    } catch (err) {
      console.error('Error sending notification:', err)
      setError(err instanceof Error ? err.message : 'Failed to send notification')
    }
  }

  const testNotification = async (type: 'email' | 'discord' | 'telegram') => {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      })
      if (!response.ok) {
        throw new Error(`Failed to send ${type} test notification`)
      }
      const result = await response.json()
      console.log(`Test ${type} notification sent:`, result)
    } catch (err) {
      console.error(`Error sending ${type} test notification:`, err)
      setError(err instanceof Error ? err.message : `Failed to send ${type} test`)
    }
  }

  const refreshNotifications = async () => {
    await fetchNotifications()
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  return {
    notifications,
    stats,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification,
    testNotification,
    refreshNotifications,
  }
}
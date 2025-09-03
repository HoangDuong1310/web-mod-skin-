import { getSettings } from './settings'

export interface NotificationOptions {
  title: string
  message: string
  channel?: 'email' | 'slack' | 'discord' | 'telegram' | 'browser'
  urgency?: 'low' | 'normal' | 'high'
  data?: any
}

export class NotificationService {
  private settings: any = null

  async loadSettings() {
    this.settings = await getSettings('notifications')
  }

  async sendNotification(options: NotificationOptions): Promise<boolean> {
    if (!this.settings) {
      await this.loadSettings()
    }

    // Check quiet hours
    if (this.settings.enableQuietHours && this.isQuietHours()) {
      console.log('🔇 Notification skipped due to quiet hours')
      return false
    }

    try {
      switch (options.channel) {
        case 'slack':
          return await this.sendSlackNotification(options)
        case 'discord':
          return await this.sendDiscordNotification(options)
        case 'telegram':
          return await this.sendTelegramNotification(options)
        case 'browser':
          return await this.sendBrowserNotification(options)
        default:
          console.log('📢 Default notification sent:', options.title)
          return true
      }
    } catch (error) {
      console.error('❌ Notification failed:', error)
      return false
    }
  }

  private isQuietHours(): boolean {
    if (!this.settings.enableQuietHours) return false

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    const [startHour, startMin] = this.settings.quietHoursStart.split(':').map(Number)
    const [endHour, endMin] = this.settings.quietHoursEnd.split(':').map(Number)
    
    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime <= endTime
    } else {
      // Spans midnight
      return currentTime >= startTime || currentTime <= endTime
    }
  }

  private async sendSlackNotification(options: NotificationOptions): Promise<boolean> {
    if (!this.settings.slackNotifications || !this.settings.slackWebhookUrl) {
      return false
    }

    try {
      const payload = {
        text: `*${options.title}*`,
        attachments: [
          {
            color: this.getColorForUrgency(options.urgency),
            text: options.message,
            footer: 'System Notification',
            ts: Math.floor(Date.now() / 1000),
          }
        ]
      }

      const response = await fetch(this.settings.slackWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status}`)
      }

      console.log('💬 Slack notification sent successfully')
      return true
    } catch (error) {
      console.error('❌ Slack notification failed:', error)
      return false
    }
  }

  private async sendDiscordNotification(options: NotificationOptions): Promise<boolean> {
    if (!this.settings.discordWebhookUrl) {
      return false
    }

    try {
      const payload = {
        embeds: [
          {
            title: options.title,
            description: options.message,
            color: this.getDiscordColorForUrgency(options.urgency),
            timestamp: new Date().toISOString(),
            footer: {
              text: 'System Notification',
            }
          }
        ]
      }

      const response = await fetch(this.settings.discordWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status}`)
      }

      console.log('🎮 Discord notification sent successfully')
      return true
    } catch (error) {
      console.error('❌ Discord notification failed:', error)
      return false
    }
  }

  private async sendTelegramNotification(options: NotificationOptions): Promise<boolean> {
    if (!this.settings.telegramBotToken || !this.settings.telegramChatId) {
      return false
    }

    try {
      const message = `*${options.title}*\n\n${options.message}`
      
      const response = await fetch(`https://api.telegram.org/bot${this.settings.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.settings.telegramChatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Telegram API error: ${errorData.description}`)
      }

      console.log('📱 Telegram notification sent successfully')
      return true
    } catch (error) {
      console.error('❌ Telegram notification failed:', error)
      return false
    }
  }

  private async sendBrowserNotification(options: NotificationOptions): Promise<boolean> {
    // Browser notifications would typically be handled client-side
    // For server-side, we can log or store for later client polling
    console.log('🔔 Browser notification queued:', options.title)
    return true
  }

  private getColorForUrgency(urgency?: string): string {
    switch (urgency) {
      case 'high':
        return 'danger'
      case 'normal':
        return 'warning'
      case 'low':
      default:
        return 'good'
    }
  }

  private getDiscordColorForUrgency(urgency?: string): number {
    switch (urgency) {
      case 'high':
        return 0xff0000 // Red
      case 'normal':
        return 0xffaa00 // Orange
      case 'low':
      default:
        return 0x00ff00 // Green
    }
  }

  // Admin notification methods
  async notifyNewUser(userName: string, userEmail: string): Promise<void> {
    if (!this.settings?.newUserNotification) return

    await this.sendNotification({
      title: '👤 New User Registration',
      message: `A new user has registered:\n\n**Name:** ${userName}\n**Email:** ${userEmail}`,
      urgency: 'normal',
      channel: 'slack'
    })
  }

  async notifyNewProduct(productName: string, uploaderName: string): Promise<void> {
    if (!this.settings?.newProductNotification) return

    await this.sendNotification({
      title: '📦 New Product Upload',
      message: `A new product has been uploaded:\n\n**Product:** ${productName}\n**Uploader:** ${uploaderName}`,
      urgency: 'normal',
      channel: 'slack'
    })
  }

  async notifyNewReview(productName: string, rating: number, reviewer: string): Promise<void> {
    if (!this.settings?.newReviewNotification) return

    const stars = '⭐'.repeat(rating)
    await this.sendNotification({
      title: '⭐ New Review Submitted',
      message: `A new review has been submitted:\n\n**Product:** ${productName}\n**Rating:** ${stars} (${rating}/5)\n**Reviewer:** ${reviewer}`,
      urgency: 'low',
      channel: 'slack'
    })
  }

  async notifySystemError(error: string, location?: string): Promise<void> {
    if (!this.settings?.systemErrorNotification) return

    await this.sendNotification({
      title: '🚨 System Error',
      message: `A system error has occurred:\n\n**Error:** ${error}${location ? `\n**Location:** ${location}` : ''}`,
      urgency: 'high',
      channel: 'slack'
    })
  }

  async notifyBackupStatus(success: boolean, details?: string): Promise<void> {
    if (!this.settings?.backupNotification) return

    await this.sendNotification({
      title: success ? '✅ Backup Completed' : '❌ Backup Failed',
      message: `Database backup ${success ? 'completed successfully' : 'failed'}${details ? `\n\n**Details:** ${details}` : ''}`,
      urgency: success ? 'low' : 'high',
      channel: 'slack'
    })
  }

  // Test notification method
  async sendTestNotification(channel: string): Promise<boolean> {
    const testMessage = {
      title: `🧪 Test ${channel.charAt(0).toUpperCase() + channel.slice(1)} Notification`,
      message: `This is a test notification sent at ${new Date().toLocaleString()}.\n\nIf you received this, your ${channel} integration is working correctly! 🎉`,
      urgency: 'normal' as const,
      channel: channel as any
    }

    return await this.sendNotification(testMessage)
  }
}

// Singleton instance
export const notificationService = new NotificationService()
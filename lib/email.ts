import nodemailer from 'nodemailer'
import { getSettings } from './settings'

export interface EmailOptions {
  to: string
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private settings: any = null

  async initializeTransporter() {
    try {
      this.settings = await getSettings('email')
      
      if (!this.settings.smtpEnabled) {
        console.log('📧 SMTP is disabled, skipping email sending')
        return false
      }

      // Configure SMTP settings with better SSL/TLS handling
      const transportConfig: any = {
        host: this.settings.smtpHost,
        port: this.settings.smtpPort || 587,
        secure: this.settings.smtpSecure || false,
        auth: {
          user: this.settings.smtpUsername,
          pass: this.settings.smtpPassword,
        },
      }

      // For port 587, typically use STARTTLS (secure: false, requireTLS: true)
      // For port 465, typically use direct SSL (secure: true)
      // For port 25, typically plain text (secure: false, ignoreTLS: true)
      const port = this.settings.smtpPort || 587
      
      if (port === 587) {
        // STARTTLS configuration for port 587
        transportConfig.secure = false
        transportConfig.requireTLS = true
        transportConfig.tls = {
          rejectUnauthorized: false, // Allow self-signed certificates in development
          ciphers: 'SSLv3'
        }
      } else if (port === 465) {
        // Direct SSL for port 465
        transportConfig.secure = true
        transportConfig.tls = {
          rejectUnauthorized: false
        }
      } else if (port === 25) {
        // Plain text for port 25
        transportConfig.secure = false
        transportConfig.ignoreTLS = true
      } else {
        // Custom port - use user settings but with safer defaults
        transportConfig.tls = {
          rejectUnauthorized: false
        }
      }

      this.transporter = nodemailer.createTransport(transportConfig)

      // Verify connection
      if (this.transporter) {
        await this.transporter.verify()
      }
      console.log('📧 SMTP connection verified successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to initialize email transporter:', error)
      this.transporter = null
      return false
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        const initialized = await this.initializeTransporter()
        if (!initialized) {
          throw new Error('Email service not initialized')
        }
      }

      const mailOptions = {
        from: options.from || `${this.settings.fromName} <${this.settings.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo || this.settings.replyToEmail,
      }

      const result = await this.transporter!.sendMail(mailOptions)
      console.log('📧 Email sent successfully:', result.messageId)
      return true
    } catch (error) {
      console.error('❌ Failed to send email:', error)
      return false
    }
  }

  async sendTestEmail(recipientEmail: string): Promise<boolean> {
    try {
      // Ensure settings are loaded
      if (!this.settings) {
        const initialized = await this.initializeTransporter()
        if (!initialized) {
          throw new Error('Failed to initialize email settings')
        }
      }

      return this.sendEmail({
        to: recipientEmail,
        subject: 'Test Email from Your Application',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">🧪 Test Email</h2>
            <p>This is a test email sent from your application's SMTP configuration.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Configuration Details:</h3>
              <ul>
                <li><strong>SMTP Host:</strong> ${this.settings?.smtpHost || 'Not configured'}</li>
                <li><strong>SMTP Port:</strong> ${this.settings?.smtpPort || 'Not configured'}</li>
                <li><strong>Secure:</strong> ${this.settings?.smtpSecure ? 'Yes' : 'No'}</li>
                <li><strong>From Name:</strong> ${this.settings?.fromName || 'Not configured'}</li>
              </ul>
            </div>
            <p>If you received this email, your SMTP configuration is working correctly! 🎉</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Sent at: ${new Date().toLocaleString()}<br>
              This is an automated test message.
            </p>
          </div>
        `,
        text: `
          Test Email from Your Application
          
          This is a test email sent from your application's SMTP configuration.
          
          Configuration Details:
          - SMTP Host: ${this.settings?.smtpHost || 'Not configured'}
          - SMTP Port: ${this.settings?.smtpPort || 'Not configured'}
          - Secure: ${this.settings?.smtpSecure ? 'Yes' : 'No'}
          - From Name: ${this.settings?.fromName || 'Not configured'}
          
          If you received this email, your SMTP configuration is working correctly!
          
          Sent at: ${new Date().toLocaleString()}
          This is an automated test message.
        `,
      })
    } catch (error) {
      console.error('❌ Error in sendTestEmail:', error)
      return false
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    const settings = await getSettings('email')
    if (!settings.welcomeEmailEnabled) {
      return false
    }

    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to Our Platform!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🎉 Welcome ${userName}!</h2>
          <p>Thank you for joining our platform. We're excited to have you on board!</p>
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
            <p><strong>What's next?</strong></p>
            <ul>
              <li>Complete your profile setup</li>
              <li>Explore our features</li>
              <li>Connect with the community</li>
            </ul>
          </div>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br>The Team</p>
        </div>
      `,
      text: `
        Welcome ${userName}!
        
        Thank you for joining our platform. We're excited to have you on board!
        
        What's next?
        - Complete your profile setup
        - Explore our features
        - Connect with the community
        
        If you have any questions, feel free to reach out to our support team.
        
        Best regards,
        The Team
      `,
    })
  }

  async sendPasswordResetEmail(userEmail: string, resetToken: string, baseUrl: string): Promise<boolean> {
    const settings = await getSettings('email')
    if (!settings.passwordResetEnabled) {
      return false
    }

    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`

    return this.sendEmail({
      to: userEmail,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🔐 Password Reset Request</h2>
          <p>You recently requested to reset your password. Click the button below to reset it:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">${resetUrl}</p>
          <div style="background: #fef3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p><strong>⚠️ Security Notice:</strong></p>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Never share this link with anyone</li>
            </ul>
          </div>
          <p>Best regards,<br>The Security Team</p>
        </div>
      `,
      text: `
        Password Reset Request
        
        You recently requested to reset your password. Click the link below to reset it:
        
        ${resetUrl}
        
        Security Notice:
        - This link will expire in 1 hour
        - If you didn't request this reset, please ignore this email
        - Never share this link with anyone
        
        Best regards,
        The Security Team
      `,
    })
  }

  async sendReviewNotification(userEmail: string, productName: string, status: 'approved' | 'rejected', feedback?: string): Promise<boolean> {
    const settings = await getSettings('email')
    if (!settings.reviewNotificationEnabled) {
      return false
    }

    const isApproved = status === 'approved'
    const statusColor = isApproved ? '#10b981' : '#ef4444'
    const statusIcon = isApproved ? '✅' : '❌'

    return this.sendEmail({
      to: userEmail,
      subject: `Your Review has been ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${statusIcon} Review ${status === 'approved' ? 'Approved' : 'Rejected'}</h2>
          <p>Your review for <strong>${productName}</strong> has been ${status}.</p>
          
          <div style="background: ${isApproved ? '#f0fdf4' : '#fef2f2'}; padding: 20px; border-radius: 8px; border-left: 4px solid ${statusColor};">
            <h3>Review Status: ${status.charAt(0).toUpperCase() + status.slice(1)}</h3>
            ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ''}
          </div>
          
          ${isApproved 
            ? '<p>Your review is now live and visible to other users. Thank you for your contribution!</p>'
            : '<p>You can edit and resubmit your review if you\'d like to address the feedback above.</p>'
          }
          
          <p>Best regards,<br>The Content Team</p>
        </div>
      `,
      text: `
        Review ${status === 'approved' ? 'Approved' : 'Rejected'}
        
        Your review for ${productName} has been ${status}.
        
        ${feedback ? `Feedback: ${feedback}` : ''}
        
        ${isApproved 
          ? 'Your review is now live and visible to other users. Thank you for your contribution!'
          : 'You can edit and resubmit your review if you\'d like to address the feedback above.'
        }
        
        Best regards,
        The Content Team
      `,
    })
  }
}

// Singleton instance
export const emailService = new EmailService()
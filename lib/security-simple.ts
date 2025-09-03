import { getSettings } from './settings'
import bcrypt from 'bcryptjs'

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
}

export interface SecuritySettings {
  minPasswordLength: number
  requireUppercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  passwordHistoryCount: number
  maxPasswordAge: number
  sessionTimeout: number
  maxConcurrentSessions: number
  requireTwoFactor: boolean
  maxLoginAttempts: number
  lockoutDuration: number
  enableCaptcha: boolean
  adminIpWhitelist: string
  enableAuditLog: boolean
  requireAdminApproval: boolean
}

export class SecurityService {
  private settings: SecuritySettings | null = null

  async loadSettings(): Promise<SecuritySettings> {
    if (!this.settings) {
      const savedSettings = await getSettings('security')
      
      // Default settings
      this.settings = {
        minPasswordLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        passwordHistoryCount: 3,
        maxPasswordAge: 90,
        sessionTimeout: 24,
        maxConcurrentSessions: 5,
        requireTwoFactor: false,
        maxLoginAttempts: 5,
        lockoutDuration: 15,
        enableCaptcha: false,
        adminIpWhitelist: '',
        enableAuditLog: true,
        requireAdminApproval: false,
        ...savedSettings
      }
    }
    
    return this.settings
  }

  async validatePassword(password: string, userId?: string): Promise<PasswordValidationResult> {
    const settings = await this.loadSettings()
    const errors: string[] = []

    // Check minimum length
    if (password.length < settings.minPasswordLength) {
      errors.push(`Password must be at least ${settings.minPasswordLength} characters long`)
    }

    // Check uppercase requirement
    if (settings.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    // Check numbers requirement
    if (settings.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    // Check special characters requirement
    if (settings.requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    // Note: Password history check would require the PasswordHistory model
    // For now, we'll skip this until migration is complete

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  async isAdminIpAllowed(clientIp: string): Promise<boolean> {
    const settings = await this.loadSettings()
    
    if (!settings.adminIpWhitelist || settings.adminIpWhitelist.trim() === '') {
      return true // No IP restriction
    }

    const allowedIps = settings.adminIpWhitelist
      .split(',')
      .map(ip => ip.trim())
      .filter(ip => ip !== '')

    return allowedIps.includes(clientIp) || allowedIps.includes('*')
  }

  async getPasswordStrengthScore(password: string): Promise<{ score: number; feedback: string[] }> {
    const feedback: string[] = []
    let score = 0

    // Length scoring
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1
    if (password.length >= 16) score += 1

    // Character variety scoring
    if (/[a-z]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/\d/.test(password)) score += 1
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 1

    // Pattern detection (negative scoring)
    if (/(.)\1{2,}/.test(password)) {
      score -= 1
      feedback.push('Avoid repeated characters')
    }
    
    if (/123|abc|qwe|password|admin/i.test(password)) {
      score -= 2
      feedback.push('Avoid common patterns and words')
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(7, score))

    // Generate feedback based on score
    if (score <= 2) {
      feedback.unshift('Very weak password')
    } else if (score <= 3) {
      feedback.unshift('Weak password')
    } else if (score <= 4) {
      feedback.unshift('Fair password')
    } else if (score <= 5) {
      feedback.unshift('Good password')
    } else {
      feedback.unshift('Strong password')
    }

    return { score, feedback }
  }

  // Simplified methods that work without additional database models
  async logSecurityEvent(action: string, details?: any): Promise<void> {
    const settings = await this.loadSettings()
    
    if (!settings.enableAuditLog) {
      return
    }

    // For now, just log to console
    // In production, this would be saved to the AuditLog table
    console.log('🔐 Security Event:', {
      action,
      details,
      timestamp: new Date().toISOString()
    })
  }
}

// Singleton instance
export const securityService = new SecurityService()
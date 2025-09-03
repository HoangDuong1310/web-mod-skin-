'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Send, Mail, MessageSquare, Zap, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface TestResult {
  type: string
  success: boolean
  message: string
  timestamp: Date
}

export function NotificationTestPanel() {
  const [testType, setTestType] = useState<'email' | 'discord' | 'telegram'>('email')
  const [testMessage, setTestMessage] = useState('')
  const [testTitle, setTestTitle] = useState('Test Notification')
  const [testRecipient, setTestRecipient] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])

  const handleSendTest = async () => {
    if (!testMessage || (testType === 'email' && !testRecipient)) return

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: testType,
          title: testTitle,
          message: testMessage,
          recipient: testRecipient,
        }),
      })

      const result = await response.json()
      
      const testResult: TestResult = {
        type: testType,
        success: response.ok,
        message: result.message || (response.ok ? 'Test notification sent successfully!' : 'Failed to send test notification'),
        timestamp: new Date(),
      }

      setTestResults(prev => [testResult, ...prev.slice(0, 9)]) // Keep last 10 results
      
      if (response.ok) {
        // Reset form on success
        setTestMessage('')
        setTestTitle('Test Notification')
        setTestRecipient('')
      }
    } catch (error) {
      const testResult: TestResult = {
        type: testType,
        success: false,
        message: 'Network error occurred while sending test notification',
        timestamp: new Date(),
      }
      setTestResults(prev => [testResult, ...prev.slice(0, 9)])
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'discord':
        return <MessageSquare className="h-4 w-4" />
      case 'telegram':
        return <Zap className="h-4 w-4" />
      default:
        return <Send className="h-4 w-4" />
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'discord':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'telegram':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Send Test Notification</CardTitle>
          <CardDescription>
            Test your notification configurations by sending sample notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Notification Type */}
          <div className="space-y-2">
            <Label>Notification Type</Label>
            <Select value={testType} onValueChange={(value: any) => setTestType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Notification
                  </div>
                </SelectItem>
                <SelectItem value="discord">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Discord Webhook
                  </div>
                </SelectItem>
                <SelectItem value="telegram">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Telegram Bot
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Test Title */}
          <div className="space-y-2">
            <Label htmlFor="test-title">Notification Title</Label>
            <Input
              id="test-title"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="Enter notification title"
            />
          </div>

          {/* Test Message */}
          <div className="space-y-2">
            <Label htmlFor="test-message">Test Message</Label>
            <Textarea
              id="test-message"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter your test message here..."
              rows={4}
            />
          </div>

          {/* Recipient (for email only) */}
          {testType === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="test-recipient">Email Recipient</Label>
              <Input
                id="test-recipient"
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="Enter email address to send test to"
              />
            </div>
          )}

          {/* Send Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSendTest}
              disabled={!testMessage || (testType === 'email' && !testRecipient) || isLoading}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isLoading ? 'Sending...' : `Send ${testType} Test`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Tests</CardTitle>
          <CardDescription>
            Send predefined test notifications to verify configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button
              variant="outline"
              onClick={() => {
                setTestType('email')
                setTestTitle('Welcome Test')
                setTestMessage('This is a test welcome email to verify your email configuration is working correctly.')
              }}
              className="flex items-center gap-2 h-auto p-4"
            >
              <Mail className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">Email Test</div>
                <div className="text-xs text-muted-foreground">Welcome email template</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setTestType('discord')
                setTestTitle('Discord Test')
                setTestMessage('🤖 This is a test message from your notification system. Discord integration is working!')
              }}
              className="flex items-center gap-2 h-auto p-4"
            >
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              <div className="text-left">
                <div className="font-medium">Discord Test</div>
                <div className="text-xs text-muted-foreground">Webhook message</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setTestType('telegram')
                setTestTitle('Telegram Test')
                setTestMessage('📱 Test message from your notification system. Telegram bot is configured correctly!')
              }}
              className="flex items-center gap-2 h-auto p-4"
            >
              <Zap className="h-5 w-5 text-cyan-600" />
              <div className="text-left">
                <div className="font-medium">Telegram Test</div>
                <div className="text-xs text-muted-foreground">Bot message</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Recent test notification results and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeBadgeColor(result.type)}>
                          {getTypeIcon(result.type)}
                          <span className="ml-1 capitalize">{result.type}</span>
                        </Badge>
                        <span className={`text-sm font-medium ${
                          result.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {result.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {result.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <p className={`text-sm mt-1 ${
                    result.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.message}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { generateDynamicMetadata } from '@/lib/dynamic-seo'
import { 
  Mail, 
  MessageSquare, 
  MapPin, 
  Clock,
  Send,
  CheckCircle,
  HelpCircle,
  Bug,
  Lightbulb
} from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

const contactMethods = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Get help from our support team',
    contact: 'support@nextstore.com',
    response: 'Usually within 24 hours',
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Chat with us in real-time',
    contact: 'Available 9 AM - 6 PM EST',
    response: 'Instant response',
  },
  {
    icon: MapPin,
    title: 'Office',
    description: 'Visit us in person',
    contact: '123 Tech Street, San Francisco, CA',
    response: 'By appointment only',
  },
]

const inquiryTypes = [
  { icon: HelpCircle, label: 'General Support', value: 'support' },
  { icon: Bug, label: 'Bug Report', value: 'bug' },
  { icon: Lightbulb, label: 'Feature Request', value: 'feature' },
  { icon: Mail, label: 'Business Inquiry', value: 'business' },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    type: 'support',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Đã xảy ra lỗi, vui lòng thử lại.')
        return
      }

      setIsSubmitted(true)
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false)
        setFormData({
          name: '',
          email: '',
          subject: '',
          type: 'support',
          message: '',
        })
      }, 5000)
    } catch {
      alert('Không thể kết nối đến server, vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (isSubmitted) {
    return (
      <div className="container py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-green-50 dark:bg-green-950/20 rounded-2xl p-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
              Message Sent Successfully!
            </h1>
            <p className="text-green-700 dark:text-green-300 mb-6">
              Thank you for reaching out. We'll get back to you within 24 hours.
            </p>
            <Button asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="text-center mb-16">
        <Badge variant="secondary" className="mb-4">Contact Us</Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Get in Touch
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Have a question, suggestion, or need help? We'd love to hear from you. 
          Our team is here to help and usually responds within 24 hours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Methods */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">How to Reach Us</h2>
            <div className="space-y-4">
              {contactMethods.map((method) => (
                <Card key={method.title}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <method.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{method.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {method.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="font-medium text-sm mb-1">{method.contact}</p>
                    <p className="text-xs text-muted-foreground">{method.response}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Business Hours */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Business Hours</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Monday - Friday</span>
                <span className="text-muted-foreground">9 AM - 6 PM EST</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday</span>
                <span className="text-muted-foreground">10 AM - 4 PM EST</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday</span>
                <span className="text-muted-foreground">Closed</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium mb-2">
                    Inquiry Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full h-10 px-3 py-2 text-sm border border-input rounded-md bg-background"
                    required
                  >
                    {inquiryTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="Brief description of your inquiry"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="Please provide details about your inquiry..."
                    className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background resize-none"
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">
            Quick answers to common questions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            {
              q: 'How do I report a bug or issue?',
              a: 'Use the contact form above with "Bug Report" selected, or email us directly at support@nextstore.com with details about the issue.',
            },
            {
              q: 'Can I request a specific app to be added?',
              a: 'Absolutely! We love suggestions from our community. Use the "Feature Request" option in the contact form above.',
            },
            {
              q: 'Is it safe to download apps from your platform?',
              a: 'Yes, all apps are thoroughly scanned and tested before being made available. We prioritize security and quality.',
            },
            {
              q: 'How can I become a developer partner?',
              a: 'Great! Select "Business Inquiry" in the contact form and let us know about your apps. We\'d love to work with you.',
            },
          ].map((faq, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-base">{faq.q}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}



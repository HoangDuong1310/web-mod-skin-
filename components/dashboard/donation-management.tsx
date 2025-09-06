'use client'

import { useState, useEffect } from 'react'
import { Eye, Download, Calendar, User, DollarSign, MessageCircle, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Donation {
  id: string
  amount: number
  currency: string
  donorName?: string
  donorEmail?: string
  isAnonymous: boolean
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
  message?: string
  isMessagePublic: boolean
  paymentMethod?: string
  transactionId?: string
  createdAt: string
  completedAt?: string
  user?: {
    id: string
    name: string
    email: string
  }
  goal?: {
    id: string
    title: string
  }
}

interface PaginationData {
  page: number
  limit: number
  total: number
  pages: number
}

export function DonationManagement() {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [filters, setFilters] = useState({
    status: 'all',
    goalId: '',
    search: ''
  })

  useEffect(() => {
    fetchDonations()
  }, [pagination.page, pagination.limit, filters])

  const fetchDonations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.goalId && { goalId: filters.goalId }),
      })

      const response = await fetch(`/api/donations?${params}`)
      if (response.ok) {
        const data = await response.json()
        setDonations(data.donations)
        setPagination(data.pagination)
      } else {
        throw new Error('Failed to fetch donations')
      }
    } catch (error) {
      console.error('Error fetching donations:', error)
      setError('Failed to load donations')
    } finally {
      setLoading(false)
    }
  }

  const updateDonationStatus = async (donationId: string, status: 'COMPLETED' | 'FAILED' | 'CANCELLED') => {
    try {
      const response = await fetch(`/api/donations/${donationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        // Refresh donations list
        fetchDonations()
        setError('')
      } else {
        throw new Error('Failed to update donation status')
      }
    } catch (error) {
      console.error('Error updating donation:', error)
      setError('Failed to update donation status')
    }
  }

  const exportDonations = async () => {
    try {
      const params = new URLSearchParams({
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.goalId && { goalId: filters.goalId }),
        export: 'true'
      })

      const response = await fetch(`/api/donations?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `donations-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting donations:', error)
      setError('Failed to export donations')
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      COMPLETED: 'default',
      PENDING: 'secondary',
      FAILED: 'destructive',
      REFUNDED: 'outline',
      CANCELLED: 'outline'
    }
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    )
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  if (loading && donations.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Donations</h2>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all donations
          </p>
        </div>
        <Button onClick={exportDonations} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {donations.filter(d => d.status === 'COMPLETED').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                donations
                  .filter(d => d.status === 'COMPLETED')
                  .reduce((sum, d) => sum + d.amount, 0)
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {donations.filter(d => {
                const date = new Date(d.createdAt)
                const now = new Date()
                return date.getMonth() === now.getMonth() && 
                       date.getFullYear() === now.getFullYear()
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search donor name, email, or transaction ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({ status: 'all', goalId: '', search: '' })
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Donations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Donations</CardTitle>
        </CardHeader>
        <CardContent>
          {donations.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No donations found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Donations will appear here once people start supporting your cause.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Donor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Goal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donations.map((donation) => (
                      <TableRow key={donation.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">
                                {donation.isAnonymous 
                                  ? 'Anonymous' 
                                  : (donation.user?.name || donation.donorName || 'Unknown')
                                }
                              </div>
                              {!donation.isAnonymous && (donation.user?.email || donation.donorEmail) && (
                                <div className="text-sm text-gray-600">
                                  {donation.user?.email || donation.donorEmail}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(donation.amount, donation.currency)}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {donation.goal ? (
                            <div className="text-sm">
                              {donation.goal.title}
                            </div>
                          ) : (
                            <span className="text-gray-400">General</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          {getStatusBadge(donation.status)}
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm">
                            <div>{donation.paymentMethod || 'Unknown'}</div>
                            {donation.transactionId && (
                              <div className="text-gray-600 truncate max-w-24">
                                {donation.transactionId}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {donation.message ? (
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              <span className="text-sm">
                                {donation.isMessagePublic ? 'Public' : 'Private'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        
                        <TableCell className="text-sm">
                          <div>{formatDate(donation.createdAt)}</div>
                          {donation.completedAt && (
                            <div className="text-gray-600">
                              Completed: {formatDate(donation.completedAt)}
                            </div>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // TODO: Implement donation details modal
                                console.log('View donation details:', donation.id)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {donation.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateDonationStatus(donation.id, 'COMPLETED')}
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateDonationStatus(donation.id, 'FAILED')}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} donations
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        const page = i + 1
                        return (
                          <Button
                            key={page}
                            variant={page === pagination.page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
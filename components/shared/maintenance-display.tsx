import { Wrench, Clock, Mail } from 'lucide-react'

interface MaintenanceDisplayProps {
  siteName?: string
  supportEmail?: string
}

export function MaintenanceDisplay({ 
  siteName = 'Website',
  supportEmail 
}: MaintenanceDisplayProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Wrench className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Site Under Maintenance
          </h1>
          <p className="text-gray-600">
            {siteName} is currently undergoing scheduled maintenance to improve your experience.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-center space-x-2 text-gray-700">
            <Clock className="w-4 h-4" />
            <span className="text-sm">We'll be back soon!</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-3">
            Need immediate assistance?
          </p>
          {supportEmail && (
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Support</span>
            </a>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Thank you for your patience while we make improvements.
          </p>
        </div>
      </div>
    </div>
  )
}
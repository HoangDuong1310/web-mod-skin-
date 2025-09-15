/**
 * Custom Skins API Client
 * Provides methods to interact with custom skins endpoints
 */

export interface CustomSkinsAPI {
  apiURL: string
  getSkinById(skinId: string): Promise<any>
  getCustomSkinDetails(skinId: string): Promise<any>
  downloadSkin(skinId: string): Promise<void>
  getDownloadInfo(skinId: string): Promise<any>
  formatSkinForUI(skin: any): any
}

class CustomSkinsAPIClient implements CustomSkinsAPI {
  public apiURL: string

  constructor(baseURL: string = '') {
    this.apiURL = baseURL || (typeof window !== 'undefined' ? window.location.origin : '')
  }

  /**
   * Get skin details by ID
   * @param skinId - The skin ID
   * @returns Promise with skin details
   */
  async getSkinById(skinId: string): Promise<any> {
    const response = await fetch(`${this.apiURL}/api/custom-skins/${skinId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch skin details: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Alias for getSkinById for backward compatibility
   */
  async getCustomSkinDetails(skinId: string): Promise<any> {
    return this.getSkinById(skinId)
  }

  /**
   * Download skin file
   * @param skinId - The skin ID
   */
  async downloadSkin(skinId: string): Promise<void> {
    const response = await fetch(`${this.apiURL}/api/custom-skins/${skinId}/download`, {
      method: 'POST'
    })
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`)
    }
    
    const blob = await response.blob()
    const filename = response.headers.get('content-disposition')
      ?.split('filename=')[1]?.replace(/"/g, '') || `skin-${skinId}.zip`
    
    // Trigger download
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  /**
   * Get download information without downloading
   * @param skinId - The skin ID
   * @returns Promise with download info
   */
  async getDownloadInfo(skinId: string): Promise<any> {
    const response = await fetch(`${this.apiURL}/api/custom-skins/${skinId}/download-info`)
    if (!response.ok) {
      throw new Error(`Failed to fetch download info: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Format skin data for UI display
   * @param skin - Raw skin data
   * @returns Formatted skin data
   */
  formatSkinForUI(skin: any): any {
    return {
      ...skin,
      previewImages: skin.previewImages || [],
      formattedFileSize: this.formatFileSize(skin.fileSize),
      formattedDate: new Date(skin.createdAt).toLocaleDateString()
    }
  }

  /**
   * Format file size to human readable format
   * @param bytes - File size in bytes
   * @returns Formatted file size string
   */
  private formatFileSize(bytes: string | number): string {
    const size = typeof bytes === 'string' ? parseInt(bytes) : bytes
    if (size === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(size) / Math.log(k))
    
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Handle download with protocol support for external apps
   * @param skinId - The skin ID
   */
  async handleDownload(skinId: string): Promise<void> {
    try {
      // Get full skin details before download
      const skinDetails = await this.getSkinById(skinId)
      
      // Create protocol data with full details
      const protocolData = {
        skinId: skinId,
        downloadUrl: `${this.apiURL}/api/custom-skins/${skinId}/download`,
        skinName: skinDetails.name,
        championName: skinDetails.champion?.name,
        fileName: skinDetails.fileName,
        fileSize: skinDetails.fileSize,
        version: skinDetails.version,
        author: skinDetails.author?.name
      }
      
      // Try to send to local app first
      const encodedData = encodeURIComponent(JSON.stringify(protocolData))
      const protocolURL = `skinmod://download?data=${encodedData}`
      
      // Check if protocol is supported
      if (typeof window !== 'undefined') {
        try {
          window.location.href = protocolURL
          // If protocol fails, fallback to direct download after a short delay
          setTimeout(() => {
            this.downloadSkin(skinId).catch(console.error)
          }, 1000)
        } catch (error) {
          // Fallback to direct download
          await this.downloadSkin(skinId)
        }
      }
    } catch (error) {
      console.error('Download failed:', error)
      throw error
    }
  }
}

// Create and export singleton instance
export const customSkinsAPI = new CustomSkinsAPIClient()

// Export class for custom instances
export { CustomSkinsAPIClient }

// Export default instance
export default customSkinsAPI
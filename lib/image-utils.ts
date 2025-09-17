// Image utility functions for handling upload paths and API routes

/**
 * Convert upload path to API route
 * /uploads/previews/image.jpg -> /api/uploads/previews/image.jpg
 */
export function convertToApiUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return '/default-skin.svg'
  
  // If already an API URL, return as is
  if (imagePath.startsWith('/api/uploads/')) {
    return imagePath
  }
  
  // If it's a direct upload path, convert to API
  if (imagePath.startsWith('/uploads/')) {
    return `/api${imagePath}`
  }
  
  // If it's an external URL or already processed, return as is
  return imagePath
}

/**
 * Process preview images array and convert paths to API URLs
 */
export function processPreviewImages(previewImages: string | string[] | null | undefined): string[] {
  if (!previewImages) return []
  
  try {
    let images: string[] = []
    
    if (typeof previewImages === 'string') {
      // Parse JSON string
      const parsed = JSON.parse(previewImages)
      images = Array.isArray(parsed) ? parsed : []
    } else if (Array.isArray(previewImages)) {
      images = previewImages
    }
    
    // Convert all paths to API URLs and filter out invalid ones
    return images
      .filter(img => typeof img === 'string' && img.length > 0)
      .map(img => convertToApiUrl(img))
      
  } catch (error) {
    console.warn('Failed to process preview images:', error)
    return []
  }
}

/**
 * Get the best available image from skin data
 */
export function getBestSkinImage(skin: any): string {
  // Try thumbnail first
  if (skin.thumbnailImage) {
    return convertToApiUrl(skin.thumbnailImage)
  }
  
  // Try first preview image
  const previewImages = processPreviewImages(skin.previewImages)
  if (previewImages.length > 0) {
    return previewImages[0]
  }
  
  // Fallback to default
  return '/default-skin.svg'
}

/**
 * Create a fallback image URL with error handling
 */
export function createImageWithFallback(imageSrc: string | null | undefined, fallback: string = '/default-skin.svg'): {
  src: string;
  onError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
} {
  return {
    src: convertToApiUrl(imageSrc) || fallback,
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
      const target = e.target as HTMLImageElement
      if (target.src !== fallback) {
        target.src = fallback
      }
    }
  }
}

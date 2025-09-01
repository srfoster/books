// Utility function to get the correct base path for assets
export const getBasePath = (): string => {
  if (window.location.hostname === 'localhost') {
    return ''
  }
  // For GitHub Pages deployment (srfoster.github.io/books)
  if (window.location.hostname === 'srfoster.github.io') {
    return '/books'
  }
  // For S3/custom domain deployment (stephenfoster.us)
  return ''
}

// Utility function to get the full path for textbook assets
export const getTextbookAssetPath = (textbookPath: string, assetPath: string): string => {
  const basePath = getBasePath()
  return `${basePath}/textbooks/${textbookPath}/${assetPath}`
}

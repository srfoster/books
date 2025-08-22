// Utility function to get the correct base path for assets
export const getBasePath = (): string => {
  return window.location.hostname === 'localhost' ? '' : '/books'
}

// Utility function to get the full path for textbook assets
export const getTextbookAssetPath = (textbookPath: string, assetPath: string): string => {
  const basePath = getBasePath()
  return `${basePath}/textbooks/${textbookPath}/${assetPath}`
}

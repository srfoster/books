export interface NavigationItem {
  id: string
  title: string
  file: string
  type: 'page' | 'chapter' | 'section' | 'subsection'
  children?: NavigationItem[]
}

export interface TextbookConfig {
  title: string
  description: string
  authors: string[]
  version: string
  navigation: NavigationItem[]
}

export interface ContentFile {
  path: string
  content: string
}

// Load markdown content directly from the public folder via HTTP
export const loadMarkdownContent = async (textbookPath: string, fileName: string = 'index.md'): Promise<string> => {
  try {
    // Construct the URL to fetch the markdown file from the public directory
    // Use different base paths for development vs production
    const basePath = window.location.hostname === 'localhost' ? '' : '/books'
    // Add cache busting query parameter to ensure fresh content
    const cacheBuster = `?v=${Date.now()}`
    const url = `${basePath}/textbooks/${textbookPath}/${fileName}${cacheBuster}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
    }
    
    const content = await response.text()
    
    // Process the content to fix image paths for production
    const processedContent = content.replace(
      /src="\/textbooks\//g,
      `src="${basePath}/textbooks/`
    )
    
    return processedContent
    
  } catch (error) {
    console.error('Error loading markdown content:', error)
    return `# Error Loading Content\n\nFailed to load content from ${textbookPath}/${fileName}`
  }
}

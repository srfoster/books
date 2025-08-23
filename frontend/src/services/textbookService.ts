import { Textbook } from '../types'
import * as yaml from 'js-yaml'

// Configuration for available textbooks - only the minimal info needed
const TEXTBOOK_CONFIGS = [
  { id: 'ai_ml', path: 'ai_ml', under_construction: true },
  { id: 'coding_is_dead', path: 'coding_is_dead' , under_construction: true },
  { id: 'education_systems', path: 'education_systems', under_construction: true },

  { id: 'math', path: 'math', coming_soon: true },
  { id: 'history', path: 'history', coming_soon: true },

  { id: 'science', path: 'science', coming_soon: true },
  { id: 'new_age_mysticism_and_religion', path: 'new_age_mysticism_and_religion', coming_soon: true },

  { id: 'spanish', path: 'spanish', coming_soon: true },

  { id: 'stoicism', path: 'stoicism', coming_soon: true },

  { id: 'music', path: 'music', coming_soon: true },
  { id: 'drawing', path: 'drawing', coming_soon: true },

  { id: 'mixed_martial_arts', path: 'mixed_martial_arts', coming_soon: true },
  { id: 'chess', path: 'chess', coming_soon: true },
  { id: 'starcraft_2', path: 'starcraft_2', coming_soon: true },
]


/**
 * Load textbook metadata from index.yml file
 */
export const loadTextbookMetadata = async (path: string): Promise<Textbook | null> => {
  try {
    // Find the config for this textbook to check for coming_soon and under_construction flags
    const config = TEXTBOOK_CONFIGS.find(c => c.path === path)
    const isComingSoon = config?.coming_soon || false
    const isUnderConstruction = config?.under_construction || false
    
    // Use different base paths for development vs production
    const basePath = window.location.hostname === 'localhost' ? '' : '/books'
    const response = await fetch(`${basePath}/textbooks/${path}/index.yml`)
    if (!response.ok) {
      console.warn(`No index.yml found for textbook: ${path} (${response.status})`)
      return null
    }
    
    const yamlText = await response.text()
    const metadata = yaml.load(yamlText) as Partial<Textbook>
    
    const textbook = {
      ...metadata,
      id: path,
      path,
      coming_soon: isComingSoon,
      under_construction: isUnderConstruction
    } as Textbook
    
    return textbook
  } catch (error) {
    console.error(`Error loading metadata for ${path}:`, error)
    return null
  }
}

/**
 * Load all available textbooks
 */
export const loadAllTextbooks = async (): Promise<Textbook[]> => {
  const textbooks: Textbook[] = []
  
  for (const config of TEXTBOOK_CONFIGS) {
    const textbook = await loadTextbookMetadata(config.path)
    if (textbook) {
      textbooks.push(textbook)
    }
  }
  
  return textbooks
}

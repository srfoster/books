import { Textbook } from '../types'
import * as yaml from 'js-yaml'

// Configuration for available textbooks - only the minimal info needed
const TEXTBOOK_CONFIGS = [
{ id: 'education_systems', path: 'education_systems', under_construction: true },
  { id: 'ai_ml', path: 'ai_ml', under_construction: true },
  { id: 'math', path: 'math', under_construction: true },
  { id: 'coding_is_dead', path: 'coding_is_dead', under_construction: true },
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
    
    const response = await fetch(`/textbooks/${path}/index.yml`)
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

/**
 * Simple YAML parser for textbook metadata
 * This handles the basic structure we need for textbook index files
 */
function parseYaml(yamlText: string): Partial<Textbook> {
  const result: any = {}
  const lines = yamlText.split('\n')
  let i = 0
  
  while (i < lines.length) {
    const line = lines[i].trimEnd()
    if (!line || line.startsWith('#')) {
      i++
      continue
    }
    
    const indent = line.length - line.trimStart().length
    const trimmedLine = line.trim()
    
    if (!trimmedLine.includes(':')) {
      i++
      continue
    }
    
    const [key, ...valueParts] = trimmedLine.split(':')
    const value = valueParts.join(':').trim()
    const cleanKey = key.trim()
    
    if (indent === 0) {
      if (value === '') {
        // This is a section (like chapters: or config:)
        if (cleanKey === 'chapters') {
          const [chaptersArray, nextIndex] = parseArray(lines, i + 1)
          result[cleanKey] = chaptersArray
          i = nextIndex
        } else if (cleanKey === 'config') {
          const [configObj, nextIndex] = parseObject(lines, i + 1)
          result[cleanKey] = configObj
          i = nextIndex
        } else {
          i++
        }
      } else {
        // Simple key-value
        result[cleanKey] = parseYamlValue(value)
        i++
      }
    } else {
      i++
    }
  }
  
  return result
}

function parseArray(lines: string[], startIndex: number): [any[], number] {
  const array: any[] = []
  let i = startIndex
  
  while (i < lines.length) {
    const line = lines[i].trimEnd()
    if (!line || line.startsWith('#')) {
      i++
      continue
    }
    
    const indent = line.length - line.trimStart().length
    const trimmedLine = line.trim()
    
    if (indent <= 0) {
      // End of array
      break
    }
    
    if (trimmedLine.startsWith('- ')) {
      const itemText = trimmedLine.substring(2).trim()
      
      if (itemText.includes(':')) {
        // Object in array
        const [obj, nextIndex] = parseArrayObject(lines, i)
        array.push(obj)
        i = nextIndex
      } else {
        // Simple value
        array.push(parseYamlValue(itemText))
        i++
      }
    } else {
      i++
    }
  }
  
  return [array, i]
}

function parseArrayObject(lines: string[], startIndex: number): [any, number] {
  const obj: Record<string, any> = {}
  let i = startIndex
  
  const firstLine = lines[i].trimEnd()
  const firstTrimmed = firstLine.trim()
  const originalIndent = firstLine.length - firstLine.trimStart().length
  
  if (firstTrimmed.startsWith('- ')) {
    const itemText = firstTrimmed.substring(2).trim()
    const [key, ...valueParts] = itemText.split(':')
    const value = valueParts.join(':').trim()
    obj[key.trim()] = parseYamlValue(value)
    i++
  }
  
  // Parse additional properties of this object
  while (i < lines.length) {
    const line = lines[i].trimEnd()
    if (!line || line.startsWith('#')) {
      i++
      continue
    }
    
    const indent = line.length - line.trimStart().length
    const trimmedLine = line.trim()
    
    // End this object if we encounter another item at the same level or higher
    if (indent <= originalIndent && trimmedLine.startsWith('- ')) {
      // This is a new array item at the same level or higher - don't consume it
      break
    }
    
    // End this object if we're back to a higher level (less indented)
    if (indent < originalIndent + 2) {
      break
    }
    
    if (trimmedLine.includes(':')) {
      const [key, ...valueParts] = trimmedLine.split(':')
      const value = valueParts.join(':').trim()
      const cleanKey = key.trim()
      
      if (value === '' && cleanKey === 'children') {
        // Parse nested children array
        const [childrenArray, nextIndex] = parseArray(lines, i + 1)
        obj[cleanKey] = childrenArray
        i = nextIndex
      } else {
        obj[cleanKey] = parseYamlValue(value)
        i++
      }
    } else {
      i++
    }
  }
  
  return [obj, i]
}

function parseObject(lines: string[], startIndex: number): [any, number] {
  const obj: Record<string, any> = {}
  let i = startIndex
  
  while (i < lines.length) {
    const line = lines[i].trimEnd()
    if (!line || line.startsWith('#')) {
      i++
      continue
    }
    
    const indent = line.length - line.trimStart().length
    const trimmedLine = line.trim()
    
    if (indent <= 0) {
      // End of object
      break
    }
    
    if (trimmedLine.includes(':')) {
      const [key, ...valueParts] = trimmedLine.split(':')
      const value = valueParts.join(':').trim()
      const cleanKey = key.trim()
      
      if (value === '') {
        // Nested object or array
        if (trimmedLine.endsWith(':')) {
          const [nestedArray, nextIndex] = parseArray(lines, i + 1)
          obj[cleanKey] = nestedArray
          i = nextIndex
        }
      } else {
        obj[cleanKey] = parseYamlValue(value)
        i++
      }
    } else {
      i++
    }
  }
  
  return [obj, i]
}

/**
 * Parse YAML value, handling strings, numbers, booleans, and nested objects
 */
function parseYamlValue(value: string): any {
  if (!value) return ''
  
  // Remove quotes if present
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  
  // Boolean values
  if (value === 'true') return true
  if (value === 'false') return false
  
  // Numbers
  if (/^\d+$/.test(value)) return parseInt(value)
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value)
  
  return value
}

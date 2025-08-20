import { Textbook } from '../types'

// Configuration for available textbooks - only the minimal info needed
const TEXTBOOK_CONFIGS = [
{ id: 'education_systems', path: 'education_systems' },
  { id: 'ai_ml', path: 'ai_ml' },
  { id: 'math', path: 'math' },
  { id: 'coding_is_dead', path: 'coding_is_dead' },
  { id: 'history', path: 'history' },

  { id: 'science', path: 'science' },
  { id: 'new_age_mysticism_and_religion', path: 'new_age_mysticism_and_religion' },

  { id: 'spanish', path: 'spanish' },

  { id: 'stoicism', path: 'stoicism' },

  { id: 'music', path: 'music' },
  { id: 'drawing', path: 'drawing' },

  { id: 'mixed_martial_arts', path: 'mixed_martial_arts' },
  { id: 'chess', path: 'chess' },
  { id: 'starcraft_2', path: 'starcraft_2' },
]


/**
 * Load textbook metadata from index.yml file
 */
export const loadTextbookMetadata = async (path: string): Promise<Textbook | null> => {
  try {
    const response = await fetch(`/textbooks/${path}/index.yml`)
    if (!response.ok) {
      console.warn(`No index.yml found for textbook: ${path} (${response.status})`)
      return null
    }
    
    const yamlText = await response.text()
    const metadata = parseYaml(yamlText)
    
    const textbook = {
      ...metadata,
      id: path,
      path
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
    
    if (indent <= 2 || trimmedLine.startsWith('- ')) {
      // End of this object or start of next array item
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

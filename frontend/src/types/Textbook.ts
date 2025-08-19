export interface Chapter {
  id: string
  title: string
  file: string
  type?: 'page' | 'chapter' | 'section' | 'subsection'
  children?: Chapter[]
}

export interface Textbook {
  id: string
  title: string
  description: string
  path: string
  chapters: Chapter[]
  config?: {
    authors?: string[]
    version?: string
  }
}

import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'
import { Textbook, Chapter } from '../types'
import { loadMarkdownContent } from '../services/contentService'

interface TextbookViewerProps {
  textbooks: Textbook[]
}

// Helper function to find a chapter by ID recursively
const findChapterById = (chapters: Chapter[], chapterId: string): Chapter | null => {
  for (const chapter of chapters) {
    if (chapter.id === chapterId) {
      return chapter
    }
    if (chapter.children) {
      const found = findChapterById(chapter.children, chapterId)
      if (found) return found
    }
  }
  return null
}

// Helper function to flatten chapter structure for sequential navigation
const flattenChapters = (chapters: Chapter[], parentPath: string = ''): Array<{chapter: Chapter, path: string}> => {
  const flattened: Array<{chapter: Chapter, path: string}> = []
  
  chapters.forEach(chapter => {
    const currentPath = parentPath ? `${parentPath}/${chapter.id}` : chapter.id
    flattened.push({ chapter, path: currentPath })
    
    if (chapter.children) {
      flattened.push(...flattenChapters(chapter.children, currentPath))
    }
  })
  
  return flattened
}

// Helper function to get navigation links
const getNavigationLinks = (chapters: Chapter[], currentPath: string) => {
  const flattened = flattenChapters(chapters)
  const currentIndex = flattened.findIndex(item => item.path === currentPath)
  
  if (currentIndex === -1) return { prev: null, next: null }
  
  const prev = currentIndex > 0 ? flattened[currentIndex - 1] : null
  const next = currentIndex < flattened.length - 1 ? flattened[currentIndex + 1] : null
  
  return { prev, next }
}

// Navigation component
const ChapterNavigation = ({ textbookId, prev, next }: {
  textbookId: string
  prev: {chapter: Chapter, path: string} | null
  next: {chapter: Chapter, path: string} | null
}) => {
  if (!prev && !next) return null
  
  return (
    <div className="chapter-navigation">
      <div className="nav-links">
        {prev && (
          <Link to={`/textbook/${textbookId}/${prev.path}`} className="nav-link prev">
            <span className="nav-direction">← Previous</span>
            <span className="nav-title">{prev.chapter.title}</span>
          </Link>
        )}
        {next && (
          <Link to={`/textbook/${textbookId}/${next.path}`} className="nav-link next">
            <span className="nav-direction">Next →</span>
            <span className="nav-title">{next.chapter.title}</span>
          </Link>
        )}
      </div>
    </div>
  )
}

// Component to render navigation tree
const NavigationTree = ({ chapters, textbookId, currentChapterId, level = 0, parentChapterId }: {
  chapters: Chapter[]
  textbookId: string
  currentChapterId?: string
  level?: number
  parentChapterId?: string
}) => {
  return (
    <ul className={`chapter-list level-${level}`}>
      {chapters.map((chapter) => {
        // Generate URL based on whether this is a top-level chapter or a section
        const url = parentChapterId 
          ? `/textbook/${textbookId}/${parentChapterId}/${chapter.id}`
          : `/textbook/${textbookId}/${chapter.id}`
          
        return (
          <li key={chapter.id}>
            <Link
              to={url}
              className={currentChapterId === chapter.id ? 'active' : ''}
            >
              <span className={`chapter-type ${chapter.type || 'section'}`}>
                {chapter.title}
              </span>
            </Link>
            {chapter.children && chapter.children.length > 0 && (
              <NavigationTree
                chapters={chapter.children}
                textbookId={textbookId}
                currentChapterId={currentChapterId}
                level={level + 1}
                parentChapterId={chapter.id}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

const TextbookViewer = ({ textbooks }: TextbookViewerProps) => {
  const { id, chapter, section } = useParams<{ id: string; chapter?: string; section?: string }>()
  const navigate = useNavigate()
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const longPressTimeoutRef = useRef<number | null>(null)
  const isLongPressRef = useRef(false)
  
  const textbook = textbooks.find(t => t.id === id)
  
  // Long press handlers for secret raw notes access
  const handleLongPressStart = () => {
    isLongPressRef.current = false
    longPressTimeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true
      if (textbook) {
        navigate(`/textbook/${textbook.id}/raw`)
      }
    }, 1000) // 1 second long press
  }

  const handleLongPressEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }
  }

  const handleTitleClick = (e: React.MouseEvent) => {
    // Prevent navigation if this was a long press
    if (isLongPressRef.current) {
      e.preventDefault()
      return false
    }
  }
  
  // Find the current item to display - could be a chapter or a section
  let currentItem: Chapter | null = null
  let currentPath = ''

  if (section) {
    // If we have a section, find it within the chapter
    const parentChapter = chapter ? findChapterById(textbook?.chapters || [], chapter) : null
    if (parentChapter?.children) {
      currentItem = findChapterById(parentChapter.children, section)
      currentPath = `${chapter}/${section}`
    }
  } else if (chapter) {
    // If we just have a chapter, find it
    currentItem = findChapterById(textbook?.chapters || [], chapter)
    currentPath = chapter
  } else {
    // We're viewing the main textbook page - find the first chapter
    if (textbook?.chapters && textbook.chapters.length > 0) {
      const firstChapter = textbook.chapters[0]
      currentPath = firstChapter.id
    }
  }

  // Get navigation links
  const navigation = textbook ? getNavigationLinks(textbook.chapters, currentPath) : { prev: null, next: null }

  useEffect(() => {
    const loadContent = async () => {
      if (!textbook) return
      
      setLoading(true)
      try {
        let fileName = 'index.md'
        
        if (currentItem) {
          // Load specific chapter or section
          fileName = currentItem.file
        }
        
        // Load the actual markdown content using our service
        const markdownContent = await loadMarkdownContent(textbook.path, fileName)
        setContent(markdownContent)
        
      } catch (error) {
        console.error('Error loading content:', error)
        setContent('# Error\n\nFailed to load content.')
      }
      setLoading(false)
    }

    loadContent()
  }, [textbook, currentItem])

  if (!textbook) {
    return (
      <div>
        <h1>Textbook Not Found</h1>
        <p>The requested textbook could not be found.</p>
        <Link to="/">← Back to Library</Link>
      </div>
    )
  }

  return (
    <div className="textbook-viewer">
      {/* Mobile toggle button */}
      <button 
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle navigation"
      >
        ☰
      </button>
      
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/">← Back to Library</Link>
          <button 
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            ×
          </button>
        </div>
        <h2 
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
          onClick={handleTitleClick}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          {textbook.title}
        </h2>
        <p>{textbook.description}</p>
        
        {textbook.chapters.length > 0 && (
          <>
            <h3>Table of Contents</h3>
            <NavigationTree
              chapters={textbook.chapters}
              textbookId={textbook.id}
              currentChapterId={section || chapter}
            />
          </>
        )}
      </aside>
      
      <div className="content-area">
        {loading ? (
          <p>Loading content...</p>
        ) : (
          <>
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeRaw]}
              >
                {content}
              </ReactMarkdown>
            </div>
            <ChapterNavigation 
              textbookId={textbook.id}
              prev={navigation.prev}
              next={navigation.next}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default TextbookViewer

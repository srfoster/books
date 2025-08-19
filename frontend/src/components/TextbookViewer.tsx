import { useParams, Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { useAuth } from '@srfoster/one-backend-react'
import { Textbook, Chapter } from '../types'
import { loadMarkdownContent } from '../services/contentService'
import { useReadingProgress } from '../services/progressService'

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
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { trackProgress } = useReadingProgress()
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const startTimeRef = useRef<number>(Date.now())
  const hasTrackedPageRef = useRef<boolean>(false)
  const currentPageRef = useRef<string>('')
  
  const textbook = textbooks.find(t => t.id === id)
  
  // Find the current item to display - could be a chapter or a section
  let currentItem: Chapter | null = null

  if (section) {
    // If we have a section, find it within the chapter
    const parentChapter = chapter ? findChapterById(textbook?.chapters || [], chapter) : null
    if (parentChapter?.children) {
      currentItem = findChapterById(parentChapter.children, section)
    }
  } else if (chapter) {
    // If we just have a chapter, find it
    currentItem = findChapterById(textbook?.chapters || [], chapter)
  }

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

  // Track reading progress
  useEffect(() => {
    if (!isAuthenticated || !textbook || !content) return

    const currentPath = location.pathname
    
    // If this is a new page, reset tracking flags
    if (currentPageRef.current !== currentPath) {
      currentPageRef.current = currentPath
      hasTrackedPageRef.current = false
      startTimeRef.current = Date.now()
    }

    // Only track once per page load
    if (hasTrackedPageRef.current) return

    // Mark as tracked to prevent duplicate calls
    hasTrackedPageRef.current = true

    // Debounced tracking function
    const trackPageStart = async () => {
      try {
        await trackProgress({
          textbookId: textbook.id,
          chapterId: chapter || undefined,
          sectionId: section || undefined,
          completedAt: new Date().toISOString(),
          currentPage: currentPath,
          progressPercentage: calculateProgressPercentage(),
          timeSpent: 0 // Initial time spent
        })
      } catch (error) {
        console.error('Error tracking progress:', error)
        // Reset flag on error so we can retry
        hasTrackedPageRef.current = false
      }
    }

    // Delay the tracking slightly to ensure everything is loaded
    const trackingTimeout = setTimeout(trackPageStart, 1000)

    return () => {
      clearTimeout(trackingTimeout)
    }
  }, [textbook, content, chapter, section, isAuthenticated, trackProgress, location.pathname])

  // Track time spent and save progress on page unload/navigation
  useEffect(() => {
    if (!isAuthenticated || !textbook) return

    let lastSaveTime = 0

    const saveProgressBeforeLeave = async () => {
      const now = Date.now()
      const timeSpent = Math.floor((now - startTimeRef.current) / 1000)
      const currentPath = location.pathname

      // Prevent duplicate saves within 5 seconds
      if (now - lastSaveTime < 5000) return
      
      if (timeSpent > 5) { // Only save if user spent more than 5 seconds
        try {
          lastSaveTime = now
          await trackProgress({
            textbookId: textbook.id,
            chapterId: chapter || undefined,
            sectionId: section || undefined,
            completedAt: new Date().toISOString(),
            currentPage: currentPath,
            progressPercentage: calculateProgressPercentage(),
            timeSpent
          })
        } catch (error) {
          console.error('Error saving progress:', error)
        }
      }
    }

    // Save progress when user leaves the page
    const handleBeforeUnload = () => {
      saveProgressBeforeLeave()
    }

    // Also save progress periodically (every 60 seconds if actively reading)
    const progressInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        saveProgressBeforeLeave()
        startTimeRef.current = Date.now() // Reset timer for next interval
      }
    }, 60000)

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      clearInterval(progressInterval)
      saveProgressBeforeLeave() // Save when component unmounts
    }
  }, [textbook, chapter, section, isAuthenticated, trackProgress, location.pathname])

  // Helper function to calculate reading progress percentage
  const calculateProgressPercentage = (): number => {
    if (!textbook) return 0

    // Simple calculation based on current position in textbook structure
    const totalChapters = textbook.chapters.length
    if (!chapter) return 0

    const chapterIndex = textbook.chapters.findIndex(ch => ch.id === chapter)
    if (chapterIndex === -1) return 0

    if (!section) {
      // Just reached this chapter
      return Math.round(((chapterIndex + 1) / totalChapters) * 100)
    }

    // If we have sections, calculate more precisely
    const currentChapter = textbook.chapters[chapterIndex]
    if (currentChapter?.children) {
      const sectionIndex = currentChapter.children.findIndex(sec => sec.id === section)
      const sectionsInChapter = currentChapter.children.length
      const sectionProgress = (sectionIndex + 1) / sectionsInChapter
      const chapterProgress = (chapterIndex + sectionProgress) / totalChapters
      return Math.round(chapterProgress * 100)
    }

    return Math.round(((chapterIndex + 1) / totalChapters) * 100)
  }

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
      <aside className="sidebar">
        <Link to="/">← Back to Library</Link>
        <h2>{textbook.title}</h2>
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
          <div className="markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

export default TextbookViewer

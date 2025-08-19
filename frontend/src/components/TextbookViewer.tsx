import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
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
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
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

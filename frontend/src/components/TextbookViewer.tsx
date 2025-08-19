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
const NavigationTree = ({ chapters, textbookId, currentChapterId, level = 0 }: {
  chapters: Chapter[]
  textbookId: string
  currentChapterId?: string
  level?: number
}) => {
  return (
    <ul className={`chapter-list level-${level}`}>
      {chapters.map((chapter) => (
        <li key={chapter.id}>
          <Link
            to={`/textbook/${textbookId}/${chapter.id}`}
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
            />
          )}
        </li>
      ))}
    </ul>
  )
}

const TextbookViewer = ({ textbooks }: TextbookViewerProps) => {
  const { id, chapter } = useParams<{ id: string; chapter?: string }>()
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  const textbook = textbooks.find(t => t.id === id)
  const currentChapter = chapter ? findChapterById(textbook?.chapters || [], chapter) : null

  useEffect(() => {
    const loadContent = async () => {
      if (!textbook) return
      
      setLoading(true)
      try {
        let fileName = 'index.md'
        
        if (currentChapter) {
          // Load specific chapter
          fileName = currentChapter.file
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
  }, [textbook, currentChapter])

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
              currentChapterId={chapter}
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

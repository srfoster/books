import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { loadMarkdownContent } from '../services/contentService'
import './RawNotesViewer.css'

interface RawNotesViewerProps {
  textbooks: any[]
}

export const RawNotesViewer: React.FC<RawNotesViewerProps> = ({ textbooks }) => {
  const { id } = useParams<{ id: string }>()
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const textbook = textbooks.find(t => t.id === id)

  useEffect(() => {
    const loadRawNotes = async () => {
      if (!id) return

      try {
        setLoading(true)
        setError(null)
        const rawContent = await loadMarkdownContent(id, 'raw.md')
        setContent(rawContent)
      } catch (err) {
        console.error('Error loading raw notes:', err)
        setError('Failed to load raw notes')
      } finally {
        setLoading(false)
      }
    }

    loadRawNotes()
  }, [id])

  if (loading) {
    return <div className="raw-notes-loading">Loading raw notes...</div>
  }

  if (error) {
    return (
      <div className="raw-notes-error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="raw-notes-viewer">
      <div className="raw-notes-header">
        <h1>🔓 Raw Notes: {textbook?.title || id}</h1>
        <p className="raw-notes-subtitle">
          These are unorganized notes and ideas for this textbook
        </p>
      </div>
      <div className="raw-notes-content">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  )
}

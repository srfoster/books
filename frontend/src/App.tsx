import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Navigation, TextbookList, TextbookViewer, AuthPage } from './components'
import { Textbook } from './types'
import { loadAllTextbooks } from './services/textbookService'
import './App.css'

function App() {
  const [textbooks, setTextbooks] = useState<Textbook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTextbooks = async () => {
      try {
        setLoading(true)
        setError(null)
        const loadedTextbooks = await loadAllTextbooks()
        setTextbooks(loadedTextbooks)
      } catch (err) {
        console.error('Error loading textbooks:', err)
        setError('Failed to load textbooks')
      } finally {
        setLoading(false)
      }
    }

    loadTextbooks()
  }, [])

  if (loading) {
    return (
      <div className="app">
        <Navigation />
        <main className="main-content">
          <div className="loading">Loading textbooks...</div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <Navigation />
        <main className="main-content">
          <div className="error">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <Navigation />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<TextbookList textbooks={textbooks} />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/textbook/:id" element={<TextbookViewer textbooks={textbooks} />} />
          <Route path="/textbook/:id/:chapter" element={<TextbookViewer textbooks={textbooks} />} />
          <Route path="/textbook/:id/:chapter/:section" element={<TextbookViewer textbooks={textbooks} />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

// Backup of original App.tsx
import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Navigation, TextbookList, TextbookViewer, AuthPage, ProgressDashboard } from './components'
import { Textbook } from './types'
import './App.css'

function App() {
  const [textbooks, setTextbooks] = useState<Textbook[]>([])

  useEffect(() => {
    // Load textbook metadata - simplified configuration
    const loadTextbooks = async () => {
      // Simple textbook definitions based on directory names in public/textbooks/
      const simpleTextbooks: Textbook[] = [
        {
          id: 'ai-ml',
          title: 'AI & Machine Learning',
          description: 'Comprehensive guide to artificial intelligence and machine learning concepts',
          path: 'ai_ml',
          chapters: [
            { id: 'overview', title: 'Course Overview', file: 'index.md' }
          ]
        },
        {
          id: 'math',
          title: 'Mathematics',
          description: 'Mathematical concepts and theories',
          path: 'math',
          chapters: [
            { id: 'overview', title: 'Mathematics Overview', file: 'index.md', type: 'page' },
            { id: 'algebra', title: 'Algebra', file: 'algebra.md', type: 'page' },
            { id: 'calculus', title: 'Calculus', file: 'calculus.md', type: 'page' },
            { id: 'geometry', title: 'Geometry', file: 'geometry.md', type: 'page' },
            { id: 'statistics', title: 'Statistics', file: 'statistics.md', type: 'page' }
          ]
        },
        {
          id: 'frontend',
          title: 'Frontend Development',
          description: 'Modern frontend development with React, HTML, CSS, and JavaScript',
          path: 'frontend',
          chapters: [
            { id: 'overview', title: 'Frontend Overview', file: 'index.md' }
          ]
        },
        {
          id: 'stoicism',
          title: 'Stoicism',
          description: 'Philosophy and principles of Stoicism',
          path: 'stoicism',
          chapters: [
            { id: 'overview', title: 'Introduction to Stoicism', file: 'index.md' },
            { id: 'main', title: 'Main Concepts', file: 'main.md' },
            { id: 'related', title: 'Related Topics', file: 'related.md' }
          ]
        },
        {
          id: 'history',
          title: 'History',
          description: 'Historical events and analysis',
          path: 'history',
          chapters: [
            { id: 'overview', title: 'Understanding History', file: 'index.md' }
          ]
        }
      ]
      setTextbooks(simpleTextbooks)
    }

    loadTextbooks()
  }, [])

  return (
    <div className="app">
      <Navigation />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<TextbookList textbooks={textbooks} />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/progress" element={<ProgressDashboard />} />
          <Route path="/textbook/:id" element={<TextbookViewer textbooks={textbooks} />} />
          <Route path="/textbook/:id/:chapter" element={<TextbookViewer textbooks={textbooks} />} />
          <Route path="/textbook/:id/:chapter/:section" element={<TextbookViewer textbooks={textbooks} />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Navigation, TextbookList, TextbookViewer } from './components'
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
            { 
              id: 'algebra', 
              title: 'Chapter 1: Algebra', 
              file: 'chapters/01-algebra/index.md', 
              type: 'chapter',
              children: [
                { id: 'linear-equations', title: 'Linear Equations', file: 'chapters/01-algebra/01-linear-equations.md', type: 'section' },
                { id: 'quadratic-functions', title: 'Quadratic Functions', file: 'chapters/01-algebra/02-quadratic-functions.md', type: 'section' }
              ]
            }
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
          <Route path="/textbook/:id" element={<TextbookViewer textbooks={textbooks} />} />
          <Route path="/textbook/:id/:chapter" element={<TextbookViewer textbooks={textbooks} />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

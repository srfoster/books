import { Link, useNavigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import { Textbook } from '../types'

interface TextbookListProps {
  textbooks: Textbook[]
}

const TextbookList = ({ textbooks }: TextbookListProps) => {
  const navigate = useNavigate()
  
  // Long press detection
  const useLongPress = (callback: () => void, delay = 800) => {
    const [longPressTriggered, setLongPressTriggered] = useState(false)
    const timeout = useRef<number>()
    const target = useRef<EventTarget>()

    const start = (event: React.TouchEvent | React.MouseEvent) => {
      setLongPressTriggered(false)
      timeout.current = window.setTimeout(() => {
        callback()
        setLongPressTriggered(true)
      }, delay)
      target.current = event.target
    }

    const clear = (event: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
      timeout.current && clearTimeout(timeout.current)
      if (longPressTriggered && shouldTriggerClick) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    return {
      onMouseDown: start,
      onTouchStart: start,
      onMouseUp: clear,
      onMouseLeave: (event: React.MouseEvent) => clear(event, false),
      onTouchEnd: clear
    }
  }

  return (
    <div>
      <h1>Books</h1>
      
      <div className="textbook-grid">
        {textbooks.map((textbook) => {
          const longPressEvents = useLongPress(() => {
            if (textbook.coming_soon) {
              // Add haptic feedback on mobile devices
              if ('vibrate' in navigator) {
                navigator.vibrate(100)
              }
              navigate(`/textbook/${textbook.id}`)
            }
          })

          const TextbookCard = ({ children }: { children: React.ReactNode }) => {
            if (textbook.coming_soon) {
              return (
                <div 
                  className="textbook-card textbook-card-coming-soon"
                  {...longPressEvents}
                  style={{ cursor: 'pointer' }}
                  title="Long press to access"
                >
                  {children}
                </div>
              )
            }
            
            return (
              <Link
                to={`/textbook/${textbook.id}`}
                className="textbook-card"
              >
                {children}
              </Link>
            )
          }

          return (
            <TextbookCard key={textbook.id}>
              <h3>{textbook.title}</h3>
              <p>{textbook.description}</p>
              {textbook.coming_soon && (
                <div className="coming-soon-badge">Coming Soon</div>
              )}
              {textbook.under_construction && (
                <div className="under-construction-badge">Under Construction</div>
              )}
              {textbook.coming_soon && (
                <div style={{ 
                  fontSize: '0.8em', 
                  color: '#666', 
                  marginTop: '0.5rem',
                  fontStyle: 'italic'
                }}>
                  💡 Long press to preview
                </div>
              )}
              <br/>
              {textbook.chapters.length > 0 && (
                <small>{textbook.chapters.length} chapters available</small>
              )}
            </TextbookCard>
          )
        })}
      </div>
      
      {textbooks.length === 0 && (
        <p>No textbooks available yet. Check back later!</p>
      )}
    </div>
  )
}

export default TextbookList

import { Link } from 'react-router-dom'
import { Textbook } from '../types'

interface TextbookListProps {
  textbooks: Textbook[]
}

const TextbookList = ({ textbooks }: TextbookListProps) => {
  return (
    <div>
      <h1>Books</h1>
      
      <div className="textbook-grid">
        {textbooks.map((textbook) => {
          const TextbookCard = ({ children }: { children: React.ReactNode }) => {
            if (textbook.coming_soon) {
              return (
                <div className="textbook-card textbook-card-coming-soon">
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

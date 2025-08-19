import { Link } from 'react-router-dom'
import { Textbook } from '../types'

interface TextbookListProps {
  textbooks: Textbook[]
}

const TextbookList = ({ textbooks }: TextbookListProps) => {
  return (
    <div>
      <h1>Available Textbooks</h1>
      <p>Choose from our collection of educational materials:</p>
      
      <div className="textbook-grid">
        {textbooks.map((textbook) => (
          <Link
            key={textbook.id}
            to={`/textbook/${textbook.id}`}
            className="textbook-card"
          >
            <h3>{textbook.title}</h3>
            <p>{textbook.description}</p>
            {textbook.chapters.length > 0 && (
              <small>{textbook.chapters.length} chapters available</small>
            )}
          </Link>
        ))}
      </div>
      
      {textbooks.length === 0 && (
        <p>No textbooks available yet. Check back later!</p>
      )}
    </div>
  )
}

export default TextbookList

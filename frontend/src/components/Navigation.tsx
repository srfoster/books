import { Link } from 'react-router-dom'

const Navigation = () => {
  return (
    <nav className="navigation">
      <div className="nav-content">
        <Link to="/" className="nav-brand">
          Textbook Library
        </Link>
        <ul className="nav-links">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navigation

import { Link } from 'react-router-dom'
import { useAuth } from '@srfoster/one-backend-react'
import { useState } from 'react'
import './Navigation.css'

const Navigation = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth()
  
  const [showUserMenu, setShowUserMenu] = useState(false)

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
          {isAuthenticated && (
            <li>
              <Link to="/progress">My Progress</Link>
            </li>
          )}
          <li>
            <Link to="/about">About</Link>
          </li>
        </ul>
        
        <div className="nav-auth">
          {isAuthenticated && user ? (
            <div className="user-menu">
              <button 
                className="user-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                {user.firstName || user.email}
                <span className="dropdown-arrow">▼</span>
              </button>
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <strong>{user.firstName} {user.lastName}</strong>
                    <span className="user-email">{user.email}</span>
                  </div>
                  <hr />
                  <Link 
                    to="/progress" 
                    className="dropdown-link"
                    onClick={() => setShowUserMenu(false)}
                  >
                    My Progress
                  </Link>
                  <button onClick={() => { logout(); setShowUserMenu(false); }}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="login-link">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navigation

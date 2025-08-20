import React from 'react'
import { useAuth, LoginForm, RegisterForm } from '@srfoster/one-backend-react'
import './AuthPage.css'

interface AuthPageProps {
  onAuthSuccess?: () => void
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const { user, logout, isAuthenticated } = useAuth()
  
  const [showRegister, setShowRegister] = React.useState(false)

  React.useEffect(() => {
    if (isAuthenticated && onAuthSuccess) {
      onAuthSuccess()
    }
  }, [isAuthenticated, onAuthSuccess])

  if (isAuthenticated && user) {
    return (
      <div className="auth-page authenticated">
        <div className="user-info">
          <h2>Welcome back!</h2>
          <p>Logged in as: <strong>{user.email}</strong></p>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Textbook Platform</h1>
          <p>Sign in to access the full platform features</p>
        </div>

        <div className="auth-toggle">
          <button 
            className={!showRegister ? 'active' : ''}
            onClick={() => setShowRegister(false)}
          >
            Login
          </button>
          <button 
            className={showRegister ? 'active' : ''}
            onClick={() => setShowRegister(true)}
          >
            Register
          </button>
        </div>

        <div className="auth-form">
          {showRegister ? (
            <RegisterForm 
              onSuccess={() => {
                console.log('Registration successful!')
                if (onAuthSuccess) onAuthSuccess()
              }}
              onError={(error) => console.error('Registration error:', error)}
              showNameFields={true}
              className="one-backend-form"
            />
          ) : (
            <LoginForm 
              onSuccess={() => {
                console.log('Login successful!')
                if (onAuthSuccess) onAuthSuccess()
              }}
              onError={(error) => console.error('Login error:', error)}
              className="one-backend-form"
            />
          )}
        </div>

        <div className="guest-access">
          <p>
            <button 
              onClick={onAuthSuccess} 
              className="link-button"
            >
              Continue as guest
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthPage

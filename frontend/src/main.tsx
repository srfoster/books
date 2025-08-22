import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from '@srfoster/one-backend-react'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AuthProvider config={{
    appId: 'textbook-platform'
  }}>
    <HashRouter>
      <App />
    </HashRouter>
  </AuthProvider>
)

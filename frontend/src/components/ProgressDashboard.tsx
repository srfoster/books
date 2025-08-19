import { useAuth } from '@srfoster/one-backend-react'
import { useReadingProgress, useBookmarks } from '../services/progressService'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import './ProgressDashboard.css'

const ProgressDashboard = () => {
  const { user, isAuthenticated } = useAuth()
  const { getUserProgress, loadAllProgress, clearAllProgress, loading: progressLoading } = useReadingProgress()
  const { getUserBookmarks, loadAllBookmarks, clearAllBookmarks, loading: bookmarksLoading } = useBookmarks()
  const [isClearing, setIsClearing] = useState(false)

  // Remove the automatic loading to prevent infinite loops
  // Users can manually load more records if needed

  const handleLoadAllProgress = async () => {
    await loadAllProgress()
  }

  const handleLoadAllBookmarks = async () => {
    await loadAllBookmarks()
  }

  const handleClearProgress = async () => {
    setIsClearing(true)
    try {
      const result = await clearAllProgress()
      if (result?.success) {
        console.log(`✅ Batch deleted ${result.deleted} progress records`)
      }
    } catch (error) {
      console.error('Error clearing progress:', error)
    } finally {
      setIsClearing(false)
    }
  }

  const handleClearBookmarks = async () => {
    setIsClearing(true)
    try {
      const result = await clearAllBookmarks()
      if (result?.success) {
        console.log(`✅ Batch deleted ${result.deleted} bookmark records`)
      }
    } catch (error) {
      console.error('Error clearing bookmarks:', error)
    } finally {
      setIsClearing(false)
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="progress-dashboard">
        <div className="auth-required">
          <h2>Please log in to view your progress</h2>
          <p>Track your reading progress and save bookmarks by creating an account.</p>
          <Link to="/auth" className="login-button">
            Login / Register
          </Link>
        </div>
      </div>
    )
  }

  const progress = getUserProgress() as any[]
  const bookmarks = getUserBookmarks() as any[]

  if (progressLoading || bookmarksLoading) {
    return (
      <div className="progress-dashboard">
        <div className="loading">Loading your progress...</div>
      </div>
    )
  }

  return (
    <div className="progress-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>My Learning Progress</h1>
          <p>Welcome back, {user.firstName || user.email}!</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={handleClearProgress} 
            className="clear-btn danger"
            disabled={isClearing || progress.length === 0}
          >
            Clear All Progress ({progress.length})
          </button>
          <button 
            onClick={handleClearBookmarks} 
            className="clear-btn danger"
            disabled={isClearing || bookmarks.length === 0}
          >
            Clear All Bookmarks ({bookmarks.length})
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <section className="progress-section">
          <div className="section-header">
            <h2>Reading Progress ({progress.length} records)</h2>
            {progress.length >= 20 && (
              <button 
                onClick={handleLoadAllProgress} 
                className="load-more-btn"
                disabled={progressLoading}
              >
                {progressLoading ? 'Loading...' : 'Load All Records'}
              </button>
            )}
          </div>
          {progress.length === 0 ? (
            <div className="empty-state">
              <p>You haven't started reading any textbooks yet.</p>
              <Link to="/" className="start-reading-btn">
                Browse Textbooks
              </Link>
            </div>
          ) : (
            <div className="progress-list">
              {progress.map((record, index) => (
                <div key={record.id || index} className="progress-item">
                  <div className="progress-info">
                    <h3>{record.data.textbookId}</h3>
                    {record.data.chapterId && <p className="chapter">Chapter: {record.data.chapterId}</p>}
                    {record.data.sectionId && <p className="section">Section: {record.data.sectionId}</p>}
                    <div className="progress-meta">
                      <span className="progress-percent">
                        {record.data.progressPercentage}% complete
                      </span>
                      <span className="time-spent">
                        {Math.round(record.data.timeSpent / 60)} min read
                      </span>
                      <span className="last-read">
                        {new Date(record.data.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="progress-actions">
                    <a href={record.data.currentPage} className="continue-btn">
                      Continue Reading
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bookmarks-section">
          <div className="section-header">
            <h2>Bookmarks ({bookmarks.length} records)</h2>
            {bookmarks.length >= 20 && (
              <button 
                onClick={handleLoadAllBookmarks} 
                className="load-more-btn"
                disabled={bookmarksLoading}
              >
                {bookmarksLoading ? 'Loading...' : 'Load All Records'}
              </button>
            )}
          </div>
          {bookmarks.length === 0 ? (
            <div className="empty-state">
              <p>No bookmarks saved yet.</p>
              <p>Click the bookmark icon while reading to save your favorite sections.</p>
            </div>
          ) : (
            <div className="bookmarks-list">
              {bookmarks.map((record) => (
                <div key={record.id} className="bookmark-item">
                  <div className="bookmark-info">
                    <h3>{record.data.title}</h3>
                    <p className="bookmark-textbook">{record.data.textbookId}</p>
                    {record.data.notes && (
                      <p className="bookmark-notes">{record.data.notes}</p>
                    )}
                    <span className="bookmark-date">
                      Saved {new Date(record.data.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="bookmark-actions">
                    <a href={record.data.url} className="visit-btn">
                      Visit
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default ProgressDashboard

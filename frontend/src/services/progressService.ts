import { useData, useAuth } from '@srfoster/one-backend-react'

export interface ReadingProgress {
  userId: string
  textbookId: string
  chapterId?: string
  sectionId?: string
  completedAt: string
  currentPage: string // URL of current page
  progressPercentage: number
  timeSpent: number // in seconds
}

export interface Bookmark {
  userId: string
  textbookId: string
  chapterId?: string
  sectionId?: string
  title: string
  url: string
  notes?: string
  createdAt: string
}

// Hook for managing reading progress
export const useReadingProgress = () => {
  const { user } = useAuth()
  const { data, createRecord, updateRecord, deleteRecord, loading, error, fetchData } = useData('reading-progress')

  const trackProgress = async (progressData: Omit<ReadingProgress, 'userId'>) => {
    if (!user) return
    
    const progressRecord = {
      ...progressData,
      userId: user.id
    }
    
    return await createRecord({ data: progressRecord })
  }

  const getProgress = (textbookId: string, currentPage: string) => {
    if (!user) return null
    return data?.find((record: any) => 
      record.data.userId === user.id && 
      record.data.textbookId === textbookId && 
      record.data.currentPage === currentPage
    ) || null
  }

  const getUserProgress = () => {
    if (!user) return []
    return data?.filter((record: any) => record.data.userId === user.id) || []
  }

  const clearAllProgress = async () => {
    if (!user) return
    
    const userProgress = getUserProgress()
    const deletePromises = userProgress.map((record: any) => deleteRecord(record.id))
    
    try {
      await Promise.all(deletePromises)
      await fetchData() // Refresh the data
    } catch (error) {
      console.error('Error clearing progress:', error)
      throw error
    }
  }

  return {
    trackProgress,
    getProgress,
    getUserProgress,
    clearAllProgress,
    loading,
    error,
    refreshProgress: fetchData
  }
}

// Hook for managing bookmarks
export const useBookmarks = () => {
  const { user } = useAuth()
  const { data, createRecord, deleteRecord, loading, error, fetchData } = useData('bookmarks')

  const addBookmark = async (bookmarkData: Omit<Bookmark, 'userId' | 'createdAt'>) => {
    if (!user) return
    
    const bookmarkRecord = {
      ...bookmarkData,
      userId: user.id,
      createdAt: new Date().toISOString()
    }
    
    return await createRecord({ data: bookmarkRecord })
  }

  const removeBookmark = async (bookmarkId: string) => {
    return await deleteRecord(bookmarkId)
  }

  const getUserBookmarks = () => {
    if (!user) return []
    return data?.filter((record: any) => record.data.userId === user.id) || []
  }

  const isBookmarked = (url: string) => {
    if (!user) return false
    return data?.some((record: any) => record.data.userId === user.id && record.data.url === url) || false
  }

  const clearAllBookmarks = async () => {
    if (!user) return
    
    const userBookmarks = getUserBookmarks()
    const deletePromises = userBookmarks.map((record: any) => deleteRecord(record.id))
    
    try {
      await Promise.all(deletePromises)
      await fetchData() // Refresh the data
    } catch (error) {
      console.error('Error clearing bookmarks:', error)
      throw error
    }
  }

  return {
    addBookmark,
    removeBookmark,
    getUserBookmarks,
    isBookmarked,
    clearAllBookmarks,
    loading,
    error,
    refreshBookmarks: fetchData
  }
}

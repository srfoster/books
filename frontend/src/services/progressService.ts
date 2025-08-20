import { useData, useAuth } from '@srfoster/one-backend-react'
import { useCallback } from 'react'

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
  const { data, createRecord, updateRecord, deleteRecord, deleteRecords, loading, error, fetchData } = useData('reading-progress')

  const trackProgress = async (progressData: Omit<ReadingProgress, 'userId'>) => {
    if (!user) return
    
    // Wait for initial data load if still loading
    if (loading) {
      console.log('⏳ Waiting for data to load before checking duplicates...')
      // Give it a moment to load
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    const progressRecord = {
      ...progressData,
      userId: user.id
    }
    
    // Debug: Log what we're looking for
    console.log('🔍 Looking for existing progress:', {
      userId: user.id,
      textbookId: progressData.textbookId,
      currentPage: progressData.currentPage,
      chapterId: progressData.chapterId,
      sectionId: progressData.sectionId
    })
    
    // Debug: Log all existing records for this user
    const userRecords = getUserProgress()
    console.log('📊 Existing user records:', userRecords.length, userRecords)
    
    // Strategy 1: Check by exact page URL (most specific)
    let existingRecord = getProgress(progressData.textbookId, progressData.currentPage)
    console.log('🎯 Found by page URL:', existingRecord)
    
    // Strategy 2: If no exact match, check by location (textbook + chapter + section)
    if (!existingRecord) {
      existingRecord = getProgressByLocation(
        progressData.textbookId, 
        progressData.chapterId, 
        progressData.sectionId
      )
      console.log('📍 Found by location:', existingRecord)
    }
    
    if (existingRecord) {
      // Update existing record (merge time spent and update other fields)
      const updatedData = {
        ...progressRecord,
        timeSpent: existingRecord.data.timeSpent + progressRecord.timeSpent, // Add to existing time
        completedAt: new Date().toISOString() // Update timestamp
      }
      console.log(`📝 Updating existing progress for ${progressData.textbookId} (${existingRecord.data.timeSpent}s + ${progressRecord.timeSpent}s = ${updatedData.timeSpent}s)`)
      return await updateRecord(existingRecord.id, { data: updatedData })
    } else {
      // Create new record
      console.log(`✨ Creating new progress for ${progressData.textbookId}`)
      return await createRecord({ data: progressRecord })
    }
  }

  const getProgress = (textbookId: string, currentPage: string) => {
    if (!user) return null
    return data?.find((record: any) => 
      record.data.userId === user.id && 
      record.data.textbookId === textbookId && 
      record.data.currentPage === currentPage
    ) || null
  }

  const getProgressByLocation = (textbookId: string, chapterId?: string, sectionId?: string) => {
    if (!user) return null
    return data?.find((record: any) => 
      record.data.userId === user.id && 
      record.data.textbookId === textbookId &&
      record.data.chapterId === chapterId &&
      record.data.sectionId === sectionId
    ) || null
  }

  const getUserProgress = () => {
    if (!user) return []
    return data?.filter((record: any) => record.data.userId === user.id) || []
  }

  const loadAllProgress = useCallback(async () => {
    try {
      await fetchData(1, 1000) // Fetch up to 1000 records
    } catch (error) {
      console.error('Error loading all progress:', error)
    }
  }, [fetchData])

  const clearAllProgress = async () => {
    if (!user) return
    
    // First, make sure we have all the data loaded
    await loadAllProgress()
    
    const userProgress = getUserProgress()
    if (userProgress.length === 0) return
    
    const progressIds = userProgress.map((record: any) => record.id)
    
    try {
      // Try batch delete first
      if (deleteRecords) {
        const result = await deleteRecords(progressIds)
        if (result.success) {
          console.log(`✅ Batch deleted ${result.deleted} progress records`)
          if (result.failed > 0) {
            console.warn(`⚠️ Failed to delete ${result.failed} progress records`)
          }
        }
        await fetchData() // Refresh the data
        return result
      } else {
        // Fallback to individual deletes
        const deletePromises = userProgress.map((record: any) => deleteRecord(record.id))
        await Promise.all(deletePromises)
        
        console.log(`✅ Successfully deleted ${userProgress.length} progress records (individual)`)
        await fetchData() // Refresh the data
        
        return { success: true, deleted: userProgress.length, failed: 0 }
      }
    } catch (error) {
      console.error('Error clearing progress:', error)
      throw error
    }
  }

  return {
    trackProgress,
    getProgress,
    getProgressByLocation,
    getUserProgress,
    loadAllProgress,
    clearAllProgress,
    loading,
    error,
    refreshProgress: fetchData
  }
}

// Hook for managing bookmarks
export const useBookmarks = () => {
  const { user } = useAuth()
  const { data, createRecord, deleteRecord, deleteRecords, loading, error, fetchData } = useData('bookmarks')

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

  const loadAllBookmarks = useCallback(async () => {
    try {
      await fetchData(1, 1000) // Fetch up to 1000 records
    } catch (error) {
      console.error('Error loading all bookmarks:', error)
    }
  }, [fetchData])

  const clearAllBookmarks = async () => {
    if (!user) return
    
    // First, make sure we have all the data loaded
    await loadAllBookmarks()
    
    const userBookmarks = getUserBookmarks()
    if (userBookmarks.length === 0) return
    
    const bookmarkIds = userBookmarks.map((record: any) => record.id)
    
    try {
      // Try batch delete first
      if (deleteRecords) {
        const result = await deleteRecords(bookmarkIds)
        if (result.success) {
          console.log(`✅ Batch deleted ${result.deleted} bookmark records`)
          if (result.failed > 0) {
            console.warn(`⚠️ Failed to delete ${result.failed} bookmark records`)
          }
        }
        await fetchData() // Refresh the data
        return result
      } else {
        // Fallback to individual deletes
        const deletePromises = userBookmarks.map((record: any) => deleteRecord(record.id))
        await Promise.all(deletePromises)
        
        console.log(`✅ Successfully deleted ${userBookmarks.length} bookmark records (individual)`)
        await fetchData() // Refresh the data
        
        return { success: true, deleted: userBookmarks.length, failed: 0 }
      }
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
    loadAllBookmarks,
    clearAllBookmarks,
    loading,
    error,
    refreshBookmarks: fetchData
  }
}

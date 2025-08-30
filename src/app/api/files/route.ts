import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { getUserFiles, deleteUserFile } from '@/lib/redis'
import { deleteFileChunks } from '@/lib/vector'

// Get user's files
export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const files = await getUserFiles(userId)
    
    return NextResponse.json({
      success: true,
      files
    })

  } catch (error) {
    console.error('Get files error:', error)
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}

// Delete a file
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileId } = await request.json()
    
    if (!fileId) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 })
    }

    // Delete from vector database
    const deletedChunks = await deleteFileChunks(userId, fileId)
    
    // Delete from Redis
    await deleteUserFile(userId, fileId)

    return NextResponse.json({
      success: true,
      deletedChunks,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('Delete file error:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}
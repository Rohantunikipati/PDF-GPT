import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { rateLimitUser, redis } from '@/lib/redis'
import { extractTextFromPDF } from '@/lib/pdf.server'
import { cleanExtractedText, validatePDFFile } from '@/lib/pdf.utils'
import { chunkText, generateEmbeddings } from '@/lib/embeddings'
import { upsertDocumentChunks } from '@/lib/vector'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  console.log('=== PDF Upload Started ===')
  
  try {
    // Authentication
    const { userId } = auth()
    if (!userId) {
      console.log('❌ No user ID found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ User authenticated:', userId)

    // Rate limiting
    const allowed = await rateLimitUser(userId, 5, 300) // 5 uploads per 5 minutes
    if (!allowed) {
      console.log('❌ Rate limit exceeded for user:', userId)
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait before uploading again.' }, { status: 429 })
    }
    console.log('✅ Rate limit check passed')

    // Get form data
    const formData = await request.formData()
    const file = formData.get('pdf') as File
    
    if (!file) {
      console.log('❌ No file in form data')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('📄 File received:', { 
      name: file.name, 
      type: file.type, 
      size: file.size 
    })

    // Validate PDF file
    if (!validatePDFFile(file)) {
      console.log('❌ File validation failed')
      return NextResponse.json({ error: 'Invalid PDF file or file too large (max 10MB)' }, { status: 400 })
    }
    console.log('✅ File validation passed')

    // Convert to buffer
    console.log('🔄 Converting file to buffer...')
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    console.log('✅ Buffer created, size:', buffer.length, 'bytes')

    // Extract text from PDF
    console.log('📖 Extracting text from PDF...')
    const rawText = await extractTextFromPDF(buffer)
    
    if (!rawText || rawText.length < 10) {
      console.log('❌ PDF contains no readable text')
      return NextResponse.json({ 
        error: 'PDF appears to be empty, corrupted, or contains no readable text' 
      }, { status: 400 })
    }
    console.log('✅ Text extracted, length:', rawText.length, 'characters')

    // Clean and chunk text
    console.log('🧹 Cleaning and chunking text...')
    const cleanText = cleanExtractedText(rawText)
    const chunks = chunkText(cleanText)
    
    if (chunks.length === 0) {
      console.log('❌ No valid text chunks created')
      return NextResponse.json({ error: 'No valid text content found after processing' }, { status: 400 })
    }
    console.log('✅ Text chunked into', chunks.length, 'pieces')

    // Generate embeddings
    console.log('🤖 Generating embeddings with OpenAI...')
    const embeddings = await generateEmbeddings(chunks)
    console.log('✅ Generated', embeddings.length, 'embeddings')

    // Prepare document chunks for storage
    const fileId = uuidv4()
    const documentChunks = chunks.map((chunk, index) => ({
      id: `${userId}-${fileId}-${index}`,
      userId,
      fileName: file.name,
      chunkIndex: index,
      content: chunk,
      metadata: {
        fileId,
        totalChunks: chunks.length,
        uploadedAt: new Date().toISOString()
      }
    }))

    // Store in vector database
    console.log('💾 Storing embeddings in vector database...')
    await upsertDocumentChunks(documentChunks, embeddings)
    console.log('✅ Vector storage completed')

    // Store metadata in Redis
    console.log('💾 Storing metadata in Redis...')
    const fileMetadata = {
      fileName: file.name,
      fileId,
      chunksCount: chunks.length,
      uploadedAt: new Date().toISOString(),
      textLength: cleanText.length,
      originalSize: file.size
    }

    await redis.set(`file:${userId}:${fileId}`, JSON.stringify(fileMetadata), { 
      ex: 86400 * 30 // 30 days retention
    })

    // Add to user's file list
    const userFilesKey = `files:${userId}`
    await redis.lpush(userFilesKey, fileId)
    console.log('✅ Metadata storage completed')

    console.log('🎉 Upload process completed successfully')

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileId,
      chunksProcessed: chunks.length,
      textLength: cleanText.length,
      originalSize: file.size,
      message: 'PDF processed successfully and ready for queries!'
    })

  } catch (error) {
    console.error('💥 Upload error:', error)
    
    // Detailed error handling
    if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
      const message = (error as any).message as string;

      if (message.includes('ENOENT')) {
        return NextResponse.json({ 
          error: 'File processing error. Please try uploading the PDF again.' 
        }, { status: 400 })
      }
      
      if (message.includes('pdf-parse') || message.includes('PDF')) {
        return NextResponse.json({ 
          error: 'Failed to parse PDF. The file might be corrupted, password-protected, or contain only images.' 
        }, { status: 400 })
      }

      if (message.includes('OpenAI') || message.includes('embeddings')) {
        return NextResponse.json({ 
          error: 'Failed to generate embeddings. Please try again.' 
        }, { status: 500 })
      }

      return NextResponse.json({ 
        error: `Processing failed: ${message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      error: 'Processing failed due to an unknown error.' 
    }, { status: 500 })
  }
}

export const maxDuration = 60 // 60 seconds for large PDF processing
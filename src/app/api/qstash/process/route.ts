import { NextRequest, NextResponse } from 'next/server'
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'
import { extractTextFromPDF, cleanExtractedText } from '@/lib/pdf'
import { chunkText, generateEmbeddings } from '@/lib/embeddings'
import { upsertDocumentChunks } from '@/lib/vector'
import { redis } from '@/lib/redis'

async function handler(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, fileName, blobUrl } = body

    // Download PDF from blob storage
    const pdfResponse = await fetch(blobUrl)
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer())

    // Extract and clean text
    const rawText = await extractTextFromPDF(pdfBuffer)
    const cleanText = cleanExtractedText(rawText)

    // Chunk the text
    const chunks = chunkText(cleanText)

    // Generate embeddings
    const embeddings = await generateEmbeddings(chunks)

    // Prepare document chunks
    const documentChunks = chunks.map((chunk, index) => ({
      id: `${userId}-${fileName}-${index}`,
      userId,
      fileName,
      chunkIndex: index,
      content: chunk,
      metadata: {
        totalChunks: chunks.length
      }
    }))

    // Store in vector database
    await upsertDocumentChunks(documentChunks, embeddings)

    // Update processing status in Redis
    await redis.set(`processing:${userId}:${fileName}`, 'completed', { ex: 3600 })

    return NextResponse.json({ 
      success: true, 
      chunksProcessed: chunks.length 
    })

  } catch (error) {
    console.error('QStash processing error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

export const POST = verifySignatureAppRouter(handler)
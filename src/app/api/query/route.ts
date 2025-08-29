import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { generateEmbeddings } from '@/lib/embeddings'
import { searchSimilarChunks } from '@/lib/vector'
import { getCachedEmbedding, cacheEmbedding, rateLimitUser } from '@/lib/redis'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const allowed = await rateLimitUser(userId, 20, 60) // 20 queries per minute
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const { query } = await request.json()

    // Check for cached query embedding
    const cacheKey = `embed:${query}`
    let queryEmbedding = await getCachedEmbedding(cacheKey)
    
    if (!queryEmbedding) {
      const embeddings = await generateEmbeddings([query])
      queryEmbedding = embeddings[0]
      await cacheEmbedding(cacheKey, queryEmbedding)
    }

    // Search for similar chunks
    const searchResults = await searchSimilarChunks(queryEmbedding, userId, 5)
    
    if (searchResults.length === 0) {
      return NextResponse.json({ 
        error: 'No relevant documents found. Please upload a PDF first.' 
      }, { status: 404 })
    }

    // Prepare context from search results
    const context = searchResults
      .map(result => result.metadata?.content ?? '')
      .join('\n\n')

    // Generate streaming response
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that answers questions based on the provided document context. Only use information from the context provided.'
        },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion: ${query}`
        }
      ],
      stream: true,
    })

    //@ts-ignore
    const stream = OpenAIStream(response)
    return new StreamingTextResponse(stream)

  } catch (error) {
    console.error('Query error:', error)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }
}
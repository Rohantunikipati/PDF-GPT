import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { generateEmbeddings } from '@/lib/embeddings'
import { searchSimilarChunks } from '@/lib/vector'
import { getCachedEmbedding, cacheEmbedding, rateLimitUser } from '@/lib/redis'
import OpenAI from 'openai'

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    console.log('=== Query Started ===')

    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limiting
    const allowed = await rateLimitUser(userId, 20, 60)
    if (!allowed) return NextResponse.json({ error: 'Too many queries.' }, { status: 429 })

    const { query } = await request.json()
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Please provide a valid question' }, { status: 400 })
    }

    console.log('📝 Query received:', query.substring(0, 100) + '...')

    // Cached embedding
    const cacheKey = `embed:query:${Buffer.from(query).toString('base64').substring(0, 50)}`
    let queryEmbedding = await getCachedEmbedding(cacheKey)

    if (!queryEmbedding) {
      console.log('🤖 Generating query embedding...')
      const embeddings = await generateEmbeddings([query])
      queryEmbedding = embeddings[0]
      await cacheEmbedding(cacheKey, queryEmbedding, 1800) // 30 min
      console.log('✅ Query embedding cached')
    } else {
      console.log('✅ Using cached embedding')
    }

    // Search for relevant chunks
    console.log('🔍 Searching for similar content...')
    const searchResults = await searchSimilarChunks(queryEmbedding, userId, 5)
    if (searchResults.length === 0) 
      return NextResponse.json({ error: 'No relevant documents found.' }, { status: 404 })

    // Build context
    type Metadata = { fileName: string; chunkIndex: number; content: string }
    const context = searchResults
      .map(r => {
        const m = r.metadata as Metadata
        const score = r.score || 0
        return m
          ? `[Document: ${m.fileName}, Chunk ${m.chunkIndex + 1}, Relevance: ${(score * 100).toFixed(1)}%]\n${m.content}`
          : `No content available.`
      })
      .join('\n\n---\n\n')

    console.log('📄 Context length:', context.length)

    // OpenRouter text generation
    console.log('🤖 Generating AI response via OpenRouter...')
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o:extended", // or gpt-3.5-turbo
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant. Answer concisely based on the context below. Cite document chunks when relevant.`
        },
        {
          role: "user",
          content: `Context:
${context}

Question:
${query}`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
      stream: false,
    })

    const aiText = completion.choices?.[0]?.message?.content || 'Sorry, no response was generated.'
    
    console.log(aiText)

    return NextResponse.json({ response: aiText })

  } catch (error) {
    console.error('💥 Query error:', error)
    return NextResponse.json({ error: 'Query processing failed.' }, { status: 500 })
  }
}

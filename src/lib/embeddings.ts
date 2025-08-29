import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: texts,
  })

  return response.data.map(item => item.embedding)
}

export function chunkText(text: string, maxChunkSize = 1000, overlap = 100): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    let end = start + maxChunkSize
    
    // Find the last complete sentence within the chunk
    if (end < text.length) {
      const lastSentence = text.lastIndexOf('.', end)
      if (lastSentence > start + maxChunkSize * 0.5) {
        end = lastSentence + 1
      }
    }
    
    chunks.push(text.slice(start, end).trim())
    start = Math.max(start + maxChunkSize - overlap, end)
  }
  
  return chunks.filter(chunk => chunk.length > 50) // Filter out tiny chunks
}
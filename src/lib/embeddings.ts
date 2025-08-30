import OpenAI from 'openai'

import { InferenceClient } from "@huggingface/inference"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const hf = new InferenceClient(process.env.HF_API_KEY!);

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // Process in batches to avoid rate limits
  const batchSize = 100
  const allEmbeddings: number[][] = []

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    
    // const response = await openai.embeddings.create({
    //   model: "text-embedding-3-small",
    //   input: batch,
    // })

    const response = await hf.featureExtraction({
      model:process.env.HUGGINGFACE_MODEL,
      inputs:batch
    })

    console.log(response)

    // response is an array of embeddings (number[]), or a single embedding (number[])
    const batchEmbeddings = Array.isArray(response[0])
      ? response as number[][]
      : [response as number[]];
    allEmbeddings.push(...batchEmbeddings)
  }

  return allEmbeddings
}

export function chunkText(text: string, maxChunkSize = 1000, overlap = 100): string[] {
  if (!text || text.length === 0) return []
  
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    let end = start + maxChunkSize
    
    // Find the last complete sentence within the chunk
    if (end < text.length) {
      const lastSentence = text.lastIndexOf('.', end)
      const lastNewline = text.lastIndexOf('\n', end)
      const lastSpace = text.lastIndexOf(' ', end)
      
      // Use the best breaking point
      const breakPoint = Math.max(lastSentence, lastNewline, lastSpace)
      if (breakPoint > start + maxChunkSize * 0.5) {
        end = breakPoint + (breakPoint === lastSentence ? 1 : 0)
      }
    }
    
    const chunk = text.slice(start, end).trim()
    if (chunk.length > 50) { // Only keep meaningful chunks
      chunks.push(chunk)
    }
    
    start = Math.max(start + maxChunkSize - overlap, end)
  }
  
  return chunks
}
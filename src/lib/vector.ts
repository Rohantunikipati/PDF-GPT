import { Index } from '@upstash/vector'

export const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
})

export interface DocumentChunk {
  id: string
  userId: string
  fileName: string
  chunkIndex: number
  content: string
  metadata: {
    fileId: string
    totalChunks: number
    uploadedAt: string
  }
}

export async function upsertDocumentChunks(
  chunks: DocumentChunk[], 
  embeddings: number[][]
) {
  const vectors = chunks.map((chunk, i) => ({
    id: chunk.id,
    vector: embeddings[i],
    metadata: {
      userId: chunk.userId,
      fileName: chunk.fileName,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      ...chunk.metadata
    }
  }))

  // Upsert in batches to avoid rate limits
  const batchSize = 100
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize)
    await vectorIndex.upsert(batch)
  }
}

export async function searchSimilarChunks(
  queryEmbedding: number[],
  userId: string,
  topK = 5
) {
  const results = await vectorIndex.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
    filter: `userId = '${userId}'`
  })

  return results
}

export async function deleteFileChunks(userId: string, fileId: string) {
  // Get all chunks for this file
  const results = await vectorIndex.query({
    vector: new Array(1536).fill(0), // Dummy vector for search
    topK: 1000, // Get many results
    includeMetadata: true,
    filter: `userId = '${userId}' AND fileId = '${fileId}'`
  })

  // Delete each chunk
  const chunkIds = results.map(result => result.id)
  const numericChunkIds = chunkIds.filter(id => typeof id === 'number') as number[]
  if (numericChunkIds.length > 0) {
    await vectorIndex.delete(numericChunkIds)
  }

  return chunkIds.length
}
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
    page?: number
    totalChunks: number
  }
}

export async function upsertDocumentChunks(
  chunks: DocumentChunk[], 
  embeddings: number[][]
) {
  const vectors = chunks.map((chunk, i) => ({
    id: chunk.id,
    vector: embeddings[i],
    metadata: chunk
  }))

  await vectorIndex.upsert(vectors)
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
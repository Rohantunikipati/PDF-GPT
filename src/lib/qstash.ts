import { Client } from '@upstash/qstash'

export const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
})

export async function publishPDFProcessingJob(
  userId: string,
  fileName: string,
  blobUrl: string
) {
  const payload = {
    userId,
    fileName,
    blobUrl,
    timestamp: Date.now()
  }

  const response = await qstash.publishJSON({
    url: `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/qstash/process`,
    body: payload,
    delay: 1, // 1 second delay to ensure blob is ready
  })

  return response.messageId
}
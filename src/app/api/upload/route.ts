import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { put } from '@vercel/blob'
import { publishPDFProcessingJob } from '@/lib/qstash'
import { rateLimitUser } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    // 🔐 Auth
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 🚦 Rate limiting (5 uploads / 5 minutes)
    const allowed = await rateLimitUser(userId, 5, 300)
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    // 📂 Extract file
    const formData = await request.formData()
    const file = formData.get('pdf') as File
    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid PDF file' }, { status: 400 })
    }

    // 🧹 Clean filename (avoid weird characters)
    const safeName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '')

    // 📦 Convert to Buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // ☁️ Upload to Vercel Blob (public) 
    // @ts-ignore
    const blob = await put(safeName, buffer, {
      access: 'public',
      addRandomSuffix: true,
    })

    // ⏳ Queue background processing job
    const jobId = await publishPDFProcessingJob(userId, safeName, blob.url)

    return NextResponse.json({
      success: true,
      fileName: safeName,
      blobUrl: blob.url,   // 🔗 public URL
      path: blob.pathname, // useful if later making private blobs
      jobId,
    })
  } catch (error: any) {
    console.error('❌ Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}

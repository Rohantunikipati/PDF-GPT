import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { put } from '@vercel/blob'
import { publishPDFProcessingJob } from '@/lib/qstash'
import { rateLimitUser } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    // 🔐 Clerk Auth
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 🚦 Rate limiting: 5 uploads / 5 minutes
    const allowed = await rateLimitUser(userId, 5, 300)
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    // 📂 Extract file from formData
    const formData = await request.formData()
    const file = formData.get('pdf') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    // 🧹 Clean filename (avoid spaces/special chars)
    const safeName = file.name
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_.-]/g, '')

    // 📦 Convert File → Buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // ☁️ Upload to Vercel Blob
    // @ts-ignore
    const blob = await put(safeName, buffer, {
      access: 'public',
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN, // ✅ Required for local
    })

    // ⏳ Queue background processing
    const jobId = await publishPDFProcessingJob(userId, safeName, blob.url)

    return NextResponse.json({
      success: true,
      fileName: safeName,
      blobUrl: blob.url,   // Public link
      path: blob.pathname, // Optional internal path
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

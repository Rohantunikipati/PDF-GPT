'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

export default function UploadForm() {
  const { user } = useUser()
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    const formData = new FormData(e.currentTarget)
    const file = formData.get('pdf') as File

    if (!file) return

    setUploading(true)
    setStatus('Uploading...')

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setStatus('PDF uploaded! Processing in background...')
      } else {
        setStatus(`Error: ${result.error}`)
      }
    } catch (error) {
      setStatus('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Upload PDF</h2>
      
      <form onSubmit={handleUpload}>
        <div className="mb-4">
          <input
            type="file"
            name="pdf"
            accept=".pdf"
            required
            className="w-full p-2 border border-gray-300 rounded"
            disabled={uploading}
          />
        </div>
        
        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload PDF'}
        </button>
      </form>

      {status && (
        <p className="mt-4 text-sm text-gray-600">{status}</p>
      )}
    </div>
  )
}
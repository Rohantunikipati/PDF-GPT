'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

interface UploadResult {
  success: boolean
  fileName: string
  fileId: string
  chunksProcessed: number
  textLength: number
  originalSize: number
  message: string
}

export default function UploadForm({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const { user } = useUser()
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<UploadResult | null>(null)

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    const formData = new FormData(e.currentTarget)
    const file = formData.get('pdf') as File

    if (!file) {
      setStatus('Please select a PDF file')
      return
    }

    setUploading(true)
    setStatus('Uploading and processing PDF...')
    setResult(null)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        setStatus('')
        onUploadComplete?.()
        
        // Reset form
        // e.currentTarget.reset()
      } else {
        setStatus(`Error: ${data.error}`)
        setResult(null)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setResult(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Upload PDF Document</h2>
      
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select PDF File
          </label>
          <input
            type="file"
            name="pdf"
            accept=".pdf"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={uploading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum file size: 10MB
          </p>
        </div>
        
        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {uploading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing PDF...
            </span>
          ) : (
            'Upload PDF'
          )}
        </button>
      </form>

      {/* Status Messages */}
      {status && (
        <div className={`mt-4 p-3 rounded-lg ${status.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
          <p className="text-sm">{status}</p>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h3 className="font-medium text-green-800">Upload Successful!</h3>
          </div>
          <div className="text-sm text-green-700 space-y-1">
            <p><strong>File:</strong> {result.fileName}</p>
            <p><strong>Processed:</strong> {result.chunksProcessed} text chunks</p>
            <p><strong>Content:</strong> {result.textLength.toLocaleString()} characters</p>
            <p className="text-green-600 font-medium">{result.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
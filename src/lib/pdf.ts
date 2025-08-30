"use server"

import pdf from 'pdf-parse'

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Validate input
    if (!Buffer.isBuffer(buffer)) {
      throw new Error('Invalid input: expected Buffer')
    }

    if (buffer.length === 0) {
      throw new Error('Empty PDF buffer')
    }

    console.log('Processing PDF buffer of size:', buffer.length)

    const data = await pdf(buffer, {
      max: 0, // No page limit
      version: 'v1.10.100' // Specify version for consistency
    })
    
    if (!data.text) {
      throw new Error('No text content found in PDF')
    }

    console.log('Extracted text length:', data.text.length)
    return data.text
    
  } catch (error) {
    console.error('PDF parsing error:', error)
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    throw new Error(`Failed to extract text from PDF: ${errorMessage}`)
  }
}

export function cleanExtractedText(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }
  
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n\s*\n/g, '\n') // Remove extra newlines
    .replace(/[^\x20-\x7E\n\r\t]/g, '') // Keep only printable ASCII + newlines
    .replace(/(.)\1{4,}/g, '$1$1$1') // Remove excessive repetition
    .trim()
}

export function validatePDFFile(file: File): boolean {
  // Check file type
  if (file.type !== 'application/pdf') {
    return false
  }
  
  // Check file size (max 10MB)
  if (file.size === 0 || file.size > 10 * 1024 * 1024) {
    return false
  }
  
  return true
}

export function getFileSizeString(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
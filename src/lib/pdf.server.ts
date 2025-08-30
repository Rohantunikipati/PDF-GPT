"use server"

import pdf from 'pdf-parse'

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    if (!Buffer.isBuffer(buffer)) {
      throw new Error('Invalid input: expected Buffer')
    }
    if (buffer.length === 0) {
      throw new Error('Empty PDF buffer')
    }

    console.log('Processing PDF buffer of size:', buffer.length)

    const data = await pdf(buffer, {
      max: 0,
      version: 'v1.10.100'
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

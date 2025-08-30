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
  if (file.type !== 'application/pdf') {
    return false
  }
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

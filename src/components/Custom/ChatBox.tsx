'use client'

import { useState, useRef, useEffect } from 'react'

export default function ChatBox() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string; id: string }[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setError(null)
    const userMessage: { role: 'user' | 'ai'; content: string; id: string } = { role: 'user', content: input, id: crypto.randomUUID() }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get response')

      const aiMessage: { role: 'user' | 'ai'; content: string; id: string } = { role: 'ai', content: data.response || 'No response', id: crypto.randomUUID() }
      setMessages(prev => [...prev, aiMessage])
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
      setInput('')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Chat with your Documents</h2>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto mb-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-500 text-center">
            <p>Ready to help! Upload a PDF and start asking questions.</p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}
              >
                <div className="flex items-center mb-1 text-xs font-medium opacity-75">
                  {msg.role === 'user' ? 'You' : 'AI Assistant'}
                </div>
                <div className="text-sm">
  {msg.role === 'ai' ? (
    <div
      className="prose max-w-full"
      dangerouslySetInnerHTML={{
        __html: msg.content
          // Convert **bold** to <strong>
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          // Convert numbered lists "1. " to <ol><li>
          .replace(/^\d+\.\s.+$/gm, match => `<li>${match.replace(/^\d+\.\s/, '')}</li>`)
          .replace(/(<li>.*<\/li>)/g, '<ol>$1</ol>')
          // Convert bullet points "- " to <ul><li>
          .replace(/^- .+$/gm, match => `<li>${match.replace(/^- /, '')}</li>`)
          .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
          // Convert line breaks to <br>
          .replace(/\n/g, '<br />')
      }}
    />
  ) : (
    <div className="whitespace-pre-wrap">{msg.content}</div>
  )}
</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-bl-none max-w-[80%]">
                <div className="flex items-center mb-1 text-xs font-medium text-gray-600">AI Assistant</div>
                <div className="text-sm text-gray-500">Thinking...</div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question about your documents..."
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

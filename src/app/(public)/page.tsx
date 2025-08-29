import { SignInButton, SignUpButton } from '@clerk/nextjs'

export default function HomePage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Chat with Your PDFs
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Upload your documents and ask questions. Get instant answers powered by AI.
          </p>
          
          <div className="space-x-4">
            <SignUpButton mode="modal">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                Get Started
              </button>
            </SignUpButton>
            
            <SignInButton mode="modal">
              <button className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </div>
    </div>
  )
}
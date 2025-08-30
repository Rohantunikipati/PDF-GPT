import { requireAuth } from '@/lib/auth'
import UploadForm from '@/components/Custom/UploadForm' 
import ChatBox from '@/components/Custom/ChatBox' 
import FileList from '@/components/Custom/FileList' 
import AuthButtons from '@/components/Custom/AuthButtons' 

export default async function DashboardPage() {
  await requireAuth() // Ensures user is authenticated

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
              </svg>
              <span className="text-xl font-bold text-gray-900">PDF Chat</span>
            </div>
            <AuthButtons />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to your AI Assistant</h1>
          <p className="text-gray-600">Upload PDFs and start chatting with your documents</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & Files */}
          <div className="lg:col-span-1 space-y-6">
            <UploadForm />
            <FileList />
          </div>
          
          {/* Right Column - Chat */}
          <div className="lg:col-span-2">
            <ChatBox />
          </div>
        </div>
      </div>
    </div>
  )
}
import UploadForm from '@/components/Custom/UploadForm' 
import ChatBox from '@/components/Custom/ChatBox' 

export default async function DashboardPage() {// Ensures user is authenticated

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Your PDF Assistant
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UploadForm />
          <ChatBox />
        </div>
      </div>
    </div>
  )
}
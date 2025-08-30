import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs'

export default function AuthButtons() {
  const { userId } = auth()

  if (userId) {
    return (
      <div className="flex items-center space-x-4">
        <UserButton afterSignOutUrl="/" />
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <SignInButton mode="modal">
        <button className="text-gray-600 hover:text-gray-900 font-medium">
          Sign In
        </button>
      </SignInButton>
      
      <SignUpButton mode="modal">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
          Get Started
        </button>
      </SignUpButton>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { getData, saveData } from '../utils/localStorage'

function Login({ onLogin }) {
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')

  useEffect(() => {
    const allUsers = getData('users') || []
    setUsers(allUsers)
    if (allUsers.length > 0) {
      setSelectedUserId(allUsers[0].id)
    }
  }, [])

  const handleLogin = () => {
    const user = users.find(u => u.id == selectedUserId)
    if (user) {
      saveData('currentUser', user)
      onLogin(user)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          MiningSense Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Select your user account to continue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <label htmlFor="user" className="block text-sm font-medium text-gray-700">
                Select User
              </label>
              <select
                id="user"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.role} {user.assignedSite ? `(Site ${user.assignedSite})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button
                onClick={handleLogin}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
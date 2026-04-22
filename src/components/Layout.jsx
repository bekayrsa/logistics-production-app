import { useState, useEffect } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { getData, saveData } from '../utils/localStorage'

function Layout({ currentUser, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const savedDarkMode = getData('darkMode') || false
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    saveData('darkMode', newDarkMode)
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleLogout = () => {
    saveData('currentUser', null)
    onLogout()
  }

  const getMenuItems = () => {
    const role = currentUser?.role
    const baseItems = [
      { to: '/dashboard', label: 'Dashboard' },
    ]

    if (role === 'admin') {
      return [
        ...baseItems,
        { to: '/admin-data', label: 'Data Management' },
        { to: '/projects', label: 'Projects' },
        { to: '/mines', label: 'Mines' },
        { to: '/sites', label: 'Sites' },
        { to: '/site-performance', label: 'Site Performance' },
        { to: '/trucks', label: 'Trucks' },
        { to: '/capture', label: 'Capture' },
        { to: '/reports', label: 'Reports' },
        { to: '/users', label: 'Users' },
      ]
    } else if (role === 'manager') {
      return [
        ...baseItems,
        { to: '/reports', label: 'Reports' },
        { to: '/site-performance', label: 'Site Performance' },
      ]
    } else if (role === 'siteManager') {
      return [
        ...baseItems,
        { to: '/capture', label: 'Capture' },
        { to: '/reports', label: 'Reports' },
      ]
    }
    return baseItems
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Demo Mode Banner */}
      <div className="bg-green-100 dark:bg-green-900/50 border-b border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 px-6 py-2 text-center text-sm font-semibold">
        🎯 Demo Mode: Demo Mining Logistics
      </div>

      {/* Top Navbar */}
      <nav className="bg-blue-600 dark:bg-blue-800 text-white px-6 py-4 shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Production Management</h1>
          <div className="flex items-center space-x-4">
            <button onClick={toggleDarkMode} className="p-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-900">
              {darkMode ? '☀️' : '🌙'}
            </button>
            <div className="hidden md:flex items-center space-x-4">
              <span>{currentUser?.name} ({currentUser?.role})</span>
              <button onClick={handleLogout} className="hover:underline">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:mt-0`}>
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Menu</h2>
          </div>
          <nav className="mt-4">
            {getMenuItems().map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 lg:ml-0">
          <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 shadow lg:hidden">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-600 dark:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Dashboard</h2>
            <div></div>
          </header>
          <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Layout
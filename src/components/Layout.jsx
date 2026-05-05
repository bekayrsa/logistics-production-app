import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, Shield, Database, WifiOff, Sun, Moon } from 'lucide-react'
import { getData, saveData } from '../utils/localStorage'
import { APP_MODE } from '../config'
import { dataService } from '../lib/dataService'

function Layout({ currentUser, onLogout, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)
  const [darkMode, setDarkMode] = useState(false)
  const [isConnected, setIsConnected] = useState(true)

  const location = useLocation()

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024
      setIsDesktop(desktop)
      if (desktop) setSidebarOpen(true)
      else setSidebarOpen(false)
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Set initial state
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const savedDarkMode = getData('darkMode') || false
    setDarkMode(savedDarkMode)

    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    const unsub = dataService.onConnectionChange((status) => {
      setIsConnected(status)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    // Close sidebar on route change for mobile
    if (!isDesktop) {
      setSidebarOpen(false)
    }
  }, [location.pathname, isDesktop])

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    saveData('darkMode', next)

    if (next) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleLogout = () => {
    saveData('currentUser', null)
    if (onLogout) onLogout()
  }

  const handleSwitchToDemo = () => {
    localStorage.setItem('APP_MODE', 'demo')
    window.location.reload()
  }

  const getMenuItems = () => {
    const role = currentUser?.role
    const items = []

    if (role === 'admin') {
      items.push(
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/capture', label: 'Daily Capture', icon: '📝' },
        { path: '/reports', label: 'Reports', icon: '📈' },
        { path: '/projects', label: 'Projects', icon: '📁' },
        { path: '/mines', label: 'Mines', icon: '⛏️' },
        { path: '/sites', label: 'Sites', icon: '🏭' },
        { path: '/trucks', label: 'Trucks', icon: '🚛' },
        { path: '/users', label: 'Users', icon: '👥' },
        { path: '/site-performance', label: 'Performance', icon: '📍' },
        { path: '/admin-data', label: 'Data Management', icon: '⚙️' },
        { path: '/settings', label: 'Settings', icon: '🔧' }
      )
    } else if (role === 'manager') {
      items.push(
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/reports', label: 'Reports', icon: '📈' },
        { path: '/site-performance', label: 'Site Performance', icon: '🏭' }
      )
    } else if (role === 'siteManager') {
      items.push(
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/capture', label: 'Daily Capture', icon: '📝' },
        { path: '/reports', label: 'Reports', icon: '📈' }
      )
    }

    return items
  }

  const menuItems = getMenuItems()
  const isActive = path => location.pathname === path
  const pageTitle = menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 font-sans overflow-hidden">
      {/* Mobile Overlay */}
      {!isDesktop && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 transform 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          ${isDesktop ? 'relative translate-x-0' : ''} 
          flex flex-col shadow-2xl lg:shadow-lg`}
      >
        {/* Brand */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              PM
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Production</h1>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 font-black">Management</p>
            </div>
          </div>
          {!isDesktop && (
            <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Mode Indicator Badge */}
        <div className="px-6 py-4">
          <div className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
            APP_MODE === 'demo' 
              ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-500' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-500'
          }`}>
            {APP_MODE === 'demo' ? <Database size={12} /> : <Shield size={12} />}
            <span>{APP_MODE === 'demo' ? 'Demo Mode' : 'Live Mode'}</span>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className={`text-xl transition-transform group-hover:scale-110 ${isActive(item.path) ? 'scale-110' : ''}`}>{item.icon}</span>
              <span className="font-semibold">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Panel */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-tighter mb-1">User Profile</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{currentUser?.name}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium capitalize">{currentUser?.role}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={toggleDarkMode}
              className="flex items-center justify-center p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header Bar */}
        {!isDesktop && (
          <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">PM</div>
              <span className="font-bold text-sm dark:text-white">Logistics</span>
            </div>
            <div className="w-10"></div> {/* Spacer for symmetry */}
          </header>
        )}

        {/* Connection Failure Header Banner */}
        {!isConnected && APP_MODE === 'live' && (
          <div className="bg-red-600 text-white px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg z-50">
            <div className="flex items-center space-x-3">
              <WifiOff size={18} className="animate-pulse" />
              <span className="font-bold text-xs sm:text-sm text-center sm:text-left">
                Cloud Connection Lost. Production data cannot be saved.
              </span>
            </div>
            <button 
              onClick={handleSwitchToDemo}
              className="bg-white text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase hover:bg-red-50 transition-colors shadow-sm whitespace-nowrap"
            >
              Switch to Demo Mode
            </button>
          </div>
        )}

        {/* Header (Desktop Only) */}
        {isDesktop && (
          <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-6 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  {pageTitle}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </header>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children ? children : <Outlet />}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Layout
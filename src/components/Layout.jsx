// (RS) Logistics Production App
import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { 
  Menu, X, LogOut, Shield, Database, WifiOff, Sun, Moon, 
  LayoutDashboard, ClipboardList, BarChart3, LineChart, 
  Map, Truck, Users, Settings, Activity, Layers, Package
} from 'lucide-react'
import { getData, saveData } from '../utils/localStorage'
import { APP_MODE } from '../config'
import { dataService } from '../lib/dataService'

function Layout({ currentUser, onLogout, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)
  const [darkMode, setDarkMode] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const [briefings, setBriefings] = useState([])

  const location = useLocation()

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024
      setIsDesktop(desktop)
      if (desktop) setSidebarOpen(true)
      else setSidebarOpen(false)
    }

    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const savedDarkMode = getData('darkMode') || false
    setDarkMode(savedDarkMode)
    if (savedDarkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [])

  useEffect(() => {
    const unsub = dataService.onConnectionChange(setIsConnected)
    const unsubBriefings = dataService.subscribeToBriefings(setBriefings)
    return () => {
      unsub()
      unsubBriefings()
    }
  }, [])

  useEffect(() => {
    if (!isDesktop) setSidebarOpen(false)
  }, [location.pathname, isDesktop])

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    saveData('darkMode', next)
    if (next) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }

  const handleLogout = () => {
    saveData('currentUser', null)
    if (onLogout) onLogout()
  }
  const getNavigationGroups = () => {
    const role = currentUser?.role
    const groups = []
    const isSuperAdmin = currentUser?.email === 'boiketloramaobi@gmail.com' || currentUser?.email === 'boiketloramoabi@gmail.com';
    const isCompanyAdmin = role === 'admin';
    const isCompanyManager = role === 'manager';
    const isSiteManager = role === 'siteManager';

    // Operations Group
    const operations = {
      title: 'Operations',
      items: [
        { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/capture', label: 'Live Capture', icon: ClipboardList, roles: ['admin', 'siteManager'] },
      ].filter(i => isSuperAdmin || !i.roles || i.roles.includes(role))
    }
    groups.push(operations)

    // Intelligence Group
    const relevantOpenCount = isSiteManager
      ? briefings.filter(b => b.status === 'open' && (Array.isArray(currentUser.assignedSites) ? currentUser.assignedSites.includes(b.siteId) : Number(b.siteId) === Number(currentUser.assignedSite))).length
      : briefings.filter(b => b.status === 'open').length

    const intelligence = {
      title: 'Intelligence',
      items: [
        { path: '/site-performance', label: 'Performance', icon: Activity },
        { path: '/reports', label: 'Analytics', icon: LineChart, badge: relevantOpenCount },
      ]
    }
    groups.push(intelligence)

    // Infrastructure Group (Admin Only)
    if (isSuperAdmin || isCompanyAdmin) {
      const infrastructure = {
        title: 'Infrastructure',
        items: [
          { path: '/sites', label: 'Sites', icon: Map },
          { path: '/trucks', label: 'Fleet', icon: Truck },
          { path: '/projects', label: 'Projects', icon: Layers },
          { path: '/users', label: 'Personnel', icon: Users },
          { path: '/admin-data', label: 'Master Data', icon: Database, roles: ['superAdmin'] },
        ].filter(i => isSuperAdmin || !i.roles || (i.roles.includes('superAdmin') && isSuperAdmin))
      }
      groups.push(infrastructure)
    }

    // System Group
    const system = {
      title: 'System',
      items: [
        { path: '/settings', label: 'Settings', icon: Settings },
      ]
    }
    groups.push(system)

    return groups
  }

  const navGroups = getNavigationGroups()
  const isActive = path => location.pathname === path
  
  // Find current active item label for header
  let activeItemLabel = 'Dashboard'
  navGroups.forEach(g => {
    const item = g.items.find(i => i.path === location.pathname)
    if (item) activeItemLabel = item.label
  })

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden transition-colors duration-500">
      {/* Mobile Overlay */}
      {!isDesktop && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 z-40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-500 ease-in-out transform 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          ${isDesktop ? 'relative translate-x-0' : ''} 
          flex flex-col shadow-2xl lg:shadow-none`}
      >
        {/* Brand Header */}
        <div className="p-8 pb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-600/30 ring-4 ring-blue-600/10">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">PRODUCTION</h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-blue-600 font-black mt-1">Management Pro</p>
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
          {navGroups.map(group => (
            <div key={group.title} className="space-y-2">
              <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map(item => {
                  const Icon = item.icon
                  const active = isActive(item.path)
                  return (
                     <Link
                       key={item.path}
                       to={item.path}
                       className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group ${
                         active
                           ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                           : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                       }`}
                     >
                       <div className="flex items-center space-x-3">
                         <Icon size={20} className={`transition-transform duration-500 group-hover:scale-110 ${active ? 'scale-110' : ''}`} />
                         <span className="font-bold text-sm tracking-tight">{item.label}</span>
                       </div>
                       {item.badge > 0 && (
                         <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${active ? 'bg-white text-blue-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'}`}>
                           {item.badge}
                         </span>
                       )}
                     </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Panel */}
        <div className="p-6 mt-auto">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 transition-all">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <Users size={18} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Authenticated</p>
                <p className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">
                  {currentUser?.name} {currentUser?.surname}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={toggleDarkMode}
                className="flex items-center justify-center py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all text-slate-600 dark:text-slate-400"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center py-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-100 transition-all border border-rose-100 dark:border-rose-900/30"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Navbar */}
        {!isDesktop && (
          <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Package size={16} />
              </div>
              <span className="font-black text-sm tracking-tighter dark:text-white">PRODUCTION</span>
            </div>
            <div className="w-10"></div>
          </header>
        )}

        {/* Global Connectivity Banner */}
        {!isConnected && APP_MODE === 'live' && (
          <div className="bg-rose-600 text-white px-8 py-3 flex items-center justify-between animate-in slide-in-from-top duration-500 z-50">
            <div className="flex items-center space-x-3">
              <WifiOff size={18} className="animate-pulse" />
              <p className="text-xs font-black uppercase tracking-widest">Connection Offline • Sync Paused</p>
            </div>
          </div>
        )}

        {/* Desktop Header */}
        {isDesktop && (
          <header className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-12 py-8 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-1">Intelligence Console</p>
                <h2 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter transition-all">
                  {activeItemLabel}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-2">Current Session</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-300">
                  {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </header>
        )}

        {/* Content Viewport */}
        <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-950/50">
          <div className="max-w-7xl mx-auto p-6 sm:p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children ? children : <Outlet />}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Layout

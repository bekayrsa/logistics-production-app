import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Mines from './pages/Mines'
import Sites from './pages/Sites'
import SitePerformance from './pages/SitePerformance'
import Trucks from './pages/Trucks'
import Capture from './pages/Capture'
import Reports from './pages/Reports'
import Users from './pages/Users'
import AdminDataManagement from './pages/AdminDataManagement'
import { loadDemoData } from './utils/demoData'
import { getData } from './utils/localStorage'

function App() {
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    // Auto-load demo data on first visit or version change
    const demoVersion = getData('demoVersion')
    const CURRENT_VERSION = '4' // Increment this to force reload
    if (demoVersion !== CURRENT_VERSION) {
      loadDemoData()
    }

    // Load current user
    const user = getData('currentUser')
    setCurrentUser(user)
  }, [])

  const handleLogin = (user) => {
    setCurrentUser(user)
  }

  const handleLogout = () => {
    setCurrentUser(null)
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <Routes>
      <Route path="/" element={<Layout currentUser={currentUser} onLogout={handleLogout} />}>
        <Route index element={<Dashboard currentUser={currentUser} />} />
        <Route path="dashboard" element={<Dashboard currentUser={currentUser} />} />
        <Route path="admin-data" element={<AdminDataManagement currentUser={currentUser} />} />
        <Route path="projects" element={<Projects currentUser={currentUser} />} />
        <Route path="mines" element={<Mines currentUser={currentUser} />} />
        <Route path="sites" element={<Sites currentUser={currentUser} />} />
        <Route path="site-performance" element={<SitePerformance currentUser={currentUser} />} />
        <Route path="trucks" element={<Trucks currentUser={currentUser} />} />
        <Route path="capture" element={<Capture currentUser={currentUser} />} />
        <Route path="reports" element={<Reports currentUser={currentUser} />} />
        <Route path="users" element={<Users currentUser={currentUser} />} />
      </Route>
    </Routes>
  )
}

export default App
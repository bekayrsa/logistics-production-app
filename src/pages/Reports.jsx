import { useState, useEffect } from 'react'
import { getData } from '../utils/localStorage'

function Reports({ currentUser }) {
  const [captures, setCaptures] = useState([])

  useEffect(() => {
    if (!currentUser) return
    let storedCaptures = getData('captures') || []
    if (currentUser.role === 'siteManager') {
      storedCaptures = storedCaptures.filter(capture => capture.siteId === currentUser.assignedSite)
    }
    setCaptures(storedCaptures)
  }, [currentUser])

  // Summary stats
  const todayTotalLoads = captures.reduce((sum, c) => sum + c.loads, 0)
  const todayTotalTons = captures.reduce((sum, c) => sum + c.tons, 0)
  const uniqueSites = new Set(captures.map(c => c.siteId)).size

  const canView = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'siteManager'

  if (!canView) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return (
    <main className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Production Reports</h1>
        <p className="text-gray-600 dark:text-gray-400">Today's captured production data</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 p-6 rounded-lg shadow border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Total Loads</p>
          <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">{todayTotalLoads}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">loads captured</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 p-6 rounded-lg shadow border border-green-200 dark:border-green-800">
          <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">Total Production</p>
          <p className="text-4xl font-bold text-green-900 dark:text-green-100">{todayTotalTons}</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">tons processed</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 p-6 rounded-lg shadow border border-purple-200 dark:border-purple-800">
          <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">Active Sites</p>
          <p className="text-4xl font-bold text-purple-900 dark:text-purple-100">{uniqueSites}</p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">with data</p>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Site</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Truck</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Loads</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Tons</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {captures.length > 0 ? captures.map(capture => (
              <tr key={capture.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{capture.siteName}</td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{capture.truckName}</td>
                <td className="px-6 py-4 text-sm text-center font-semibold text-blue-600 dark:text-blue-400">{capture.loads}</td>
                <td className="px-6 py-4 text-sm text-center font-semibold text-green-600 dark:text-green-400">{capture.tons}t</td>
                <td className="px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                  {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    <p className="text-lg font-medium">No production data captured yet today</p>
                    <p className="text-sm mt-1">Use the Capture page to log production data</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}

export default Reports
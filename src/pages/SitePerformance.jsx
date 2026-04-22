import { useState, useEffect } from 'react'
import { getData } from '../utils/localStorage'

function SitePerformance({ currentUser }) {
  const [sitePerformance, setSitePerformance] = useState([])

  useEffect(() => {
    if (!currentUser) return
    let sites = getData('sites') || []
    if (currentUser.role === 'siteManager') {
      sites = sites.filter(site => site.id === currentUser.assignedSite)
    }
    const production = getData('production') || []

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    // Calculate performance for each site
    const performance = sites.map(site => {
      const todayProduction = production.find(p => p.siteId === site.id && p.date === today)

      if (todayProduction) {
        return {
          id: site.id,
          siteName: site.siteName,
          mineName: site.mineName,
          resource: site.resource,
          target: site.dailyTarget,
          actual: todayProduction.actual,
          variance: todayProduction.variance,
          status: getPerformanceStatus(todayProduction.variance),
          statusColor: getStatusColor(todayProduction.variance)
        }
      } else {
        // No data for today
        return {
          id: site.id,
          siteName: site.siteName,
          mineName: site.mineName,
          resource: site.resource,
          target: site.dailyTarget,
          actual: 0,
          variance: -100,
          status: 'No Data',
          statusColor: 'bg-gray-100 text-gray-800'
        }
      }
    })

    setSitePerformance(performance)
  }, [currentUser])

  const getPerformanceStatus = (variance) => {
    if (variance >= 0) return 'On Target'
    if (variance >= -10) return 'Below Target'
    return 'Failed Target'
  }

  const getStatusColor = (variance) => {
    if (variance >= 0) return 'bg-green-100 text-green-800'
    if (variance >= -10) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getVarianceIcon = (variance) => {
    if (variance >= 0) return '↑'
    if (variance >= -10) return '→'
    return '↓'
  }

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
      <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white">Site Performance Analytics</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Today's production performance across all sites</p>

      <div className="grid grid-cols-1 gap-4">
        {sitePerformance.map(site => (
          <div key={site.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              {/* Site Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{site.siteName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{site.mineName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs mr-2">
                    {site.resource}
                  </span>
                </p>
              </div>

              {/* Metrics */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Daily Target</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{site.target}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">tons</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Actual Production</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{site.actual}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">tons</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Variance</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-1">
                  {site.variance}%
                  <span className="text-lg">{getVarianceIcon(site.variance)}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">vs target</p>
              </div>

              {/* Status */}
              <div className="flex justify-end">
                <div className={`px-4 py-3 rounded-lg text-center ${site.statusColor}`}>
                  <p className="text-sm font-bold">{site.status}</p>
                  <p className="text-xs mt-1">
                    {site.status === 'On Target' && '✓ Met'}
                    {site.status === 'Below Target' && '⚠ Close'}
                    {site.status === 'Failed Target' && '✗ Miss'}
                    {site.status === 'No Data' && '−'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">On Target Sites</p>
          <p className="text-3xl font-bold text-green-600">
            {sitePerformance.filter(s => s.status === 'On Target').length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Below Target Sites</p>
          <p className="text-3xl font-bold text-yellow-600">
            {sitePerformance.filter(s => s.status === 'Below Target').length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Failed Target Sites</p>
          <p className="text-3xl font-bold text-red-600">
            {sitePerformance.filter(s => s.status === 'Failed Target').length}
          </p>
        </div>
      </div>
    </main>
  )
}

export default SitePerformance

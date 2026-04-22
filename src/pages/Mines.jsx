import { useState, useEffect } from 'react'
import { getData } from '../utils/localStorage'

function Mines({ currentUser }) {
  const [mineSummaries, setMineSummaries] = useState([])

  useEffect(() => {
    const mines = getData('mines') || []
    const sites = getData('sites') || []
    const trucks = getData('trucks') || []
    const production = getData('production') || []

    // Calculate summary for each mine
    const summaries = mines.map(mine => {
      // Total Sites for this mine
      const mineSites = sites.filter(s => s.mineId === mine.id)
      const totalSites = mineSites.length

      // Total Trucks assigned to this mine
      const mineTrucks = trucks.filter(t => {
        return mineSites.some(ms => ms.id === t.siteId)
      })
      const totalTrucks = mineTrucks.length

      // Total Production (tons) for this mine
      const mineProduction = production.filter(p => {
        return mineSites.some(ms => ms.id === p.siteId)
      })
      const totalTons = mineProduction.reduce((sum, p) => sum + p.totalTons, 0)

      // Average Target Achievement %
      let avgAchievement = 0
      if (mineProduction.length > 0) {
        const totalVariance = mineProduction.reduce((sum, p) => sum + p.variance, 0)
        avgAchievement = Math.round(totalVariance / mineProduction.length)
      }

      return {
        id: mine.id,
        name: mine.name,
        operation: mine.operation,
        location: mine.location,
        totalSites,
        totalTrucks,
        totalTons,
        avgAchievement,
        status: avgAchievement >= 0 ? 'On Track' : 'Below Target'
      }
    })

    setMineSummaries(summaries)
  }, [])

  const getStatusColor = (status) => {
    return status === 'On Track' ? 'text-green-600' : 'text-red-600'
  }

  const getAchievementColor = (achievement) => {
    if (achievement >= 5) return 'bg-green-100 text-green-800'
    if (achievement >= 0) return 'bg-blue-100 text-blue-800'
    if (achievement >= -10) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const canView = currentUser?.role === 'admin'

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
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">Mine Summary</h2>

      <div className="grid grid-cols-1 gap-6">
        {mineSummaries.map(mine => (
          <div key={mine.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{mine.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{mine.operation}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">{mine.location}</p>
              </div>
              <div className="flex items-center justify-end">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(mine.status)}`}>
                  {mine.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Sites</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mine.totalSites}</p>
              </div>

              <div className="bg-purple-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Trucks</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{mine.totalTrucks}</p>
              </div>

              <div className="bg-green-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Production (tons)</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{mine.totalTons}</p>
              </div>

              <div className={`p-4 rounded ${getAchievementColor(mine.avgAchievement)}`}>
                <p className="text-sm font-semibold mb-1">Avg Achievement</p>
                <p className="text-2xl font-bold">{mine.avgAchievement}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

export default Mines

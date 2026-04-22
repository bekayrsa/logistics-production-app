import { useState, useEffect } from 'react'
import { getData } from '../utils/localStorage'

function Dashboard({ currentUser }) {
  const [company, setCompany] = useState(null)
  const [kpis, setKpis] = useState({
    totalSites: 0,
    totalMines: 0,
    totalTrucks: 0,
    totalLoadsToday: 0,
    totalTonsToday: 0,
    underperformingSites: 0
  })
  const [sitePerformanceData, setSitePerformanceData] = useState([])
  const [productionTrend, setProductionTrend] = useState([])
  const [comments, setComments] = useState([])
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedSite, setSelectedSite] = useState(null)
  const [commentForm, setCommentForm] = useState({
    type: 'comment',
    content: '',
    priority: 'medium'
  })

  useEffect(() => {
    if (!currentUser) return

    // Load and compute KPIs from seed data
    const companyData = getData('company')
    setCompany(companyData)

    const mines = getData('mines') || []
    const allSites = getData('sites') || []
    const allTrucks = getData('trucks') || []
    const production = getData('production') || []

    // Filter data based on role
    let sites = allSites
    let trucks = allTrucks

    if (currentUser.role === 'siteManager') {
      sites = allSites.filter(site => site.id === currentUser.assignedSite)
      trucks = allTrucks.filter(truck => truck.siteId === currentUser.assignedSite)
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    // Filter today's production data
    const todayProduction = production.filter(p => p.date === today && sites.some(s => s.id === p.siteId))

    // Calculate KPIs
    const totalLoads = todayProduction.reduce((sum, p) => sum + p.loadsPerTruck, 0)
    const totalTons = todayProduction.reduce((sum, p) => sum + p.totalTons, 0)
    const underperforming = todayProduction.filter(p => p.variance < 0).length

    setKpis({
      totalSites: sites.length,
      totalMines: currentUser.role === 'siteManager' ? 1 : mines.length, // For site manager, show 1 mine
      totalTrucks: trucks.length,
      totalLoadsToday: totalLoads,
      totalTonsToday: totalTons,
      underperformingSites: underperforming
    })

    // Get site performance data
    const sitePerf = sites.map(site => {
      const todaySiteProduction = todayProduction.find(p => p.siteId === site.id)
      if (todaySiteProduction) {
        return {
          siteName: site.siteName,
          actual: todaySiteProduction.actual,
          target: todaySiteProduction.target,
          variance: todaySiteProduction.variance,
          status: todaySiteProduction.status
        }
      } else {
        return {
          siteName: site.siteName,
          actual: 0,
          target: site.dailyTarget,
          variance: -100,
          status: 'No Data'
        }
      }
    })
    setSitePerformanceData(sitePerf)

    // Get 7-day production trend
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayProduction = production.filter(p => p.date === dateStr && sites.some(s => s.id === p.siteId))
      const totalTons = dayProduction.reduce((sum, p) => sum + p.totalTons, 0)
      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tons: totalTons
      })
    }
    setProductionTrend(last7Days)
  }, [currentUser])

  const getStatusColor = (status) => {
    if (status === 'On Target') return 'text-green-600'
    if (status === 'Below Target') return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusBgColor = (status) => {
    if (status === 'On Target') return 'bg-green-100 dark:bg-green-900/30'
    if (status === 'Below Target') return 'bg-yellow-100 dark:bg-yellow-900/30'
    return 'bg-red-100 dark:bg-red-900/30'
  }

  const maxTons = Math.max(...productionTrend.map(d => d.tons), 100)

  // Load comments from localStorage
  useEffect(() => {
    const savedComments = getData('comments') || []
    setComments(savedComments)
  }, [])

  const handleCommentSubmit = (e) => {
    e.preventDefault()
    if (!selectedSite || !commentForm.content.trim()) return

    const newComment = {
      id: Date.now(),
      siteId: selectedSite.id,
      type: commentForm.type,
      content: commentForm.content.trim(),
      priority: commentForm.priority,
      author: currentUser.name,
      authorRole: currentUser.role,
      timestamp: new Date().toISOString(),
      resolved: false
    }

    const updatedComments = [...comments, newComment]
    setComments(updatedComments)
    localStorage.setItem('comments', JSON.stringify(updatedComments))

    // Reset form
    setCommentForm({
      type: 'comment',
      content: '',
      priority: 'medium'
    })
    setSelectedSite(null)
    setShowCommentModal(false)
  }

  const toggleResolved = (commentId) => {
    const updatedComments = comments.map(comment =>
      comment.id === commentId ? { ...comment, resolved: !comment.resolved } : comment
    )
    setComments(updatedComments)
    localStorage.setItem('comments', JSON.stringify(updatedComments))
  }

  return (
    <main className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              {company?.name || 'Dashboard'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{company?.description}</p>
          </div>
          <div className="bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 px-4 py-2 rounded-lg">
            <p className="text-sm font-semibold text-green-800 dark:text-green-200">✓ Demo Mode Active</p>
          </div>
        </div>
      </div>

      {/* KPI Cards - Updated Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 p-6 rounded-lg shadow border border-blue-200 dark:border-blue-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Total Sites</p>
              <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">{kpis.totalSites}</p>
            </div>
            <div className="text-3xl">🏭</div>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-4">Across all mines</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-900/10 p-6 rounded-lg shadow border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Total Mines</p>
              <p className="text-4xl font-bold text-indigo-900 dark:text-indigo-100">{kpis.totalMines}</p>
            </div>
            <div className="text-3xl">⛏️</div>
          </div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-4">Active operations</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 p-6 rounded-lg shadow border border-purple-200 dark:border-purple-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">Total Trucks</p>
              <p className="text-4xl font-bold text-purple-900 dark:text-purple-100">{kpis.totalTrucks}</p>
            </div>
            <div className="text-3xl">🚚</div>
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-4">Fleet size</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 p-6 rounded-lg shadow border border-green-200 dark:border-green-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">Loads Today</p>
              <p className="text-4xl font-bold text-green-900 dark:text-green-100">{kpis.totalLoadsToday}</p>
            </div>
            <div className="text-3xl">📦</div>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 mt-4">Total loads processed</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-900/10 p-6 rounded-lg shadow border border-cyan-200 dark:border-cyan-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300 mb-2">Production Today</p>
              <p className="text-4xl font-bold text-cyan-900 dark:text-cyan-100">{kpis.totalTonsToday}</p>
              <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">tons</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
          <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-2">Total output</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 p-6 rounded-lg shadow border border-red-200 dark:border-red-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">At Risk</p>
              <p className="text-4xl font-bold text-red-900 dark:text-red-100">{kpis.underperformingSites}</p>
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">sites</p>
            </div>
            <div className="text-3xl">⚠️</div>
          </div>
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">Below target</p>
        </div>
      </div>

      {/* Production Trend Chart */}
      {productionTrend.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">7-Day Production Trend</h2>
          <div className="flex items-end justify-between h-48 gap-2">
            {productionTrend.map((day, idx) => {
              const height = (day.tons / maxTons) * 100 || 5
              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-md" style={{ height: `${height}%` }}></div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{day.date}</p>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{day.tons}t</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Site Performance Summary */}
      {sitePerformanceData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Today's Site Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Site</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Target</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actual</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Variance</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Progress</th>
                </tr>
              </thead>
              <tbody>
                {sitePerformanceData.map((site, idx) => {
                  const percentage = Math.round((site.actual / site.target) * 100)
                  return (
                    <tr key={idx} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${getStatusBgColor(site.status)}`}>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{site.siteName}</td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{site.target}t</td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{site.actual}t</td>
                      <td className={`py-3 px-4 font-semibold ${getStatusColor(site.status)}`}>
                        {site.variance >= 0 ? '+' : ''}{site.variance}%
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                          site.status === 'On Target' ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          site.status === 'Below Target' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                        }`}>
                          {site.status === 'On Target' ? '✓' : site.status === 'Below Target' ? '→' : '−'} {site.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              percentage >= 100 ? 'bg-green-500' :
                              percentage >= 80 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{percentage}%</p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manager Actions Section */}
      {currentUser?.role === 'manager' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Manager Actions</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Add comments and flag issues for sites</p>
            </div>
            <button
              onClick={() => setShowCommentModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add Comment/Issue
            </button>
          </div>

          {/* Comments and Issues List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No comments or issues yet</p>
            ) : (
              comments.map(comment => {
                const site = sitePerformanceData.find(s => s.id === comment.siteId)
                return (
                  <div key={comment.id} className={`p-4 rounded-lg border ${
                    comment.type === 'issue'
                      ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                      : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{comment.type === 'issue' ? '⚠️' : '💬'}</span>
                        <span className="font-semibold text-gray-800 dark:text-white">
                          {site?.siteName || 'Unknown Site'}
                        </span>
                        {comment.type === 'issue' && (
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            comment.priority === 'high' ? 'text-red-600 bg-red-100' :
                            comment.priority === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                            'text-green-600 bg-green-100'
                          }`}>
                            {comment.priority}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </span>
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={comment.resolved}
                            onChange={() => toggleResolved(comment.id)}
                          />
                          Resolved
                        </label>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      By {comment.author} ({comment.authorRole})
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Comment/Issue Modal */}
      {showCommentModal && currentUser?.role === 'manager' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Add Comment or Issue</h3>

            <form onSubmit={handleCommentSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Site
                </label>
                <select
                  value={selectedSite?.id || ''}
                  onChange={e => {
                    const site = sitePerformanceData.find(s => s.id === parseInt(e.target.value))
                    setSelectedSite(site)
                  }}
                  className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
                  required
                >
                  <option value="">Select Site</option>
                  {sitePerformanceData.map(site => (
                    <option key={site.id} value={site.id}>{site.siteName}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={commentForm.type}
                  onChange={e => setCommentForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="comment">Comment</option>
                  <option value="issue">Issue</option>
                </select>
              </div>

              {commentForm.type === 'issue' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={commentForm.priority}
                    onChange={e => setCommentForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content
                </label>
                <textarea
                  value={commentForm.content}
                  onChange={e => setCommentForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
                  rows="3"
                  placeholder="Enter your comment or issue description..."
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCommentModal(false)}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Add {commentForm.type === 'issue' ? 'Issue' : 'Comment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default Dashboard
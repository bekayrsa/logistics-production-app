// (RS) Logistics Production App
import { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import { exportToCSV } from '../utils/exportUtils'
import { FileText, TrendingUp, MessageSquare, Send, X, User } from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts'

function SitePerformance({ currentUser }) {
  const [sitePerformance, setSitePerformance] = useState([])
  const [comments, setComments] = useState([])
  const [activeSiteId, setActiveSiteId] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [showComments, setShowComments] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const loadPerformance = async () => {
      if (!currentUser) return
      
      const [sitesData, productionData] = await Promise.all([
        dataService.getSites(currentUser.companyId),
        dataService.getProduction(currentUser.companyId)
      ])

      let sites = sitesData
      if (currentUser.role === 'siteManager') {
        const assignedIds = Object.keys(currentUser.assignedSites || {})
        sites = sites.filter(site => assignedIds.includes(String(site.id)))
      }
      const production = productionData

      // Calculate performance for each site
      const performance = sites.map(site => {
        const todayProduction = production.find(p => Number(p.siteId) === Number(site.id) && p.date === today)

        if (todayProduction) {
          return {
            id: site.id,
            name: site.siteName,
            siteName: site.siteName,
            mineName: site.mineName,
            resource: site.resource,
            target: Number(site.dailyTarget || 0),
            actual: Number(todayProduction.actual || 0),
            variance: todayProduction.variance,
            status: getPerformanceStatus(todayProduction.variance),
            statusColor: getStatusColor(todayProduction.variance)
          }
        } else {
          return {
            id: site.id,
            name: site.siteName,
            siteName: site.siteName,
            mineName: site.mineName,
            resource: site.resource,
            target: Number(site.dailyTarget || 0),
            actual: 0,
            variance: -100,
            status: 'No Data',
            statusColor: 'bg-gray-100 text-gray-800'
          }
        }
      })

      setSitePerformance(performance)
    }

    loadPerformance()
  }, [currentUser, today])

  useEffect(() => {
    const unsub = dataService.subscribeToComments(setComments, currentUser.companyId)
    return () => unsub()
  }, [currentUser])

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || !activeSiteId) return

    const newComment = {
      id: `comment_${Date.now()}`,
      siteId: activeSiteId,
      date: today,
      authorId: currentUser.email,
      authorName: currentUser.name || currentUser.email.split('@')[0],
      authorRole: currentUser.role,
      text: commentText,
      timestamp: Date.now()
    }

    await dataService.saveComment(newComment, currentUser.companyId)
    setCommentText('')
  }

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

  const activeSite = sitePerformance.find(s => s.id === activeSiteId)
  const filteredComments = comments
    .filter(c => c.siteId === activeSiteId && c.date === today)
    .sort((a, b) => b.timestamp - a.timestamp)

  const canView = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'siteManager' || currentUser?.role === 'superAdmin'

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
    <main className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <button 
          onClick={() => exportToCSV(sitePerformance, `production_performance_${today}.csv`)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
        >
          <FileText size={16} />
          Export CSV
        </button>
      </div>

      {/* Overview Graph */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-8 flex items-center">
          <TrendingUp className="mr-2 text-blue-600" size={20} />
          Today's Production vs Target (Tons)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sitePerformance} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const actual = payload[0].value
                    const target = payload[1]?.value || 0
                    return (
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
                        <div className="space-y-1">
                          <p className="text-sm font-black text-blue-600 flex justify-between gap-4">
                            <span>Actual:</span> <span>{actual.toLocaleString()}t</span>
                          </p>
                          <p className="text-sm font-black text-slate-400 flex justify-between gap-4">
                            <span>Target:</span> <span>{target.toLocaleString()}t</span>
                          </p>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                content={({ payload }) => (
                  <div className="flex gap-4 mb-4">
                    {payload.map((entry, index) => (
                      <div key={`item-${index}`} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              />
              <Bar name="Actual" dataKey="actual" radius={[4, 4, 0, 0]} barSize={32} fill="#2563eb" />
              <Bar name="Target" dataKey="target" radius={[4, 4, 0, 0]} barSize={32} fill="#e2e8f0" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sitePerformance.map(site => {
          const siteCommentsCount = comments.filter(c => c.siteId === site.id && c.date === today).length
          return (
            <div key={site.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-8 hover:shadow-md transition-shadow group">
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 items-center">
                {/* Site Info */}
                <div className="lg:col-span-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{site.siteName}</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{site.mineName}</p>
                  <div className="mt-3">
                    <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {site.resource}
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Target</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{site.target.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Tons</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Actual</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{site.actual.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Tons</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Variance</p>
                  <p className={`text-2xl font-black leading-none flex items-center justify-center gap-1 ${
                    site.actual >= site.target ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {site.variance}%
                    <span className="text-lg">{getVarianceIcon(site.variance)}</span>
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Efficiency</p>
                </div>

                {/* Status */}
                <div className="flex flex-col items-center">
                  <div className={`w-full py-4 rounded-3xl text-center ${site.statusColor}`}>
                    <p className="text-xs font-black uppercase tracking-widest">{site.status}</p>
                  </div>
                </div>

                {/* Comment Trigger */}
                <div className="flex justify-center lg:justify-end">
                  <button 
                    onClick={() => {
                      setActiveSiteId(site.id)
                      setShowComments(true)
                    }}
                    className="relative w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all border border-slate-100 dark:border-slate-800 group-hover:scale-105"
                  >
                    <MessageSquare size={24} />
                    {siteCommentsCount > 0 && (
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black border-4 border-white dark:border-slate-950 animate-bounce">
                        {siteCommentsCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard label="On Target" count={sitePerformance.filter(s => s.status === 'On Target').length} color="emerald" />
        <SummaryCard label="Near Target" count={sitePerformance.filter(s => s.status === 'Below Target').length} color="amber" />
        <SummaryCard label="Failed" count={sitePerformance.filter(s => s.status === 'Failed Target').length} color="rose" />
      </div>

      {/* Comment Sidebar Backdrop */}
      {showComments && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] animate-in fade-in duration-300"
          onClick={() => setShowComments(false)}
        />
      )}

      {/* Comment Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white dark:bg-slate-900 z-[101] shadow-2xl transform transition-transform duration-500 ease-out flex flex-col border-l border-slate-200 dark:border-slate-800 ${
        showComments ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Performance Briefing</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{activeSite?.siteName}</p>
          </div>
          <button 
            onClick={() => setShowComments(false)}
            className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30 dark:bg-slate-950/30">
          {filteredComments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 grayscale">
              <MessageSquare size={48} className="text-slate-300 mb-4" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No comments for today yet</p>
              <p className="text-xs text-slate-500 mt-2">Managers can leave performance notes below</p>
            </div>
          ) : filteredComments.map(comment => (
            <div key={comment.id} className={`flex flex-col ${comment.authorId === currentUser.email ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] rounded-[1.5rem] p-5 ${
                comment.authorId === currentUser.email 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-700 rounded-bl-none shadow-sm'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <User size={12} className={comment.authorId === currentUser.email ? 'text-blue-100' : 'text-slate-400'} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    comment.authorId === currentUser.email ? 'text-blue-100' : 'text-slate-500'
                  }`}>
                    {comment.authorName} • {comment.authorRole}
                  </span>
                </div>
                <p className="text-sm font-medium leading-relaxed">{comment.text}</p>
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-2 px-2">
                {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>

        {(currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'superAdmin') && (
          <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <form onSubmit={handleAddComment} className="relative">
              <textarea 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Leave a performance comment..."
                className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-[2rem] text-sm focus:ring-2 focus:ring-blue-500 transition-all resize-none dark:text-white placeholder:text-slate-400 min-h-[120px]"
              />
              <button 
                type="submit"
                disabled={!commentText.trim()}
                className="absolute bottom-4 right-4 w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:grayscale"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}

function SummaryCard({ label, count, color }) {
  const colors = {
    emerald: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    amber: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    rose: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20'
  }
  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</p>
      <span className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${colors[color]}`}>
        {count}
      </span>
    </div>
  )
}

export default SitePerformance

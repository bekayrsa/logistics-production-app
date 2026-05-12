// (RS) Logistics Production App
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { dataService } from '../lib/dataService'
import { exportToCSV } from '../utils/exportUtils'
import {
  TrendingUp,
  TrendingDown,
  Truck,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Target,
  BarChart3,
  Clock,
  FileText,
  MessageSquare
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

function Dashboard({ currentUser }) {
  const [stats, setStats] = useState({
    totalTons: 0,
    onTargetSites: 0,
    belowTargetSites: 0,
    activeTrucks: 0,
    todayProgress: 0
  })
  const [productionHistory, setProductionHistory] = useState([])
  const [recentCaptures, setRecentCaptures] = useState([])
  const [briefings, setBriefings] = useState([])
  const [sitePerformance, setSitePerformance] = useState([])
  const [loading, setLoading] = useState(true)
  const [availableSites, setAvailableSites] = useState([])
  const [selectedSite, setSelectedSite] = useState('all')

  useEffect(() => {
    if (currentUser?.role === 'siteManager') {
      setSelectedSite(String(currentUser.assignedSite))
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return

    const fetchData = async () => {
      setLoading(true)
      try {
        let [history, captures, sitesData, briefingsData] = await Promise.all([
          dataService.getProduction(currentUser.companyId),
          dataService.getCaptures(currentUser.companyId),
          dataService.getSites(currentUser.companyId),
          new Promise((resolve) => {
            dataService.subscribeToBriefings(resolve, currentUser.companyId)() // Quick fetch for initial load
          })
        ])

        setBriefings(briefingsData || [])

        // 1. Populate available sites for the filter dropdown
        if (currentUser.role === 'admin' || currentUser.role === 'manager') {
          setAvailableSites(sitesData)
        } else if (currentUser.role === 'siteManager') {
          const assignedIds = Object.keys(currentUser.assignedSites || {})
          setAvailableSites(sitesData.filter(s => assignedIds.includes(String(s.id))))
        }

        // 2. Initial role-based isolation (Site Managers NEVER see other sites)
        if (currentUser.role === 'siteManager') {
          const assignedIds = Object.keys(currentUser.assignedSites || {})

          history = history.filter(h => assignedIds.includes(String(h.siteId)))
          captures = captures.filter(c => assignedIds.includes(String(c.siteId)))
        }

        // 3. User-selected filter (For admins/managers or multi-site managers)
        if (selectedSite !== 'all') {
          history = history.filter(h => Number(h.siteId) === Number(selectedSite))
          captures = captures.filter(c => Number(c.siteId) === Number(selectedSite))
        }

        const today = new Date().toISOString().split('T')[0]

        // 4. Calculate Live Site Performance from Captures + Sites
        // We iterate through all available sites and aggregate captures for each
        const livePerformance = availableSites.map(site => {
          const siteCaptures = captures.filter(c =>
            c.date === today &&
            Number(c.siteId) === Number(site.id)
          )
          const actual = siteCaptures.reduce((sum, c) => sum + Number(c.tons || 0), 0)
          const target = Number(site.dailyTarget || 0)

          return {
            id: site.id,
            siteName: site.siteName,
            actual,
            target,
            variance: target > 0 ? Math.round(((actual - target) / target) * 100) : 0,
            status: actual >= target ? 'On Target' : 'Below Target'
          }
        })

        // Filter live performance if a specific site is selected
        const filteredPerformance = selectedSite === 'all'
          ? livePerformance
          : livePerformance.filter(p => Number(p.id) === Number(selectedSite))

        // Calculate Stats based on live data
        const totalTons = filteredPerformance.reduce((sum, p) => sum + p.actual, 0)
        const totalTarget = filteredPerformance.reduce((sum, p) => sum + p.target, 0)

        const onTarget = filteredPerformance.filter(p => p.actual >= p.target && p.target > 0).length
        const belowTarget = filteredPerformance.filter(p => p.actual < p.target && p.target > 0).length
        const trucksUsed = [...new Set(captures.filter(c => c.date === today).map(c => c.truckId))].length

        const progress = totalTarget > 0 ? Math.round((totalTons / totalTarget) * 100) : 0

        setStats({
          totalTons,
          onTargetSites: onTarget,
          belowTargetSites: belowTarget,
          activeTrucks: trucksUsed,
          todayProgress: progress
        })

        // Group history by date for trend analysis (using submitted production history)
        const groupedHistory = history.reduce((acc, curr) => {
          if (!acc[curr.date]) acc[curr.date] = 0
          acc[curr.date] += curr.actual
          return acc
        }, {})

        const sortedHistory = Object.entries(groupedHistory)
          .map(([date, tons]) => ({ date, tons }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-7)

        const sortedCaptures = [...captures].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

        setProductionHistory(sortedHistory)
        setRecentCaptures(sortedCaptures.slice(0, 5))
        setSitePerformance(filteredPerformance)
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    const unsubCaptures = dataService.subscribeToCaptures(() => fetchData(), currentUser.companyId)
    const unsubProd = dataService.subscribeToProduction(() => fetchData(), currentUser.companyId)
    const unsubBriefings = dataService.subscribeToBriefings(setBriefings, currentUser.companyId)

    return () => {
      unsubCaptures()
      unsubProd()
      unsubBriefings()
    }
  }, [currentUser, selectedSite])

  if (!currentUser) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (availableSites.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-[2rem] flex items-center justify-center text-amber-600 mx-auto mb-8">
          <AlertTriangle size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">No Sites Assigned</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium mb-8">
          Your account has not been assigned to any production sites yet. Please contact your administrator to gain access to site data.
        </p>
        <button
          onClick={() => navigate('/settings')}
          className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
        >
          Go to Settings
        </button>
      </div>
    )
  }


  const navigate = useNavigate()

  return (
    <div className="space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(sitePerformance, `executive_summary_${new Date().toISOString().split('T')[0]}.csv`)}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-600/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
          >
            <FileText size={16} />
            Export Summary
          </button>

          {availableSites.length > 1 && (
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800/50">
              <MapPin size={18} className="text-blue-600" />
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="bg-transparent border-none text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer p-0"
              >
                {currentUser.role !== 'siteManager' && <option value="all">Global View</option>}
                {availableSites.map(site => (
                  <option key={site.id} value={site.id}>{site.siteName}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Daily Production"
          value={`${stats.totalTons.toLocaleString()}t`}
          subtitle={`${stats.todayProgress}% of daily target`}
          icon={<Layers className="text-blue-600" />}
          trend={stats.todayProgress >= 100 ? 'up' : 'down'}
        />
        <StatCard
          title="On Target"
          value={stats.onTargetSites}
          subtitle="Sites meeting goals"
          icon={<Target className="text-emerald-600" />}
          color="emerald"
        />
        <StatCard
          title="Below Target"
          value={stats.belowTargetSites}
          subtitle="Attention required"
          icon={<AlertTriangle className="text-rose-600" />}
          color="rose"
        />
        <StatCard
          title="Active Fleet"
          value={stats.activeTrucks}
          subtitle="Vehicles in operation"
          icon={<Truck className="text-violet-600" />}
          color="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Site Performance List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center">
                <BarChart3 className="mr-3 text-blue-600" size={24} />
                Live Site Performance
              </h3>
              <Calendar className="text-slate-400" size={20} />
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {sitePerformance.length > 0 ? sitePerformance.map(site => (
                <div key={site.id} className="p-8 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center space-x-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${site.actual >= site.target ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'
                        }`}>
                        <MapPin size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{site.siteName}</h4>
                          {briefings.filter(b => b.siteId === site.id && b.status === 'open').length > 0 && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
                              <MessageSquare size={10} />
                              {briefings.filter(b => b.siteId === site.id && b.status === 'open').length}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Coal Operations</p>
                      </div>
                    </div>

                    <div className="flex-1 max-w-xs px-4">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        <span>Progress</span>
                        <span>{Math.round((site.actual / site.target) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${site.actual >= site.target ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          style={{ width: `${Math.min(100, (site.actual / site.target) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{site.actual.toLocaleString()}t</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Target: {site.target.toLocaleString()}t</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-slate-400 italic">No production recorded for today yet.</div>
              )}
            </div>
          </div>

          {/* Production Trend Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center">
              <TrendingUp className="mr-3 text-blue-600" size={24} />
              7-Day Production Trend
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productionHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                    tickFormatter={(str) => {
                      const date = new Date(str);
                      return date.toLocaleDateString([], { weekday: 'short' });
                    }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl">
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{payload[0].payload.date}</p>
                            <p className="text-sm font-black text-blue-600">{payload[0].value.toLocaleString()} tons</p>
                          </div>
                        )
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="tons" radius={[4, 4, 0, 0]}>
                    {productionHistory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === productionHistory.length - 1 ? '#2563eb' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center">
              <Clock className="mr-2 text-blue-600" size={20} />
              Recent Captures
            </h3>
            <div className="space-y-6">
              {recentCaptures.map((capture, idx) => (
                <div key={capture.id} className="flex items-start space-x-4 relative">
                  {idx !== recentCaptures.length - 1 && (
                    <div className="absolute left-4 top-10 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />
                  )}
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 shrink-0 z-10">
                    <Truck size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{capture.truckName}</p>
                    <p className="text-xs text-slate-500">{capture.loads} loads delivered to {capture.siteName}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">{new Date(capture.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="w-full mt-8 py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
            >
              View All Logs <ArrowRight size={14} className="ml-2" />
            </button>
          </div>

          {/* Active Briefings Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center">
              <MessageSquare className="mr-2 text-blue-600" size={20} />
              Open Briefings
            </h3>
            <div className="space-y-6">
              {briefings.filter(b => b.status === 'open').slice(0, 3).map((briefing) => (
                <div key={briefing.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{briefing.siteName}</span>
                    <span className="text-[10px] font-bold text-slate-400">{new Date(briefing.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-2">{briefing.text}</p>
                </div>
              ))}
              {briefings.filter(b => b.status === 'open').length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No active briefings.</p>
              )}
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="w-full mt-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              Go to Briefing Room <ArrowRight size={14} className="ml-2" />
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}


function StatCard({ title, value, subtitle, icon, trend, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30'
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${colors[color]}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
            {trend === 'up' ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
            {trend === 'up' ? '+12%' : '-4%'}
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</p>
        <p className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{value}</p>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-500 mt-2">{subtitle}</p>
      </div>
    </div>
  )
}

export default Dashboard

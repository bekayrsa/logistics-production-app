import { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
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
  Clock
} from 'lucide-react'

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
  const [sitePerformance, setSitePerformance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const [history, captures, sites] = await Promise.all([
          dataService.getProduction(),
          dataService.getCaptures(),
          dataService.getSites()
        ])

        const today = new Date().toISOString().split('T')[0]
        const todayProd = history.filter(h => h.date === today)
        
        // Calculate Stats
        const totalTons = todayProd.reduce((sum, h) => sum + h.actual, 0)
        const onTarget = todayProd.filter(h => h.actual >= h.target).length
        const belowTarget = todayProd.filter(h => h.actual < h.target).length
        const trucksUsed = [...new Set(captures.filter(c => c.date === today).map(c => c.truckId))].length
        
        const totalTarget = todayProd.reduce((sum, h) => sum + h.target, 0)
        const progress = totalTarget > 0 ? Math.round((totalTons / totalTarget) * 100) : 0

        setStats({
          totalTons,
          onTargetSites: onTarget,
          belowTargetSites: belowTarget,
          activeTrucks: trucksUsed,
          todayProgress: progress
        })

        setProductionHistory(history.slice(-7)) // Last 7 entries
        setRecentCaptures(captures.slice(-5)) // Last 5 captures
        setSitePerformance(todayProd)
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Subscribe to real-time updates
    const unsubCaptures = dataService.subscribeToCaptures(() => fetchData())
    const unsubProd = dataService.subscribeToProduction(() => fetchData())

    return () => {
      unsubCaptures()
      unsubProd()
    }
  }, [currentUser])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                        site.actual >= site.target ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'
                      }`}>
                        <MapPin size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{site.siteName}</h4>
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
                          className={`h-full rounded-full transition-all duration-1000 ${
                            site.actual >= site.target ? 'bg-emerald-500' : 'bg-rose-500'
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
            <button className="w-full mt-8 py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center">
              View All Logs <ArrowRight size={14} className="ml-2" />
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
          <div className={`flex items-center px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
            trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
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

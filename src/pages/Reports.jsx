import { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { FileText, Download, Filter, Layers, Weight, MapPin, CheckCircle2, TrendingUp } from 'lucide-react'

function Reports({ currentUser }) {
  const [captures, setCaptures] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadReports = async () => {
      if (!currentUser) return
      setLoading(true)
      try {
        let storedCaptures = await dataService.getCaptures()
        const today = new Date().toISOString().split('T')[0]
        
        // Filter for today's data
        storedCaptures = storedCaptures.filter(c => c.date === today)
        
        if (currentUser.role === 'siteManager') {
          storedCaptures = storedCaptures.filter(capture => Number(capture.siteId) === Number(currentUser.assignedSite))
        }
        
        // Explicitly sort by timestamp descending
        storedCaptures.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        setCaptures(storedCaptures)
      } catch (err) {
        console.error('Failed to load reports:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadReports()
  }, [currentUser])

  // Summary stats
  const todayTotalLoads = captures.reduce((sum, c) => sum + Number(c.loads || 0), 0)
  const todayTotalTons = captures.reduce((sum, c) => sum + Number(c.tons || 0), 0)
  const uniqueSites = new Set(captures.map(c => c.siteId)).size

  const chartData = Object.values(captures.reduce((acc, c) => {
    if (!acc[c.siteName]) acc[c.siteName] = { name: c.siteName, tons: 0, loads: 0 }
    acc[c.siteName].tons += Number(c.tons || 0)
    acc[c.siteName].loads += Number(c.loads || 0)
    return acc
  }, {}))

  const canView = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'siteManager'

  if (!canView) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-xl font-bold dark:text-white">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">You do not have permission to view production reports.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Production Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Daily shift performance and resource metrics</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all flex items-center">
            <Filter size={14} className="mr-2" /> Filter
          </button>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center">
            <Download size={14} className="mr-2" /> Export PDF
          </button>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <ReportStatCard title="Total Loads" value={todayTotalLoads} icon={<Layers className="text-blue-600" />} color="blue" />
        <ReportStatCard title="Total Production" value={`${todayTotalTons.toLocaleString()}t`} icon={<Weight className="text-emerald-600" />} color="emerald" />
        <ReportStatCard title="Active Sites" value={uniqueSites} icon={<MapPin className="text-violet-600" />} color="violet" />
      </div>

      {/* Charts */}
      {captures.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-8 flex items-center">
              <TrendingUp className="mr-2 text-blue-600" size={20} />
              Production by Site (Tons)
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="tons" radius={[8, 8, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#2563eb', '#8b5cf6', '#06b6d4', '#10b981'][index % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-8 flex items-center">
              <Layers className="mr-2 text-violet-600" size={20} />
              Load Distribution
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="loads" radius={[8, 8, 0, 0]} barSize={40} fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Logs */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center">
            <FileText className="mr-3 text-blue-600" size={24} />
            Daily Capture Logs
          </h3>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest">
            {captures.length} Total Entries
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Location Site</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Vehicle</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Load Count</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Net Weight</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {captures.length > 0 ? captures.map(capture => (
                <tr key={capture.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-5 font-bold text-slate-900 dark:text-white">{capture.siteName}</td>
                  <td className="px-8 py-5 text-slate-600 dark:text-slate-400 font-medium">{capture.truckName}</td>
                  <td className="px-8 py-5 text-center font-black text-blue-600">{capture.loads}</td>
                  <td className="px-8 py-5 text-center">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {capture.tons}t
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-slate-400 text-[10px]">
                    {new Date(capture.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center text-slate-400 italic">No production data available for today.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ReportStatCard({ title, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30'
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-colors">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{title}</p>
        <p className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{value}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${colors[color]}`}>
        {icon}
      </div>
    </div>
  )
}

export default Reports
// (RS) Logistics Production App
import { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { FileText, Download, Filter, Layers, Weight, MapPin, CheckCircle2, TrendingUp, Search, MessageSquare, Send, X, Clock, User, CheckCircle } from 'lucide-react'

import { exportToCSV } from '../utils/exportUtils'

function Reports({ currentUser }) {
  const [allCaptures, setAllCaptures] = useState([])
  const [filteredCaptures, setFilteredCaptures] = useState([])
  const [loading, setLoading] = useState(true)
  const [availableSites, setAvailableSites] = useState([])
  const [briefings, setBriefings] = useState([])
  const [showBriefingPanel, setShowBriefingPanel] = useState(false)
  const [selectedBriefingSite, setSelectedBriefingSite] = useState(null)
  
  // Filter States
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState('all')
  const [sortBy, setSortBy] = useState({ key: 'timestamp', direction: 'desc' })

  useEffect(() => {
    if (currentUser?.role === 'siteManager') {
      setSelectedSite(String(currentUser.assignedSite))
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return
    setLoading(true)

    // 1. Subscribe to Captures
    const unsubCaptures = dataService.subscribeToCaptures((data) => {
      setAllCaptures(data)
      setLoading(false)
    }, currentUser.companyId)

    // 2. Subscribe to Sites to populate filters
    const unsubSites = dataService.subscribeToSites((sitesData) => {
      if (currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'superAdmin') {
        setAvailableSites(sitesData || [])
      } else if (currentUser.role === 'siteManager') {
        const assignedIds = Object.keys(currentUser.assignedSites || {})
        setAvailableSites((sitesData || []).filter(s => assignedIds.includes(String(s.id))))
      }
    }, currentUser.companyId)

    const unsubBriefings = dataService.subscribeToBriefings((data) => {
      setBriefings(data)
    }, currentUser.companyId)

    return () => {
      unsubCaptures()
      unsubSites()
      unsubBriefings()
    }
  }, [currentUser])

  useEffect(() => {
    let result = [...(allCaptures || [])]

    // 1. Date Range Filter
    result = result.filter(c => c.date >= startDate && c.date <= endDate)

    // 2. Role-based isolation
    if (currentUser?.role === 'siteManager') {
      const assignedIds = Object.keys(currentUser.assignedSites || {})
      result = result.filter(c => assignedIds.includes(String(c.siteId)))
    }

    // 3. Specific Site Selection
    if (selectedSite !== 'all') {
      result = result.filter(c => Number(c.siteId) === Number(selectedSite))
    }

    // 4. Search Filter
    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase()
      result = result.filter(c => 
        c.siteName.toLowerCase().includes(lowSearch) || 
        c.truckName.toLowerCase().includes(lowSearch)
      )
    }

    // 5. Sorting
    result.sort((a, b) => {
      let aVal = a[sortBy.key]
      let bVal = b[sortBy.key]
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      
      if (aVal < bVal) return sortBy.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortBy.direction === 'asc' ? 1 : -1
      return 0
    })

    setFilteredCaptures(result)
  }, [allCaptures, startDate, endDate, searchTerm, selectedSite, sortBy, currentUser])

  const handleSort = (key) => {
    setSortBy(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  const handleExport = () => {
    const filename = `production_report_${startDate}_to_${endDate}.csv`
    exportToCSV(filteredCaptures, filename)
  }

  // Summary stats (now based on filtered data)
  const totalLoads = filteredCaptures.reduce((sum, c) => sum + Number(c.loads || 0), 0)
  const totalTons = filteredCaptures.reduce((sum, c) => sum + Number(c.tons || 0), 0)
  const uniqueSites = new Set(filteredCaptures.map(c => c.siteId)).size

  const dayCount = Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1)

  const chartData = Object.values(filteredCaptures.reduce((acc, c) => {
    if (!acc[c.siteId]) {
      const siteInfo = availableSites.find(s => Number(s.id) === Number(c.siteId))
      acc[c.siteId] = { 
        name: c.siteName, 
        actual: 0, 
        target: (Number(siteInfo?.dailyTarget || 0)) * dayCount 
      }
    }
    acc[c.siteId].actual += Number(c.tons || 0)
    return acc
  }, {}))

  const trendData = Object.values(filteredCaptures.reduce((acc, c) => {
    if (!acc[c.date]) {
      // Calculate daily target for this date across all sites being viewed
      const dailyTarget = availableSites.reduce((sum, s) => sum + Number(s.dailyTarget || 0), 0)
      acc[c.date] = { date: c.date, actual: 0, target: dailyTarget }
    }
    acc[c.date].actual += Number(c.tons || 0)
    return acc
  }, {})).sort((a, b) => a.date.localeCompare(b.date))

  const canView = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'siteManager' || currentUser?.role === 'superAdmin'

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
    <div className="space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <div className="flex gap-3">
          <button 
            onClick={() => setShowBriefingPanel(true)}
            className="px-6 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 transition-all flex items-center relative"
          >
            <MessageSquare size={14} className="mr-2 text-blue-600" /> 
            Briefing Room
            {(() => {
              const relevantOpen = currentUser.role === 'siteManager' 
                ? briefings.filter(b => b.status === 'open' && Number(b.siteId) === Number(currentUser.assignedSite))
                : briefings.filter(b => b.status === 'open')
              
              if (relevantOpen.length === 0) return null
              
              return (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[8px] text-white">
                  {relevantOpen.length}
                </span>
              )
            })()}
          </button>
          <button 
            onClick={handleExport}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center"
          >
            <Download size={14} className="mr-2" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1 w-full space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Search Records</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search site or truck..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="w-full md:w-64 space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Filter by Site</label>
          <select 
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
          >
            {currentUser.role !== 'siteManager' && <option value="all">All Available Sites</option>}
            {availableSites.map(site => (
              <option key={site.id} value={site.id}>{site.siteName}</option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">From Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">To Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <button 
          onClick={() => {
            setStartDate(new Date().toISOString().split('T')[0])
            setEndDate(new Date().toISOString().split('T')[0])
            setSearchTerm('')
            setSelectedSite('all')
          }}
          className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"
        >
          Reset
        </button>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <ReportStatCard title="Total Loads" value={totalLoads} icon={<Layers className="text-blue-600" />} color="blue" />
        <ReportStatCard title="Total Production" value={`${totalTons.toLocaleString()}t`} icon={<Weight className="text-emerald-600" />} color="emerald" />
        <ReportStatCard title="Active Sites" value={uniqueSites} icon={<MapPin className="text-violet-600" />} color="violet" />
      </div>

      {/* Charts */}
      {filteredCaptures.length > 0 && (
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
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const actual = payload[0].value
                        const target = payload[1]?.value || 0
                        const variance = target > 0 ? ((actual - target) / target * 100).toFixed(1) : 0
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
                              <div className="pt-1 border-t border-slate-100 dark:border-slate-800 mt-1">
                                <p className={`text-[10px] font-black uppercase ${Number(variance) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {Number(variance) >= 0 ? '↑' : '↓'} {Math.abs(variance)}% Variance
                                </p>
                              </div>
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
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm col-span-1 lg:col-span-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-8 flex items-center">
            <TrendingUp className="mr-2 text-emerald-600" size={20} />
            Production Trend (Actual vs Target)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ stroke: '#2563eb', strokeWidth: 2 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
                          <div className="space-y-1">
                            <p className="text-sm font-black text-blue-600 flex justify-between gap-4">
                              <span>Actual:</span> <span>{payload[0].value.toLocaleString()}t</span>
                            </p>
                            <p className="text-sm font-black text-slate-400 flex justify-between gap-4">
                              <span>Target:</span> <span>{payload[1]?.value.toLocaleString()}t</span>
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
                <Line name="Actual Tons" type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={4} dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                <Line name="Daily Target" type="monotone" dataKey="target" stroke="#e2e8f0" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
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
            Capture History
          </h3>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest">
            {filteredCaptures.length} Total Entries
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th 
                  className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:text-blue-600"
                  onClick={() => handleSort('siteName')}
                >
                  Location Site {sortBy.key === 'siteName' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:text-blue-600"
                  onClick={() => handleSort('truckName')}
                >
                  Vehicle {sortBy.key === 'truckName' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center cursor-pointer hover:text-blue-600"
                  onClick={() => handleSort('loads')}
                >
                  Load Count {sortBy.key === 'loads' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center cursor-pointer hover:text-blue-600"
                  onClick={() => handleSort('tons')}
                >
                  Net Weight {sortBy.key === 'tons' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">
                  Captured By
                </th>
                <th 
                  className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right cursor-pointer hover:text-blue-600"
                  onClick={() => handleSort('timestamp')}
                >
                  Date & Time {sortBy.key === 'timestamp' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCaptures.length > 0 ? filteredCaptures.map(capture => (
                <tr key={capture.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-5 font-bold text-slate-900 dark:text-white">{capture.siteName}</td>
                  <td className="px-8 py-5 text-slate-600 dark:text-slate-400 font-medium">{capture.truckName}</td>
                  <td className="px-8 py-5 text-center font-black text-blue-600">{capture.loads}</td>
                  <td className="px-8 py-5 text-center">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {capture.tons}t
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center font-bold text-slate-500 text-[10px]">
                    {capture.capturedBy || capture.userName || 'System'}
                  </td>
                  <td className="px-8 py-5 text-right font-black text-slate-400 text-[10px]">
                    {capture.date} <br/>
                    {new Date(capture.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center text-slate-400 italic">No production data available for this range.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Briefing Room Side Panel */}
      <BriefingPanel 
        isOpen={showBriefingPanel} 
        onClose={() => setShowBriefingPanel(false)}
        currentUser={currentUser}
        sites={availableSites}
        briefings={briefings}
      />
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

function BriefingPanel({ isOpen, onClose, currentUser, sites, briefings }) {
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [text, setText] = useState('')
  const [replyText, setReplyText] = useState({})

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!selectedSiteId || !text) return
    const site = sites.find(s => String(s.id) === String(selectedSiteId))
    await dataService.saveBriefing({
      siteId: site.id,
      siteName: site.siteName,
      text,
      authorId: currentUser.id,
      authorName: `${currentUser.name} ${currentUser.surname || ''}`.trim(),
      authorRole: currentUser.role
    })
    setText('')
  }

  const handleReply = async (briefingId) => {
    if (!replyText[briefingId]) return
    await dataService.addReplyToBriefing(briefingId, {
      text: replyText[briefingId],
      authorId: currentUser.id,
      authorName: `${currentUser.name} ${currentUser.surname || ''}`.trim(),
      authorRole: currentUser.role
    })
    setReplyText(prev => ({ ...prev, [briefingId]: '' }))
  }

  const handleResolve = async (briefingId) => {
    await dataService.resolveBriefing(briefingId)
  }

  const filteredBriefings = currentUser.role === 'siteManager'
    ? briefings.filter(b => Number(b.siteId) === Number(currentUser.assignedSite))
    : briefings

  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white dark:bg-slate-900 shadow-2xl z-[100] transform transition-transform duration-500 ease-in-out border-l border-slate-200 dark:border-slate-800 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Briefing Room</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Operational Dialogue</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* New Briefing Form (Admin/Manager only) */}
          {(currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'superAdmin') && (
            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/20">
              <h4 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-4 flex items-center">
                <Send size={14} className="mr-2" /> Issue New Briefing
              </h4>
              <form onSubmit={handleCreate} className="space-y-4">
                <select 
                  value={selectedSiteId}
                  onChange={e => setSelectedSiteId(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Select Target Site</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.siteName}</option>)}
                </select>
                <textarea 
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Describe operational performance issue or instruction..."
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-none rounded-xl text-sm font-medium min-h-[100px] focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button 
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                >
                  Transmit Briefing
                </button>
              </form>
            </div>
          )}

          {/* Briefings List */}
          <div className="space-y-6">
            {filteredBriefings.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-sm font-bold text-slate-400">No active briefings in the system.</p>
              </div>
            ) : (
              filteredBriefings.map(briefing => (
                <div key={briefing.id} className={`p-6 rounded-[2rem] border transition-all ${briefing.status === 'resolved' ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 opacity-60' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                      {briefing.siteName}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center">
                      <Clock size={10} className="mr-1" />
                      {new Date(briefing.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">{briefing.authorName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{briefing.authorRole}</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 font-medium leading-relaxed">
                        {briefing.text}
                      </p>
                    </div>
                  </div>

                  {/* Replies */}
                  {briefing.replies && briefing.replies.length > 0 && (
                    <div className="ml-8 mt-4 space-y-4 border-l-2 border-slate-100 dark:border-slate-800 pl-4">
                      {briefing.replies.map((reply, idx) => (
                        <div key={idx} className="space-y-1">
                          <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                            {reply.authorName} <span className="text-slate-400 ml-2 font-bold">{new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{reply.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {briefing.status === 'open' && (
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={replyText[briefing.id] || ''}
                          onChange={e => setReplyText(prev => ({ ...prev, [briefing.id]: e.target.value }))}
                          placeholder="Type response..."
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-blue-500 dark:text-white"
                        />
                        <button 
                          onClick={() => handleReply(briefing.id)}
                          className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                        >
                          <Send size={14} />
                        </button>
                      </div>
                      
                      {(currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'superAdmin') && (
                        <button 
                          onClick={() => handleResolve(briefing.id)}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all"
                        >
                          <CheckCircle size={14} /> Mark as Resolved
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports

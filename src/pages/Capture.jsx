// (RS) Logistics Production App
import { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import { 
  Truck, 
  MapPin, 
  Weight, 
  ArrowRight, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  Info,
  TrendingUp,
  Trash2
} from 'lucide-react'

const FAILURE_REASONS = [
  { id: 'weather', label: 'Weather Conditions' },
  { id: 'equipment', label: 'Equipment Failure' },
  { id: 'staffing', label: 'Staffing Shortage' },
  { id: 'maintenance', label: 'Planned Maintenance' },
  { id: 'supply', label: 'Supply Chain Delay' },
  { id: 'operational', label: 'Operational Issue' },
  { id: 'other', label: 'Other' }
]

const DELAY_FACTORS = [
  'Traffic/Transportation',
  'Equipment Downtime',
  'Worker Absence',
  'Weather Impact',
  'Fuel Shortage',
  'Mechanical Issue',
  'Scheduling Conflict',
  'Safety Incident'
]

function Capture({ currentUser }) {
  const [sites, setSites] = useState([])
  const [trucks, setTrucks] = useState([])
  const [todayCaptures, setTodayCaptures] = useState([])
  const [filteredTrucks, setFilteredTrucks] = useState([])
  const [pendingEntries, setPendingEntries] = useState([])
  const [daySubmitted, setDaySubmitted] = useState(false)
  const [showFailureModal, setShowFailureModal] = useState(false)
  const [tons, setTons] = useState(0)
  const [willFail, setWillFail] = useState(false)

  const [formData, setFormData] = useState({
    siteId: '',
    truckId: '',
    loads: ''
  })

  const [failureReport, setFailureReport] = useState({
    reasonCategory: '',
    explanation: '',
    delayFactors: []
  })

  useEffect(() => {
    if (!currentUser) return
    
    const unsubSites = dataService.subscribeToSites((sitesData) => {
      let allSites = sitesData
      if (currentUser.role === 'siteManager') {
        const assignedIds = Object.keys(currentUser.assignedSites || {})
        
        allSites = allSites.filter(site => assignedIds.includes(String(site.id)))
        
        if (!formData.siteId || !assignedIds.includes(formData.siteId)) {
          setFormData(prev => ({ ...prev, siteId: assignedIds[0] || '' }))
        }
      }
      setSites(allSites)
    }, currentUser.companyId)

    const unsubTrucks = dataService.subscribeToTrucks((trucksData) => {
      setTrucks(trucksData)
      setFilteredTrucks(trucksData)
    }, currentUser.companyId)

    return () => {
      unsubSites()
      unsubTrucks()
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return
    const unsubCaptures = dataService.subscribeToCaptures((capturesData) => {
      const today = new Date().toISOString().split('T')[0]
      let filtered = capturesData.filter(c => c.date === today)
      if (currentUser?.role === 'siteManager') {
        const assignedIds = Object.keys(currentUser.assignedSites || {})
        filtered = filtered.filter(c => assignedIds.includes(String(c.siteId)))
      }
      setTodayCaptures(filtered)
    }, currentUser.companyId)
    const unsubSubmitted = dataService.subscribeToSubmittedDays((submittedData) => {
      const today = new Date().toISOString().split('T')[0]
      if (currentUser?.role === 'siteManager') {
        const assignedIds = Object.keys(currentUser.assignedSites || {})
        setDaySubmitted(submittedData.some(d => d.date === today && assignedIds.includes(String(d.siteId))))
      }
    }, currentUser.companyId)
    return () => {
      unsubCaptures()
      unsubSubmitted()
    }
  }, [currentUser])

  useEffect(() => {
    const truck = trucks.find(t => String(t.id) === String(formData.truckId))
    if (truck && formData.loads) setTons(Number(formData.loads) * Number(truck.capacity))
    else setTons(0)
  }, [formData.truckId, formData.loads, trucks])

  const toggleDelayFactor = factor => {
    setFailureReport(prev => ({
      ...prev,
      delayFactors: prev.delayFactors.includes(factor) ? prev.delayFactors.filter(item => item !== factor) : [...prev.delayFactors, factor]
    }))
  }

  const isFailureReportValid = () => failureReport.reasonCategory && failureReport.explanation.trim()

  const addEntry = e => {
    e.preventDefault()
    const selectedSite = sites.find(s => String(s.id) === String(formData.siteId))
    const selectedTruck = trucks.find(t => String(t.id) === String(formData.truckId))
    if (!selectedSite || !selectedTruck || !formData.loads) return
    const newEntry = {
      id: Date.now(),
      siteId: selectedSite.id,
      siteName: selectedSite.siteName,
      truckId: selectedTruck.id,
      truckName: selectedTruck.truckName,
      loads: Number(formData.loads),
      tons,
      userId: currentUser.id,
      userName: `${currentUser.name} ${currentUser.surname || ''}`.trim(),
      resource: selectedSite.resource
    }
    setPendingEntries(prev => [...prev, newEntry])
    setFormData(prev => ({ ...prev, truckId: '', loads: '' }))
    setTons(0)
  }

  const submitDayReport = () => {
    const site = sites.find(s => String(s.id) === String(formData.siteId))
    if (!site || pendingEntries.length === 0) return
    const totalTons = pendingEntries.reduce((sum, item) => sum + item.tons, 0)
    const failed = totalTons < Number(site.dailyTarget)
    setWillFail(failed)
    if (failed) setShowFailureModal(true)
    else finalizeSubmission()
  }

  const finalizeSubmission = async () => {
    const today = new Date().toISOString().split('T')[0]
    const site = sites.find(s => String(s.id) === String(formData.siteId))
    if (!site) return
    const target = Number(site.dailyTarget)
    const totalTons = pendingEntries.reduce((sum, item) => sum + item.tons, 0)
    const totalLoads = pendingEntries.reduce((sum, item) => sum + item.loads, 0)
    for (const entry of pendingEntries) {
      await dataService.createCapture({ ...entry, date: today, failureReport: willFail ? failureReport : null }, currentUser.companyId, currentUser)
    }
    await dataService.saveProduction({
      date: today, siteId: site.id, siteName: site.siteName, trucksUsed: pendingEntries.length,
      loadsPerTruck: totalLoads, totalTons, target, actual: totalTons,
      variance: Math.round(((totalTons - target) / target) * 100),
      status: totalTons >= target ? 'On Target' : 'Below Target'
    }, currentUser.companyId)
    await dataService.saveSubmittedDay({ date: today, siteId: site.id }, currentUser.companyId)
    setPendingEntries([])
    setFailureReport({ reasonCategory: '', explanation: '', delayFactors: [] })
    setShowFailureModal(false)
  }

  const canCapture = currentUser?.role === 'admin' || currentUser?.role === 'siteManager' || currentUser?.role === 'superAdmin'
  if (!canCapture) return <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl">Access Denied</div>

  const isSiteManager = currentUser?.role === 'siteManager'
  const currentTargetSite = sites.find(s => String(s.id) === String(formData.siteId))
  const dailyTarget = currentTargetSite ? Number(currentTargetSite.dailyTarget || 0) : 0
  const capturedTonsToday = todayCaptures.filter(c => Number(c.siteId) === Number(currentTargetSite?.id)).reduce((sum, c) => sum + c.tons, 0)
  const pendingTons = pendingEntries.reduce((sum, e) => sum + e.tons, 0)
  const totalTonsProgress = capturedTonsToday + pendingTons
  const progressPercent = dailyTarget > 0 ? Math.min(100, Math.round((totalTonsProgress / dailyTarget) * 100)) : 0

  if (daySubmitted) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm animate-in zoom-in-95 duration-700">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-[2rem] flex items-center justify-center text-emerald-600 mx-auto mb-8">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Production Submitted</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
          The daily production report for {currentTargetSite?.siteName} has been finalized and transmitted to the command console.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Progress Header */}
      {currentTargetSite && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <TrendingUp size={120} className="text-blue-600" />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Daily Goal Progress</span>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{currentTargetSite.siteName}</h2>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-3xl font-black text-slate-900 dark:text-white">{totalTonsProgress}<span className="text-sm font-bold text-slate-400 ml-1">/ {dailyTarget}t</span></p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{progressPercent}% Achieved</p>
              </div>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-700/50">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(37,99,235,0.3)] ${progressPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Entry Form */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-8">
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center">
          <Plus className="mr-2 text-blue-600" size={24} />
          New Production Entry
        </h3>
        
        <form onSubmit={addEntry} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(isSiteManager && sites.length > 1 || !isSiteManager) && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 px-1">
                {isSiteManager ? 'Current Active Site' : 'Location Site'}
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  value={formData.siteId}
                  onChange={e => setFormData(prev => ({ ...prev, siteId: e.target.value }))}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-600 dark:text-white transition-all appearance-none font-bold"
                >
                  {!isSiteManager && <option value="">Select Site</option>}
                  {sites.map(site => <option key={site.id} value={site.id}>{site.siteName}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-500 px-1">Assign Truck</label>
            <div className="relative">
              <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                value={formData.truckId}
                onChange={e => setFormData(prev => ({ ...prev, truckId: e.target.value }))}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-600 dark:text-white transition-all appearance-none font-bold"
              >
                <option value="">Select Truck</option>
                {filteredTrucks.map(truck => <option key={truck.id} value={truck.id}>{truck.truckName} ({truck.capacity}t)</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-500 px-1">Load Count</label>
            <div className="relative">
              <Weight className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="number"
                min="1"
                placeholder="Number of loads"
                value={formData.loads}
                onChange={e => setFormData(prev => ({ ...prev, loads: e.target.value }))}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-600 dark:text-white transition-all font-bold placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
            <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 w-full sm:w-auto">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase text-slate-400">Total Calculation</p>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{tons}t</p>
              </div>
            </div>
            <button type="submit" className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2">
              Add to Queue <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>

      {/* Pending Entries List */}
      {pendingEntries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Pending Queue</h3>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">{pendingEntries.length} items</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pendingEntries.map((entry, index) => (
              <div key={entry.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-blue-300 dark:hover:border-blue-700 transition-colors shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                    <Truck size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{entry.truckName}</p>
                    <p className="text-xs text-slate-500 font-medium">{entry.loads} loads • {entry.tons} tons</p>
                  </div>
                </div>
                <button 
                  onClick={() => setPendingEntries(prev => prev.filter(e => e.id !== entry.id))}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <button 
              onClick={submitDayReport}
              className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <CheckCircle2 size={24} />
              Submit Daily Production Report
            </button>
          </div>
        </div>
      )}

      {/* History (Mobile Friendly) */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-8">
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center">
          <Clock className="mr-2 text-slate-400" size={24} />
          Today's Activity
        </h3>
        <div className="space-y-3">
          {todayCaptures.length === 0 ? (
            <div className="text-center py-12 text-slate-400 italic text-sm">
              No entries recorded yet today.
            </div>
          ) : (
            todayCaptures.slice().reverse().map(capture => (
              <div key={capture.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/30 group">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{capture.truckName}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{capture.loads} Loads • {capture.tons}t</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400">{new Date(capture.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Failure Modal */}
      {showFailureModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl border border-rose-100 dark:border-rose-900/20 animate-in zoom-in-95 duration-300">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-3xl flex items-center justify-center text-rose-600">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">Target Not Met</h3>
                <p className="text-slate-500 font-medium">A failure report is required for management review.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-1 tracking-widest">Primary Reason</label>
                <select
                  value={failureReport.reasonCategory}
                  onChange={e => setFailureReport(prev => ({ ...prev, reasonCategory: e.target.value }))}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-rose-500 dark:text-white font-bold appearance-none"
                >
                  <option value="">Select Reason Category</option>
                  {FAILURE_REASONS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-1 tracking-widest">Detailed Explanation</label>
                <textarea
                  rows="3"
                  value={failureReport.explanation}
                  onChange={e => setFailureReport(prev => ({ ...prev, explanation: e.target.value }))}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-rose-500 dark:text-white font-medium placeholder:text-slate-400"
                  placeholder="Provide specific details about the production shortfall..."
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 px-1 tracking-widest">Contributing Factors</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DELAY_FACTORS.map(factor => (
                    <button
                      key={factor}
                      onClick={() => toggleDelayFactor(factor)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl border transition-all text-left ${
                        failureReport.delayFactors.includes(factor)
                          ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800'
                          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        failureReport.delayFactors.includes(factor) ? 'bg-rose-600 border-rose-600' : 'border-slate-300'
                      }`}>
                        {failureReport.delayFactors.includes(factor) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <span className="text-xs font-bold">{factor}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-8">
              <button
                onClick={() => setShowFailureModal(false)}
                className="flex-1 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!isFailureReportValid()}
                onClick={finalizeSubmission}
                className="flex-1 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs bg-rose-600 text-white hover:bg-rose-700 shadow-xl shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
              >
                Authorize Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Capture

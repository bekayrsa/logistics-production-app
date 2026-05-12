// (RS) Logistics Production App
import { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import { exportToCSV } from '../utils/exportUtils'
import { Plus, Edit2, Trash2, Database, Shield, Layout, Users, Truck, MapPin, Briefcase, FileText, Search, Filter, Save, X, AlertCircle, BarChart3, Map, Upload, DownloadCloud, Info } from 'lucide-react'

function AdminDataManagement({ currentUser }) {
  const [activeTab, setActiveTab] = useState('captures')
  const [captures, setCaptures] = useState([])
  const [production, setProduction] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [showImportModal, setShowImportModal] = useState(false)
  const [importStatus, setImportStatus] = useState({ loading: false, result: null })

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return
    setLoading(true)
    const unsubCaptures = dataService.subscribeToCaptures((allCaptures) => {
      const filtered = allCaptures
        .filter(c => c.date === filterDate)
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      setCaptures(filtered)
      setLoading(false)
    }, currentUser.companyId)

    const unsubProduction = dataService.subscribeToProduction((allProduction) => {
      const filtered = allProduction.filter(p => p.date === filterDate)
      setProduction(filtered)
    }, currentUser.companyId)

    return () => {
      unsubCaptures()
      unsubProduction()
    }
  }, [filterDate, currentUser])

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-3xl flex items-center justify-center text-rose-600 mb-6">
          <Shield size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs font-medium">Only Company Administrators can access the master data management console.</p>
      </div>
    )
  }

  const handleEditCapture = (capture) => {
    setEditingId(capture.id)
    setEditData({ ...capture })
  }

  const handleSaveCapture = async () => {
    if (!editingId) return
    setLoading(true)
    try {
      // In production, we'd need a way to update captures.
      // For now, we'll re-save the capture with its original ID
      await dataService.createCapture(editData, currentUser.companyId)

      // Update local state
      setCaptures(prev => prev.map(c => (c.id === editingId ? editData : c)))
      setEditingId(null)
      setEditData({})

      // In a real app, recalculateProduction would be a Cloud Function or complex service
      // alert('Production totals will be updated on the next refresh.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCapture = async (id) => {
    if (window.confirm('Are you sure you want to delete this capture? This will affect today\'s production totals.')) {
      try {
        await dataService.deleteCapture(id, currentUser.companyId)
      } catch (err) {
        alert('Failed to delete capture: ' + err.message)
      }
    }
  }

  const tabs = [
    { id: 'captures', label: 'Captures', icon: Truck },
    { id: 'production', label: 'Analytics', icon: BarChart3 },
    { id: 'sites', label: 'Sites', icon: MapPin },
    { id: 'mines', label: 'Mines', icon: Map },
    { id: 'trucks', label: 'Fleet', icon: Truck },
    { id: 'users', label: 'Personnel', icon: Users },
    { id: 'projects', label: 'Projects', icon: Briefcase }
  ]

  const handleImportCSV = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setImportStatus({ loading: true, result: null })
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const text = e.target.result
        const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()))
        const headers = rows[0]
        const data = rows.slice(1).filter(row => row.length === headers.length)

        let successCount = 0
        for (const row of data) {
          const item = {}
          headers.forEach((header, index) => {
            item[header] = row[index]
          })

          // Save based on active tab or auto-detect
          const itemWithTenant = { ...item, companyId: currentUser.companyId }
          if (activeTab === 'users') {
            await dataService.saveUser({ ...itemWithTenant, id: item.id || Date.now() + Math.random() })
          } else if (activeTab === 'sites') {
            await dataService.saveSite({ ...itemWithTenant, id: item.id || Date.now() + Math.random(), dailyTarget: Number(item.dailyTarget) }, currentUser.companyId)
          } else if (activeTab === 'trucks') {
            await dataService.saveTruck({ ...itemWithTenant, id: item.id || Date.now() + Math.random(), capacity: Number(item.capacity) }, currentUser.companyId)
          } else if (activeTab === 'projects') {
            await dataService.saveProject({ ...itemWithTenant, id: item.id || Date.now() + Math.random() }, currentUser.companyId)
          } else if (activeTab === 'mines') {
            await dataService.saveMine({ ...itemWithTenant, id: item.id || Date.now() + Math.random() }, currentUser.companyId)
          }
          successCount++
        }
        setImportStatus({ loading: false, result: `Successfully imported ${successCount} ${activeTab}.` })
        setTimeout(() => setShowImportModal(false), 3000)
      } catch (err) {
        setImportStatus({ loading: false, result: 'Error parsing CSV: ' + err.message })
      }
    }
    reader.readAsText(file)
  }

  return (
    <main className="space-y-12">
      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-4 lg:pb-0">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all whitespace-nowrap text-xs font-black uppercase tracking-widest ${activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 text-blue-600 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-blue-100 dark:border-blue-900/20 shadow-sm hover:bg-blue-50 transition-all"
          >
            <Upload size={14} /> Bulk Onboarding
          </button>

          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <Filter size={14} className="text-blue-600" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 focus:ring-0 p-0"
              />
            </div>
            <button
              className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors"
              onClick={() => setFilterDate(new Date().toISOString().split('T')[0])}
              title="Today"
            >
              <Search size={18} />
            </button>
          </div>
        </div>

      </div>

      {/* Data Actions & Filters */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {(activeTab === 'captures' || activeTab === 'production') && (
            <>
              <label className="font-semibold text-gray-700 dark:text-gray-300">Filter by Date:</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </>
          )}
        </div>

        <button
          onClick={() => {
            let data = []
            let fileName = `production_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`

            // For simple tabs, we can't easily get the data here without lifting state
            // But for captures and production, we have it in the parent state
            if (activeTab === 'captures') data = captures
            else if (activeTab === 'production') data = production
            else {
              alert('Please use the export button within the ' + activeTab + ' table below for full database exports.')
              return
            }

            exportToCSV(data, fileName)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold shadow-sm"
        >
          <FileText size={18} />
          Export {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} to CSV
        </button>
      </div>

      {/* Captures Tab */}
      {activeTab === 'captures' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Site</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Truck</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Loads</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tons</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {captures.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No captures for {filterDate}
                    </td>
                  </tr>
                ) : (
                  captures.map(capture => (
                    <tr key={capture.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      {editingId === capture.id ? (
                        <>
                          <td className="px-6 py-3">{capture.siteName}</td>
                          <td className="px-6 py-3">{capture.truckName}</td>
                          <td className="px-6 py-3">
                            <input
                              type="number"
                              value={editData.loads}
                              onChange={(e) => setEditData(prev => ({ ...prev, loads: Number(e.target.value) }))}
                              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                            />
                          </td>
                          <td className="px-6 py-3">
                            <input
                              type="number"
                              value={editData.tons}
                              onChange={(e) => setEditData(prev => ({ ...prev, tons: Number(e.target.value) }))}
                              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                            />
                          </td>
                          <td className="px-6 py-3 flex gap-2">
                            <button
                              onClick={handleSaveCapture}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-3 font-medium text-gray-800 dark:text-gray-200">{capture.siteName}</td>
                          <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{capture.truckName}</td>
                          <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{capture.loads}</td>
                          <td className="px-6 py-3 font-semibold text-gray-800 dark:text-gray-200">{capture.tons}t</td>
                          <td className="px-6 py-3 flex gap-2">
                            <button
                              onClick={() => handleEditCapture(capture)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCapture(capture.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Production Summary Tab */}
      {activeTab === 'production' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Site</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Target</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actual</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Variance</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Trucks</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {production.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No production data for {filterDate}
                    </td>
                  </tr>
                ) : (
                  production.map(prod => (
                    <tr key={prod.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-3 font-medium text-gray-800 dark:text-gray-200">{prod.siteName}</td>
                      <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{prod.target}t</td>
                      <td className="px-6 py-3 font-semibold text-gray-800 dark:text-gray-200">{prod.actual}t</td>
                      <td className={`px-6 py-3 font-semibold ${prod.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {prod.variance >= 0 ? '+' : ''}{prod.variance}%
                      </td>
                      <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{prod.trucksUsed}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${prod.status === 'On Target' ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                          {prod.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sites Tab */}
      {activeTab === 'sites' && <SitesDatabase currentUser={currentUser} />}

      {/* Mines Tab */}
      {activeTab === 'mines' && <MinesDatabase currentUser={currentUser} />}

      {/* Trucks Tab */}
      {activeTab === 'trucks' && <TrucksDatabase currentUser={currentUser} />}

      {/* Users Tab */}
      {activeTab === 'users' && <UsersDatabase currentUser={currentUser} />}

      {/* Projects Tab */}
      {activeTab === 'projects' && <ProjectsDatabase currentUser={currentUser} />}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
                  <Upload size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Bulk {activeTab} Import</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Master Data Onboarding</p>
                </div>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center">
                  <Info size={12} className="mr-2" /> Required CSV Headers
                </h4>
                <code className="text-xs font-bold text-blue-600 dark:text-blue-400 break-all">
                  {activeTab === 'users' && 'name,surname,email,password,role,company'}
                  {activeTab === 'sites' && 'siteName,mineName,resource,dailyTarget,status'}
                  {activeTab === 'trucks' && 'truckName,type,capacity,status'}
                  {activeTab === 'projects' && 'projectName,mineName,status'}
                  {activeTab === 'mines' && 'name,location,status'}
                  {(activeTab === 'captures' || activeTab === 'production') && 'Please select a master data tab (Sites, Users, etc) to use import.'}
                </code>
              </div>

              {importStatus.result ? (
                <div className={`p-4 rounded-xl text-center font-bold text-sm ${importStatus.result.includes('Error') ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {importStatus.result}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileText className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-500">Click to upload CSV file</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Maximum 500 records</p>
                  </div>
                  <input type="file" className="hidden" accept=".csv" onChange={handleImportCSV} disabled={importStatus.loading} />
                </label>
              )}

              {importStatus.loading && (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-black uppercase tracking-widest text-blue-600">Processing Data...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function SitesDatabase({ currentUser }) {
  const [sites, setSites] = useState([])
  const [mines, setMines] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})

  useEffect(() => {
    const unsubSites = dataService.subscribeToSites(setSites, currentUser.companyId)
    const unsubMines = dataService.subscribeToMines(setMines, currentUser.companyId)
    return () => {
      unsubSites()
      unsubMines()
    }
  }, [currentUser])

  const handleEdit = (site) => {
    setEditingId(site.id)
    setEditData({ ...site })
  }

  const handleSave = async () => {
    await dataService.saveSite(editData, currentUser.companyId)
    setEditingId(null)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this site? This action cannot be undone.')) {
      try {
        await dataService.deleteSite(id, currentUser.companyId)
      } catch (err) {
        alert('Failed to delete site: ' + err.message)
      }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
        <h3 className="font-bold text-gray-700 dark:text-gray-300">Sites Master Records</h3>
        <button
          onClick={() => exportToCSV(sites, 'production_sites_master.csv')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-bold hover:bg-emerald-700 transition-colors"
        >
          <FileText size={14} /> Export Sites
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <th className="px-6 py-3 text-left text-sm font-semibold">Site Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Mine</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Resource</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Daily Target</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sites.map(site => (
              <tr key={site.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {editingId === site.id ? (
                  <>
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={editData.siteName}
                        onChange={(e) => setEditData(prev => ({ ...prev, siteName: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <select
                        value={editData.mineId || ''}
                        onChange={(e) => {
                          const mine = mines.find(m => m.id === Number(e.target.value))
                          setEditData(prev => ({ ...prev, mineId: Number(e.target.value), mineName: mine ? mine.name : '' }))
                        }}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select Mine</option>
                        {mines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={editData.resource}
                        onChange={(e) => setEditData(prev => ({ ...prev, resource: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="number"
                        value={editData.dailyTarget}
                        onChange={(e) => setEditData(prev => ({ ...prev, dailyTarget: Number(e.target.value) }))}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="px-6 py-3 flex gap-2">
                      <button
                        onClick={handleSave}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-3 font-medium">{site.siteName}</td>
                    <td className="px-6 py-3">{site.mineName}</td>
                    <td className="px-6 py-3">{site.resource}</td>
                    <td className="px-6 py-3">{site.dailyTarget}t</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${site.status === 'Active' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'
                        }`}>
                        {site.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(site)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(site.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MinesDatabase({ currentUser }) {
  const [mines, setMines] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})

  useEffect(() => {
    const unsub = dataService.subscribeToMines((data) => setMines(data), currentUser.companyId)
    return () => unsub()
  }, [currentUser])

  const handleEdit = (mine) => {
    setEditingId(mine.id)
    setEditData({ ...mine })
  }

  const handleSave = async () => {
    await dataService.saveMine(editData, currentUser.companyId)
    setEditingId(null)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this mine? This action cannot be undone.')) {
      try {
        await dataService.deleteMine(id, currentUser.companyId)
      } catch (err) {
        alert('Failed to delete mine: ' + err.message)
      }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
        <h3 className="font-bold text-gray-700 dark:text-gray-300">Mines Master Records</h3>
        <button
          onClick={() => exportToCSV(mines, 'production_mines_master.csv')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-bold hover:bg-emerald-700 transition-colors"
        >
          <FileText size={14} /> Export Mines
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <th className="px-6 py-3 text-left text-sm font-semibold">Mine Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Operation</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Location</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mines.map(mine => (
              <tr key={mine.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {editingId === mine.id ? (
                  <>
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={editData.operation}
                        onChange={(e) => setEditData(prev => ({ ...prev, operation: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={editData.location}
                        onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-3 flex gap-2">
                      <button
                        onClick={handleSave}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-3 font-medium text-gray-800 dark:text-gray-200">{mine.name}</td>
                    <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{mine.operation}</td>
                    <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{mine.location}</td>
                    <td className="px-6 py-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(mine)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(mine.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TrucksDatabase({ currentUser }) {
  const [trucks, setTrucks] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})

  useEffect(() => {
    const unsub = dataService.subscribeToTrucks((data) => setTrucks(data), currentUser.companyId)
    return () => unsub()
  }, [currentUser])

  const handleEdit = (truck) => {
    setEditingId(truck.id)
    setEditData({ ...truck })
  }

  const handleSave = async () => {
    await dataService.saveTruck(editData, currentUser.companyId)
    setEditingId(null)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this truck? This action cannot be undone.')) {
      try {
        await dataService.deleteTruck(id, currentUser.companyId)
      } catch (err) {
        alert('Failed to delete truck: ' + err.message)
      }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
        <h3 className="font-bold text-gray-700 dark:text-gray-300">Fleet Master Records</h3>
        <button
          onClick={() => exportToCSV(trucks, 'production_trucks_master.csv')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-bold hover:bg-emerald-700 transition-colors"
        >
          <FileText size={14} /> Export Trucks
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <th className="px-6 py-3 text-left text-sm font-semibold">Truck</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Site</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Capacity</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trucks.map(truck => (
              <tr key={truck.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {editingId === truck.id ? (
                  <>
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={editData.truckName}
                        onChange={(e) => setEditData(prev => ({ ...prev, truckName: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={editData.siteName}
                        onChange={(e) => setEditData(prev => ({ ...prev, siteName: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={editData.type}
                        onChange={(e) => setEditData(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="number"
                        value={editData.capacity}
                        onChange={(e) => setEditData(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="px-6 py-3 flex gap-2">
                      <button
                        onClick={handleSave}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-3 font-medium">{truck.truckName}</td>
                    <td className="px-6 py-3">{truck.siteName}</td>
                    <td className="px-6 py-3">{truck.type}</td>
                    <td className="px-6 py-3">{truck.capacity}t</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${truck.status === 'Active' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'
                        }`}>
                        {truck.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(truck)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(truck.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function UsersDatabase({ currentUser }) {
  const [users, setUsers] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})

  useEffect(() => {
    // Note: users are still in a global node but filtered by companyId in the rules/service
    const unsub = dataService.subscribeToUsers((data) => setUsers(data), currentUser.companyId)
    return () => unsub()
  }, [currentUser])

  const handleEdit = (user) => {
    setEditingId(user.id)
    setEditData({ ...user })
  }

  const handleSave = async () => {
    await dataService.saveUser(editData, currentUser.companyId)
    setEditingId(null)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? Access to the console will be revoked immediately.')) {
      try {
        await dataService.deleteUser(id, currentUser.companyId)
      } catch (err) {
        alert('Failed to delete user: ' + err.message)
      }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
        <h3 className="font-bold text-gray-700 dark:text-gray-300">User Access Control</h3>
        <button
          onClick={() => exportToCSV(users, 'production_users_master.csv')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-bold hover:bg-emerald-700 transition-colors"
        >
          <FileText size={14} /> Export Users
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Surname</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Assigned Site</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {editingId === user.id ? (
                  <>
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={editData.surname || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, surname: e.target.value }))}
                        placeholder="Surname"
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <select
                        value={editData.role}
                        onChange={(e) => setEditData(prev => ({ ...prev, role: e.target.value }))}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="siteManager">Site Manager</option>
                      </select>
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="number"
                        value={editData.assignedSite || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, assignedSite: e.target.value ? Number(e.target.value) : null }))}
                        placeholder="Site ID"
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-3 flex gap-2">
                      <button
                        onClick={handleSave}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-3 font-medium">{user.name}</td>
                    <td className="px-6 py-3 font-medium">{user.surname}</td>
                    <td className="px-6 py-3">{user.email}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-blue-200 text-blue-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-3">{user.assignedSite || '—'}</td>
                    <td className="px-6 py-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProjectsDatabase({ currentUser }) {
  const [projects, setProjects] = useState([])
  const [mines, setMines] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})

  useEffect(() => {
    const unsubProjects = dataService.subscribeToProjects(setProjects, currentUser.companyId)
    const unsubMines = dataService.subscribeToMines(setMines, currentUser.companyId)
    return () => {
      unsubProjects()
      unsubMines()
    }
  }, [currentUser])

  const handleEdit = (project) => {
    setEditingId(project.id)
    setEditData({ ...project })
  }

  const handleSave = async () => {
    await dataService.saveProject(editData, currentUser.companyId)
    setEditingId(null)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await dataService.deleteProject(id, currentUser.companyId)
      } catch (err) {
        alert('Failed to delete project: ' + err.message)
      }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
        <h3 className="font-bold text-gray-700 dark:text-gray-300">Project Initiatives</h3>
        <button
          onClick={() => exportToCSV(projects, 'production_projects_master.csv')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-bold hover:bg-emerald-700 transition-colors"
        >
          <FileText size={14} /> Export Projects
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <th className="px-6 py-3 text-left text-sm font-semibold">Project</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Mine</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {editingId === project.id ? (
                  <>
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={editData.projectName}
                        onChange={(e) => setEditData(prev => ({ ...prev, projectName: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <select
                        value={editData.mineId || ''}
                        onChange={(e) => {
                          const mine = mines.find(m => m.id === Number(e.target.value))
                          setEditData(prev => ({ ...prev, mineId: Number(e.target.value), mineName: mine ? mine.name : '' }))
                        }}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select Mine</option>
                        {mines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-3">
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      >
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                      </select>
                    </td>
                    <td className="px-6 py-3 flex gap-2">
                      <button
                        onClick={handleSave}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-3 font-medium">{project.projectName}</td>
                    <td className="px-6 py-3">{project.mine}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${project.status === 'Active' ? 'bg-green-200 text-green-800' :
                        project.status === 'Completed' ? 'bg-blue-200 text-blue-800' :
                          'bg-yellow-200 text-yellow-800'
                        }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(project)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminDataManagement

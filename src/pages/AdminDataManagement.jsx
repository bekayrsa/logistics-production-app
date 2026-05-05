import { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import { exportToCSV } from '../utils/exportUtils'
import { Plus, Edit2, Trash2, Database, Shield, Layout, Users, Truck, MapPin, Briefcase, FileText, Search, Filter, Save, X, AlertCircle } from 'lucide-react'

function AdminDataManagement({ currentUser }) {
  if (currentUser?.role !== 'admin') {
    return (
      <main className="p-6">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200">Access Denied</h2>
          <p className="text-red-700 dark:text-red-300 mt-2">Only Company Admins can access this page.</p>
        </div>
      </main>
    )
  }

  const [activeTab, setActiveTab] = useState('captures')
  const [captures, setCaptures] = useState([])
  const [production, setProduction] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])

  const loadData = async () => {
    setLoading(true)
    try {
      const allCaptures = await dataService.getCaptures()
      const filteredCaptures = allCaptures.filter(c => c.date === filterDate)
      setCaptures(filteredCaptures)

      const allProduction = await dataService.getProduction()
      const filteredProduction = allProduction.filter(p => p.date === filterDate)
      setProduction(filteredProduction)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filterDate, activeTab])

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
      await dataService.createCapture(editData) // Assuming createCapture handles updates if ID exists or we add an updateCapture
      
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
        await dataService.deleteCapture(id)
        loadData()
      } catch (err) {
        alert('Failed to delete capture: ' + err.message)
      }
    }
  }

  const tabs = [
    { id: 'captures', label: 'Truck Captures', icon: '🚚' },
    { id: 'production', label: 'Production Summary', icon: '📊' },
    { id: 'sites', label: 'Sites Database', icon: '🏭' },
    { id: 'trucks', label: 'Trucks Database', icon: '🚛' },
    { id: 'users', label: 'Users Database', icon: '👥' },
    { id: 'projects', label: 'Projects Database', icon: '📋' }
  ]

  return (
    <main className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Admin Data Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Full data control and override capabilities</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              setEditingId(null)
            }}
            className={`px-4 py-2 whitespace-nowrap rounded-t-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Date Filter for Captures */}
      {(activeTab === 'captures' || activeTab === 'production') && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="font-semibold text-gray-700 dark:text-gray-300">Filter by Date:</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <button
            onClick={() => {
              const data = activeTab === 'captures' ? captures : production;
              const fileName = `logistics_${activeTab}_${filterDate}.csv`;
              exportToCSV(data, fileName);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
          >
            <FileText size={18} />
            Export to CSV
          </button>
        </div>
      )}

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
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                          prod.status === 'On Target' ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200' :
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
      {activeTab === 'sites' && <SitesDatabase />}

      {/* Trucks Tab */}
      {activeTab === 'trucks' && <TrucksDatabase />}

      {/* Users Tab */}
      {activeTab === 'users' && <UsersDatabase />}

      {/* Projects Tab */}
      {activeTab === 'projects' && <ProjectsDatabase />}
    </main>
  )
}

function SitesDatabase() {
  const [sites, setSites] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})

  const loadSites = async () => {
    const data = await dataService.getSites()
    setSites(data)
  }

  useEffect(() => {
    loadSites()
  }, [])

  const handleEdit = (site) => {
    setEditingId(site.id)
    setEditData({ ...site })
  }

  const handleSave = async () => {
    await dataService.saveSite(editData)
    setEditingId(null)
    loadSites()
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this site? This action cannot be undone.')) {
      try {
        await dataService.deleteSite(id)
        loadSites()
      } catch (err) {
        alert('Failed to delete site: ' + err.message)
      }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
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
                      <input
                        type="text"
                        value={editData.mineName}
                        onChange={(e) => setEditData(prev => ({ ...prev, mineName: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
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
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                        site.status === 'Active' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'
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

function TrucksDatabase() {
  const [trucks, setTrucks] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})

  const loadTrucks = async () => {
    const data = await dataService.getTrucks()
    setTrucks(data)
  }

  useEffect(() => {
    loadTrucks()
  }, [])

  const handleEdit = (truck) => {
    setEditingId(truck.id)
    setEditData({ ...truck })
  }

  const handleSave = async () => {
    await dataService.saveTruck(editData)
    setEditingId(null)
    loadTrucks()
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this truck? This action cannot be undone.')) {
      try {
        await dataService.deleteTruck(id)
        loadTrucks()
      } catch (err) {
        alert('Failed to delete truck: ' + err.message)
      }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
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
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                        truck.status === 'Active' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'
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

function UsersDatabase() {
  const [users, setUsers] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})

  const loadUsers = async () => {
    const data = await dataService.getUsers()
    setUsers(data)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleEdit = (user) => {
    setEditingId(user.id)
    setEditData({ ...user })
  }

  const handleSave = async () => {
    await dataService.saveUser(editData)
    setEditingId(null)
    loadUsers()
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? Access to the console will be revoked immediately.')) {
      try {
        await dataService.deleteUser(id)
        loadUsers()
      } catch (err) {
        alert('Failed to delete user: ' + err.message)
      }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
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

function ProjectsDatabase() {
  const [projects, setProjects] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})

  const loadProjects = async () => {
    const data = await dataService.getProjects()
    setProjects(data)
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleEdit = (project) => {
    setEditingId(project.id)
    setEditData({ ...project })
  }

  const handleSave = async () => {
    await dataService.saveProject(editData)
    setEditingId(null)
    loadProjects()
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await dataService.deleteProject(id)
        loadProjects()
      } catch (err) {
        alert('Failed to delete project: ' + err.message)
      }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
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
                      <input
                        type="text"
                        value={editData.mine}
                        onChange={(e) => setEditData(prev => ({ ...prev, mine: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
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
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                        project.status === 'Active' ? 'bg-green-200 text-green-800' :
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

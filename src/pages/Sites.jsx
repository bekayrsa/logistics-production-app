import { useState, useEffect } from 'react'
import { getData, saveData } from '../utils/localStorage'

function Sites({ currentUser }) {
  const [sites, setSites] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    siteName: '',
    resource: 'Coal',
    dailyTarget: ''
  })

  useEffect(() => {
    if (!currentUser) return
    loadSites()
  }, [currentUser])

  const loadSites = () => {
    let storedSites = getData('sites') || []
    if (currentUser.role === 'siteManager') {
      storedSites = storedSites.filter(site => site.id === currentUser.assignedSite)
    }
    setSites(storedSites)
  }

  const saveSites = (newSites) => {
    const allSites = getData('sites') || []
    const otherSites = allSites.filter(site => !newSites.some(ns => ns.id === site.id))
    const updatedAll = [...otherSites, ...newSites]
    setSites(newSites)
    saveData('sites', updatedAll)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (currentUser.role !== 'admin') return

    if (editingId !== null) {
      // Update existing
      const updatedSites = sites.map(site =>
        site.id === editingId ? { ...site, ...formData } : site
      )
      saveSites(updatedSites)
      setEditingId(null)
    } else {
      // Add new
      const newSite = {
        id: Date.now(),
        ...formData,
        mineId: 1, // Default
        companyId: 1,
        assignedManager: 'Manager',
        managerId: 1,
        status: 'Active'
      }
      saveSites([...sites, newSite])
    }
    setFormData({ siteName: '', resource: 'Coal', dailyTarget: '' })
  }

  const handleEdit = (site) => {
    if (currentUser.role !== 'admin') return
    setEditingId(site.id)
    setFormData({
      siteName: site.siteName,
      resource: site.resource,
      dailyTarget: site.dailyTarget
    })
  }

  const handleDelete = (id) => {
    if (currentUser.role !== 'admin') return
    const updatedSites = sites.filter(site => site.id !== id)
    saveSites(updatedSites)
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({ siteName: '', resource: 'Coal', dailyTarget: '' })
  }

  const canEdit = currentUser?.role === 'admin'
  const canView = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'siteManager'

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Sites Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage production sites across mines</p>
      </div>

      {canEdit && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{editingId ? '✎ Edit Site' : '+ Add New Site'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Site Name</label>
              <input
                type="text"
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resource</label>
              <select
                value={formData.resource}
                onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Coal">Coal</option>
                <option value="Chrome">Chrome</option>
                <option value="Platinum">Platinum</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Daily Target (tons)</label>
              <input
                type="number"
                value={formData.dailyTarget}
                onChange={(e) => setFormData({ ...formData, dailyTarget: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
              {editingId ? '✓ Update' : '+ Add'} Site
            </button>
            {editingId && (
              <button type="button" onClick={handleCancel} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Sites Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 p-6 rounded-lg shadow border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Total Sites</p>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{sites.length}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 p-6 rounded-lg shadow border border-green-200 dark:border-green-800">
          <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">Combined Daily Target</p>
          <p className="text-3xl font-bold text-green-900 dark:text-green-100">{sites.reduce((sum, s) => sum + Number(s.dailyTarget || 0), 0)}t</p>
        </div>
      </div>

      {/* Sites Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Site Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Resource</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Daily Target</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sites.length > 0 ? sites.map(site => (
              <tr key={site.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{site.siteName}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    site.resource === 'Coal' ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                    site.resource === 'Chrome' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' :
                    'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                  }`}>
                    {site.resource}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-center font-semibold text-gray-900 dark:text-white">{site.dailyTarget}t</td>
                <td className="px-6 py-4 text-sm text-right">
                  {canEdit && (
                    <>
                      <button onClick={() => handleEdit(site)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium mr-4">Edit</button>
                      <button onClick={() => handleDelete(site.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium">Delete</button>
                    </>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <p className="font-medium">No sites configured yet</p>
                  <p className="text-sm mt-1">Add your first site using the form above</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}

export default Sites
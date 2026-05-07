import { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import { MapPin, Plus, Edit2, Trash2, Shield, Target, TrendingUp } from 'lucide-react'

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
    const unsubscribe = dataService.subscribeToSites((storedSites) => {
      let filtered = storedSites
      if (currentUser.role === 'siteManager') {
        filtered = filtered.filter(site => Number(site.id) === Number(currentUser.assignedSite))
      }
      setSites(filtered)
    })
    return () => unsubscribe()
  }, [currentUser])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (currentUser.role !== 'admin') return

    const siteData = {
      ...formData,
      id: editingId || Date.now(),
      mineId: 1, 
      companyId: 1,
      assignedManager: 'Manager',
      managerId: 1,
      status: 'Active'
    }

    await dataService.saveSite(siteData)
    setEditingId(null)
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (currentUser.role !== 'admin') return
    if (window.confirm('Are you sure you want to delete this site?')) {
      try {
        await dataService.deleteSite(id)
      } catch (err) {
        alert('Failed to delete site: ' + err.message)
      }
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({ siteName: '', resource: 'Coal', dailyTarget: '' })
  }

  const getResourceColor = (resource) => {
    if (resource === 'Coal') return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
    if (resource === 'Chrome') return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  }

  const canEdit = currentUser?.role === 'admin'
  const canView = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'siteManager'

  if (!canView) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <Shield size={48} className="mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-bold dark:text-white">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">You do not have permission to manage production sites.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <SummaryCard title="Total Sites" value={sites.length} icon={<MapPin className="text-blue-600" />} />
        <SummaryCard title="Daily Capacity" value={`${sites.reduce((sum, s) => sum + Number(s.dailyTarget || 0), 0)}t`} icon={<Target className="text-emerald-600" />} />
      </div>

      {canEdit && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center">
            {editingId ? <Edit2 className="mr-2 text-blue-600" size={24} /> : <Plus className="mr-2 text-blue-600" size={24} />}
            {editingId ? 'Edit Site Configuration' : 'Register New Production Site'}
          </h3>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 px-1">Site Designation</label>
              <input
                type="text"
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-600 dark:text-white transition-all font-bold"
                placeholder="e.g. North Pit A"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 px-1">Resource Category</label>
              <select
                value={formData.resource}
                onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-600 dark:text-white transition-all font-bold appearance-none"
              >
                <option value="Coal">Coal</option>
                <option value="Chrome">Chrome</option>
                <option value="Platinum">Platinum</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 px-1">Daily Target (Tons)</label>
              <input
                type="number"
                value={formData.dailyTarget}
                onChange={(e) => setFormData({ ...formData, dailyTarget: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-600 dark:text-white transition-all font-bold"
                placeholder="0"
                required
              />
            </div>

            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95">
                {editingId ? 'Update Site' : 'Create Site'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Sites List */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Site Name</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Resource</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Daily Target</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sites.length > 0 ? sites.map(site => (
                <tr key={site.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-5 font-bold text-slate-900 dark:text-white">{site.siteName}</td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getResourceColor(site.resource)}`}>
                      {site.resource}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center font-black text-slate-900 dark:text-white">{site.dailyTarget}t</td>
                  <td className="px-8 py-5 text-right">
                    {canEdit && (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(site)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(site.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-8 py-12 text-center text-slate-400 italic">No sites configured.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ title, value, icon }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{title}</p>
        <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
      </div>
      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
        {icon}
      </div>
    </div>
  )
}

export default Sites
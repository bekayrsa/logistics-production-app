import { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import { Truck, Plus, Edit2, Trash2, Shield, Info, ArrowRight } from 'lucide-react'

function Trucks({ currentUser }) {
  const [trucks, setTrucks] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    truckName: '',
    type: 'ADT',
    capacity: ''
  })

  const loadTrucks = async () => {
    const data = await dataService.getTrucks()
    setTrucks(data)
  }

  useEffect(() => {
    if (!currentUser) return
    loadTrucks()
  }, [currentUser])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (currentUser.role !== 'admin') return

    const truckData = {
      ...formData,
      id: editingId || Date.now(),
      companyId: 1,
      status: 'Active'
    }

    await dataService.saveTruck(truckData)
    setEditingId(null)
    setFormData({ truckName: '', type: 'ADT', capacity: '' })
    loadTrucks()
  }

  const handleEdit = (truck) => {
    if (currentUser.role !== 'admin') return
    setEditingId(truck.id)
    setFormData({
      truckName: truck.truckName,
      type: truck.type,
      capacity: truck.capacity
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (currentUser.role !== 'admin') return
    if (window.confirm('Are you sure you want to delete this truck?')) {
      // In a full implementation, we'd add deleteTruck to dataService
      console.log('Delete requested for truck:', id)
      alert('Delete functionality is currently being finalized in the cloud backend.')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({ truckName: '', type: 'ADT', capacity: '' })
  }

  const getTruckTypeColor = (type) => {
    if (type === 'ADT') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    if (type === 'Rigid Hauler') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
  }

  const totalCapacity = trucks.reduce((sum, t) => sum + Number(t.capacity || 0), 0)

  const canView = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'siteManager'
  const canEdit = currentUser?.role === 'admin'

  if (!canView) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <Shield size={48} className="mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-bold dark:text-white">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">You do not have permission to manage the fleet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <SummaryCard title="Total Fleet" value={trucks.length} icon={<Truck className="text-blue-600" />} />
        <SummaryCard title="Total Capacity" value={`${totalCapacity}t`} icon={<Info className="text-emerald-600" />} />
        <SummaryCard title="Avg Capacity" value={`${trucks.length > 0 ? Math.round(totalCapacity / trucks.length) : 0}t`} icon={<ArrowRight className="text-violet-600" />} />
      </div>

      {canEdit && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center">
            {editingId ? <Edit2 className="mr-2 text-blue-600" size={24} /> : <Plus className="mr-2 text-blue-600" size={24} />}
            {editingId ? 'Edit Vehicle Config' : 'Register New Vehicle'}
          </h3>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 px-1">Truck Designation</label>
              <input
                type="text"
                value={formData.truckName}
                onChange={(e) => setFormData({ ...formData, truckName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-600 dark:text-white transition-all font-bold"
                placeholder="e.g. KOM-930E-01"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 px-1">Vehicle Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-600 dark:text-white transition-all font-bold appearance-none"
              >
                <option value="ADT">ADT (Articulated Dump Truck)</option>
                <option value="Rigid Hauler">Rigid Hauler</option>
                <option value="Tippertruck">Tippertruck</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 px-1">Payload Capacity (Tons)</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-600 dark:text-white transition-all font-bold"
                placeholder="0"
                required
              />
            </div>

            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95">
                {editingId ? 'Update Configuration' : 'Add Vehicle to Fleet'}
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

      {/* Fleet Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Designation</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Classification</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Capacity</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Status</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {trucks.length > 0 ? trucks.map(truck => (
                <tr key={truck.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-5 font-bold text-slate-900 dark:text-white">{truck.truckName}</td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getTruckTypeColor(truck.type)}`}>
                      {truck.type}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center font-black text-slate-900 dark:text-white">{truck.capacity}t</td>
                  <td className="px-8 py-5 text-center">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Active</span>
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    {canEdit && (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(truck)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(truck.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-8 py-12 text-center text-slate-400 italic">No vehicles registered in fleet.</td>
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

export default Trucks
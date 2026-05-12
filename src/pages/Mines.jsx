// (RS) Logistics Production App
import { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import { Map, Plus, Edit2, Trash2, Shield, Drill, Locate, Factory } from 'lucide-react'

function Mines({ currentUser }) {
  const [mines, setMines] = useState([])
  const [sites, setSites] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    operation: 'Open Pit',
    location: ''
  })

  useEffect(() => {
    if (!currentUser) return
    const unsubMines = dataService.subscribeToMines((data) => setMines(data), currentUser.companyId)
    const unsubSites = dataService.subscribeToSites((data) => setSites(data), currentUser.companyId)
    return () => {
      unsubMines()
      unsubSites()
    }
  }, [currentUser])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (currentUser.role !== 'admin') return

    const mineData = {
      ...formData,
      id: editingId || Date.now()
    }

    await dataService.saveMine(mineData, currentUser.companyId)
    setEditingId(null)
    setFormData({ name: '', operation: 'Open Pit', location: '' })
  }

  const handleEdit = (mine) => {
    if (currentUser.role !== 'admin') return
    setEditingId(mine.id)
    setFormData({
      name: mine.name,
      operation: mine.operation,
      location: mine.location
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (currentUser.role !== 'admin') return
    if (window.confirm('Are you sure you want to delete this mine?')) {
      try {
        await dataService.deleteMine(id, currentUser.companyId)
      } catch (err) {
        alert('Failed to delete mine: ' + err.message)
      }
    }
  }

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'superAdmin'
  const canView = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'superAdmin'

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-3xl flex items-center justify-center text-rose-600 mb-6">
          <Shield size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs font-medium">You do not have the necessary clearance to access organizational mine records.</p>
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <SummaryCard 
          label="Total Operations" 
          value={mines.length} 
          icon={<Drill className="text-blue-600" />} 
          color="blue"
        />
        <SummaryCard 
          label="Active Sites" 
          value={sites.length} 
          icon={<Factory className="text-emerald-600" />} 
          color="emerald"
        />
        <SummaryCard 
          label="Global Locations" 
          value={[...new Set(mines.map(m => m.location))].length} 
          icon={<Locate className="text-violet-600" />} 
          color="violet"
        />
      </div>

      {canEdit && (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
            {editingId ? <Edit2 className="text-blue-600" /> : <Plus className="text-blue-600" />}
            {editingId ? 'Modify Operation' : 'Register New Mine'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Mine Name</label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Black Rock North"
                className="w-full px-8 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Operation Type</label>
              <select 
                value={formData.operation}
                onChange={e => setFormData(prev => ({ ...prev, operation: e.target.value }))}
                className="w-full px-8 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 dark:text-white appearance-none"
              >
                <option value="Open Pit">Open Pit</option>
                <option value="Underground">Underground</option>
                <option value="Alluvial">Alluvial</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Location</label>
              <input 
                required
                value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Region / Coordinate"
                className="w-full px-8 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 dark:text-white"
              />
            </div>
            <div className="lg:col-span-3 flex justify-end gap-4 pt-4">
              {editingId && (
                <button 
                  type="button"
                  onClick={() => { setEditingId(null); setFormData({ name: '', operation: 'Open Pit', location: '' }) }}
                  className="px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button 
                type="submit"
                className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
              >
                {editingId ? 'Update Record' : 'Add Operation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {mines.map(mine => {
          const mineSites = sites.filter(s => s.mineId === mine.id)
          return (
            <div key={mine.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-8">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 transition-all duration-500">
                  <Map size={24} />
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(mine)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(mine.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                  </div>
                )}
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{mine.name}</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{mine.location}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-50 dark:border-slate-800">
                <div className="col-span-2 mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Connected Sites</p>
                  <div className="flex flex-wrap gap-2">
                    {mineSites.length > 0 ? mineSites.map(s => (
                      <span key={s.id} className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                        {s.siteName}
                      </span>
                    )) : <span className="text-[10px] italic text-slate-400">No active sites linked</span>}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Type</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{mine.operation}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Capacity</p>
                  <p className="text-sm font-bold text-blue-600">{mineSites.length} Units</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20'
  }
  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${colors[color]}`}>
        {icon}
      </div>
    </div>
  )
}

export default Mines

// (RS) Logistics Production App
import { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import { Briefcase, Plus, Edit2, Trash2, Shield, Layers, Calendar, Target } from 'lucide-react'

function Projects({ currentUser }) {
  const [projects, setProjects] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    projectName: '',
    mineId: '',
    mineName: '',
    status: 'Active'
  })
  const [mines, setMines] = useState([])

  useEffect(() => {
    if (!currentUser) return
    if (currentUser.role === 'siteManager') return
    const unsubProjects = dataService.subscribeToProjects(setProjects, currentUser.companyId)
    const unsubMines = dataService.subscribeToMines(setMines, currentUser.companyId)
    return () => {
      unsubProjects()
      unsubMines()
    }
  }, [currentUser])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (currentUser.role !== 'admin') return

    const projectData = {
      ...formData,
      id: editingId || Date.now()
    }

    await dataService.saveProject(projectData, currentUser.companyId)
    setEditingId(null)
    setFormData({ projectName: '', mineId: '', mineName: '', status: 'Active' })
  }

  const handleEdit = (project) => {
    if (currentUser.role !== 'admin') return
    setEditingId(project.id)
    setFormData({
      projectName: project.projectName,
      mineId: project.mineId || '',
      mineName: project.mineName || project.mine || '',
      status: project.status
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (currentUser.role !== 'admin') return
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await dataService.deleteProject(id, currentUser.companyId)
      } catch (err) {
        alert('Failed to delete project: ' + err.message)
      }
    }
  }

  const canEdit = currentUser?.role === 'admin'
  const canView = currentUser?.role === 'admin' || currentUser?.role === 'manager'

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-3xl flex items-center justify-center text-rose-600 mb-6">
          <Shield size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs font-medium">Strategic project data is restricted to executive management and administrators.</p>
      </div>
    )
  }

  const getStatusStyle = (status) => {
    if (status === 'Active') return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800'
    if (status === 'Completed') return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800'
    return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800'
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <SummaryCard 
          label="Total Initiatives" 
          value={projects.length} 
          icon={<Layers className="text-blue-600" />} 
          color="blue"
        />
        <SummaryCard 
          label="Active Projects" 
          value={projects.filter(p => p.status === 'Active').length} 
          icon={<Target className="text-emerald-600" />} 
          color="emerald"
        />
        <SummaryCard 
          label="Completed" 
          value={projects.filter(p => p.status === 'Completed').length} 
          icon={<Calendar className="text-violet-600" />} 
          color="violet"
        />
      </div>

      {canEdit && (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
            {editingId ? <Edit2 className="text-blue-600" /> : <Plus className="text-blue-600" />}
            {editingId ? 'Modify Project' : 'Initiate New Project'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Project Identity</label>
              <input 
                required
                value={formData.projectName}
                onChange={e => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                placeholder="e.g. Expansion Phase II"
                className="w-full px-8 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Linked Operation</label>
              <select 
                required
                value={formData.mineId}
                onChange={e => {
                  const mine = mines.find(m => String(m.id) === e.target.value)
                  setFormData(prev => ({ ...prev, mineId: e.target.value, mineName: mine ? mine.name : '' }))
                }}
                className="w-full px-8 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 dark:text-white appearance-none"
              >
                <option value="">Select Mine</option>
                {mines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Lifecycle Status</label>
              <select 
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-8 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 dark:text-white appearance-none"
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
            <div className="lg:col-span-3 flex justify-end gap-4 pt-4">
              {editingId && (
                <button 
                  type="button"
                  onClick={() => { setEditingId(null); setFormData({ projectName: '', mineId: '', mineName: '', status: 'Active' }) }}
                  className="px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button 
                type="submit"
                className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
              >
                {editingId ? 'Update Initiative' : 'Deploy Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {projects.map(project => (
          <div key={project.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Briefcase size={120} className="text-blue-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(project.status)}`}>
                  {project.status}
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(project)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(project.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                  </div>
                )}
              </div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">{project.projectName}</h4>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">{project.mineName || project.mine}</p>
            </div>
          </div>
        ))}
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

export default Projects

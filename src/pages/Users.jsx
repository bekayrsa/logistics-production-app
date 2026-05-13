// (RS) Logistics Production App
import { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import { APP_MODE } from '../config'
import { secondaryAuth } from '../lib/firebase'
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { Users as UsersIcon, Plus, Edit2, Trash2, Shield, Mail, BadgeCheck, Briefcase } from 'lucide-react'

function Users({ currentUser }) {
  const [users, setUsers] = useState([])
  const [sites, setSites] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    role: 'siteManager',
    assignedSites: []
  })

  const canView = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'superAdmin'
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'superAdmin'

  useEffect(() => {
    if (!canView) return
    const isSuperAdmin = currentUser.role === 'superAdmin'
    const unsubUsers = dataService.subscribeToUsers((data) => setUsers(data), currentUser.companyId, isSuperAdmin)
    const unsubSites = dataService.subscribeToSites((data) => setSites(data), currentUser.companyId)
    return () => {
      unsubUsers()
      unsubSites()
    }
  }, [currentUser])

  const handleSubmit = async (e) => {
    if (!canEdit) return
    e.preventDefault()
    
    const userData = {
      ...formData,
      id: isEditing ? editingUser.id : (formData.email.replace(/[@.]/g, '_')),
      companyId: currentUser.companyId
    }

    if (!isEditing && APP_MODE !== 'demo' && secondaryAuth) {
      try {
        await createUserWithEmailAndPassword(secondaryAuth, formData.email, "welcome123");
        await sendPasswordResetEmail(secondaryAuth, formData.email);
      } catch (err) {
        console.error("Firebase Auth Error:", err);
        if (err.code !== 'auth/email-already-in-use') {
          alert('Auth Error: ' + err.message);
          return;
        }
      }
    }

    await dataService.saveUser(userData, currentUser.companyId, currentUser)
    setIsEditing(false)
    setEditingUser(null)
    setFormData({ name: '', email: '', role: 'siteManager', assignedSites: [] })
  }

  const handleEdit = (user) => {
    if (!canEdit) return
    setIsEditing(true)
    setEditingUser(user)
    setFormData({
      name: user.name,
      surname: user.surname || '',
      email: user.email,
      role: user.role,
      assignedSites: user.assignedSites || (user.assignedSite ? [user.assignedSite] : [])
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (userId) => {
    if (window.confirm('Confirm permanent deletion of this user profile?')) {
      try {
        await dataService.deleteUser(userId, currentUser.companyId, currentUser)
      } catch (err) {
        alert('Deletion failed: ' + err.message)
      }
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditingUser(null)
    setFormData({ name: '', surname: '', email: '', role: 'siteManager', assignedSites: [] })
  }

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-3xl flex items-center justify-center text-rose-600 mb-6">
          <Shield size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs font-medium">Personnel records are highly sensitive and restricted to authorized managers.</p>
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <SummaryCard label="Total Personnel" value={users.length} icon={<UsersIcon className="text-blue-600" />} color="blue" />
        <SummaryCard label="Field Managers" value={users.filter(u => u.role === 'siteManager').length} icon={<BadgeCheck className="text-emerald-600" />} color="emerald" />
        <SummaryCard label="Administrators" value={users.filter(u => u.role === 'admin').length} icon={<Shield className="text-violet-600" />} color="violet" />
      </div>

      {canEdit && (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
            {isEditing ? <Edit2 className="text-blue-600" /> : <Plus className="text-blue-600" />}
            {isEditing ? 'Update User Identity' : 'Provision New User'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">First Name</label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John"
                className="w-full px-8 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Surname</label>
              <input 
                required
                value={formData.surname}
                onChange={e => setFormData(prev => ({ ...prev, surname: e.target.value }))}
                placeholder="Doe"
                className="w-full px-8 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Email Credentials</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="corporate@email.com"
                  className="w-full pl-12 pr-8 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 dark:text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Organizational Role</label>
              <select 
                value={formData.role}
                onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-8 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 dark:text-white appearance-none"
              >
                <option value="admin">Company Administrator</option>
                <option value="manager">Operations Manager</option>
                <option value="siteManager">Field Site Manager</option>
                {currentUser?.role === 'superAdmin' && <option value="superAdmin">System SuperAdmin</option>}
              </select>
            </div>
            <div className="lg:col-span-2 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Authorized Site Assignments (Multi-Select)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sites.map(site => (
                  <label 
                    key={site.id} 
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all cursor-pointer ${
                      formData.assignedSites.includes(site.id)
                        ? 'bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-900/20'
                        : 'bg-slate-50 border-transparent text-slate-500 dark:bg-slate-800'
                    }`}
                  >
                    <input 
                      type="checkbox"
                      className="hidden"
                      checked={!!formData.assignedSites?.[String(site.id)]}
                      onChange={() => {
                        const siteIdStr = String(site.id)
                        const nextSites = { ...(formData.assignedSites || {}) }
                        if (nextSites[siteIdStr]) delete nextSites[siteIdStr]
                        else nextSites[siteIdStr] = true
                        setFormData(prev => ({ ...prev, assignedSites: nextSites }))
                      }}
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      formData.assignedSites?.[String(site.id)] ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                    }`}>
                      {formData.assignedSites?.[String(site.id)] && <BadgeCheck size={12} className="text-white" />}
                    </div>
                    <span className="text-xs font-bold">{site.siteName}</span>
                  </label>
                ))}
              </div>
              <p className="text-[9px] font-medium text-slate-400 ml-4">Admins and Managers ignore site restrictions. Site Managers only see data for these selected sites.</p>
            </div>
            <div className="lg:col-span-2 flex justify-end gap-4 pt-4">
              {isEditing && (
                <button 
                  type="button"
                  onClick={handleCancel}
                  className="px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button 
                type="submit"
                className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
              >
                {isEditing ? 'Update Profile' : 'Authorize User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identity</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Auth Role</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Deployment</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {users.map(user => {
                const assignedSiteName = sites.find(s => Number(s.id) === Number(user.assignedSite))?.siteName || 'Global'
                return (
                  <tr key={user.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <UsersIcon size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{user.name} {user.surname}</p>
                          <p className="text-xs font-medium text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        user.role === 'admin' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' :
                        user.role === 'manager' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' :
                        'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex flex-wrap justify-center gap-1 max-w-[200px] mx-auto">
                        {user.role === 'admin' || user.role === 'manager' ? (
                          <span className="text-xs font-bold text-slate-400">Full Access</span>
                        ) : (
                          Object.keys(user.assignedSites || {}).filter(Boolean).map(siteId => {
                            const sName = sites.find(s => String(s.id) === String(siteId))?.siteName || 'Unknown'
                            return (
                              <span key={siteId} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-bold text-slate-600 dark:text-slate-400">
                                {sName}
                              </span>
                            )
                          })
                        )}
                        {!(user.assignedSites?.length || user.assignedSite) && user.role === 'siteManager' && (
                          <span className="text-[10px] italic text-rose-400">No Sites Assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {canEdit && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(user)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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

export default Users

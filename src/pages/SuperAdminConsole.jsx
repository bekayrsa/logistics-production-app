// (RS) Logistics Production App - SuperAdmin Console
import { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import { 
  Building2, Plus, Users, Shield, Globe, 
  Search, ExternalLink, Trash2, Edit2, 
  CheckCircle2, AlertCircle, Layout, ArrowRight
} from 'lucide-react'

function SuperAdminConsole({ currentUser }) {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    industry: 'Mining & Logistics',
    adminName: '',
    adminEmail: '',
    adminPassword: 'welcome123'
  })
  const [status, setStatus] = useState({ type: '', message: '' })

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    setLoading(true)
    const data = await dataService.getCompanies()
    setCompanies(data)
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ type: 'loading', message: 'Onboarding Company...' })
    
    try {
      // 1. Create the Company Record
      const companyId = `comp_${formData.companyName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`
      const companyData = {
        id: companyId,
        name: formData.companyName,
        industry: formData.industry,
        createdAt: new Date().toISOString(),
        status: 'Active'
      }
      
      await dataService.saveCompany(companyData)

      // 2. Provision the Company Admin
      const adminData = {
        id: formData.adminEmail.replace(/[@.]/g, '_'),
        name: formData.adminName,
        email: formData.adminEmail,
        role: 'admin', // This is 'Company Admin'
        companyId: companyId,
        createdAt: new Date().toISOString()
      }

      await dataService.saveUser(adminData)
      
      // 3. Initialize Company Info
      await dataService.saveCompanyInfo({
        companyName: formData.companyName,
        onboardedBy: currentUser.email,
        setupComplete: false
      }, companyId)

      setStatus({ type: 'success', message: 'Company and Admin onboarded successfully!' })
      setShowAddModal(false)
      setFormData({ companyName: '', industry: 'Mining & Logistics', adminName: '', adminEmail: '', adminPassword: 'welcome123' })
      loadCompanies()
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to onboard: ' + err.message })
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('WARNING: Permanent deletion of a company will orphan all its data. Proceed?')) {
      await dataService.deleteCompany(id)
      loadCompanies()
    }
  }

  if (loading && companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-48 gap-6">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Initializing Ecosystem...</p>
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Global Ecosystem</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 flex items-center gap-2">
            <Globe size={16} className="text-blue-600" />
            Managing {companies.length} Independent Organizational Tenants
          </p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={16} /> Onboard New Company
        </button>
      </div>

      {/* Company Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {companies.map(company => (
          <div key={company.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-blue-600/5 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleDelete(company.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 mb-8">
              <Building2 size={28} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{company.name}</h4>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{company.industry}</p>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Company ID</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{company.id}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
                  {company.status}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
               <button className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2">
                 <Shield size={14} /> Admins
               </button>
               <button className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2">
                 <Layout size={14} /> Inspect
               </button>
            </div>
          </div>
        ))}

        {companies.length === 0 && !loading && (
          <div className="lg:col-span-3 py-24 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-6">
              <Building2 size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Clean Slate</h3>
            <p className="text-slate-400 max-w-xs font-medium">No companies have been onboarded to the platform yet.</p>
          </div>
        )}
      </div>

      {/* Onboarding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 w-full max-w-2xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />
            
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-blue-600">
                  <Building2 size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Tenant Onboarding</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Infrastructure Deployment</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <Plus size={32} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Company Name</label>
                  <input 
                    required
                    value={formData.companyName}
                    onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="e.g. Azania Mining"
                    className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-blue-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Industry Sector</label>
                  <select 
                    value={formData.industry}
                    onChange={e => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-blue-600 dark:text-white"
                  >
                    <option>Mining & Logistics</option>
                    <option>Transportation</option>
                    <option>Infrastructure</option>
                  </select>
                </div>
                
                <div className="md:col-span-2 pt-6">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Administrator</span>
                      <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Admin Full Name</label>
                  <input 
                    required
                    value={formData.adminName}
                    onChange={e => setFormData(prev => ({ ...prev, adminName: e.target.value }))}
                    placeholder="Sipho Gumedze"
                    className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-blue-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Admin Email Address</label>
                  <input 
                    required
                    type="email"
                    value={formData.adminEmail}
                    onChange={e => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                    placeholder="sipho.g@company.com"
                    className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-blue-600 dark:text-white"
                  />
                </div>
              </div>

              {status.message && (
                <div className={`p-6 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-2 ${
                  status.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                  status.type === 'loading' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                  'bg-emerald-50 text-emerald-600 border border-emerald-100'
                }`}>
                  {status.type === 'loading' ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <AlertCircle size={20} />}
                  <p className="text-xs font-black uppercase tracking-widest">{status.message}</p>
                </div>
              )}

              <div className="flex justify-end gap-6 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-10 py-5 rounded-3xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={status.type === 'loading'}
                  className="px-12 py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  Confirm Deployment <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SuperAdminConsole

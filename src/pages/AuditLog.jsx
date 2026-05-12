// (RS) Logistics Production App - Audit Center
import { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import { 
  History, Search, Filter, Shield, 
  User, Clock, AlertCircle, ArrowRight,
  Database, FileText, Trash2, Edit2, PlusCircle
} from 'lucide-react'

function AuditLog({ currentUser }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    setLoading(true)
    const data = await dataService.getAuditLogs(currentUser.companyId)
    setLogs(data)
    setLoading(false)
  }

  const getActionIcon = (action) => {
    if (action?.includes('CREATE')) return <PlusCircle size={14} className="text-emerald-500" />
    if (action?.includes('UPDATE')) return <Edit2 size={14} className="text-blue-500" />
    if (action?.includes('DELETE')) return <Trash2 size={14} className="text-rose-500" />
    return <Database size={14} className="text-slate-400" />
  }

  const filteredLogs = logs.filter(log => {
    const searchMatch = !filter || 
      log.performedBy?.email?.toLowerCase().includes(filter.toLowerCase()) ||
      log.performedBy?.name?.toLowerCase().includes(filter.toLowerCase()) ||
      log.entityId?.toLowerCase().includes(filter.toLowerCase())
    
    const typeMatch = typeFilter === 'ALL' || log.entityType === typeFilter
    return searchMatch && typeMatch
  })

  if (loading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-48 gap-6 animate-pulse">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300">
          <History size={32} />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Loading Forensic Records...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Forensic Audit</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 flex items-center gap-2">
            <Shield size={16} className="text-blue-600" />
            Security & Accountability Ledger
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Search by user or ID..."
              className="pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 w-full md:w-64"
            />
          </div>
          <select 
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 text-slate-600 dark:text-slate-300"
          >
            <option value="ALL">All Entities</option>
            <option value="CAPTURE">Captures</option>
            <option value="USER">Users</option>
            <option value="SITE">Sites</option>
            <option value="TRUCK">Trucks</option>
          </select>
        </div>
      </div>

      {/* Log Feed */}
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Operator</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Target</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredLogs.map((log, idx) => (
                <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                        <Clock size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{log.performedBy?.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate max-w-[120px]">
                          {log.performedBy?.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                        {log.action}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg inline-flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{log.entityType}</span>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">#{log.entityId?.slice(-6)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-blue-600 hover:text-blue-700 transition-colors">
                      <ArrowRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredLogs.length === 0 && (
            <div className="py-24 text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                <History size={40} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">No Records Found</h3>
              <p className="text-sm text-slate-400 font-medium">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuditLog

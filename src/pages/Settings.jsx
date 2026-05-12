// (RS) Logistics Production App
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { APP_MODE } from '../config'
import { 
  User, 
  Lock, 
  Moon, 
  Sun, 
  Database, 
  Shield, 
  Bell, 
  Monitor,
  RefreshCw,
  Save,
  ChevronRight,
  LogOut
} from 'lucide-react'
import { dataService } from '../lib/dataService'
import { loadDemoData } from '../utils/demoData'

function Settings({ currentUser }) {
  const { logout, resetPassword } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    surname: currentUser?.surname || '',
    email: currentUser?.email || '',
    role: currentUser?.role || ''
  })

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // In a real app, this would update the user document in Firestore
      // For this demo, we'll simulate success and alert the user
      await new Promise(resolve => setTimeout(resolve, 800))
      setMessage({ type: 'success', text: 'Profile updated successfully (Simulated)' })
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile.' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    setLoading(true)
    try {
      await resetPassword(currentUser.email)
      setMessage({ type: 'success', text: 'Password reset link sent to your email.' })
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to send reset link.' })
    } finally {
      setLoading(false)
    }
  }

  const handleResetData = () => {
    if (window.confirm('This will restore all demo data to factory settings. Continue?')) {
      loadDemoData()
      window.location.reload()
    }
  }

  const tabs = [
    { id: 'profile', label: 'My Account', icon: User },
    { id: 'system', label: 'System & Data', icon: Database },
    { id: 'preferences', label: 'Preferences', icon: Monitor }
  ]

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-72 space-y-2">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-3xl transition-all ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} />
                  <span className="font-bold text-sm">{tab.label}</span>
                </div>
                <ChevronRight size={16} className={activeTab === tab.id ? 'opacity-100' : 'opacity-0'} />
              </button>
            )
          })}
          
          <div className="pt-8 mt-8 border-t border-slate-200 dark:border-slate-800">
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-6 py-4 text-rose-500 font-bold text-sm hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-3xl transition-all"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {message.text && (
            <div className={`mb-8 p-5 rounded-[2rem] border animate-in slide-in-from-top-4 duration-500 flex items-center gap-4 ${
              message.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' 
                : 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400'
            }`}>
              <Shield size={20} />
              <p className="text-sm font-black uppercase tracking-widest">{message.text}</p>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-8">
              <section className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                    <User size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Identity Profile</h3>
                    <p className="text-sm font-medium text-slate-500">Manage your personal organizational identifiers</p>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">First Name</label>
                      <input 
                        type="text" 
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-blue-600 transition-all dark:text-white"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Surname</label>
                      <input 
                        type="text" 
                        value={profileData.surname}
                        onChange={(e) => setProfileData(prev => ({ ...prev, surname: e.target.value }))}
                        className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-blue-600 transition-all dark:text-white"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Email Address</label>
                      <input 
                        type="email" 
                        readOnly
                        value={profileData.email}
                        className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-[2rem] text-sm font-bold text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-3 px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Save size={16} />
                      {loading ? 'Processing...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              </section>

              <section className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
                    <Lock size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Security Credentials</h3>
                    <p className="text-sm font-medium text-slate-500">Update your access authorization protocols</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 max-w-lg">
                  To ensure maximum security, password updates are handled via a verified email encryption link. 
                  Clicking the button below will transmit a reset token to your registered inbox.
                </p>
                <button 
                  onClick={handlePasswordReset}
                  disabled={loading}
                  className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-lg"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  Request Reset Token
                </button>
              </section>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-8">
              <section className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                    <Database size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Environment Config</h3>
                    <p className="text-sm font-medium text-slate-500">Manage application state and data persistence</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl">
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">Active App Mode</p>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">
                        Currently operating in <span className="text-blue-600 font-bold">{APP_MODE.toUpperCase()}</span> environment
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      APP_MODE === 'live' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {APP_MODE}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-rose-100 dark:border-rose-900/30">
                    <div className="max-w-md">
                      <p className="text-sm font-black text-slate-900 dark:text-white">Reset Local Database</p>
                      <p className="text-xs font-medium text-slate-500 mt-1">
                        Reverts all local caches to the production seed state. 
                        Useful for clearing synchronization conflicts or testing fresh site configurations.
                      </p>
                    </div>
                    <button 
                      onClick={handleResetData}
                      className="px-6 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all"
                    >
                      Factory Reset
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-8">
              <section className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-16 h-16 rounded-3xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600">
                    <Monitor size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Visual Theme</h3>
                    <p className="text-sm font-medium text-slate-500">Customize the application interface appearance</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => {
                      document.documentElement.classList.remove('dark')
                      localStorage.setItem('darkMode', 'false')
                      window.dispatchEvent(new Event('storage')) // Trigger sync with Layout
                    }}
                    className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all ${
                      !document.documentElement.classList.contains('dark')
                        ? 'bg-white border-blue-600 shadow-xl shadow-blue-600/10'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500">
                        <Sun size={20} />
                      </div>
                      <span className="font-bold text-sm dark:text-white">Light Mode</span>
                    </div>
                    {!document.documentElement.classList.contains('dark') && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                  </button>

                  <button 
                    onClick={() => {
                      document.documentElement.classList.add('dark')
                      localStorage.setItem('darkMode', 'true')
                      window.dispatchEvent(new Event('storage')) // Trigger sync with Layout
                    }}
                    className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all ${
                      document.documentElement.classList.contains('dark')
                        ? 'bg-slate-900 border-blue-600 shadow-xl shadow-blue-600/10'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-blue-400">
                        <Moon size={20} />
                      </div>
                      <span className="font-bold text-sm dark:text-white">Dark Mode</span>
                    </div>
                    {document.documentElement.classList.contains('dark') && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                  </button>
                </div>
              </section>

              <section className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-16 h-16 rounded-3xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600">
                    <Bell size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Alert Preferences</h3>
                    <p className="text-sm font-medium text-slate-500">Configure operational notification channels</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <PreferenceToggle label="Push Notifications" description="Real-time alerts for performance misses" enabled={true} />
                  <PreferenceToggle label="Weekly Digest" description="Summary of weekly site production targets" enabled={false} />
                  <PreferenceToggle label="Comment Alerts" description="Notify when a manager leaves a briefing note" enabled={true} />
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PreferenceToggle({ label, description, enabled }) {
  const [isOn, setIsOn] = useState(enabled)
  return (
    <div className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-3xl transition-colors group">
      <div>
        <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{label}</p>
        <p className="text-xs font-medium text-slate-500 mt-1">{description}</p>
      </div>
      <button 
        onClick={() => setIsOn(!isOn)}
        className={`w-14 h-8 rounded-full relative transition-all duration-300 ${
          isOn ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-sm ${
          isOn ? 'left-7' : 'left-1'
        }`} />
      </button>
    </div>
  )
}

export default Settings

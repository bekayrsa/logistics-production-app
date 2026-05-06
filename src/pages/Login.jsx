import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { APP_MODE } from '../config';
import { Shield, Database, Lock, Mail, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { loadDemoData } from '../utils/demoData';
import { dataService } from '../lib/dataService';
function Login() {
  const { login, signup } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
    } catch (err) {
      console.error(err)
      setError(APP_MODE === 'demo' ? 'User not found. Try admin@miningsense.com' : 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleSeedDB = () => {
    try {
      setLoading(true)
      loadDemoData()
      alert('Demo data successfully restored to LocalStorage!')
    } catch (err) {
      console.error(err)
      alert('Failed to restore demo data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row font-sans">
      {/* Visual Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900 opacity-90" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 text-white max-w-lg">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl">
            <Shield size={40} className="text-white" />
          </div>
          <h1 className="text-6xl font-black tracking-tighter leading-none mb-6">
            Logistics <br />Production <br />Management
          </h1>
          <p className="text-xl text-blue-100 font-medium leading-relaxed">
            Real-time operational tracking, site performance monitoring, and secure production reporting for modern mining fleets.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-8 border-t border-white/10 pt-12">
            <div>
              <p className="text-4xl font-black">24/7</p>
              <p className="text-sm font-bold uppercase tracking-widest text-blue-200 mt-1">Live Monitoring</p>
            </div>
            <div>
              <p className="text-4xl font-black">100%</p>
              <p className="text-sm font-bold uppercase tracking-widest text-blue-200 mt-1">Data Isolation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="lg:hidden flex items-center space-x-3 mb-12">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-blue-600/20">PM</div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Logistics</h2>
          </div>

          <div className="mb-10">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Welcome Back</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Please enter your credentials to access the console.</p>
          </div>

          <div className="mb-8 flex items-center justify-between">
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-widest ${APP_MODE === 'demo'
                ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-500'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-500'
              }`}>
              {APP_MODE === 'demo' ? <Database size={14} /> : <Shield size={14} />}
              <span>{APP_MODE === 'demo' ? 'System in Demo Mode' : 'Secured with Firebase'}</span>
            </div>

            <button
              onClick={() => {
                const nextMode = APP_MODE === 'demo' ? 'production' : 'demo';
                localStorage.setItem('app_mode', nextMode);
                window.location.reload();
              }}
              className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors flex items-center"
            >
              <RefreshCw size={12} className="mr-1" />
              Switch to {APP_MODE === 'demo' ? 'Production' : 'Demo'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 flex items-start space-x-3 text-rose-700 dark:text-rose-400 animate-in shake duration-500">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-bold leading-tight">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 px-1 tracking-widest">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border-none focus:ring-2 focus:ring-blue-600 dark:text-white transition-all font-bold placeholder:text-slate-400"
                  placeholder={APP_MODE === 'demo' ? 'admin@miningsense.com' : 'your@email.com'}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 px-1 tracking-widest">Security Code</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border-none focus:ring-2 focus:ring-blue-600 dark:text-white transition-all font-bold placeholder:text-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-700 shadow-2xl shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center overflow-hidden"
            >
              {loading ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <>
                  <span className="relative z-10">Access Console</span>
                  <ArrowRight size={18} className="relative z-10 ml-2 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </button>
          </form>

          {APP_MODE === 'demo' ? (
            <div className="mt-12 space-y-6">
              <div className="p-6 bg-slate-100 dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quick Access Credentials</h4>
                </div>
                <div className="space-y-3">
                  <CredentialRow label="Admin" email="admin@miningsense.com" />
                  <CredentialRow label="Manager" email="manager@miningsense.com" />
                  <CredentialRow label="Site Manager" email="site1@miningsense.com" />
                </div>
              </div>

              <button
                onClick={handleSeedDB}
                disabled={loading}
                className="w-full text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2"
              >
                Restore Factory Settings (Seed Demo)
              </button>
            </div>
          ) : (
            <div className="mt-12">
              <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Production Setup</h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 font-medium leading-relaxed">
                  First time using this project? Use this button to create the primary admin account and initialize the database structure.
                </p>
                <button
                  onClick={async () => {
                    setLoading(true);
                    setError('');
                    try {
                      // This is a special helper to bootstrap the project
                      try {
                        await signup('admin@miningsense.com', 'admin123');
                      } catch (signupErr) {
                        if (signupErr.code === 'auth/email-already-in-use') {
                          console.log('Admin already exists, logging in to seed...');
                          await login('admin@miningsense.com', 'admin123');
                        } else {
                          throw signupErr;
                        }
                      }

                      // Import the seed data
                      const response = await fetch('/firebase-live-seed.json');
                      const seedData = await response.json();
                      await dataService.seedDatabase(seedData);

                      alert('Production environment initialized and seeded! You can now log in.');
                    } catch (err) {
                      console.error(err);
                      setError('Setup failed: ' + err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full py-3 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                  Initialize Admin Account & Seed Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CredentialRow({ label, email }) {
  return (
    <div className="flex items-center justify-between group">
      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-[11px] font-black text-slate-900 dark:text-white opacity-60 group-hover:opacity-100 transition-opacity select-all">{email}</span>
    </div>
  )
}

export default Login
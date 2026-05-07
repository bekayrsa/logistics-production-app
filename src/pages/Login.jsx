import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { APP_MODE } from '../config';
import { Shield, Lock, Mail, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { loadDemoData } from '../utils/demoData';

function Login() {
  const { login, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (showForgotPassword) {
        await resetPassword(email)
        setMessage('Reset instructions sent to your email.')
      } else {
        await login(email, password)
      }
    } catch (err) {
      console.error(err)
      if (showForgotPassword) {
        setError('Unable to send reset link. Verify your email.')
      } else {
        setError(APP_MODE === 'demo' ? 'User not found. Use admin@miningsense.com' : 'Invalid credentials. Access denied.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSeedDB = () => {
    try {
      setLoading(true)
      loadDemoData()
      alert('Demo database restored.')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans selection:bg-blue-500/30">
      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        {/* Branding */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 mb-6 shadow-xl shadow-blue-500/20">
            <Shield className="text-white" size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-none mb-3">
            Production <span className="text-blue-500 text-stroke">Management</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm uppercase tracking-[0.2em]">Enterprise Console</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-700">
          
          {error && (
            <div className="mb-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-3 text-rose-400">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="text-xs font-bold leading-tight">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start space-x-3 text-emerald-400">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <p className="text-xs font-bold leading-tight">{message}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 px-1 tracking-widest">Email Identity</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 text-white transition-all font-bold placeholder:text-slate-600 outline-none"
                  placeholder="identity@enterprise.com"
                />
              </div>
            </div>

            {!showForgotPassword && (
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Security Token</label>
                  <button 
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-400 tracking-widest transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 text-white transition-all font-bold placeholder:text-slate-600 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center overflow-hidden"
            >
              {loading ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <>
                  <span className="relative z-10">{showForgotPassword ? 'Request Reset' : 'Sign In'}</span>
                  <ArrowRight size={18} className="relative z-10 ml-2 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </button>

            {showForgotPassword && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="w-full text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors py-2"
              >
                Return to Login
              </button>
            )}
          </form>
        </div>

        {/* Subtle Mode Switcher */}
        <div className="mt-8 flex flex-col items-center space-y-4">
          <button
            onClick={() => {
              const nextMode = APP_MODE === 'demo' ? 'production' : 'demo';
              localStorage.setItem('app_mode', nextMode);
              window.location.reload();
            }}
            className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors flex items-center bg-slate-900/30 px-4 py-2 rounded-full border border-slate-800"
          >
            <RefreshCw size={12} className="mr-2" />
            Mode: {APP_MODE === 'demo' ? 'Sandboxed Demo' : 'Live Production'}
          </button>

          {APP_MODE === 'demo' && (
            <div className="w-full p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/60 mb-4">Demo Credentials</p>
              <div className="grid grid-cols-1 gap-2">
                <CredentialRow label="Admin" email="admin@miningsense.com" />
                <CredentialRow label="Manager" email="manager@miningsense.com" />
              </div>
              <button
                onClick={handleSeedDB}
                className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-amber-500 transition-colors"
              >
                Reset Database
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CredentialRow({ label, email }) {
  return (
    <div className="flex items-center justify-between px-2">
      <span className="text-[10px] font-bold text-slate-500">{label}</span>
      <span className="text-[10px] font-black text-slate-300 select-all">{email}</span>
    </div>
  )
}

export default Login
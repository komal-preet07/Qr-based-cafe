import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('owner')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError(null)

    // FIX: login() now returns role so we can redirect correctly
    const { error, role } = await login(email, password)

    if (error) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    // FIX: redirect based on role from auth context
    if (role === 'owner') {
      navigate('/owner')
    } else {
      navigate('/kitchen')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F8F8F5] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-[36px] bg-white/60 backdrop-blur-xl border border-white/70 shadow-2xl p-8">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-3xl bg-[#A9AC8D] text-white flex items-center justify-center text-4xl shadow-lg">
            ☕
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500">Café Management</p>
          <h1 className="display-font text-4xl font-semibold text-gray-900 mt-2">Welcome Back</h1>
          <p className="text-gray-400 mt-2 text-sm">Sign in to continue managing your café.</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          <button
            onClick={() => { setActiveTab('owner'); setError(null) }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'owner'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Owner
          </button>
          <button
            onClick={() => { setActiveTab('staff'); setError(null) }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'staff'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Kitchen Staff
          </button>
        </div>

        {/* FIX Bug 2: Staff tab shows info instead of a signup form */}
        {activeTab === 'staff' ? (
          <div className="text-center py-6 px-4 bg-[#A9AC8D]/10 rounded-2xl mb-4">
            <div className="text-3xl mb-3">👨‍🍳</div>
            <p className="text-gray-700 font-medium mb-1">Kitchen Staff Login</p>
            <p className="text-gray-500 text-sm">
              Staff accounts are created by the café owner from their dashboard.
              Please contact your owner to get your login credentials.
            </p>
          </div>
        ) : null}

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Login form — shown for both tabs (staff use same form once they have credentials) */}
        <div className="mb-4">
          <label className="block text-sm text-gray-500 mb-2">Email</label>
          <input
            type="email"
            placeholder="you@cafe.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full rounded-2xl border border-gray-200 bg-white/70 px-5 py-4 outline-none transition focus:ring-2 focus:ring-[#A9AC8D]"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-500 mb-2">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full rounded-2xl border border-gray-200 bg-white/70 px-5 py-4 outline-none transition focus:ring-2 focus:ring-[#A9AC8D]"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full rounded-2xl bg-[#A9AC8D] text-white py-4 font-medium text-lg hover:opacity-90 transition disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        <p className="text-center text-xs text-gray-400 mt-6">
          Secure access for café owners and kitchen staff.
        </p>
      </div>
    </div>
  )
}

export default LoginPage

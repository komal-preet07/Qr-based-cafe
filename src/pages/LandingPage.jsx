import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

function LandingPage() {
  const [activeTab, setActiveTab] = useState('owner')
  const [form, setForm] = useState({ name: '', email: '', password: '', cafeName: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  async function handleSignup() {
    setLoading(true)
    setError(null)

    if (activeTab === 'owner') {
      // sign up owner with supabase auth
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // create cafe
      const { data: cafe, error: cafeError } = await supabase
        .from('cafes')
        .insert({ name: form.cafeName, phone: form.phone })
        .select()
        .single()

      if (cafeError) {
        setError(cafeError.message)
        setLoading(false)
        return
      }

      // create user record
      await supabase.from('users').insert({
        id: data.user.id,
        cafe_id: cafe.id,
        name: form.name,
        email: form.email,
        role: 'owner'
      })

      setSuccess(true)
    } else {
      // staff signup - just collect info for now
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">

      {/* NAVBAR */}
      <nav className="bg-white/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#8B9D6A] rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">D</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">DineFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-gray-500 font-medium hover:text-gray-900">
            Login
          </Link>
          <a href="#signup" className="bg-[#8B9D6A] text-white text-sm px-4 py-2 rounded-full font-medium">
            Get Started
          </a>
        </div>
      </nav>

      {/* HERO */}
      <div className="pt-24 pb-16 px-6 text-center">
        <div className="inline-block bg-[#8B9D6A]/10 text-[#8B9D6A] text-xs font-semibold px-4 py-2 rounded-full mb-6 tracking-wide uppercase">
          QR-based ordering for cafés
        </div>
        <h1 className="display-font text-5xl font-semibold text-gray-900 mb-4 leading-tight">
          Your café, <br />
          <span className="text-[#8B9D6A]">smarter.</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-md mx-auto mb-8 leading-relaxed">
          Let customers order from their phone. Watch orders appear live in your kitchen. Track revenue from anywhere.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a href="#signup" className="bg-[#8B9D6A] text-white px-8 py-4 rounded-2xl font-semibold text-sm shadow-lg">
            Start free trial →
          </a>
          <a href="#how" className="bg-white text-gray-700 px-8 py-4 rounded-2xl font-semibold text-sm border border-gray-200">
            See how it works
          </a>
        </div>
      </div>

      {/* HERO IMAGE */}
      <div className="px-6 mb-16">
        <div className="relative rounded-3xl overflow-hidden h-64 shadow-xl">
          <img
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800"
            alt="cafe"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#8B9D6A] rounded-xl flex items-center justify-center text-white text-lg">
                ☕
              </div>
              <div>
                <p className="text-white font-semibold text-sm">New order — Table 7</p>
                <p className="text-white/70 text-xs">2x Masala Chai · 1x Veg Sandwich</p>
              </div>
              <div className="ml-auto bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                Just now
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how" className="px-6 mb-16">
        <h2 className="display-font text-2xl font-semibold text-center mb-2">How it works</h2>
        <p className="text-gray-400 text-sm text-center mb-8">Set up in under 30 minutes</p>
        <div className="space-y-4">
          {[
            { step: '01', title: 'Sign up your café', desc: 'Create your account and add your menu items in minutes.', icon: '🏪' },
            { step: '02', title: 'Print QR codes', desc: 'Generate unique QR codes for each table and stick them on.', icon: '🖨️' },
            { step: '03', title: 'Customers scan & order', desc: 'No app needed. Customers scan, browse, and order instantly.', icon: '📱' },
            { step: '04', title: 'Kitchen gets live orders', desc: 'Orders appear on your kitchen screen the moment they\'re placed.', icon: '👨‍🍳' },
          ].map(item => (
            <div key={item.step} className="bg-white rounded-2xl p-5 flex items-start gap-4 shadow-sm">
              <div className="text-2xl flex-shrink-0">{item.icon}</div>
              <div>
                <div className="text-[#8B9D6A] text-xs font-bold mb-1">{item.step}</div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div className="px-6 mb-16">
        <h2 className="display-font text-2xl font-semibold text-center mb-2">Everything you need</h2>
        <p className="text-gray-400 text-sm text-center mb-8">Built for small cafés, not big chains</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '📱', title: 'QR Ordering', desc: 'Customers order from their phone' },
            { icon: '⚡', title: 'Live Kitchen', desc: 'Orders appear instantly' },
            { icon: '📊', title: 'Analytics', desc: 'Track revenue anytime' },
            { icon: '🍽️', title: 'Menu Manager', desc: 'Update menu in seconds' },
            { icon: '👥', title: 'Staff Roles', desc: 'Owner and staff access' },
            { icon: '🔒', title: 'Secure', desc: 'Your data is protected' },
          ].map(feature => (
            <div key={feature.title} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-2xl mb-2">{feature.icon}</div>
              <h3 className="font-semibold text-gray-900 text-sm">{feature.title}</h3>
              <p className="text-gray-400 text-xs mt-1">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PRICING */}
      <div className="px-6 mb-16">
        <h2 className="display-font text-2xl font-semibold text-center mb-2">Simple pricing</h2>
        <p className="text-gray-400 text-sm text-center mb-8">One plan, everything included</p>
        <div className="bg-[#8B9D6A] rounded-3xl p-6 text-white shadow-xl">
          <div className="text-center mb-6">
            <p className="text-white/70 text-sm mb-1">Per café, per month</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold">₹999</span>
              <span className="text-white/70">/month</span>
            </div>
            <p className="text-white/70 text-xs mt-2">14-day free trial, no credit card needed</p>
          </div>
          <div className="space-y-3 mb-6">
            {[
              'QR menu for unlimited tables',
              'Live kitchen dashboard',
              'Owner analytics dashboard',
              'Menu management',
              'Staff accounts',
              'QR code generator',
              'WhatsApp support',
            ].map(feature => (
              <div key={feature} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</div>
                <span className="text-sm text-white/90">{feature}</span>
              </div>
            ))}
          </div>
          <a href="#signup" className="block bg-white text-[#8B9D6A] text-center py-4 rounded-2xl font-bold text-sm">
            Start 14-day free trial →
          </a>
        </div>
      </div>

      {/* SIGNUP */}
      <div id="signup" className="px-6 mb-16">
        <h2 className="display-font text-2xl font-semibold text-center mb-2">Get started today</h2>
        <p className="text-gray-400 text-sm text-center mb-6">Set up your café in under 30 minutes</p>

        {/* tabs */}
        <div className="flex bg-white rounded-2xl p-1 mb-6 shadow-sm">
          <button
            onClick={() => setActiveTab('owner')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'owner'
                ? 'bg-[#8B9D6A] text-white shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Café Owner
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'staff'
                ? 'bg-[#8B9D6A] text-white shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Staff Member
          </button>
        </div>

        {success ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-[#8B9D6A]/10 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              ✓
            </div>
            <h3 className="display-font text-xl font-semibold mb-2">You're on the list!</h3>
            <p className="text-gray-400 text-sm">We'll reach out within 24 hours to get your café set up.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            {activeTab === 'owner' ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Your name</label>
                  <input
                    type="text"
                    placeholder="Rajesh Kumar"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#8B9D6A]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Café name</label>
                  <input
                    type="text"
                    placeholder="Brew & Bites"
                    value={form.cafeName}
                    onChange={e => setForm({ ...form, cafeName: e.target.value })}
                    className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#8B9D6A]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Phone number</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#8B9D6A]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
                  <input
                    type="email"
                    placeholder="rajesh@brewbites.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#8B9D6A]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#8B9D6A]/30"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-[#8B9D6A]/10 rounded-xl p-4 text-center mb-2">
                  <p className="text-[#8B9D6A] text-sm font-medium">Staff accounts are created by your café owner.</p>
                  <p className="text-gray-400 text-xs mt-1">Ask your owner to add you from their dashboard.</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Your email</label>
                  <input
                    type="email"
                    placeholder="staff@brewbites.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#8B9D6A]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#8B9D6A]/30"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleSignup}
              disabled={loading}
              className="w-full bg-[#8B9D6A] text-white py-4 rounded-2xl font-semibold text-sm mt-6 disabled:opacity-50"
            >
              {loading ? 'Setting up...' : activeTab === 'owner' ? 'Create my café →' : 'Login to dashboard →'}
            </button>

            <p className="text-center text-xs text-gray-400 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-[#8B9D6A] font-medium">Login here</Link>
            </p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="px-6 pb-12 text-center border-t border-gray-200 pt-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 bg-[#8B9D6A] rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">D</span>
          </div>
          <span className="font-bold text-gray-900">DineFlow</span>
        </div>
        <p className="text-gray-400 text-xs">© 2026 DineFlow. Built for Indian cafés.</p>
      </div>

    </div>
  )
}

export default LandingPage
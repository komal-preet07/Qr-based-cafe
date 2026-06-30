import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

function OwnerDashboard() {
  const { cafeId, cafeName, logout, user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, totalOrders: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const [staff, setStaff] = useState([])
  const [staffEmail, setStaffEmail] = useState('')
  const [staffPassword, setStaffPassword] = useState('')
  const [staffName, setStaffName] = useState('')
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffError, setStaffError] = useState(null)
  const [staffSuccess, setStaffSuccess] = useState(false)

  const [cafeImageUrl, setCafeImageUrl] = useState(null)
  const [cafeImageUploading, setCafeImageUploading] = useState(false)
  const cafePhotoInputRef = useRef(null)

  const [ratingStats, setRatingStats] = useState({ avg: 0, count: 0, recent: [] })

  useEffect(() => {
    if (cafeId) {
      fetchStats()
      fetchStaff()
      fetchCafeImage()
      fetchRatings()
    }
  }, [cafeId])

  async function fetchRatings() {
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .eq('cafe_id', cafeId)
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      const avg = data.reduce((sum, f) => sum + f.rating, 0) / data.length
      setRatingStats({ avg: avg.toFixed(1), count: data.length, recent: data.slice(0, 5) })
    }
  }

  async function fetchCafeImage() {
    const { data } = await supabase
      .from('cafes')
      .select('image_url')
      .eq('id', cafeId)
      .single()
    if (data?.image_url) setCafeImageUrl(data.image_url)
  }

  async function uploadCafePhoto(file) {
    setCafeImageUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `cafe-covers/${cafeId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      setCafeImageUploading(false)
      return
    }

    const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName)
    const publicUrl = data.publicUrl

    await supabase.from('cafes').update({ image_url: publicUrl }).eq('id', cafeId)
    setCafeImageUrl(publicUrl)
    setCafeImageUploading(false)
  }

  async function fetchStats() {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekStart = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthStart = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: allOrders } = await supabase
      .from('orders')
      .select('total_price, created_at, status, cafe_tables(table_number)')
      .eq('cafe_id', cafeId)
      .order('created_at', { ascending: false })

    if (allOrders) {
      const today = allOrders
        .filter(o => o.created_at >= todayStart)
        .reduce((sum, o) => sum + o.total_price, 0)

      const week = allOrders
        .filter(o => o.created_at >= weekStart)
        .reduce((sum, o) => sum + o.total_price, 0)

      const month = allOrders
        .filter(o => o.created_at >= monthStart)
        .reduce((sum, o) => sum + o.total_price, 0)

      setStats({ today, week, month, totalOrders: allOrders.length })
      setRecentOrders(allOrders.slice(0, 10))
    }
    setLoading(false)
  }

  async function fetchStaff() {
    const { data } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('cafe_id', cafeId)
      .eq('role', 'staff')
    if (data) setStaff(data)
  }

  async function addStaff() {
    if (!staffEmail || !staffPassword || !staffName) {
      setStaffError('Please fill in all fields.')
      return
    }
    setStaffLoading(true)
    setStaffError(null)
    setStaffSuccess(false)

    const { data, error } = await supabase.auth.signUp({
      email: staffEmail,
      password: staffPassword,
    })

    if (error) {
      setStaffError(error.message)
      setStaffLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('users').insert({
      id: data.user.id,
      cafe_id: cafeId,
      name: staffName,
      email: staffEmail,
      role: 'staff',
    })

    if (insertError) {
      setStaffError(insertError.message)
    } else {
      setStaffSuccess(true)
      setStaffEmail('')
      setStaffPassword('')
      setStaffName('')
      fetchStaff()
    }
    setStaffLoading(false)
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#F8F8F5]">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Owner Dashboard</p>
          <h1 className="display-font text-xl font-semibold text-gray-900">{cafeName || 'My Café'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            👤 {user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="text-xs text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="flex gap-1 px-6 pt-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {['overview', 'staff', 'menu', 'qr'].map(tab => (
          <button
            key={tab}
            onClick={() => {
              if (tab === 'menu') navigate('/owner/menu')
              else if (tab === 'qr') navigate('/owner/qr')
              else setActiveTab(tab)
            }}
            className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-sm font-medium transition capitalize ${
              activeTab === tab
                ? 'bg-[#A9AC8D] text-white'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {tab === 'overview' ? '📊 Overview' : tab === 'staff' ? '👥 Staff' : tab === 'menu' ? '🍽️ Menu' : '📱 QR Codes'}
          </button>
        ))}
      </div>

      <div className="px-6 py-6">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* Cafe cover photo upload */}
            <div className="rounded-[28px] bg-white p-5 shadow-sm mb-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Café Cover Photo</p>
                  <p className="text-xs text-gray-400 mt-0.5">Shown as the hero image on your menu</p>
                </div>
                <button
                  onClick={() => cafePhotoInputRef.current?.click()}
                  disabled={cafeImageUploading}
                  className="text-xs bg-[#A9AC8D] text-white px-4 py-2 rounded-full font-medium hover:opacity-90 transition disabled:opacity-60"
                >
                  {cafeImageUploading ? 'Uploading…' : cafeImageUrl ? 'Change Photo' : 'Upload Photo'}
                </button>
                <input
                  ref={cafePhotoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files[0] && uploadCafePhoto(e.target.files[0])}
                />
              </div>
              {cafeImageUrl ? (
                <div className="relative w-full h-36 rounded-2xl overflow-hidden">
                  <img src={cafeImageUrl} alt="Café cover" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div
                  onClick={() => cafePhotoInputRef.current?.click()}
                  className="w-full h-28 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#A9AC8D] transition gap-2"
                >
                  <span className="text-3xl">📸</span>
                  <p className="text-xs text-gray-400">Click to upload your café's photo</p>
                </div>
              )}
            </div>

            {loading ? (
              <p className="text-gray-400">Loading stats…</p>
            ) : (
              <>
                {/* Revenue cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="rounded-[28px] bg-white p-5 shadow-sm col-span-2">
                    <p className="text-sm text-gray-400">Today's Revenue</p>
                    <p className="display-font text-4xl font-semibold text-gray-900 mt-1">
                      ₹{(stats.today / 100).toFixed(0)}
                    </p>
                  </div>
                  <div className="rounded-[28px] bg-white p-5 shadow-sm">
                    <p className="text-xs text-gray-400">Last 7 days</p>
                    <p className="display-font text-2xl font-semibold text-gray-900 mt-1">
                      ₹{(stats.week / 100).toFixed(0)}
                    </p>
                  </div>
                  <div className="rounded-[28px] bg-white p-5 shadow-sm">
                    <p className="text-xs text-gray-400">Last 30 days</p>
                    <p className="display-font text-2xl font-semibold text-gray-900 mt-1">
                      ₹{(stats.month / 100).toFixed(0)}
                    </p>
                  </div>
                  <div className="rounded-[28px] bg-white p-5 shadow-sm col-span-2">
                    <p className="text-sm text-gray-400">Total Orders</p>
                    <p className="display-font text-3xl font-semibold text-gray-900 mt-1">
                      {stats.totalOrders}
                    </p>
                  </div>
                </div>

                {/* Ratings card */}
                <div className="rounded-[28px] bg-white p-5 shadow-sm mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-400">Customer Rating</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <p className="display-font text-3xl font-semibold text-gray-900">
                          {ratingStats.count > 0 ? ratingStats.avg : '—'}
                        </p>
                        {ratingStats.count > 0 && <span className="text-yellow-500">⭐</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{ratingStats.count} review{ratingStats.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {ratingStats.recent.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-gray-100">
                      {ratingStats.recent.map(f => (
                        <div key={f.id} className="flex items-start gap-2 text-sm">
                          <span className="text-yellow-500 flex-shrink-0">{'⭐'.repeat(f.rating)}</span>
                          {f.comment && <span className="text-gray-500 text-xs">{f.comment}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent orders */}
                <h2 className="display-font text-xl font-semibold mb-4">Recent Orders</h2>
                <div className="space-y-3">
                  {recentOrders.length === 0 && (
                    <p className="text-gray-400 text-sm">No orders yet.</p>
                  )}
                  {recentOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-2xl px-5 py-4 flex justify-between items-center shadow-sm">
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          Table {order.cafe_tables?.table_number}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{order.total_price / 100}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* STAFF TAB */}
        {activeTab === 'staff' && (
          <>
            <div className="rounded-[32px] bg-white/60 backdrop-blur-xl border border-white/70 shadow-xl p-6 mb-6">
              <h2 className="display-font text-2xl font-semibold mb-5">Add Kitchen Staff</h2>

              {staffError && (
                <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {staffError}
                </div>
              )}
              {staffSuccess && (
                <div className="mb-4 rounded-2xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                  ✓ Staff account created! They can now log in at /login.
                </div>
              )}

              <div className="space-y-4">
                <input
                  placeholder="Staff Name"
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white/70 px-5 py-4 outline-none focus:ring-2 focus:ring-[#A9AC8D]"
                />
                <input
                  placeholder="Staff Email"
                  type="email"
                  value={staffEmail}
                  onChange={e => setStaffEmail(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white/70 px-5 py-4 outline-none focus:ring-2 focus:ring-[#A9AC8D]"
                />
                <input
                  placeholder="Temporary Password"
                  type="password"
                  value={staffPassword}
                  onChange={e => setStaffPassword(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white/70 px-5 py-4 outline-none focus:ring-2 focus:ring-[#A9AC8D]"
                />
                <button
                  onClick={addStaff}
                  disabled={staffLoading}
                  className="w-full rounded-2xl bg-[#A9AC8D] text-white py-4 font-medium hover:opacity-90 transition disabled:opacity-60"
                >
                  {staffLoading ? 'Creating…' : 'Create Staff Account'}
                </button>
              </div>
            </div>

            <h2 className="display-font text-xl font-semibold mb-4">Your Staff</h2>
            {staff.length === 0 ? (
              <p className="text-gray-400 text-sm">No staff added yet.</p>
            ) : (
              <div className="space-y-3">
                {staff.map(member => (
                  <div key={member.id} className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-400">{member.email}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                      Kitchen Staff
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default OwnerDashboard
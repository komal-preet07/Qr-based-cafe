import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function OwnerDashboard() {
  const { cafeId, cafeName, logout, user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  // overview
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, totalOrders: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // staff
  const [staff, setStaff] = useState([])
  const [staffEmail, setStaffEmail] = useState('')
  const [staffPassword, setStaffPassword] = useState('')
  const [staffName, setStaffName] = useState('')
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffError, setStaffError] = useState(null)
  const [staffSuccess, setStaffSuccess] = useState(false)

  // cafe photo
  const [cafeImageUrl, setCafeImageUrl] = useState(null)
  const [cafeImageUploading, setCafeImageUploading] = useState(false)
  const cafePhotoInputRef = useRef(null)

  // ratings
  const [ratingStats, setRatingStats] = useState({ avg: 0, count: 0, recent: [] })

  // bills
  const [bills, setBills] = useState([])
  const [billsLoading, setBillsLoading] = useState(false)
  const [expandedBill, setExpandedBill] = useState(null)
  const [billSearch, setBillSearch] = useState('')
  const [billDateFilter, setBillDateFilter] = useState('today')

  // UPI
  const [upiId, setUpiId] = useState('')
  const [upiSaving, setUpiSaving] = useState(false)
  const [upiSaved, setUpiSaved] = useState(false)

  useEffect(() => {
    if (cafeId) {
      fetchStats()
      fetchStaff()
      fetchCafeImage()
      fetchRatings()
      fetchUpiId()
    }
  }, [cafeId])

  useEffect(() => {
    if (cafeId && activeTab === 'bills') fetchBills()
  }, [cafeId, activeTab, billDateFilter])

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    })
  }

  async function fetchUpiId() {
    const { data } = await supabase
      .from('cafes')
      .select('upi_id')
      .eq('id', cafeId)
      .single()
    if (data?.upi_id) setUpiId(data.upi_id)
  }

  async function saveUpiId() {
    if (!upiId.trim()) return
    setUpiSaving(true)
    const { error } = await supabase
      .from('cafes')
      .update({ upi_id: upiId.trim() })
      .eq('id', cafeId)
    if (!error) {
      setUpiSaved(true)
      setTimeout(() => setUpiSaved(false), 3000)
    }
    setUpiSaving(false)
  }

  async function fetchBills() {
    setBillsLoading(true)
    const now = new Date()
    let startDate
    if (billDateFilter === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    } else if (billDateFilter === 'week') {
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
    } else {
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`*, order_items(quantity, unit_price, menu_items(name)), cafe_tables(table_number)`)
      .eq('cafe_id', cafeId)
      .gte('created_at', startDate)
      .order('created_at', { ascending: false })

    if (!error) setBills(data)
    setBillsLoading(false)
  }

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
    const { data } = await supabase.from('cafes').select('image_url').eq('id', cafeId).single()
    if (data?.image_url) setCafeImageUrl(data.image_url)
  }

  async function uploadCafePhoto(file) {
    setCafeImageUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `cafe-covers/${cafeId}.${ext}`
    const { error: uploadError } = await supabase.storage.from('menu-images').upload(fileName, file, { upsert: true })
    if (uploadError) { setCafeImageUploading(false); return }
    const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName)
    await supabase.from('cafes').update({ image_url: data.publicUrl }).eq('id', cafeId)
    setCafeImageUrl(data.publicUrl)
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
      setStats({
        today: allOrders.filter(o => o.created_at >= todayStart).reduce((s, o) => s + o.total_price, 0),
        week: allOrders.filter(o => o.created_at >= weekStart).reduce((s, o) => s + o.total_price, 0),
        month: allOrders.filter(o => o.created_at >= monthStart).reduce((s, o) => s + o.total_price, 0),
        totalOrders: allOrders.length,
      })
      setRecentOrders(allOrders.slice(0, 10))
    }
    setLoading(false)
  }

  async function fetchStaff() {
    const { data } = await supabase.from('users').select('id, name, email, role').eq('cafe_id', cafeId).eq('role', 'staff')
    if (data) setStaff(data)
  }

  async function addStaff() {
    if (!staffEmail || !staffPassword || !staffName) { setStaffError('Please fill in all fields.'); return }
    setStaffLoading(true); setStaffError(null); setStaffSuccess(false)
    const { data, error } = await supabase.auth.signUp({ email: staffEmail, password: staffPassword })
    if (error) { setStaffError(error.message); setStaffLoading(false); return }
    const { error: insertError } = await supabase.from('users').insert({
      id: data.user.id, cafe_id: cafeId, name: staffName, email: staffEmail, role: 'staff',
    })
    if (insertError) { setStaffError(insertError.message) }
    else { setStaffSuccess(true); setStaffEmail(''); setStaffPassword(''); setStaffName(''); fetchStaff() }
    setStaffLoading(false)
  }

  async function handleLogout() { await logout(); navigate('/login') }

  const filteredBills = bills.filter(bill => {
    if (!billSearch) return true
    const s = billSearch.toLowerCase()
    return bill.customer_name?.toLowerCase().includes(s) ||
      bill.customer_phone?.includes(s) ||
      bill.cafe_tables?.table_number?.toString().includes(s)
  })

  return (
    <div className="min-h-screen bg-[#F8F8F5]">

      {/* top bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Owner Dashboard</p>
          <h1 className="display-font text-xl font-semibold text-gray-900">{cafeName || 'My Café'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">👤 {user?.email}</span>
          <button onClick={handleLogout} className="text-xs text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition font-medium">Logout</button>
        </div>
      </div>

      {/* nav tabs */}
      <div className="flex gap-1 px-6 pt-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {['overview', 'bills', 'staff', 'menu', 'qr'].map(tab => (
          <button
            key={tab}
            onClick={() => {
              if (tab === 'menu') navigate('/owner/menu')
              else if (tab === 'qr') navigate('/owner/qr')
              else setActiveTab(tab)
            }}
            className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-sm font-medium transition capitalize ${
              activeTab === tab ? 'bg-[#8B9D6A] text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {tab === 'overview' ? '📊 Overview' : tab === 'bills' ? '🧾 Bills' : tab === 'staff' ? '👥 Staff' : tab === 'menu' ? '🍽️ Menu' : '📱 QR Codes'}
          </button>
        ))}
      </div>

      <div className="px-6 py-6">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <>
            {/* cafe cover photo */}
            <div className="rounded-[28px] bg-white p-5 shadow-sm mb-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Café Cover Photo</p>
                  <p className="text-xs text-gray-400 mt-0.5">Shown as hero image on your menu</p>
                </div>
                <button
                  onClick={() => cafePhotoInputRef.current?.click()}
                  disabled={cafeImageUploading}
                  className="text-xs bg-[#8B9D6A] text-white px-4 py-2 rounded-full font-medium hover:opacity-90 transition disabled:opacity-60"
                >
                  {cafeImageUploading ? 'Uploading…' : cafeImageUrl ? 'Change Photo' : 'Upload Photo'}
                </button>
                <input ref={cafePhotoInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files[0] && uploadCafePhoto(e.target.files[0])} />
              </div>
              {cafeImageUrl ? (
                <div className="relative w-full h-36 rounded-2xl overflow-hidden">
                  <img src={cafeImageUrl} alt="Café cover" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div onClick={() => cafePhotoInputRef.current?.click()}
                  className="w-full h-28 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#8B9D6A] transition gap-2">
                  <span className="text-3xl">📸</span>
                  <p className="text-xs text-gray-400">Click to upload your café's photo</p>
                </div>
              )}
            </div>

            {/* UPI ID card */}
            <div className="rounded-[28px] bg-white p-5 shadow-sm mb-5">
              <div className="mb-3">
                <p className="font-semibold text-gray-900 text-sm">UPI Payment ID</p>
                <p className="text-xs text-gray-400 mt-0.5">Customers can pay online via GPay, PhonePe, Paytm</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 9876543210@ybl or cafe@paytm"
                  value={upiId}
                  onChange={e => { setUpiId(e.target.value); setUpiSaved(false) }}
                  className="flex-1 bg-[#F5F5F0] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#8B9D6A]"
                />
                <button
                  onClick={saveUpiId}
                  disabled={upiSaving || !upiId.trim()}
                  className="bg-[#8B9D6A] text-white px-5 py-3 rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  {upiSaving ? '…' : upiSaved ? '✓ Saved' : 'Save'}
                </button>
              </div>
              {upiSaved && (
                <p className="text-xs text-green-600 mt-2">✓ UPI ID saved! Customers can now pay online.</p>
              )}
              {!upiId && (
                <p className="text-xs text-gray-400 mt-2">
                  Without this, only "Pay at Counter" will be shown to customers.
                </p>
              )}
            </div>

            {loading ? <p className="text-gray-400">Loading stats…</p> : (
              <>
                {/* revenue cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="rounded-[28px] bg-white p-5 shadow-sm col-span-2">
                    <p className="text-sm text-gray-400">Today's Revenue</p>
                    <p className="display-font text-4xl font-semibold text-gray-900 mt-1">₹{(stats.today / 100).toFixed(0)}</p>
                  </div>
                  <div className="rounded-[28px] bg-white p-5 shadow-sm">
                    <p className="text-xs text-gray-400">Last 7 days</p>
                    <p className="display-font text-2xl font-semibold text-gray-900 mt-1">₹{(stats.week / 100).toFixed(0)}</p>
                  </div>
                  <div className="rounded-[28px] bg-white p-5 shadow-sm">
                    <p className="text-xs text-gray-400">Last 30 days</p>
                    <p className="display-font text-2xl font-semibold text-gray-900 mt-1">₹{(stats.month / 100).toFixed(0)}</p>
                  </div>
                  <div className="rounded-[28px] bg-white p-5 shadow-sm col-span-2">
                    <p className="text-sm text-gray-400">Total Orders</p>
                    <p className="display-font text-3xl font-semibold text-gray-900 mt-1">{stats.totalOrders}</p>
                  </div>
                </div>

                {/* ratings */}
                <div className="rounded-[28px] bg-white p-5 shadow-sm mb-6">
                  <p className="text-sm text-gray-400">Customer Rating</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="display-font text-3xl font-semibold text-gray-900">{ratingStats.count > 0 ? ratingStats.avg : '—'}</p>
                    {ratingStats.count > 0 && <span className="text-yellow-500">⭐</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{ratingStats.count} review{ratingStats.count !== 1 ? 's' : ''}</p>
                  {ratingStats.recent.length > 0 && (
                    <div className="space-y-2 pt-3 mt-3 border-t border-gray-100">
                      {ratingStats.recent.map(f => (
                        <div key={f.id} className="flex items-start gap-2 text-sm">
                          <span className="text-yellow-500 flex-shrink-0">{'⭐'.repeat(f.rating)}</span>
                          {f.comment && <span className="text-gray-500 text-xs">{f.comment}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* recent orders */}
                <h2 className="display-font text-xl font-semibold mb-4">Recent Orders</h2>
                <div className="space-y-3">
                  {recentOrders.length === 0 && <p className="text-gray-400 text-sm">No orders yet.</p>}
                  {recentOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-2xl px-5 py-4 flex justify-between items-center shadow-sm">
                      <div>
                        <p className="font-medium text-sm text-gray-900">Table {order.cafe_tables?.table_number}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatTime(order.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{order.total_price / 100}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'ready' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>{order.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── BILLS TAB ── */}
        {activeTab === 'bills' && (
          <>
            <div className="flex gap-2 mb-4">
              {['today', 'week', 'month'].map(f => (
                <button key={f} onClick={() => setBillDateFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition capitalize ${
                    billDateFilter === f ? 'bg-[#8B9D6A] text-white' : 'bg-white text-gray-500 border border-gray-200'
                  }`}>
                  {f === 'today' ? 'Today' : f === 'week' ? 'Last 7 days' : 'Last 30 days'}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm mb-4">
              <span className="text-gray-400">🔍</span>
              <input type="text" placeholder="Search by name, phone or table…" value={billSearch}
                onChange={e => setBillSearch(e.target.value)}
                className="bg-transparent flex-1 outline-none text-sm text-gray-700 placeholder-gray-400" />
            </div>
            <div className="bg-[#8B9D6A]/10 rounded-2xl px-4 py-3 mb-4 flex justify-between items-center">
              <span className="text-sm text-[#8B9D6A] font-medium">{filteredBills.length} bills</span>
              <span className="text-sm font-semibold text-[#8B9D6A]">
                Total: ₹{filteredBills.reduce((sum, b) => sum + b.total_price, 0) / 100}
              </span>
            </div>
            {billsLoading ? <p className="text-gray-400 text-sm">Loading bills…</p> :
              filteredBills.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                  <p className="text-4xl mb-3">🧾</p>
                  <p className="text-gray-400 text-sm">No bills found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBills.map(bill => (
                    <div key={bill.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                      <div className="px-5 py-4 flex justify-between items-center cursor-pointer"
                        onClick={() => setExpandedBill(expandedBill === bill.id ? null : bill.id)}>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-gray-900">Table {bill.cafe_tables?.table_number}</p>
                            {bill.customer_name && <span className="text-xs text-gray-400">· {bill.customer_name}</span>}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{formatTime(bill.created_at)}</p>
                          {bill.customer_phone && <p className="text-xs text-[#8B9D6A] mt-0.5">📞 {bill.customer_phone}</p>}
                          {bill.payment_method && (
                            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                              bill.payment_method === 'upi' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {bill.payment_method === 'upi' ? '📱 UPI' : '💵 Counter'}
                            </span>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-900">₹{bill.total_price / 100}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            bill.status === 'completed' ? 'bg-green-100 text-green-700' :
                            bill.status === 'ready' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>{bill.status}</span>
                          <p className="text-xs text-gray-400 mt-1">{expandedBill === bill.id ? '▲' : '▼'}</p>
                        </div>
                      </div>
                      {expandedBill === bill.id && (
                        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                          <div className="space-y-2 mb-3">
                            {bill.order_items.map((item, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className="text-gray-600">{item.quantity}x {item.menu_items?.name}</span>
                                <span className="font-medium text-gray-900">₹{(item.unit_price * item.quantity) / 100}</span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-gray-200 pt-3 flex justify-between">
                            <span className="font-semibold text-sm">Total</span>
                            <span className="font-bold text-sm">₹{bill.total_price / 100}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </>
        )}

        {/* ── STAFF TAB ── */}
        {activeTab === 'staff' && (
          <>
            <div className="rounded-[32px] bg-white/60 backdrop-blur-xl border border-white/70 shadow-xl p-6 mb-6">
              <h2 className="display-font text-2xl font-semibold mb-5">Add Kitchen Staff</h2>
              {staffError && <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{staffError}</div>}
              {staffSuccess && <div className="mb-4 rounded-2xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">✓ Staff account created!</div>}
              <div className="space-y-4">
                <input placeholder="Staff Name" value={staffName} onChange={e => setStaffName(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white/70 px-5 py-4 outline-none focus:ring-2 focus:ring-[#8B9D6A]" />
                <input placeholder="Staff Email" type="email" value={staffEmail} onChange={e => setStaffEmail(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white/70 px-5 py-4 outline-none focus:ring-2 focus:ring-[#8B9D6A]" />
                <input placeholder="Temporary Password" type="password" value={staffPassword} onChange={e => setStaffPassword(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white/70 px-5 py-4 outline-none focus:ring-2 focus:ring-[#8B9D6A]" />
                <button onClick={addStaff} disabled={staffLoading}
                  className="w-full rounded-2xl bg-[#8B9D6A] text-white py-4 font-medium hover:opacity-90 transition disabled:opacity-60">
                  {staffLoading ? 'Creating…' : 'Create Staff Account'}
                </button>
              </div>
            </div>
            <h2 className="display-font text-xl font-semibold mb-4">Your Staff</h2>
            {staff.length === 0 ? <p className="text-gray-400 text-sm">No staff added yet.</p> : (
              <div className="space-y-3">
                {staff.map(member => (
                  <div key={member.id} className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-400">{member.email}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Kitchen Staff</span>
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

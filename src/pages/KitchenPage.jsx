import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function KitchenPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  // FIX Bug 1: cafeId comes from AuthContext — no more hardcoded value
  const { cafeId, cafeName, logout, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!cafeId) return
    fetchOrders()

    const channel = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [cafeId])

  async function fetchOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          unit_price,
          menu_items (name)
        ),
        cafe_tables (table_number)
      `)
      .eq('cafe_id', cafeId)
      .neq('status', 'completed')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
    } else {
      setOrders(data)
    }
    setLoading(false)
  }

  async function updateStatus(orderId, newStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (error) {
      console.error('Error updating status:', error)
    } else {
      setOrders(prev =>
        newStatus === 'completed'
          ? prev.filter(o => o.id !== orderId)
          : prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      )
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F8F8F5] flex items-center justify-center">
      <p className="text-gray-400">Loading orders…</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8F8F5] px-5 py-8">

      {/* FIX Bug 3: header showing who's logged in + logout button */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-gray-400">Live Kitchen Dashboard</p>
          <h1 className="display-font text-4xl font-semibold">{cafeName || 'Orders'}</h1>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-xs text-gray-400 bg-white px-3 py-1.5 rounded-full border border-gray-100">
            👤 {user?.email}
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      {orders.length === 0 && (
        <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
          <div className="text-4xl mb-3">🍽️</div>
          <p className="text-gray-400">No active orders right now</p>
        </div>
      )}

      <div className="space-y-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm">

            {/* Top Row */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-400 mb-1">Table</p>
                <h2 className="display-font text-2xl font-semibold">
                  {order.cafe_tables?.table_number}
                </h2>
              </div>

              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : order.status === 'preparing'
                      ? 'bg-blue-100 text-blue-700'
                      : order.status === 'ready'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {order.status}
                </span>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(order.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 my-5" />

            {/* Items */}
            <div className="space-y-3">
              {order.order_items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-900">
                    {item.quantity} × {item.menu_items?.name}
                  </span>
                  <span className="font-medium">₹{(item.unit_price * item.quantity) / 100}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-gray-100 mt-5 pt-4 flex justify-between">
              <span className="font-medium">Total</span>
              <span className="font-semibold">₹{order.total_price / 100}</span>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <button
                onClick={() => updateStatus(order.id, 'preparing')}
                className="py-3 rounded-2xl bg-yellow-100 text-yellow-700 font-medium hover:bg-yellow-200 transition"
              >
                Preparing
              </button>
              <button
                onClick={() => updateStatus(order.id, 'ready')}
                className="py-3 rounded-2xl bg-green-100 text-green-700 font-medium hover:bg-green-200 transition"
              >
                Ready
              </button>
              <button
                onClick={() => updateStatus(order.id, 'completed')}
                className="py-3 rounded-2xl bg-black text-white font-medium hover:bg-gray-900 transition"
              >
                Complete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default KitchenPage

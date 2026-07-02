import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'

function OrderSuccess() {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [order, setOrder] = useState(null)
  const [cafeName, setCafeName] = useState('')

  const { cafeId, tableId, lastOrderId } = useCart()
  const [searchParams] = useSearchParams()

  const resolvedCafeId = cafeId || searchParams.get('cafe')
  const resolvedTableId = tableId || searchParams.get('table')

  useEffect(() => {
    if (lastOrderId) fetchOrderDetails()
    if (resolvedCafeId) fetchCafeName()
  }, [lastOrderId])

  async function fetchCafeName() {
    const { data } = await supabase
      .from('cafes')
      .select('name')
      .eq('id', resolvedCafeId)
      .single()
    if (data) setCafeName(data.name)
  }

  async function fetchOrderDetails() {
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
      .eq('id', lastOrderId)
      .single()

    if (!error) setOrder(data)
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  function generateBillText() {
    if (!order) return ''

    const lines = [
      `🧾 *Bill from ${cafeName}*`,
      `📍 Table ${order.cafe_tables?.table_number}`,
      `🕐 ${formatTime(order.created_at)}`,
      `─────────────────`,
      ...order.order_items.map(item =>
        `${item.quantity}x ${item.menu_items?.name} — ₹${(item.unit_price * item.quantity) / 100}`
      ),
      `─────────────────`,
      `*Total: ₹${order.total_price / 100}*`,
      ``,
      `Thank you for visiting! 🙏`,
      `Powered by DineFlow`
    ]
    return lines.join('\n')
  }

  function shareOnWhatsApp() {
    const text = encodeURIComponent(generateBillText())
    const phone = order?.customer_phone
      ? order.customer_phone.replace(/\D/g, '')
      : ''
    const url = phone
      ? `https://wa.me/91${phone}?text=${text}`
      : `https://wa.me/?text=${text}`
    window.open(url, '_blank')
  }

  async function submitFeedback() {
    if (rating === 0) return
    setSubmitting(true)

    await supabase.from('feedback').insert({
      cafe_id: resolvedCafeId,
      table_id: resolvedTableId,
      rating,
      comment: comment.trim() || null,
    })

    setSubmitted(true)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-md">

        {/* success icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-[#8B9D6A]/15 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#8B9D6A] flex items-center justify-center text-4xl shadow-lg">
              ✓
            </div>
          </div>
        </div>

        {/* heading */}
        <div className="text-center mb-6">
          <h1 className="display-font text-4xl font-semibold text-gray-900">Order Placed!</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Your order is on its way to the kitchen.
            {resolvedTableId && (
              <span className="block mt-1 text-[#8B9D6A] font-medium">Table {resolvedTableId}</span>
            )}
          </p>
        </div>

        {/* digital bill */}
        {order && (
          <div className="bg-white rounded-3xl p-5 shadow-sm mb-4">

            {/* bill header */}
            <div className="text-center border-b border-dashed border-gray-200 pb-4 mb-4">
              <p className="display-font text-xl font-semibold text-gray-900">{cafeName}</p>
              <p className="text-xs text-gray-400 mt-1">
                Table {order.cafe_tables?.table_number} · {formatTime(order.created_at)}
              </p>
              {order.customer_name && (
                <p className="text-xs text-gray-500 mt-1">👤 {order.customer_name}</p>
              )}
            </div>

            {/* bill items */}
            <div className="space-y-2 mb-4">
              {order.order_items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.quantity}x {item.menu_items?.name}
                  </span>
                  <span className="font-medium text-gray-900">
                    ₹{(item.unit_price * item.quantity) / 100}
                  </span>
                </div>
              ))}
            </div>

            {/* total */}
            <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="display-font text-2xl font-semibold text-gray-900">
                ₹{order.total_price / 100}
              </span>
            </div>

            {/* pay at counter */}
            <div className="mt-4 bg-[#8B9D6A]/10 rounded-2xl px-4 py-3 text-center">
              <p className="text-[#8B9D6A] text-xs font-medium">💵 Please pay at the counter</p>
            </div>

            {/* whatsapp share */}
            <button
              onClick={shareOnWhatsApp}
              className="w-full mt-4 bg-[#25D366] text-white py-3 rounded-2xl font-medium text-sm flex items-center justify-center gap-2"
            >
              <span>📲</span>
              <span>Share Bill on WhatsApp</span>
            </button>
          </div>
        )}

        {/* rating card */}
        <div className="rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/80 shadow-xl p-6 mb-5">
          {!submitted ? (
            <>
              <h2 className="display-font text-xl font-semibold text-gray-900 mb-1 text-center">
                How's your experience?
              </h2>
              <p className="text-gray-400 text-sm text-center mb-6">
                Your feedback helps us improve 🙏
              </p>

              <div className="flex justify-center gap-3 mb-6">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(star)}
                    className="text-4xl transition-transform active:scale-110"
                    style={{ filter: (hovered || rating) >= star ? 'none' : 'grayscale(1) opacity(0.3)' }}
                  >
                    ⭐
                  </button>
                ))}
              </div>

              {(hovered || rating) > 0 && (
                <p className="text-center text-sm text-[#8B9D6A] font-medium mb-4 -mt-2">
                  {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][(hovered || rating)]}
                </p>
              )}

              <textarea
                placeholder="Anything you'd like to share? (optional)"
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#8B9D6A] resize-none placeholder-gray-300"
              />

              <button
                onClick={submitFeedback}
                disabled={rating === 0 || submitting}
                className="w-full mt-4 rounded-2xl bg-[#8B9D6A] text-white py-4 font-medium transition hover:opacity-90 disabled:opacity-40"
              >
                {submitting ? 'Sending…' : 'Submit Feedback'}
              </button>

              <button
                onClick={() => setSubmitted(true)}
                className="w-full mt-2 text-sm text-gray-400 hover:text-gray-600 transition py-2"
              >
                Skip for now
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="display-font text-2xl font-semibold text-gray-900 mb-2">
                Thank you!
              </h3>
              <p className="text-gray-400 text-sm">
                We really appreciate your feedback.
              </p>
            </div>
          )}
        </div>

        {/* back to menu */}
        {resolvedCafeId && resolvedTableId && (
          <Link
            to={`/menu?cafe=${resolvedCafeId}&table=${resolvedTableId}`}
            className="block w-full text-center rounded-2xl bg-white border border-gray-200 text-gray-700 py-4 font-medium hover:bg-gray-50 transition"
          >
            Back to Menu
          </Link>
        )}
      </div>
    </div>
  )
}

export default OrderSuccess
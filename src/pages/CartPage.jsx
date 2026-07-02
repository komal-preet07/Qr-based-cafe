import { useState, useEffect, useRef } from 'react'
import { useCart } from '../context/CartContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { QRCodeCanvas } from 'qrcode.react'

function CartPage() {
  const { cart, totalPrice, tableId, cafeId, clearCart, addItem, removeItem, setLastOrderId } = useCart()
  const navigate = useNavigate()
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState(null) // null | 'upi' | 'counter'
  const [upiId, setUpiId] = useState(null)
  const [cafeName, setCafeName] = useState('')
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState(null)

  useEffect(() => {
    if (cafeId) fetchCafeUpi()
  }, [cafeId])

  async function fetchCafeUpi() {
    const { data } = await supabase
      .from('cafes')
      .select('upi_id, name')
      .eq('id', cafeId)
      .single()
    if (data) {
      setUpiId(data.upi_id)
      setCafeName(data.name)
    }
  }

  // UPI deep link — every Indian payment app understands this
  function getUpiUrl() {
    const amount = (totalPrice / 100).toFixed(2)
    const note = `Table ${tableId} Order`
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(cafeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`
  }

  async function placeOrder() {
    if (!cafeId || !tableId) {
      alert('Missing café or table info. Please scan the QR code again.')
      return
    }
    if (!paymentMethod) {
      alert('Please choose how you want to pay.')
      return
    }

    setPlacingOrder(true)

    const { data: tableData, error: tableError } = await supabase
      .from('cafe_tables')
      .select('id')
      .eq('cafe_id', cafeId)
      .eq('table_number', tableId)
      .single()

    if (tableError) {
      alert('Could not find your table. Please scan the QR code again.')
      setPlacingOrder(false)
      return
    }

    const { data, error } = await supabase
      .from('orders')
      .insert({
        cafe_id: cafeId,
        table_id: tableData.id,
        status: 'pending',
        total_price: totalPrice,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        payment_method: paymentMethod,
      })
      .select()
      .single()

    if (error) {
      alert('Failed to place order. Please try again.')
      setPlacingOrder(false)
      return
    }

    await supabase.from('order_items').insert(
      cart.map(item => ({
        order_id: data.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      }))
    )

    setOrderId(data.id)
    setLastOrderId(data.id)

    if (paymentMethod === 'upi') {
      // show UPI QR — don't navigate yet
      setOrderPlaced(true)
    } else {
      clearCart()
      navigate('/order-success')
    }

    setPlacingOrder(false)
  }

  // ── UPI QR SCREEN (shown after order is placed, before navigating away) ──
  if (orderPlaced && paymentMethod === 'upi') {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#8B9D6A] mx-auto mb-4 flex items-center justify-center text-3xl shadow-lg">
              📲
            </div>
            <h1 className="display-font text-3xl font-semibold text-gray-900">Scan to Pay</h1>
            <p className="text-gray-400 text-sm mt-2">
              Open GPay, PhonePe, or Paytm and scan this QR
            </p>
          </div>

          {/* QR card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm mb-4 text-center">
            <div className="flex justify-center mb-4">
              {upiId ? (
                <QRCodeCanvas
                  value={getUpiUrl()}
                  size={200}
                  level="H"
                  includeMargin
                />
              ) : (
                <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <p className="text-gray-400 text-xs text-center px-4">
                    UPI not set up by this café yet
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-1">Paying to</p>
            <p className="font-semibold text-gray-900">{cafeName}</p>
            {upiId && <p className="text-xs text-gray-400 mt-0.5">{upiId}</p>}

            <div className="mt-4 bg-[#8B9D6A]/10 rounded-2xl px-4 py-3">
              <p className="text-[#8B9D6A] text-xs font-medium">Amount pre-filled automatically</p>
              <p className="display-font text-3xl font-semibold text-gray-900 mt-1">
                ₹{totalPrice / 100}
              </p>
            </div>
          </div>

          {/* Payment app buttons */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { name: 'GPay', url: getUpiUrl(), emoji: '🟢' },
              { name: 'PhonePe', url: getUpiUrl(), emoji: '🟣' },
              { name: 'Paytm', url: getUpiUrl(), emoji: '🔵' },
            ].map(app => (
              <a
                key={app.name}
                href={app.url}
                className="bg-white rounded-2xl py-3 flex flex-col items-center gap-1 shadow-sm border border-gray-100 hover:border-[#8B9D6A] transition"
              >
                <span className="text-xl">{app.emoji}</span>
                <span className="text-xs font-medium text-gray-700">{app.name}</span>
              </a>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4 text-center">
            <p className="text-amber-700 text-xs font-medium">
              After paying, show your payment confirmation to the staff ✓
            </p>
          </div>

          <button
            onClick={() => { clearCart(); navigate('/order-success') }}
            className="w-full bg-[#8B9D6A] text-white py-4 rounded-2xl font-semibold text-base"
          >
            I've Paid — Done ✓
          </button>

          <button
            onClick={() => { clearCart(); navigate('/order-success') }}
            className="w-full mt-2 text-sm text-gray-400 py-2"
          >
            Pay later / skip
          </button>
        </div>
      </div>
    )
  }

  // ── EMPTY CART ────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#F5F5F0]">
        <div className="text-6xl mb-2">🛒</div>
        <h2 className="display-font text-2xl font-semibold text-gray-800">Your cart is empty</h2>
        <p className="text-gray-400 text-sm">Add something delicious from the menu</p>
        <Link
          to={cafeId && tableId ? `/menu?cafe=${cafeId}&table=${tableId}` : '/'}
          className="mt-4 bg-[#8B9D6A] text-white px-8 py-3 rounded-full font-medium text-sm"
        >
          Browse Menu
        </Link>
      </div>
    )
  }

  // ── MAIN CART ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F5F0] pb-48">

      {/* header */}
      <div className="bg-white px-5 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <Link
            to={cafeId && tableId ? `/menu?cafe=${cafeId}&table=${tableId}` : '/'}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
          >
            ←
          </Link>
          <h1 className="display-font text-xl font-semibold">Cart</h1>
          {tableId && (
            <span className="text-xs bg-[#8B9D6A]/10 text-[#8B9D6A] px-3 py-1 rounded-full font-medium">
              Table {tableId}
            </span>
          )}
        </div>
      </div>

      {/* items */}
      <div className="px-4 pt-4 space-y-3">
        {cart.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-16 h-16 rounded-xl bg-[#8B9D6A]/10 flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
              {item.image_url
                ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                : '🍽️'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900">{item.name}</h3>
              <p className="text-[#8B9D6A] font-bold text-sm mt-0.5">₹{item.price / 100}</p>
              <div className="flex items-center gap-3 mt-2">
                <button onClick={() => removeItem(item.id)} className="w-7 h-7 rounded-full bg-[#8B9D6A] text-white flex items-center justify-center text-lg leading-none">−</button>
                <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                <button onClick={() => addItem(item)} className="w-7 h-7 rounded-full bg-[#8B9D6A] text-white flex items-center justify-center text-lg leading-none">+</button>
              </div>
            </div>
            <p className="font-bold text-gray-900 text-sm flex-shrink-0">₹{(item.price * item.quantity) / 100}</p>
          </div>
        ))}
      </div>

      {/* order summary */}
      <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-sm text-gray-700 mb-3">Order Summary</h3>
        {cart.map(item => (
          <div key={item.id} className="flex justify-between text-sm text-gray-500 mb-1">
            <span>{item.name} × {item.quantity}</span>
            <span>₹{(item.price * item.quantity) / 100}</span>
          </div>
        ))}
        <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-gray-900 text-lg">₹{totalPrice / 100}</span>
        </div>
      </div>

      {/* customer info */}
      <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-sm text-gray-700 mb-3">Your Details (optional)</h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Your name"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3 text-sm outline-none"
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
            className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>
      </div>

      {/* PAYMENT METHOD PICKER */}
      <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-sm text-gray-700 mb-3">How would you like to pay?</h3>
        <div className="grid grid-cols-2 gap-3">

          {/* UPI option — only show if cafe has upi_id set */}
          {upiId ? (
            <button
              onClick={() => setPaymentMethod('upi')}
              className={`rounded-2xl p-4 border-2 transition flex flex-col items-center gap-2 ${
                paymentMethod === 'upi'
                  ? 'border-[#8B9D6A] bg-[#8B9D6A]/5'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <span className="text-2xl">📱</span>
              <span className="text-sm font-semibold text-gray-800">Pay Online</span>
              <span className="text-xs text-gray-400">GPay / PhonePe / Paytm</span>
              {paymentMethod === 'upi' && (
                <span className="text-xs text-[#8B9D6A] font-medium">✓ Selected</span>
              )}
            </button>
          ) : (
            <div className="rounded-2xl p-4 border-2 border-dashed border-gray-200 flex flex-col items-center gap-2 opacity-50">
              <span className="text-2xl">📱</span>
              <span className="text-sm font-semibold text-gray-500">Pay Online</span>
              <span className="text-xs text-gray-400 text-center">Not available at this café</span>
            </div>
          )}

          <button
            onClick={() => setPaymentMethod('counter')}
            className={`rounded-2xl p-4 border-2 transition flex flex-col items-center gap-2 ${
              paymentMethod === 'counter'
                ? 'border-[#8B9D6A] bg-[#8B9D6A]/5'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <span className="text-2xl">💵</span>
            <span className="text-sm font-semibold text-gray-800">Pay at Counter</span>
            <span className="text-xs text-gray-400">Cash or card</span>
            {paymentMethod === 'counter' && (
              <span className="text-xs text-[#8B9D6A] font-medium">✓ Selected</span>
            )}
          </button>
        </div>
      </div>

      {/* place order button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-5 bg-[#F5F5F0]">
        <button
          onClick={placeOrder}
          disabled={!paymentMethod || placingOrder}
          className="w-full bg-[#8B9D6A] text-white py-4 rounded-2xl font-semibold text-base flex items-center justify-between px-6 shadow-lg disabled:opacity-50 transition"
        >
          <span>{placingOrder ? 'Placing order…' : paymentMethod === 'upi' ? 'Place Order & Pay' : 'Place Order'}</span>
          <span className="bg-white/20 rounded-full px-3 py-1 text-sm">₹{totalPrice / 100} →</span>
        </button>
        {!paymentMethod && (
          <p className="text-center text-xs text-gray-400 mt-2">Select a payment method above</p>
        )}
      </div>
    </div>
  )
}

export default CartPage

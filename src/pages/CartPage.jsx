import { useCart } from '../context/CartContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function CartPage() {
  // FIX Bug 5: cafeId now comes from CartContext (set by MenuPage from URL)
  const { cart, totalPrice, tableId, cafeId, clearCart, addItem, removeItem } = useCart()
  const navigate = useNavigate()

  async function placeOrder() {
    if (!cafeId || !tableId) {
      alert('Missing café or table info. Please scan the QR code again.')
      return
    }

    // look up the table UUID from the table number
    const { data: tableData, error: tableError } = await supabase
      .from('cafe_tables')
      .select('id')
      .eq('cafe_id', cafeId)
      .eq('table_number', tableId)
      .single()

    if (tableError) {
      console.error('Table error:', tableError)
      alert('Could not find your table. Please scan the QR code again.')
      return
    }

    const { data, error } = await supabase
      .from('orders')
      .insert({
        cafe_id: cafeId,
        table_id: tableData.id,
        status: 'pending',
        total_price: totalPrice,
      })
      .select()
      .single()

    if (error) {
      console.error('Order error:', error)
      alert('Failed to place order. Please try again.')
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

    clearCart()
    navigate('/order-success')
  }

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

  return (
    <div className="min-h-screen bg-[#F5F5F0] pb-36">

      {/* header */}
      <div className="bg-white px-5 pt-12 pb-5">
        <div className="flex items-center justify-between mb-1">
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
                : '🍽️'
              }
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900">{item.name}</h3>
              <p className="text-[#8B9D6A] font-bold text-sm mt-0.5">₹{item.price / 100}</p>

              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => removeItem(item.id)}
                  className="w-7 h-7 rounded-full bg-[#8B9D6A] text-white flex items-center justify-center text-lg font-light leading-none"
                >
                  −
                </button>
                <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                <button
                  onClick={() => addItem(item)}
                  className="w-7 h-7 rounded-full bg-[#8B9D6A] text-white flex items-center justify-center text-lg font-light leading-none"
                >
                  +
                </button>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="font-bold text-gray-900 text-sm">₹{(item.price * item.quantity) / 100}</p>
            </div>
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

      {/* checkout button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-5 bg-[#F5F5F0]">
        <button
          onClick={placeOrder}
          className="w-full bg-[#8B9D6A] text-white py-4 rounded-2xl font-semibold text-base flex items-center justify-between px-6 shadow-lg"
        >
          <span>Place Order</span>
          <span className="bg-white/20 rounded-full px-3 py-1 text-sm">₹{totalPrice / 100} →</span>
        </button>
      </div>
    </div>
  )
}

export default CartPage

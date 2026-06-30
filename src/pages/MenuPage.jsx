import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { Link, useSearchParams } from 'react-router-dom'

function MenuPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [cafeName, setCafeName] = useState('Our Café')
  const [cafeImage, setCafeImage] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const [avgRating, setAvgRating] = useState(null)

  const [searchParams] = useSearchParams()
  const cafeId = searchParams.get('cafe')
  const urlTableId = searchParams.get('table')

  const { addItem, totalItems, totalPrice, setTableId, setCafeId } = useCart()

  useEffect(() => {
    if (urlTableId) setTableId(urlTableId)
    if (cafeId) setCafeId(cafeId)

    if (cafeId) {
      fetchCafeName()
      fetchItems()
      fetchRating()
    } else {
      setLoading(false)
    }
  }, [cafeId])

  async function fetchCafeName() {
    const { data } = await supabase
      .from('cafes')
      .select('name, image_url')
      .eq('id', cafeId)
      .single()
    if (data) {
      setCafeName(data.name)
      if (data.image_url) setCafeImage(data.image_url)
    }
  }

  async function fetchRating() {
    const { data } = await supabase
      .from('feedback')
      .select('rating')
      .eq('cafe_id', cafeId)

    if (data && data.length > 0) {
      const avg = data.reduce((sum, f) => sum + f.rating, 0) / data.length
      setAvgRating({ value: avg.toFixed(1), count: data.length })
    }
  }

  async function fetchItems() {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('cafe_id', cafeId)
      .eq('is_available', true)

    if (error) {
      console.error('Error fetching items:', error)
    } else {
      setItems(data)
      const categories = [...new Set(data.map(i => i.category))]
      if (categories.length > 0) setActiveCategory(categories[0])
    }
    setLoading(false)
  }

  function groupByCategory(items) {
    return items.reduce((groups, item) => {
      const category = item.category
      if (!groups[category]) groups[category] = []
      groups[category].push(item)
      return groups
    }, {})
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
      <p className="text-gray-400">Loading menu…</p>
    </div>
  )

  if (!cafeId) return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="text-5xl">🔗</div>
      <h2 className="display-font text-2xl font-semibold text-gray-800">Invalid QR Code</h2>
      <p className="text-gray-400 text-sm">Please scan the QR code at your table to view the menu.</p>
    </div>
  )

  const grouped = groupByCategory(items)
  const categories = Object.keys(grouped)

  return (
    <div className="min-h-screen bg-[#F5F5F0] pb-32">

      {/* hero section */}
      <div className="relative h-64 w-full overflow-hidden">
        <img
          src={cafeImage || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800"}
          alt="cafe"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />

        {/* top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-12">
          <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            ☰
          </div>
          {totalItems > 0 && (
            <Link to="/cart">
              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center relative">
                🛒
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#8B9D6A] rounded-full text-white text-xs flex items-center justify-center">
                  {totalItems}
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* cafe name + rating */}
        <div className="absolute bottom-4 left-5">
          <p className="text-white/70 text-xs tracking-widest uppercase">Welcome to</p>
          <h1 className="display-font text-white text-3xl font-semibold">{cafeName}</h1>
          <div className="flex items-center gap-2 mt-1">
            {urlTableId && (
              <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                Table {urlTableId}
              </span>
            )}
            {avgRating && (
              <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                <span>⭐</span>
                <span className="font-semibold">{avgRating.value}</span>
                <span className="text-white/70">({avgRating.count})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* floating search bar */}
      <div className="px-4 -mt-5 mb-5 relative z-10">
        <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
          <span className="text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search menu..."
            className="bg-transparent flex-1 outline-none text-sm text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      {/* category tabs */}
      <div className="px-4 mb-5 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === category
                ? 'bg-[#8B9D6A] text-white'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* menu items */}
      <div className="px-4 space-y-6">
        {Object.entries(grouped).map(([category, catItems]) => (
          (!activeCategory || activeCategory === category) && (
            <div key={category}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="display-font text-lg font-semibold text-gray-800">{category}</h2>
                <span className="text-xs text-[#8B9D6A] font-medium">{catItems.length} items</span>
              </div>
              <div className="space-y-3">
                {catItems.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="w-16 h-16 rounded-xl bg-[#8B9D6A]/10 flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
                      {item.image_url
                        ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        : '🍽️'
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900">{item.name}</h3>
                      {item.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                      )}
                      <p className="text-[#8B9D6A] font-bold text-sm mt-1">₹{item.price / 100}</p>
                    </div>
                    <button
                      onClick={() => addItem(item)}
                      className="w-8 h-8 rounded-full bg-[#8B9D6A] text-white flex items-center justify-center text-xl flex-shrink-0 shadow-sm"
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      {/* floating cart button */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 py-5 bg-[#F5F5F0]">
          <Link to="/cart">
            <div className="bg-[#8B9D6A] text-white rounded-2xl px-6 py-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-semibold">
                  {totalItems}
                </span>
                <span className="font-semibold">View Cart</span>
              </div>
              <span className="font-bold">₹{totalPrice / 100} →</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}

export default MenuPage
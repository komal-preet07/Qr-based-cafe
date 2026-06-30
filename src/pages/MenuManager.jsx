import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function MenuManager() {
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState({ name: '', category: '', price: '', description: '' })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // FIX Bug 1: use cafeId from AuthContext — no more hardcoded ID
  const { cafeId, cafeName, logout, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (cafeId) fetchMenu()
  }, [cafeId])

  async function fetchMenu() {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('cafe_id', cafeId)
      .order('category')

    if (error) {
      console.error('Error fetching menu:', error)
    } else {
      setItems(data)
    }
  }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  // FIX Bug 4: upload image to Supabase Storage
  async function uploadImage(file) {
    const ext = file.name.split('.').pop()
    const fileName = `${cafeId}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('menu-images')
      .upload(fileName, file, { upsert: true })

    if (error) {
      console.error('Image upload error:', error)
      return null
    }

    const { data } = supabase.storage
      .from('menu-images')
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  async function addItem() {
    if (!newItem.name || !newItem.category || !newItem.price) {
      alert('Please fill in name, category and price.')
      return
    }

    setUploading(true)

    let imageUrl = null
    if (imageFile) {
      imageUrl = await uploadImage(imageFile)
    }

    const { error } = await supabase.from('menu_items').insert({
      cafe_id: cafeId,
      name: newItem.name,
      category: newItem.category,
      description: newItem.description,
      price: Math.round(newItem.price * 100), // store in paise
      is_available: true,
      image_url: imageUrl,
    })

    if (error) {
      console.error('Add item error:', error)
      alert('Failed to add item.')
    } else {
      fetchMenu()
      setNewItem({ name: '', category: '', price: '', description: '' })
      setImageFile(null)
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }

    setUploading(false)
  }

  async function toggleAvailability(itemId, currentStatus) {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: !currentStatus })
      .eq('id', itemId)

    if (!error) {
      setItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, is_available: !currentStatus } : item
        )
      )
    }
  }

  async function deleteItem(itemId) {
    if (!confirm('Delete this item?')) return
    const { error } = await supabase.from('menu_items').delete().eq('id', itemId)
    if (!error) setItems(prev => prev.filter(i => i.id !== itemId))
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#F8F8F5] px-6 py-8">

      {/* Header with logout */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm text-gray-500">Café Management</p>
          <h1 className="display-font text-4xl font-semibold text-gray-900">Menu Manager</h1>
          {cafeName && <p className="text-sm text-[#A9AC8D] mt-1">{cafeName}</p>}
        </div>
        <div className="flex flex-col items-end gap-2 mt-1">
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

      {/* Add Item Card */}
      <div className="rounded-[32px] bg-white/60 backdrop-blur-xl border border-white/70 shadow-xl p-6 mb-8">
        <h2 className="display-font text-2xl font-semibold mb-5">Add New Item</h2>

        <div className="space-y-4">
          <input
            placeholder="Item Name"
            value={newItem.name}
            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
            className="w-full rounded-2xl border border-gray-200 bg-white/70 px-5 py-4 outline-none focus:ring-2 focus:ring-[#A9AC8D]"
          />

          <input
            placeholder="Category (e.g. Coffee, Snacks)"
            value={newItem.category}
            onChange={e => setNewItem({ ...newItem, category: e.target.value })}
            className="w-full rounded-2xl border border-gray-200 bg-white/70 px-5 py-4 outline-none focus:ring-2 focus:ring-[#A9AC8D]"
          />

          <input
            placeholder="Description (optional)"
            value={newItem.description}
            onChange={e => setNewItem({ ...newItem, description: e.target.value })}
            className="w-full rounded-2xl border border-gray-200 bg-white/70 px-5 py-4 outline-none focus:ring-2 focus:ring-[#A9AC8D]"
          />

          <input
            placeholder="Price (₹)"
            type="number"
            min="0"
            value={newItem.price}
            onChange={e => setNewItem({ ...newItem, price: e.target.value })}
            className="w-full rounded-2xl border border-gray-200 bg-white/70 px-5 py-4 outline-none focus:ring-2 focus:ring-[#A9AC8D]"
          />

          {/* FIX Bug 4: image upload input */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 px-5 py-4 flex items-center gap-4 cursor-pointer hover:border-[#A9AC8D] transition"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="preview" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
                📷
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">
                {imageFile ? imageFile.name : 'Upload Item Photo'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Click to choose an image</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <button
            onClick={addItem}
            disabled={uploading}
            className="w-full rounded-2xl bg-[#A9AC8D] text-white py-4 font-medium hover:opacity-90 transition disabled:opacity-60"
          >
            {uploading ? 'Adding…' : 'Add Item'}
          </button>
        </div>
      </div>

      {/* Existing Items */}
      <div>
        <h2 className="display-font text-2xl font-semibold mb-5">
          Menu Items <span className="text-gray-400 text-lg font-normal">({items.length})</span>
        </h2>

        <div className="space-y-5">
          {items.map(item => (
            <div
              key={item.id}
              className="rounded-[28px] bg-white/60 backdrop-blur-xl border border-white/70 shadow-lg p-5 hover:shadow-xl transition-all"
            >
              <div className="flex gap-4">
                {/* image */}
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center text-2xl">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    : '🍽️'
                  }
                </div>

                {/* details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-400 mt-0.5">{item.category}</p>
                      {item.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.description}</p>
                      )}
                      <p className="display-font text-xl font-semibold mt-2 text-[#A9AC8D]">
                        ₹{item.price / 100}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.is_available
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.is_available ? 'Available' : 'Sold Out'}
                      </span>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-xs text-gray-400 hover:text-red-500 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => toggleAvailability(item.id, item.is_available)}
                className={`mt-4 w-full rounded-2xl py-3 font-medium transition ${
                  item.is_available
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-[#A9AC8D] text-white hover:opacity-90'
                }`}
              >
                {item.is_available ? 'Mark as Sold Out' : 'Mark Available'}
              </button>
            </div>
          ))}

          {items.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-3">🍽️</div>
              <p>No items yet. Add your first menu item above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MenuManager

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

// Uses the qrcode.react library — install it: npm install qrcode.react
import { QRCodeCanvas } from 'qrcode.react'

function QrGenerator() {
  const { cafeId, cafeName, logout, user } = useAuth()
  const navigate = useNavigate()
  const [tables, setTables] = useState([])
  const [newTableNumber, setNewTableNumber] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (cafeId) fetchTables()
  }, [cafeId])

  async function fetchTables() {
    const { data } = await supabase
      .from('cafe_tables')
      .select('*')
      .eq('cafe_id', cafeId)
      .order('table_number')
    if (data) setTables(data)
    setLoading(false)
  }

  async function addTable() {
    if (!newTableNumber) return
    const { error } = await supabase.from('cafe_tables').insert({
      cafe_id: cafeId,
      table_number: Number(newTableNumber),
    })
    if (!error) {
      setNewTableNumber('')
      fetchTables()
    }
  }

  async function deleteTable(id) {
    if (!confirm('Delete this table?')) return
    await supabase.from('cafe_tables').delete().eq('id', id)
    setTables(prev => prev.filter(t => t.id !== id))
  }

  // FIX Bug 5: QR URL includes both cafe_id and table number
  function getMenuUrl(tableNumber) {
    return `${window.location.origin}/menu?cafe=${cafeId}&table=${tableNumber}`
  }

  function downloadQR(tableNumber) {
    const canvas = document.getElementById(`qr-${tableNumber}`)
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `table-${tableNumber}-qr.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#F8F8F5] px-6 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm text-gray-500">Café Management</p>
          <h1 className="display-font text-4xl font-semibold text-gray-900">QR Codes</h1>
          {cafeName && <p className="text-sm text-[#A9AC8D] mt-1">{cafeName}</p>}
        </div>
        <div className="flex flex-col items-end gap-2 mt-1">
          <span className="text-xs text-gray-400 bg-white px-3 py-1.5 rounded-full border border-gray-100">
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

      {/* Add table */}
      <div className="rounded-[32px] bg-white/60 backdrop-blur-xl border border-white/70 shadow-xl p-6 mb-8">
        <h2 className="display-font text-2xl font-semibold mb-5">Add Table</h2>
        <div className="flex gap-3">
          <input
            type="number"
            placeholder="Table number (e.g. 5)"
            value={newTableNumber}
            onChange={e => setNewTableNumber(e.target.value)}
            className="flex-1 rounded-2xl border border-gray-200 bg-white/70 px-5 py-4 outline-none focus:ring-2 focus:ring-[#A9AC8D]"
          />
          <button
            onClick={addTable}
            className="rounded-2xl bg-[#A9AC8D] text-white px-6 font-medium hover:opacity-90 transition"
          >
            Add
          </button>
        </div>
      </div>

      {/* QR codes */}
      {loading ? (
        <p className="text-gray-400">Loading tables…</p>
      ) : tables.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <div className="text-4xl mb-3">📱</div>
          <p>No tables yet. Add your first table above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {tables.map(table => (
            <div key={table.id} className="rounded-[28px] bg-white/60 backdrop-blur-xl border border-white/70 shadow-lg p-5 flex flex-col items-center">
              <p className="text-sm text-gray-500 mb-1">Table</p>
              <p className="display-font text-3xl font-semibold text-gray-900 mb-4">
                {table.table_number}
              </p>

              {/* QR code */}
              <QRCodeCanvas
                id={`qr-${table.table_number}`}
                value={getMenuUrl(table.table_number)}
                size={140}
                level="H"
                includeMargin
              />

              <p className="text-xs text-gray-400 mt-3 text-center break-all">
                {getMenuUrl(table.table_number)}
              </p>

              <div className="flex gap-2 mt-4 w-full">
                <button
                  onClick={() => downloadQR(table.table_number)}
                  className="flex-1 rounded-2xl bg-[#A9AC8D] text-white py-2.5 text-sm font-medium hover:opacity-90 transition"
                >
                  Download
                </button>
                <button
                  onClick={() => deleteTable(table.id)}
                  className="rounded-2xl bg-red-50 text-red-500 px-4 py-2.5 text-sm font-medium hover:bg-red-100 transition"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default QrGenerator

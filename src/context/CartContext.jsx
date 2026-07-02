import { createContext, useContext, useState } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])
  const [tableId, setTableId] = useState(null)
  const [cafeId, setCafeId] = useState(null)
  const [lastOrderId, setLastOrderId] = useState(null)

  function addItem(item) {
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id)
      if (exists) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      } else {
        return [...prev, { ...item, quantity: 1 }]
      }
    })
  }

  function removeItem(itemId) {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId)
      if (existing && existing.quantity > 1) {
        return prev.map(i =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        )
      }
      return prev.filter(i => i.id !== itemId)
    })
  }

  function clearCart() {
    setCart([])
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

 return (
  <CartContext.Provider
    value={{
      cart,
      addItem,
      removeItem,
      clearCart,
      totalItems,
      totalPrice,
      tableId,
      setTableId,
      cafeId,
      setCafeId,
      lastOrderId,
      setLastOrderId,
    }}
  >
    {children}
  </CartContext.Provider>
)
}

export function useCart() {
  return useContext(CartContext)
}
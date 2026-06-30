import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cafeId, setCafeId] = useState(null)
  const [cafeName, setCafeName] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      setUser(user)
      const { data } = await supabase
        .from('users')
        .select('role, cafe_id')
        .eq('id', user.id)
        .single()

      if (data) {
        setRole(data.role)
        setCafeId(data.cafe_id)

        if (data.cafe_id) {
          const { data: cafe } = await supabase
            .from('cafes')
            .select('name')
            .eq('id', data.cafe_id)
            .single()
          if (cafe) setCafeName(cafe.name)
        }
      }
    }
    setLoading(false)
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) return { error }

    setUser(data.user)

    const { data: userData } = await supabase
      .from('users')
      .select('role, cafe_id')
      .eq('id', data.user.id)
      .single()

    if (userData) {
      setRole(userData.role)
      setCafeId(userData.cafe_id)

      if (userData.cafe_id) {
        const { data: cafe } = await supabase
          .from('cafes')
          .select('name')
          .eq('id', userData.cafe_id)
          .single()
        if (cafe) setCafeName(cafe.name)
      }

      return { error: null, role: userData.role }
    }

    return { error: null, role: null }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setCafeId(null)
    setCafeName(null)
  }

  return (
    <AuthContext.Provider value={{ user, role, cafeId, cafeName, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
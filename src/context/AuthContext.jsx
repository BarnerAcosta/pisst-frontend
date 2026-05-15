// src/context/AuthContext.jsx
// Maneja el estado de autenticación globalmente
// El token y el usuario viven aquí en memoria (no en localStorage)
import { createContext, useState, useContext } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)

  function login(accessToken, userData) {
    setToken(accessToken)
    setUser(userData)
  }

  function logout() {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
/* eslint-disable react-refresh/only-export-components */
// src/context/AuthContext.jsx
import { createContext, useState, useContext } from 'react'

const AuthContext = createContext(null)

function leerSesion() {
  try {
    const token = sessionStorage.getItem('pisst_token')
    const user  = JSON.parse(sessionStorage.getItem('pisst_user') || 'null')
    return { token, user }
  } catch {
    return { token: null, user: null }
  }
}

export function AuthProvider({ children }) {
  const sesion = leerSesion()
  const [token, setToken] = useState(sesion.token)
  const [user, setUser]   = useState(sesion.user)

  function login(accessToken, userData) {
    sessionStorage.setItem('pisst_token', accessToken)
    sessionStorage.setItem('pisst_user',  JSON.stringify(userData))
    setToken(accessToken)
    setUser(userData)
  }

  function logout() {
    sessionStorage.removeItem('pisst_token')
    sessionStorage.removeItem('pisst_user')
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
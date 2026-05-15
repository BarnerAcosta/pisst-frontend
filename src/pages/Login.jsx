// src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        recaptcha_token: 'test', // en desarrollo se omite la validación
      })

      const { access_token, role, nombre } = response.data

      // Guardar token en sesión y en el contexto
      sessionStorage.setItem('pisst_token', access_token)
      login(access_token, { role, nombre, email })

      // Redirigir según el rol
      if (role === 'sst') navigate('/dashboard')
      else if (role === 'gerencia') navigate('/metricas')
      else navigate('/chat')

    } catch (err) {
      setError(err.response?.data?.detail || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">

        {/* Logo y título */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">PISST</h1>
          <p className="text-gray-500 text-sm mt-1">
            Plataforma Integral de Seguridad y Salud en el Trabajo
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sst@pisst.demo"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        {/* Credenciales demo */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4 text-xs text-gray-500">
          <p className="font-medium mb-2 text-gray-600">Usuarios demo:</p>
          <p>sst@pisst.demo / demo123</p>
          <p>gerencia@pisst.demo / demo123</p>
          <p>empleado@pisst.demo / demo123</p>
        </div>

      </div>
    </div>
  )
}
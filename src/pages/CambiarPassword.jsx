import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function CambiarPassword() {
  const [passwordActual, setPasswordActual] = useState('')
  const [nuevaPassword, setNuevaPassword]   = useState('')
  const [confirmar, setConfirmar]           = useState('')
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')

  const { logout } = useAuth()
  const navigate   = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (nuevaPassword !== confirmar) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }
    if (nuevaPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/cambiar-password', {
        password_actual: passwordActual,
        nueva_password:  nuevaPassword,
      })
      // Tras el cambio, cerrar sesión para que el usuario inicie con la nueva contraseña
      logout()
      navigate('/login?sesion=password_cambiado')
    } catch (err) {
      const status = err.response?.status
      if (status === 400) setError('La contraseña actual es incorrecta.')
      else if (status === 401) setError('Tu sesión expiró. Por favor inicia sesión de nuevo.')
      else setError('Ocurrió un error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

        <div className="mb-6">
          <h1 className="text-xl font-bold text-blue-900">Cambiar contraseña</h1>
          <p className="text-gray-500 text-sm mt-1 leading-relaxed">
            Por seguridad debes establecer una contraseña personal antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Contraseña actual (temporal)
            </label>
            <input
              type="password"
              value={passwordActual}
              onChange={e => setPasswordActual(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={nuevaPassword}
              onChange={e => setNuevaPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 text-sm shadow-sm"
          >
            {loading ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>

      </div>
    </div>
  )
}

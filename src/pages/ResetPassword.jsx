import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [password, setPassword]     = useState('')
  const [confirmar, setConfirmar]   = useState('')
  const [error, setError]           = useState('')
  const [exito, setExito]           = useState(false)
  const [loading, setLoading]       = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, new_password: password })
      setExito(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al restablecer la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8 text-center">
          <p className="text-red-600 font-medium">Enlace inválido o expirado.</p>
          <button onClick={() => navigate('/login')}
            className="mt-4 text-sm text-blue-600 hover:underline">
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">PISST</h1>
          <p className="text-gray-500 text-sm mt-1">Restablecer contraseña</p>
        </div>

        {exito ? (
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-4">
              Contraseña actualizada exitosamente.
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-2.5 rounded-lg transition text-sm"
            >
              Ir al inicio de sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                placeholder="Repite la contraseña"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

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
              {loading ? 'Guardando...' : 'Restablecer contraseña'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Volver al inicio de sesión
            </button>
          </form>
        )}

      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [errorTipo, setErrorTipo] = useState('') // 'bloqueo' | 'advertencia' | 'sesion' | ''
  const [loading, setLoading]   = useState(false)

  // Olvidé mi contraseña
  const [modalRecuperar, setModalRecuperar] = useState(false)
  const [emailRecuperar, setEmailRecuperar] = useState('')
  const [mensajeRecuperar, setMensajeRecuperar] = useState('')
  const [enviandoRecuperar, setEnviandoRecuperar] = useState(false)

  const { login } = useAuth()
  const navigate  = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setErrorTipo('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        recaptcha_token: 'test',
      })

      const { access_token, role, nombre } = response.data
      login(access_token, { role, nombre, email })

      if (role === 'sst') navigate('/dashboard')
      else if (role === 'gerencia') navigate('/metricas')
      else navigate('/chat')

    } catch (err) {
      const status  = err.response?.status
      const detalle = err.response?.data?.detail || 'Error al iniciar sesión'

      if (status === 429) {
        setErrorTipo('bloqueo')
      } else if (status === 401 && detalle.includes('intento')) {
        setErrorTipo('advertencia')
      } else if (detalle.includes('Sesión expirada') || detalle.includes('dispositivo')) {
        setErrorTipo('sesion')
      } else {
        setErrorTipo('')
      }

      setError(detalle)
    } finally {
      setLoading(false)
    }
  }

  async function handleRecuperar(e) {
    e.preventDefault()
    setEnviandoRecuperar(true)
    setMensajeRecuperar('')
    try {
      await api.post('/auth/forgot-password', { email: emailRecuperar })
      setMensajeRecuperar('Si el correo existe recibirás un enlace en los próximos minutos.')
    } catch {
      setMensajeRecuperar('Ocurrió un error. Intenta de nuevo.')
    } finally {
      setEnviandoRecuperar(false)
    }
  }

  const estiloError = {
    bloqueo:     'bg-red-50 border-red-300 text-red-800',
    advertencia: 'bg-orange-50 border-orange-300 text-orange-800',
    sesion:      'bg-blue-50 border-blue-300 text-blue-800',
    '':          'bg-red-50 border-red-200 text-red-700',
  }

  const iconoError = {
    bloqueo:     '🔒',
    advertencia: '⚠️',
    sesion:      'ℹ️',
    '':          '✕',
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">PISST</h1>
          <p className="text-gray-500 text-sm mt-1">
            Plataforma Integral de Seguridad y Salud en el Trabajo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@empresa.com"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => { setModalRecuperar(true); setMensajeRecuperar(''); setEmailRecuperar('') }}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className={`border rounded-lg px-4 py-3 text-sm flex gap-2 items-start ${estiloError[errorTipo]}`}>
              <span className="mt-0.5 shrink-0">{iconoError[errorTipo]}</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || errorTipo === 'bloqueo'}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-6 bg-gray-50 rounded-lg p-4 text-xs text-gray-500">
          <p className="font-medium mb-2 text-gray-600">Usuarios demo:</p>
          <p>sst@pisst.demo / demo123</p>
          <p>gerencia@pisst.demo / demo123</p>
          <p>empleado@pisst.demo / demo123</p>
        </div>

      </div>

      {/* Modal — Olvidé mi contraseña */}
      {modalRecuperar && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-blue-900 mb-1">Recuperar contraseña</h2>
            <p className="text-xs text-gray-500 mb-4">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña. El enlace expira en 30 minutos.
            </p>

            {mensajeRecuperar ? (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
                {mensajeRecuperar}
              </div>
            ) : (
              <form onSubmit={handleRecuperar} className="space-y-4">
                <input
                  type="email"
                  value={emailRecuperar}
                  onChange={e => setEmailRecuperar(e.target.value)}
                  placeholder="correo@empresa.com"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={enviandoRecuperar}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {enviandoRecuperar ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </form>
            )}

            <button
              onClick={() => setModalRecuperar(false)}
              className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

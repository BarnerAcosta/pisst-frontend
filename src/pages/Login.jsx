import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Login() {
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [error, setError]             = useState('')
  const [errorTipo, setErrorTipo]     = useState('')
  const [loading, setLoading]         = useState(false)

  const [modalRecuperar, setModalRecuperar]       = useState(false)
  const [emailRecuperar, setEmailRecuperar]       = useState('')
  const [mensajeRecuperar, setMensajeRecuperar]   = useState('')
  const [enviandoRecuperar, setEnviandoRecuperar] = useState(false)

  const { login }      = useAuth()
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const motivo = searchParams.get('sesion')
    if (motivo === 'dispositivo') {
      setErrorTipo('sesion')
      setError('Tu sesión fue cerrada porque iniciaste sesión desde otro dispositivo.')
    } else if (motivo === 'expirada') {
      setErrorTipo('sesion')
      setError('Tu sesión expiró. Por favor inicia sesión de nuevo.')
    }
  }, [])

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
      if (status === 429) setErrorTipo('bloqueo')
      else if (status === 401 && detalle.includes('intento')) setErrorTipo('advertencia')
      else if (detalle.includes('Sesión expirada') || detalle.includes('dispositivo')) setErrorTipo('sesion')
      else setErrorTipo('')
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
    bloqueo: '🔒', advertencia: '⚠️', sesion: 'ℹ️', '': '✕',
  }

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )

  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )

  const formulario = (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Correo electrónico
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="correo@empresa.com"
          required
          autoComplete="email"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-gray-600">Contraseña</label>
          <button
            type="button"
            onClick={() => { setModalRecuperar(true); setMensajeRecuperar(''); setEmailRecuperar('') }}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <div className="relative">
          <input
            type={verPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
          />
          <button
            type="button"
            onClick={() => setVerPassword(v => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            tabIndex={-1}
            aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {verPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      {error && (
        <div className={`border rounded-xl px-4 py-3 text-sm flex gap-2 items-start ${estiloError[errorTipo]}`}>
          <span className="mt-0.5 shrink-0">{iconoError[errorTipo]}</span>
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || errorTipo === 'bloqueo'}
        className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 text-sm shadow-sm"
      >
        {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </button>
    </form>
  )

  return (
    <>
      {/* ── MÓVIL / TABLET (< lg) ── */}
      <div className="lg:hidden min-h-screen flex flex-col bg-white">

        {/* Cabecera azul */}
        <div className="bg-blue-900 px-6 pt-14 pb-10">
          <h1 className="text-white text-3xl font-bold tracking-tight">PISST</h1>
          <p className="text-blue-300 text-sm mt-1 leading-relaxed">
            Plataforma Integral de Seguridad<br />y Salud en el Trabajo
          </p>
        </div>

        {/* Tarjeta formulario — se superpone sobre la cabecera */}
        <div className="flex-1 bg-gray-50 px-5 pt-6 pb-10">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 -mt-6 relative">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Bienvenido</h2>
            <p className="text-gray-400 text-xs mb-6">Ingresa tus credenciales para continuar</p>
            {formulario}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © 2025 PISST — Sistema de Gestión SST
          </p>
        </div>
      </div>

      {/* ── ESCRITORIO (≥ lg) ── */}
      <div className="hidden lg:flex min-h-screen">

        {/* Panel izquierdo */}
        <div className="w-5/12 bg-blue-900 flex flex-col justify-between p-14">
          <div>
            <h1 className="text-white text-3xl font-bold tracking-tight">PISST</h1>
            <p className="text-blue-300 text-sm mt-1">Plataforma Integral de Seguridad y Salud en el Trabajo</p>
          </div>
          <div className="space-y-7">
            {[
              { titulo: 'Gestión de incidentes', desc: 'Reporta y haz seguimiento de incidentes laborales en tiempo real.' },
              { titulo: 'Evaluación de riesgos', desc: 'Identifica peligros y controla los riesgos en tu empresa.' },
              { titulo: 'Capacitaciones SST', desc: 'Gestiona programas de formación y registra asistencia.' },
            ].map(item => (
              <div key={item.titulo} className="flex gap-3">
                <div className="w-0.5 rounded-full bg-blue-500 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">{item.titulo}</p>
                  <p className="text-blue-300 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-blue-400 text-xs">© 2025 PISST — Sistema de Gestión SST</p>
        </div>

        {/* Panel derecho */}
        <div className="flex-1 flex items-center justify-center bg-gray-50 px-10">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Bienvenido</h2>
              <p className="text-gray-400 text-sm mb-8">Ingresa tus credenciales para continuar</p>
              {formulario}
            </div>
          </div>
        </div>
      </div>

      {/* Modal — Olvidé mi contraseña */}
      {modalRecuperar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
          <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-xl p-6 sm:p-7">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
            <h2 className="text-lg font-bold text-blue-900 mb-1">Recuperar contraseña</h2>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña. El enlace expira en 30 minutos.
            </p>

            {mensajeRecuperar ? (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button
                  type="submit"
                  disabled={enviandoRecuperar}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                >
                  {enviandoRecuperar ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </form>
            )}

            <button
              onClick={() => setModalRecuperar(false)}
              className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 py-2 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  )
}

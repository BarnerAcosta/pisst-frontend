import { useState, useEffect, useRef } from 'react'
import api from '../services/api'

export default function FloatingSASBOT() {
  const [abierto, setAbierto]   = useState(false)
  const [mensaje, setMensaje]   = useState('')
  const [mensajes, setMensajes] = useState([])
  const [cargando, setCargando] = useState(false)
  const [hovered, setHovered]   = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    setMensajes([{
      tipo: 'bot',
      texto: '¡Hola! Soy SASBOT, tu asistente de Seguridad y Salud en el Trabajo. ¿En qué puedo ayudarte hoy?',
      emergencia: false,
    }])
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  useEffect(() => {
    if (abierto) setTimeout(() => inputRef.current?.focus(), 100)
  }, [abierto])

  async function enviarMensaje(e) {
    e.preventDefault()
    if (!mensaje.trim() || cargando) return
    const texto = mensaje.trim()
    setMensaje('')
    setMensajes(prev => [...prev, { tipo: 'usuario', texto }])
    setCargando(true)
    try {
      const res = await api.post('/chat/mensaje', { mensaje: texto })
      setMensajes(prev => [...prev, {
        tipo: 'bot',
        texto: res.data.respuesta,
        emergencia: res.data.modo_emergencia,
      }])
    } catch {
      setMensajes(prev => [...prev, {
        tipo: 'bot',
        texto: 'Lo siento, ocurrió un error. Intenta de nuevo.',
        emergencia: false,
      }])
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-3">

      {/* Panel de chat */}
      <div className={`transition-all duration-300 origin-bottom-right ${
        abierto
          ? 'opacity-100 scale-100 pointer-events-auto'
          : 'opacity-0 scale-95 pointer-events-none'
      }`}>
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-80 sm:w-96 flex flex-col overflow-hidden"
          style={{ height: '460px' }}>

          {/* Header */}
          <div className="bg-blue-900 px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-600 flex-shrink-0">
              <img src="/sasbot.jpeg" alt="SASBOT" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">SASBOT</p>
              <p className="text-blue-300 text-xs">Asistente SST · Gemini AI</p>
            </div>
            <button
              onClick={() => setAbierto(false)}
              className="text-blue-300 hover:text-white transition p-1 rounded-lg hover:bg-blue-800"
              aria-label="Cerrar chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {mensajes.map((msg, i) => (
              <div key={i} className={`flex ${msg.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                {msg.tipo === 'bot' && (
                  <div className={`w-7 h-7 rounded-full overflow-hidden mr-2 flex-shrink-0 mt-1 border ${msg.emergencia ? 'border-red-400' : 'border-blue-300'}`}>
                    <img src="/sasbot.jpeg" alt="SASBOT" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  msg.tipo === 'usuario'
                    ? 'bg-blue-700 text-white rounded-br-sm'
                    : msg.emergencia
                    ? 'bg-red-50 border border-red-200 text-red-900 rounded-bl-sm'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                }`}>
                  {msg.emergencia && (
                    <p className="text-xs font-bold text-red-600 mb-1 uppercase tracking-wide">⚠ Emergencia</p>
                  )}
                  {msg.texto.split('\n').map((linea, j) => (
                    <p key={j} className={j > 0 ? 'mt-1' : ''}>{linea}</p>
                  ))}
                </div>
              </div>
            ))}

            {cargando && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full overflow-hidden mr-2 flex-shrink-0 mt-1 border border-blue-300">
                  <img src="/sasbot.jpeg" alt="SASBOT" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white border border-gray-100 px-3 py-2 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={enviarMensaje} className="flex gap-2 p-3 border-t border-gray-100 bg-white flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              placeholder="Escribe tu pregunta..."
              disabled={cargando}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 bg-gray-50"
            />
            <button
              type="submit"
              disabled={cargando || !mensaje.trim()}
              className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-xl text-xs font-medium transition disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </div>
      </div>

      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(v => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Abrir SASBOT"
        className="relative group"
      >
        {!abierto && (
          <span className="absolute inset-0 rounded-full bg-blue-400 opacity-30 animate-ping" />
        )}
        <div className={`relative w-16 h-16 rounded-full overflow-hidden shadow-xl border-2 border-white transition-transform duration-200 ${
          hovered || abierto ? 'scale-110' : abierto ? '' : 'animate-bounce'
        }`} style={{ animationDuration: '2s' }}>
          <img src="/sasbot.jpeg" alt="SASBOT" className="w-full h-full object-cover" />
        </div>
        {/* Badge "x" cuando está abierto */}
        {abierto && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-900 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
      </button>

    </div>
  )
}

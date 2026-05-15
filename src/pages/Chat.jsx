// src/pages/Chat.jsx
import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import api from '../services/api'

export default function Chat() {
  const [mensaje, setMensaje] = useState('')
  const [mensajes, setMensajes] = useState([])
  const [cargando, setCargando] = useState(false)
  const bottomRef = useRef(null)

  // Mensaje de bienvenida al cargar
  useEffect(() => {
    setMensajes([{
      tipo: 'bot',
      texto: '¡Hola! Soy SASBOT, tu asistente de Seguridad y Salud en el Trabajo. ¿En qué puedo ayudarte hoy?',
      emergencia: false,
    }])
  }, [])

  // Scroll automático al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function enviarMensaje(e) {
    e.preventDefault()
    if (!mensaje.trim() || cargando) return

    const textoUsuario = mensaje.trim()
    setMensaje('')

    // Agregar mensaje del usuario
    setMensajes(prev => [...prev, { tipo: 'usuario', texto: textoUsuario }])
    setCargando(true)

    try {
      const response = await api.post('/chat/mensaje', { mensaje: textoUsuario })
      const { respuesta, modo_emergencia } = response.data

      setMensajes(prev => [...prev, {
        tipo: 'bot',
        texto: respuesta,
        emergencia: modo_emergencia,
      }])
    } catch (err) {
      setMensajes(prev => [...prev, {
        tipo: 'bot',
        texto: 'Lo siento, ocurrió un error. Por favor intenta de nuevo.',
        emergencia: false,
      }])
    } finally {
      setCargando(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">

        {/* Encabezado */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-blue-900">SASBOT</h1>
          <p className="text-gray-500 text-sm">
            Asistente de Seguridad y Salud en el Trabajo · Basado en Gemini AI
          </p>
        </div>

        {/* Área de mensajes */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-y-auto p-4 space-y-4">
          {mensajes.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar bot */}
              {msg.tipo === 'bot' && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1 ${msg.emergencia ? 'bg-red-600' : 'bg-blue-700'}`}>
                  IA
                </div>
              )}

              {/* Burbuja */}
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.tipo === 'usuario'
                    ? 'bg-blue-700 text-white rounded-br-sm'
                    : msg.emergencia
                    ? 'bg-red-50 border border-red-200 text-red-900 rounded-bl-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                {/* Badge emergencia */}
                {msg.emergencia && (
                  <div className="text-xs font-bold text-red-600 mb-1 uppercase tracking-wide">
                    ⚠ Modo emergencia
                  </div>
                )}
                {/* Texto con saltos de línea */}
                {msg.texto.split('\n').map((linea, j) => (
                  <p key={j} className={j > 0 ? 'mt-1' : ''}>{linea}</p>
                ))}
              </div>

              {/* Avatar usuario */}
              {msg.tipo === 'usuario' && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold ml-2 flex-shrink-0 mt-1">
                  Tú
                </div>
              )}
            </div>
          ))}

          {/* Indicador de carga */}
          {cargando && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold mr-2">
                IA
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1 items-center h-4">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input de mensaje */}
        <form onSubmit={enviarMensaje} className="mt-3 flex gap-2">
          <input
            type="text"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Escribe tu pregunta sobre SST..."
            disabled={cargando}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={cargando || !mensaje.trim()}
            className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-xl text-sm font-medium transition disabled:opacity-50"
          >
            Enviar
          </button>
        </form>

      </div>
    </Layout>
  )
}
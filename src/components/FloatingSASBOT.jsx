import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function FloatingSASBOT() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [hovered, setHovered] = useState(false)

  // No mostrar si ya estamos en /chat
  if (location.pathname === '/chat') return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">

      {/* Tooltip */}
      <div className={`transition-all duration-200 ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'}`}>
        <div className="bg-blue-900 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
          ¿Necesitas ayuda? Habla con SASBOT
        </div>
      </div>

      {/* Botón flotante */}
      <button
        onClick={() => navigate('/chat')}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Abrir SASBOT"
        className="relative group"
      >
        {/* Anillo de pulso */}
        <span className="absolute inset-0 rounded-full bg-blue-400 opacity-30 animate-ping" />

        {/* Imagen circular */}
        <div className={`relative w-16 h-16 rounded-full overflow-hidden shadow-xl border-2 border-white transition-transform duration-200 ${hovered ? 'scale-110' : 'animate-bounce'}`}
          style={{ animationDuration: '2s' }}>
          <img
            src="/sasbot.jpeg"
            alt="SASBOT"
            className="w-full h-full object-cover"
          />
        </div>
      </button>

    </div>
  )
}

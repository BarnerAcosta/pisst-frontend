import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import FloatingSASBOT from './FloatingSASBOT'

const menuSST = [
  { path: '/dashboard',      label: 'Dashboard' },
  { path: '/incidentes',     label: 'Incidentes' },
  { path: '/capacitaciones', label: 'Capacitaciones' },
  { path: '/riesgos',        label: 'Riesgos' },
  { path: '/auditorias',     label: 'Auditorías' },
  { path: '/metricas',       label: 'Métricas' },
  { path: '/usuarios',       label: 'Usuarios' },
]
const menuGerencia = [
  { path: '/metricas', label: 'Dashboard' },
]
const menuEmpleado = [
  { path: '/chat',      label: 'SASBOT' },
  { path: '/incidentes', label: 'Reportar incidente' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [drawerAbierto, setDrawerAbierto] = useState(false)

  const role = user?.role?.toString?.().toLowerCase?.()
  const menu =
    role === 'sst'      ? menuSST :
    role === 'gerencia' ? menuGerencia :
    menuEmpleado

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navLinks = (cerrarAlClick = false) => menu.map((item) => (
    <NavLink
      key={item.path}
      to={item.path}
      onClick={() => cerrarAlClick && setDrawerAbierto(false)}
      className={({ isActive }) =>
        `block px-3 py-2.5 rounded-lg text-sm transition ${
          isActive
            ? 'bg-blue-700 text-white font-medium'
            : 'text-blue-200 hover:bg-blue-800 hover:text-white'
        }`
      }
    >
      {item.label}
    </NavLink>
  ))

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── SIDEBAR ESCRITORIO (≥ md) ── */}
      <aside className="hidden md:flex w-56 bg-blue-900 text-white flex-col flex-shrink-0">
        <div className="px-6 py-5 border-b border-blue-800">
          <h1 className="text-xl font-bold">PISST</h1>
          <p className="text-blue-300 text-xs mt-0.5">SG-SST</p>
        </div>
        <div className="px-6 py-4 border-b border-blue-800">
          <p className="text-sm font-medium truncate">{user?.nombre}</p>
          <span className="text-xs bg-blue-700 text-blue-200 px-2 py-0.5 rounded-full mt-1 inline-block capitalize">
            {user?.role}
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks()}
        </nav>
        <div className="px-3 py-4 border-t border-blue-800">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-blue-300 hover:text-white hover:bg-blue-800 rounded-lg transition"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── LAYOUT MÓVIL (< md) ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Top bar móvil */}
        <header className="md:hidden flex items-center justify-between bg-blue-900 px-4 py-3 flex-shrink-0">
          <div>
            <span className="text-white font-bold text-lg">PISST</span>
            <span className="text-blue-300 text-xs ml-2">SG-SST</span>
          </div>
          <button
            onClick={() => setDrawerAbierto(true)}
            className="text-white p-1.5 rounded-lg hover:bg-blue-800 transition"
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {/* Drawer overlay */}
        {drawerAbierto && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={() => setDrawerAbierto(false)}
          />
        )}

        {/* Drawer lateral */}
        <div className={`md:hidden fixed top-0 left-0 h-full w-64 bg-blue-900 text-white z-50 flex flex-col transition-transform duration-300 ${
          drawerAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Header drawer */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-blue-800">
            <div>
              <p className="font-bold text-lg">PISST</p>
              <p className="text-blue-300 text-xs">SG-SST</p>
            </div>
            <button
              onClick={() => setDrawerAbierto(false)}
              className="text-blue-300 hover:text-white p-1 rounded-lg hover:bg-blue-800 transition"
              aria-label="Cerrar menú"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Info usuario */}
          <div className="px-5 py-4 border-b border-blue-800">
            <p className="text-sm font-medium truncate">{user?.nombre}</p>
            <span className="text-xs bg-blue-700 text-blue-200 px-2 py-0.5 rounded-full mt-1 inline-block capitalize">
              {user?.role}
            </span>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navLinks(true)}
          </nav>

          {/* Cerrar sesión */}
          <div className="px-3 py-4 border-t border-blue-800">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-blue-300 hover:text-white hover:bg-blue-800 rounded-lg transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* SASBOT flotante */}
      <FloatingSASBOT />

    </div>
  )
}

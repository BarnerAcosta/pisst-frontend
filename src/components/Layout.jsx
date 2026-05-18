// src/components/Layout.jsx
// Layout principal con sidebar de navegación por rol
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Menú según rol
const menuSST = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/incidentes', label: 'Incidentes' },
  { path: '/capacitaciones', label: 'Capacitaciones' },
  { path: '/riesgos', label: 'Riesgos' },
  { path: '/auditorias', label: 'Auditorías' },
  { path: '/metricas', label: 'Métricas' },
  { path: '/usuarios', label: 'Usuarios' },
  { path: '/chat', label: 'SASBOT' },
]

const menuGerencia = [
  { path: '/metricas', label: 'Dashboard' },
  { path: '/chat', label: 'SASBOT' },
]

const menuEmpleado = [
  { path: '/chat', label: 'SASBOT' },
  { path: '/incidentes', label: 'Reportar incidente' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Seleccionar menú según rol
  const menu =
    user?.role === 'sst' ? menuSST :
    user?.role === 'gerencia' ? menuGerencia :
    menuEmpleado

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Sidebar ── */}
      <aside className="w-56 bg-blue-900 text-white flex flex-col">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-blue-800">
          <h1 className="text-xl font-bold">PISST</h1>
          <p className="text-blue-300 text-xs mt-0.5">SG-SST</p>
        </div>

        {/* Info usuario */}
        <div className="px-6 py-4 border-b border-blue-800">
          <p className="text-sm font-medium truncate">{user?.nombre}</p>
          <span className="text-xs bg-blue-700 text-blue-200 px-2 py-0.5 rounded-full mt-1 inline-block capitalize">
            {user?.role}
          </span>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm transition ${
                  isActive
                    ? 'bg-blue-700 text-white font-medium'
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
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
      </aside>

      {/* ── Contenido principal ── */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>

    </div>
  )
}
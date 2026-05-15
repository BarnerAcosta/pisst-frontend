// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [alertas, setAlertas] = useState([])
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    try {
      setCargando(true)
      const [resDash, resAlertas] = await Promise.all([
        api.get('/metricas/dashboard-gerencia'),
        api.get('/metricas/alertas'),
      ])
      setDashboard(resDash.data)
      setAlertas(resAlertas.data.alertas || [])
    } catch {
      console.error('Error al cargar dashboard')
    } finally {
      setCargando(false)
    }
  }

  const accesosRapidos = [
    { label: 'Nuevo incidente', path: '/incidentes', color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' },
    { label: 'Capacitaciones', path: '/capacitaciones', color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' },
    { label: 'Evaluación de riesgos', path: '/riesgos', color: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' },
    { label: 'Auditorías', path: '/auditorias', color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100' },
    { label: 'Métricas', path: '/metricas', color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' },
    { label: 'SASBOT', path: '/chat', color: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' },
  ]

  const coloresAlerta = {
    critico: 'bg-red-50 border-red-200 text-red-700',
    medio:   'bg-yellow-50 border-yellow-200 text-yellow-700',
    bajo:    'bg-blue-50 border-blue-200 text-blue-700',
  }

  if (cargando) {
    return (
      <Layout>
        <div className="text-center py-20 text-gray-400">Cargando...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">

        {/* Encabezado */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-blue-900">Dashboard SST</h1>
          <p className="text-gray-500 text-sm mt-1">Panel de control del Encargado SST</p>
        </div>

        {/* KPI Cards */}
        {dashboard && (
          <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Cumplimiento SG-SST</p>
              <p className="text-3xl font-bold text-blue-700">{dashboard.cumplimiento_sgsst}%</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Incidentes activos</p>
              <p className="text-3xl font-bold text-red-600">{dashboard.incidentes_activos}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Último mes</p>
              <p className="text-3xl font-bold text-orange-500">{dashboard.incidentes_ultimo_mes}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Acciones vencidas</p>
              <p className="text-3xl font-bold text-orange-600">{dashboard.acciones_vencidas}</p>
            </div>
          </div>
        )}

        {/* Alertas activas */}
        {alertas.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-3">
              Alertas activas ({alertas.length})
            </h2>
            <div className="space-y-2">
              {alertas.map((alerta, i) => (
                <div
                  key={i}
                  className={`border rounded-lg px-4 py-3 text-sm ${coloresAlerta[alerta.nivel] || coloresAlerta.bajo}`}
                >
                  <span className="font-medium capitalize">{alerta.nivel}</span>
                  {' — '}
                  {alerta.mensaje}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accesos rápidos */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Accesos rápidos</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {accesosRapidos.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`border rounded-lg px-4 py-3 text-sm font-medium text-left transition ${item.color}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  )
}

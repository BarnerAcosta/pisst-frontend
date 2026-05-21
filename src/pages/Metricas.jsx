// src/pages/Metricas.jsx
import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../services/api'
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'

export default function Metricas() {
  const [dashboard, setDashboard] = useState(null)
  const [alertas, setAlertas] = useState([])
  const [cargando, setCargando] = useState(true)

  async function cargarDatos() {
    try {
      setCargando(true)
      const [resDash, resAlertas] = await Promise.all([
        api.get('/metricas/dashboard-gerencia'),
        api.get('/metricas/alertas').catch(() => ({ data: { alertas: [] } })),
      ])
      setDashboard(resDash.data)
      setAlertas(resAlertas.data.alertas || [])
    } catch {
      console.error('Error al cargar métricas')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void cargarDatos()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  if (cargando) {
    return (
      <Layout>
        <div className="text-center py-20 text-gray-400">Cargando métricas...</div>
      </Layout>
    )
  }

  if (!dashboard) return <Layout><div className="p-8 text-gray-500">Sin datos</div></Layout>

  const kpis = dashboard.kpis || {}

  // Datos para la gráfica de KPIs
  const dataGrafica = [
    { name: 'Accidentes', valor: kpis.total_accidentes || 0 },
    { name: 'Trabajadores', valor: kpis.total_trabajadores || 0 },
    { name: 'Días perdidos', valor: kpis.dias_perdidos || 0 },
  ]

  const coloresAlerta = {
    critico: 'bg-red-50 border-red-200 text-red-700',
    medio:   'bg-yellow-50 border-yellow-200 text-yellow-700',
    bajo:    'bg-blue-50 border-blue-200 text-blue-700',
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">

        {/* Encabezado */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-blue-900">Dashboard Ejecutivo</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen del Sistema de Gestión SST</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6 sm:gap-4 lg:grid-cols-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Cumplimiento SG-SST</p>
            <p className="text-3xl font-bold text-blue-700">{dashboard.cumplimiento_sgsst}%</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Incidentes activos</p>
            <p className="text-3xl font-bold text-red-600">{dashboard.incidentes_activos}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Capacitaciones</p>
            <p className="text-3xl font-bold text-green-600">{dashboard.total_capacitaciones}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Acciones vencidas</p>
            <p className="text-3xl font-bold text-orange-600">{dashboard.acciones_vencidas}</p>
          </div>
        </div>

        {/* KPIs técnicos */}
        <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-3 sm:gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Tasa de accidentalidad</p>
            <p className="text-2xl font-bold text-blue-900">{kpis.tasa_accidentalidad ?? 0}%</p>
            <p className="text-xs text-gray-400 mt-1">accidentes / trabajadores × 100</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Índice de frecuencia</p>
            <p className="text-2xl font-bold text-blue-900">{kpis.indice_frecuencia ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">accidentes / horas × 1.000.000</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Índice de severidad</p>
            <p className="text-2xl font-bold text-blue-900">{kpis.indice_severidad ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">días perdidos / horas × 1.000.000</p>
          </div>
        </div>

        {/* Gráfica */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Resumen de datos SST</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dataGrafica}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="name" tick={{ fontSize: 11 }}/>
              <YAxis tick={{ fontSize: 11 }}/>
              <Tooltip/>
              <Bar dataKey="valor" fill="#1d4ed8" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Exportar reportes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Exportar reportes</h2>
          <div className="flex flex-wrap gap-3">
            {['mensual', 'trimestral', 'anual'].map(periodo => (
              <div key={periodo} className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      const res = await api.get(`/metricas/reporte-pdf?periodo=${periodo}`, { responseType: 'blob' })
                      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
                      const a = document.createElement('a'); a.href = url
                      a.download = `reporte_sst_${periodo}.pdf`; a.click(); URL.revokeObjectURL(url)
                    } catch { console.error('Error al descargar PDF') }
                  }}
                  className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-700 hover:bg-red-50 rounded-lg transition capitalize"
                >
                  PDF {periodo}
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await api.get(`/metricas/reporte-excel?periodo=${periodo}`, { responseType: 'blob' })
                      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
                      const a = document.createElement('a'); a.href = url
                      a.download = `reporte_sst_${periodo}.xlsx`; a.click(); URL.revokeObjectURL(url)
                    } catch { console.error('Error al descargar Excel') }
                  }}
                  className="px-3 py-1.5 text-xs font-medium border border-green-200 text-green-700 hover:bg-green-50 rounded-lg transition capitalize"
                >
                  Excel {periodo}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas */}
        {alertas.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
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

      </div>
    </Layout>
  )
}

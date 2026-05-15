// src/pages/Metricas.jsx
import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../services/api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'

export default function Metricas() {
  const [dashboard, setDashboard] = useState(null)
  const [alertas, setAlertas] = useState([])
  const [cargando, setCargando] = useState(true)
  const { user } = { user: JSON.parse(sessionStorage.getItem('pisst_user') || '{}') }

  useEffect(() => {
    cargarDatos()
  }, [])

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
          <h1 className="text-2xl font-bold text-blue-900">Dashboard Ejecutivo</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen del Sistema de Gestión SST</p>
        </div>

        {/* KPI Cards */}
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
            <p className="text-xs text-gray-500 mb-1">Capacitaciones</p>
            <p className="text-3xl font-bold text-green-600">{dashboard.total_capacitaciones}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Acciones vencidas</p>
            <p className="text-3xl font-bold text-orange-600">{dashboard.acciones_vencidas}</p>
          </div>
        </div>

        {/* KPIs técnicos */}
        <div className="grid grid-cols-3 gap-4 mb-6">
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

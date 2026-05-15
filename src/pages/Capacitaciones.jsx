// src/pages/Capacitaciones.jsx
import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../services/api'

export default function Capacitaciones() {
  const [capacitaciones, setCapacitaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    titulo: '',
    objetivos: '',
    duracion_horas: 1,
  })

  useEffect(() => {
    cargarCapacitaciones()
  }, [])

  async function cargarCapacitaciones() {
    try {
      setCargando(true)
      const res = await api.get('/capacitaciones/')
      setCapacitaciones(res.data)
    } catch {
      setError('Error al cargar las capacitaciones')
    } finally {
      setCargando(false)
    }
  }

  async function crearCapacitacion(e) {
    e.preventDefault()
    try {
      await api.post('/capacitaciones/', form)
      setMostrarFormulario(false)
      setForm({ titulo: '', objetivos: '', duracion_horas: 1 })
      cargarCapacitaciones()
    } catch {
      setError('Error al crear la capacitación')
    }
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">

        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Capacitaciones</h1>
            <p className="text-gray-500 text-sm mt-1">
              {capacitaciones.length} programa{capacitaciones.length !== 1 ? 's' : ''} registrado{capacitaciones.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Nueva capacitación
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Lista */}
        {cargando ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : capacitaciones.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
            No hay capacitaciones registradas
          </div>
        ) : (
          <div className="space-y-3">
            {capacitaciones.map(cap => (
              <div key={cap.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{cap.titulo}</h3>
                    {cap.objetivos && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{cap.objetivos}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {cap.duracion_horas}h
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cap.activo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {cap.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal nueva capacitación */}
        {mostrarFormulario && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h2 className="text-lg font-bold text-blue-900 mb-4">Nueva capacitación</h2>
              <form onSubmit={crearCapacitacion} className="space-y-4">

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Título</label>
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={e => setForm({...form, titulo: e.target.value})}
                    placeholder="Ej: Inducción SST para nuevos empleados"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Objetivos</label>
                  <textarea
                    value={form.objetivos}
                    onChange={e => setForm({...form, objetivos: e.target.value})}
                    placeholder="Describe los objetivos de la capacitación..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Duración (horas)</label>
                  <input
                    type="number"
                    value={form.duracion_horas}
                    onChange={e => setForm({...form, duracion_horas: parseInt(e.target.value)})}
                    min={1}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setMostrarFormulario(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium transition"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}

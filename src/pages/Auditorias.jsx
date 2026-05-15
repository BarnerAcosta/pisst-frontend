// src/pages/Auditorias.jsx
import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../services/api'

export default function Auditorias() {
  const [auditorias, setAuditorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    objetivos: '',
    fecha_programada: '',
  })

  useEffect(() => {
    cargarAuditorias()
  }, [])

  async function cargarAuditorias() {
    try {
      setCargando(true)
      const res = await api.get('/auditorias/')
      setAuditorias(res.data)
    } catch {
      setError('Error al cargar las auditorías')
    } finally {
      setCargando(false)
    }
  }

  async function crearAuditoria(e) {
    e.preventDefault()
    try {
      await api.post('/auditorias/', form)
      setMostrarFormulario(false)
      setForm({ objetivos: '', fecha_programada: '' })
      cargarAuditorias()
    } catch {
      setError('Error al crear la auditoría')
    }
  }

  const coloresEstado = {
    planificada:  'bg-blue-100 text-blue-700',
    en_ejecucion: 'bg-yellow-100 text-yellow-700',
    completada:   'bg-green-100 text-green-700',
    cancelada:    'bg-gray-100 text-gray-500',
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">

        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Auditorías Internas</h1>
            <p className="text-gray-500 text-sm mt-1">
              {auditorias.length} auditoría{auditorias.length !== 1 ? 's' : ''} registrada{auditorias.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Nueva auditoría
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
        ) : auditorias.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
            No hay auditorías registradas
          </div>
        ) : (
          <div className="space-y-3">
            {auditorias.map(aud => (
              <div key={aud.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${coloresEstado[aud.estado]}`}>
                        {aud.estado.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(aud.fecha_programada).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                    {aud.objetivos && (
                      <p className="text-sm text-gray-700 mt-1">{aud.objetivos}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal nueva auditoría */}
        {mostrarFormulario && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h2 className="text-lg font-bold text-blue-900 mb-4">Nueva auditoría</h2>
              <form onSubmit={crearAuditoria} className="space-y-4">

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Objetivos</label>
                  <textarea
                    value={form.objetivos}
                    onChange={e => setForm({...form, objetivos: e.target.value})}
                    placeholder="Describe los objetivos de la auditoría..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha programada</label>
                  <input
                    type="datetime-local"
                    value={form.fecha_programada}
                    onChange={e => setForm({...form, fecha_programada: e.target.value})}
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

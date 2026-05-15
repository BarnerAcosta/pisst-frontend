import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../services/api'

export default function Incidentes() {
  const [incidentes, setIncidentes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('')

  const [form, setForm] = useState({
    tipo: 'accidente',
    severidad: 'leve',
    fecha: '',
    lugar: '',
    descripcion: '',
  })

  useEffect(() => {
    cargarIncidentes()
  }, [filtroEstado])

  async function cargarIncidentes() {
    try {
      setCargando(true)
      const params = filtroEstado ? { estado: filtroEstado } : {}
      const res = await api.get('/incidentes/', { params })
      setIncidentes(res.data)
    } catch {
      setError('Error al cargar los incidentes')
    } finally {
      setCargando(false)
    }
  }

  async function crearIncidente(e) {
    e.preventDefault()
    try {
      await api.post('/incidentes/', form)
      setMostrarFormulario(false)
      setForm({ tipo: 'accidente', severidad: 'leve', fecha: '', lugar: '', descripcion: '' })
      cargarIncidentes()
    } catch {
      setError('Error al crear el incidente')
    }
  }

  const coloresEstado = {
    borrador:         'bg-gray-100 text-gray-700',
    en_revision:      'bg-yellow-100 text-yellow-700',
    abierto:          'bg-red-100 text-red-700',
    en_investigacion: 'bg-orange-100 text-orange-700',
    cerrado:          'bg-green-100 text-green-700',
  }

  const coloresSeveridad = {
    sin_lesion: 'bg-green-100 text-green-700',
    leve:       'bg-yellow-100 text-yellow-700',
    moderada:   'bg-orange-100 text-orange-700',
    grave:      'bg-red-100 text-red-700',
    mortal:     'bg-red-900 text-white',
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Incidentes</h1>
            <p className="text-gray-500 text-sm mt-1">
              {incidentes.length} incidente{incidentes.length !== 1 ? 's' : ''} registrado{incidentes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Nuevo incidente
          </button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {['', 'borrador', 'en_revision', 'abierto', 'en_investigacion', 'cerrado'].map(estado => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filtroEstado === estado
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {estado === '' ? 'Todos' : estado.replace('_', ' ')}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : incidentes.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
            No hay incidentes registrados
          </div>
        ) : (
          <div className="space-y-3">
            {incidentes.map(inc => (
              <div key={inc.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-gray-900 capitalize">
                        {inc.tipo.replace('_', ' ')}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${coloresEstado[inc.estado]}`}>
                        {inc.estado.replace('_', ' ')}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${coloresSeveridad[inc.severidad]}`}>
                        {inc.severidad.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{inc.descripcion}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {inc.lugar} · {new Date(inc.fecha).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <button
                    onClick={() => window.open(`${import.meta.env.VITE_API_URL}/incidentes/${inc.id}/furat`)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                  >
                    Descargar FURAT
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {mostrarFormulario && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h2 className="text-lg font-bold text-blue-900 mb-4">Nuevo incidente</h2>
              <form onSubmit={crearIncidente} className="space-y-4">

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={form.tipo}
                      onChange={e => setForm({...form, tipo: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="accidente">Accidente</option>
                      <option value="incidente">Incidente</option>
                      <option value="cuasi_accidente">Cuasi accidente</option>
                      <option value="condicion_insegura">Condición insegura</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Severidad</label>
                    <select
                      value={form.severidad}
                      onChange={e => setForm({...form, severidad: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="sin_lesion">Sin lesión</option>
                      <option value="leve">Leve</option>
                      <option value="moderada">Moderada</option>
                      <option value="grave">Grave</option>
                      <option value="mortal">Mortal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha del incidente</label>
                  <input
                    type="datetime-local"
                    value={form.fecha}
                    onChange={e => setForm({...form, fecha: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lugar</label>
                  <input
                    type="text"
                    value={form.lugar}
                    onChange={e => setForm({...form, lugar: e.target.value})}
                    placeholder="Ej: Bodega principal, piso 2"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={form.descripcion}
                    onChange={e => setForm({...form, descripcion: e.target.value})}
                    placeholder="Describe qué ocurrió..."
                    required
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                    Guardar incidente
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
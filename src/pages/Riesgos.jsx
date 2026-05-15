// src/pages/Riesgos.jsx
import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../services/api'

export default function Riesgos() {
  const [peligros, setPeligros] = useState([])
  const [matriz, setMatriz] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    descripcion: '',
    tipo: 'mecanico',
    actividad: '',
    trabajadores_expuestos: 1,
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    try {
      setCargando(true)
      const [resPeligros, resMatriz] = await Promise.all([
        api.get('/riesgos/peligros'),
        api.get('/riesgos/matriz'),
      ])
      setPeligros(resPeligros.data)
      setMatriz(resMatriz.data)
    } catch {
      setError('Error al cargar los riesgos')
    } finally {
      setCargando(false)
    }
  }

  async function crearPeligro(e) {
    e.preventDefault()
    try {
      await api.post('/riesgos/peligros', form)
      setMostrarFormulario(false)
      setForm({ descripcion: '', tipo: 'mecanico', actividad: '', trabajadores_expuestos: 1 })
      cargarDatos()
    } catch {
      setError('Error al crear el peligro')
    }
  }

  const coloresNivel = {
    bajo:    'bg-green-100 text-green-700 border-green-200',
    medio:   'bg-yellow-100 text-yellow-700 border-yellow-200',
    alto:    'bg-orange-100 text-orange-700 border-orange-200',
    critico: 'bg-red-100 text-red-700 border-red-200',
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">

        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Evaluación de Riesgos</h1>
            <p className="text-gray-500 text-sm mt-1">
              {peligros.length} peligro{peligros.length !== 1 ? 's' : ''} identificado{peligros.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Nuevo peligro
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Resumen matriz */}
        {matriz && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {['critico', 'alto', 'medio', 'bajo'].map(nivel => (
              <div key={nivel} className={`border rounded-xl p-4 ${coloresNivel[nivel]}`}>
                <p className="text-xs font-medium capitalize mb-1">{nivel}</p>
                <p className="text-3xl font-bold">
                  {matriz[nivel === 'critico' ? 'criticos' : nivel === 'alto' ? 'altos' : nivel === 'medio' ? 'medios' : 'bajos']}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Lista peligros */}
        {cargando ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : peligros.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
            No hay peligros identificados
          </div>
        ) : (
          <div className="space-y-3">
            {peligros.map(peligro => (
              <div key={peligro.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{peligro.descripcion}</p>
                    {peligro.actividad && (
                      <p className="text-sm text-gray-500 mt-1">{peligro.actividad}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                        {peligro.tipo}
                      </span>
                      <span className="text-xs text-gray-400">
                        {peligro.trabajadores_expuestos} trabajador{peligro.trabajadores_expuestos !== 1 ? 'es' : ''} expuesto{peligro.trabajadores_expuestos !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal nuevo peligro */}
        {mostrarFormulario && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h2 className="text-lg font-bold text-blue-900 mb-4">Nuevo peligro</h2>
              <form onSubmit={crearPeligro} className="space-y-4">

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={form.descripcion}
                    onChange={e => setForm({...form, descripcion: e.target.value})}
                    placeholder="Describe el peligro identificado..."
                    required
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={form.tipo}
                      onChange={e => setForm({...form, tipo: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="fisico">Físico</option>
                      <option value="quimico">Químico</option>
                      <option value="biologico">Biológico</option>
                      <option value="ergonomico">Ergonómico</option>
                      <option value="psicosocial">Psicosocial</option>
                      <option value="mecanico">Mecánico</option>
                      <option value="electrico">Eléctrico</option>
                      <option value="locativo">Locativo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Trabajadores expuestos</label>
                    <input
                      type="number"
                      value={form.trabajadores_expuestos}
                      onChange={e => setForm({...form, trabajadores_expuestos: parseInt(e.target.value)})}
                      min={1}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Actividad (opcional)</label>
                  <input
                    type="text"
                    value={form.actividad}
                    onChange={e => setForm({...form, actividad: e.target.value})}
                    placeholder="Ej: Carga y descarga de materiales"
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

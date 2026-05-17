import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../services/api'

const coloresNivel = {
  bajo:    'bg-green-100 text-green-700 border-green-200',
  medio:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  alto:    'bg-orange-100 text-orange-700 border-orange-200',
  critico: 'bg-red-100 text-red-700 border-red-200',
}

const coloresTipo = {
  eliminacion:    'bg-green-50 text-green-700',
  sustitucion:    'bg-blue-50 text-blue-700',
  ingenieria:     'bg-purple-50 text-purple-700',
  administrativo: 'bg-yellow-50 text-yellow-700',
  epp:            'bg-gray-100 text-gray-700',
}

export default function Riesgos() {
  const [peligros, setPeligros] = useState([])
  const [matriz, setMatriz] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({ descripcion: '', tipo: 'mecanico', actividad: '', trabajadores_expuestos: 1 })

  // Peligro expandido
  const [expandido, setExpandido] = useState(null)
  const [detallePeligro, setDetallePeligro] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  // Formulario evaluación
  const [mostrarFormEval, setMostrarFormEval] = useState(false)
  const [formEval, setFormEval] = useState({ probabilidad: 3, severidad: 3, es_residual: false })

  // Formulario medida de control
  const [mostrarFormControl, setMostrarFormControl] = useState(false)
  const [formControl, setFormControl] = useState({ descripcion: '', tipo: 'administrativo', fecha_limite: '' })

  useEffect(() => { cargarDatos() }, [])

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

  async function expandirPeligro(peligro) {
    if (expandido?.id === peligro.id) { setExpandido(null); setDetallePeligro(null); return }
    setExpandido(peligro)
    setMostrarFormEval(false)
    setMostrarFormControl(false)
    setCargandoDetalle(true)
    try {
      const res = await api.get(`/riesgos/peligros/${peligro.id}`)
      setDetallePeligro(res.data)
    } catch {
      setDetallePeligro(null)
    } finally {
      setCargandoDetalle(false)
    }
  }

  async function evaluarRiesgo(e) {
    e.preventDefault()
    try {
      const payload = {
        probabilidad: parseInt(formEval.probabilidad),
        severidad: parseInt(formEval.severidad),
        es_residual: formEval.es_residual,
      }
      const res = await api.post(`/riesgos/peligros/${expandido.id}/evaluar`, payload)
      setDetallePeligro(prev => ({
        ...prev,
        evaluaciones: [...(prev?.evaluaciones || []), res.data]
      }))
      setMostrarFormEval(false)
      setFormEval({ probabilidad: 3, severidad: 3, es_residual: false })
      cargarDatos()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al evaluar el riesgo')
    }
  }

  async function crearControl(e) {
    e.preventDefault()
    try {
      const payload = {
        ...formControl,
        fecha_limite: formControl.fecha_limite ? new Date(formControl.fecha_limite).toISOString() : undefined,
      }
      const res = await api.post(`/riesgos/peligros/${expandido.id}/controles`, payload)
      setDetallePeligro(prev => ({
        ...prev,
        medidas_control: [...(prev?.medidas_control || []), res.data]
      }))
      setMostrarFormControl(false)
      setFormControl({ descripcion: '', tipo: 'administrativo', fecha_limite: '' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear medida de control')
    }
  }

  async function actualizarControl(medidaId, estado) {
    const evidencia = estado === 'implementada' ? window.prompt('Evidencia de implementación:') : undefined
    if (estado === 'implementada' && !evidencia) return
    try {
      const res = await api.patch(`/riesgos/controles/${medidaId}`, { estado, evidencia })
      setDetallePeligro(prev => ({
        ...prev,
        medidas_control: (prev?.medidas_control || []).map(m => m.id === medidaId ? res.data : m)
      }))
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar medida')
    }
  }

  const nivelLabel = n => n === 'critico' ? 'Críticos' : n === 'alto' ? 'Altos' : n === 'medio' ? 'Medios' : 'Bajos'
  const matrizKey  = n => n === 'critico' ? 'criticos' : n === 'alto' ? 'altos' : n === 'medio' ? 'medios' : 'bajos'

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Evaluación de Riesgos</h1>
            <p className="text-gray-500 text-sm mt-1">
              {peligros.length} peligro{peligros.length !== 1 ? 's' : ''} identificado{peligros.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => setMostrarFormulario(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            + Nuevo peligro
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
            <button onClick={() => setError('')} className="ml-2 font-bold">✕</button>
          </div>
        )}

        {/* Resumen matriz */}
        {matriz && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {['critico', 'alto', 'medio', 'bajo'].map(nivel => (
              <div key={nivel} className={`border rounded-xl p-4 ${coloresNivel[nivel]}`}>
                <p className="text-xs font-medium capitalize mb-1">{nivelLabel(nivel)}</p>
                <p className="text-3xl font-bold">{matriz[matrizKey(nivel)] ?? 0}</p>
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
              <div key={peligro.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

                {/* Fila principal */}
                <div className="p-4 cursor-pointer hover:bg-gray-50 transition" onClick={() => expandirPeligro(peligro)}>
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
                    <span className="text-gray-400 text-sm">{expandido?.id === peligro.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Panel expandido */}
                {expandido?.id === peligro.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-5">

                    {cargandoDetalle ? (
                      <p className="text-sm text-gray-400">Cargando detalle...</p>
                    ) : (
                      <>
                        {/* Evaluaciones */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Evaluaciones de riesgo</h3>
                            <button onClick={() => { setMostrarFormEval(!mostrarFormEval); setMostrarFormControl(false) }}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                              + Evaluar
                            </button>
                          </div>

                          {detallePeligro?.evaluaciones?.length > 0 ? (
                            <div className="space-y-2">
                              {detallePeligro.evaluaciones.map(ev => (
                                <div key={ev.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-3 py-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${coloresNivel[ev.nivel_riesgo]}`}>
                                    {ev.nivel_riesgo}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    P:{ev.probabilidad} × S:{ev.severidad} = {ev.probabilidad * ev.severidad}
                                  </span>
                                  {ev.es_residual && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">residual</span>}
                                  <span className="text-xs text-gray-400 ml-auto">
                                    {new Date(ev.fecha_evaluacion).toLocaleDateString('es-CO')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">Sin evaluaciones</p>
                          )}

                          {mostrarFormEval && (
                            <form onSubmit={evaluarRiesgo} className="mt-3 bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Probabilidad (1-5): <span className="text-blue-700 font-bold">{formEval.probabilidad}</span>
                                  </label>
                                  <input type="range" min={1} max={5} value={formEval.probabilidad}
                                    onChange={e => setFormEval({...formEval, probabilidad: e.target.value})}
                                    className="w-full accent-blue-700"/>
                                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>Rara</span><span>Casi segura</span>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Severidad (1-5): <span className="text-blue-700 font-bold">{formEval.severidad}</span>
                                  </label>
                                  <input type="range" min={1} max={5} value={formEval.severidad}
                                    onChange={e => setFormEval({...formEval, severidad: e.target.value})}
                                    className="w-full accent-blue-700"/>
                                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>Leve</span><span>Catastrófica</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-center">
                                <span className="text-sm text-gray-600">Puntuación: </span>
                                <span className="text-xl font-bold text-blue-700">{formEval.probabilidad * formEval.severidad}</span>
                                <span className="text-sm text-gray-400"> / 25</span>
                              </div>
                              <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" checked={formEval.es_residual}
                                  onChange={e => setFormEval({...formEval, es_residual: e.target.checked})}
                                  className="rounded"/>
                                Riesgo residual (después de controles)
                              </label>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => setMostrarFormEval(false)}
                                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                                  Cancelar
                                </button>
                                <button type="submit"
                                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium">
                                  Evaluar
                                </button>
                              </div>
                            </form>
                          )}
                        </div>

                        {/* Medidas de control */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Medidas de control</h3>
                            <button onClick={() => { setMostrarFormControl(!mostrarFormControl); setMostrarFormEval(false) }}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                              + Control
                            </button>
                          </div>

                          {detallePeligro?.medidas_control?.length > 0 ? (
                            <div className="space-y-2">
                              {detallePeligro.medidas_control.map(m => (
                                <div key={m.id} className="flex items-start gap-3 bg-white border border-gray-100 rounded-lg px-3 py-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${coloresTipo[m.tipo]}`}>
                                    {m.tipo}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-800 truncate">{m.descripcion}</p>
                                    {m.evidencia && <p className="text-xs text-gray-500 mt-0.5">Evidencia: {m.evidencia}</p>}
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.estado === 'implementada' ? 'bg-green-100 text-green-700' : m.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                      {m.estado}
                                    </span>
                                    {m.estado !== 'implementada' && (
                                      <button onClick={() => actualizarControl(m.id, 'implementada')}
                                        className="text-xs text-green-600 hover:text-green-800 font-medium">
                                        ✓
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">Sin medidas de control</p>
                          )}

                          {mostrarFormControl && (
                            <form onSubmit={crearControl} className="mt-3 bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                                <input type="text" value={formControl.descripcion} onChange={e => setFormControl({...formControl, descripcion: e.target.value})}
                                  required placeholder="Describe la medida de control..."
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo (jerarquía)</label>
                                  <select value={formControl.tipo} onChange={e => setFormControl({...formControl, tipo: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="eliminacion">Eliminación</option>
                                    <option value="sustitucion">Sustitución</option>
                                    <option value="ingenieria">Ingeniería</option>
                                    <option value="administrativo">Administrativo</option>
                                    <option value="epp">EPP</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha límite</label>
                                  <input type="datetime-local" value={formControl.fecha_limite} onChange={e => setFormControl({...formControl, fecha_limite: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => setMostrarFormControl(false)}
                                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                                  Cancelar
                                </button>
                                <button type="submit"
                                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium">
                                  Guardar
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
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
                  <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
                    placeholder="Describe el peligro identificado..." required rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                    <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                    <input type="number" value={form.trabajadores_expuestos} onChange={e => setForm({...form, trabajadores_expuestos: parseInt(e.target.value)})}
                      min={1} required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Actividad (opcional)</label>
                  <input type="text" value={form.actividad} onChange={e => setForm({...form, actividad: e.target.value})}
                    placeholder="Ej: Carga y descarga de materiales"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setMostrarFormulario(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                    Cancelar
                  </button>
                  <button type="submit"
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium transition">
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

import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../services/api'

const coloresEstado = {
  planificada:  'bg-blue-100 text-blue-700',
  en_ejecucion: 'bg-yellow-100 text-yellow-700',
  completada:   'bg-green-100 text-green-700',
  cancelada:    'bg-gray-100 text-gray-500',
}

const TRANSICIONES = {
  planificada:  ['en_ejecucion', 'cancelada'],
  en_ejecucion: ['completada', 'cancelada'],
  completada:   [],
  cancelada:    [],
}

const coloresClasificacion = {
  conformidad:              'bg-green-100 text-green-700',
  no_conformidad_menor:     'bg-yellow-100 text-yellow-700',
  no_conformidad_mayor:     'bg-red-100 text-red-700',
  observacion:              'bg-blue-100 text-blue-700',
}

export default function Auditorias() {
  const [auditorias, setAuditorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [error, setError] = useState('')

  // Formulario nueva auditoría
  const [form, setForm] = useState({ objetivos: '', fecha_programada: '' })

  // Auditoría expandida
  const [expandida, setExpandida] = useState(null)
  const [hallazgos, setHallazgos] = useState([])
  const [cargandoHallazgos, setCargandoHallazgos] = useState(false)
  const [progreso, setProgreso] = useState(null)

  // Formulario hallazgo
  const [mostrarFormHallazgo, setMostrarFormHallazgo] = useState(false)
  const [formHallazgo, setFormHallazgo] = useState({ descripcion: '', clasificacion: 'conformidad', evidencia: '', recomendacion: '' })

  // No conformidades
  const [ncExpandida, setNcExpandida] = useState(null)
  const [mostrarFormNC, setMostrarFormNC] = useState(null)
  const [formNC, setFormNC] = useState({ descripcion: '', fecha_limite: '', responsable_id: '' })
  const [noConformidades, setNoConformidades] = useState({})

  useEffect(() => { cargarAuditorias() }, [])

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
      await api.post('/auditorias/', { ...form, fecha_programada: new Date(form.fecha_programada).toISOString() })
      setMostrarFormulario(false)
      setForm({ objetivos: '', fecha_programada: '' })
      cargarAuditorias()
    } catch {
      setError('Error al crear la auditoría')
    }
  }

  async function expandirAuditoria(aud) {
    if (expandida?.id === aud.id) { setExpandida(null); return }
    setExpandida(aud)
    setMostrarFormHallazgo(false)
    setCargandoHallazgos(true)
    try {
      const [resH, resProg] = await Promise.all([
        api.get(`/auditorias/${aud.id}/hallazgos`),
        api.get(`/auditorias/${aud.id}/progreso`),
      ])
      setHallazgos(resH.data)
      setProgreso(resProg.data)
    } catch {
      setHallazgos([])
    } finally {
      setCargandoHallazgos(false)
    }
  }

  async function cambiarEstado(audId, nuevoEstado) {
    try {
      await api.patch(`/auditorias/${audId}/estado?estado=${nuevoEstado}`)
      setAuditorias(prev => prev.map(a => a.id === audId ? { ...a, estado: nuevoEstado } : a))
      setExpandida(prev => prev?.id === audId ? { ...prev, estado: nuevoEstado } : prev)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cambiar estado')
    }
  }

  async function crearHallazgo(e) {
    e.preventDefault()
    try {
      const res = await api.post(`/auditorias/${expandida.id}/hallazgos`, formHallazgo)
      setHallazgos(prev => [...prev, res.data])
      setMostrarFormHallazgo(false)
      setFormHallazgo({ descripcion: '', clasificacion: 'conformidad', evidencia: '', recomendacion: '' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear hallazgo')
    }
  }

  async function crearNC(e, hallazgoId) {
    e.preventDefault()
    try {
      const payload = { ...formNC, fecha_limite: new Date(formNC.fecha_limite).toISOString() }
      const res = await api.post(`/auditorias/hallazgos/${hallazgoId}/nc`, payload)
      setNoConformidades(prev => ({ ...prev, [hallazgoId]: [...(prev[hallazgoId] || []), res.data] }))
      setMostrarFormNC(null)
      setFormNC({ descripcion: '', fecha_limite: '', responsable_id: '' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear NC')
    }
  }

  async function cerrarNC(ncId, hallazgoId) {
    const evidencia = window.prompt('Evidencia de cierre de la no conformidad:')
    if (!evidencia) return
    try {
      const res = await api.patch(`/auditorias/nc/${ncId}`, { estado: 'cerrada', evidencia_cierre: evidencia })
      setNoConformidades(prev => ({
        ...prev,
        [hallazgoId]: (prev[hallazgoId] || []).map(nc => nc.id === ncId ? res.data : nc)
      }))
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cerrar NC')
    }
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Auditorías Internas</h1>
            <p className="text-gray-500 text-sm mt-1">
              {auditorias.length} auditoría{auditorias.length !== 1 ? 's' : ''} registrada{auditorias.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => setMostrarFormulario(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            + Nueva auditoría
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
            <button onClick={() => setError('')} className="ml-2 font-bold">✕</button>
          </div>
        )}

        {cargando ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : auditorias.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
            No hay auditorías registradas
          </div>
        ) : (
          <div className="space-y-3">
            {auditorias.map(aud => (
              <div key={aud.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

                {/* Fila principal */}
                <div className="p-4 cursor-pointer hover:bg-gray-50 transition" onClick={() => expandirAuditoria(aud)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${coloresEstado[aud.estado]}`}>
                          {aud.estado.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(aud.fecha_programada).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                      {aud.objetivos && (
                        <p className="text-sm text-gray-700 mt-1">{aud.objetivos}</p>
                      )}
                    </div>
                    <span className="text-gray-400 text-sm">{expandida?.id === aud.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Panel expandido */}
                {expandida?.id === aud.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">

                    {/* Progreso + cambio de estado */}
                    <div className="flex items-center justify-between mb-4">
                      {progreso && (
                        <div className="text-sm text-gray-600">
                          Progreso: <span className="font-bold text-blue-700">{progreso.porcentaje_completado}%</span>
                          <span className="text-gray-400 ml-2">({progreso.nc_cerradas}/{progreso.total_nc} NC cerradas)</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {(TRANSICIONES[aud.estado] || []).map(siguiente => (
                          <button key={siguiente} onClick={() => cambiarEstado(aud.id, siguiente)}
                            className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:border-blue-400 hover:text-blue-700 text-gray-600 transition">
                            → {siguiente.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Hallazgos */}
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Hallazgos</h3>

                    {cargandoHallazgos ? (
                      <p className="text-sm text-gray-400">Cargando...</p>
                    ) : hallazgos.length === 0 ? (
                      <p className="text-sm text-gray-400 mb-3">No hay hallazgos registrados</p>
                    ) : (
                      <div className="space-y-3 mb-3">
                        {hallazgos.map(h => (
                          <div key={h.id} className="bg-white border border-gray-100 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${coloresClasificacion[h.clasificacion]}`}>
                                  {h.clasificacion.replace(/_/g, ' ')}
                                </span>
                                <p className="text-sm text-gray-800 mt-1">{h.descripcion}</p>
                                {h.recomendacion && (
                                  <p className="text-xs text-gray-500 mt-1">Rec: {h.recomendacion}</p>
                                )}
                              </div>
                              {(h.clasificacion === 'no_conformidad_menor' || h.clasificacion === 'no_conformidad_mayor') && (
                                <button onClick={() => setMostrarFormNC(mostrarFormNC === h.id ? null : h.id)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap">
                                  + NC
                                </button>
                              )}
                            </div>

                            {/* No conformidades de este hallazgo */}
                            {noConformidades[h.id]?.map(nc => (
                              <div key={nc.id} className="ml-3 border-l-2 border-gray-200 pl-3 mt-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-xs text-gray-700">{nc.descripcion}</p>
                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${nc.estado === 'cerrada' ? 'text-green-700' : 'text-orange-700'}`}>
                                      {nc.estado}
                                    </span>
                                  </div>
                                  {nc.estado !== 'cerrada' && (
                                    <button onClick={() => cerrarNC(nc.id, h.id)}
                                      className="text-xs text-green-600 hover:text-green-800 font-medium">
                                      Cerrar
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}

                            {/* Formulario NC */}
                            {mostrarFormNC === h.id && (
                              <form onSubmit={e => crearNC(e, h.id)} className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                                <textarea value={formNC.descripcion} onChange={e => setFormNC({...formNC, descripcion: e.target.value})}
                                  placeholder="Descripción de la no conformidad..." required rows={2}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
                                <input type="datetime-local" value={formNC.fecha_limite} onChange={e => setFormNC({...formNC, fecha_limite: e.target.value})} required
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                                <div className="flex gap-2">
                                  <button type="button" onClick={() => setMostrarFormNC(null)}
                                    className="flex-1 border border-gray-200 text-gray-600 py-1.5 rounded-lg text-xs hover:bg-gray-50">
                                    Cancelar
                                  </button>
                                  <button type="submit"
                                    className="flex-1 bg-blue-700 text-white py-1.5 rounded-lg text-xs font-medium hover:bg-blue-800">
                                    Crear NC
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulario hallazgo */}
                    {aud.estado === 'en_ejecucion' && (
                      !mostrarFormHallazgo ? (
                        <button onClick={() => setMostrarFormHallazgo(true)}
                          className="w-full border-2 border-dashed border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 py-2 rounded-lg text-sm transition">
                          + Agregar hallazgo
                        </button>
                      ) : (
                        <form onSubmit={crearHallazgo} className="space-y-3 bg-white border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Clasificación</label>
                              <select value={formHallazgo.clasificacion} onChange={e => setFormHallazgo({...formHallazgo, clasificacion: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="conformidad">Conformidad</option>
                                <option value="no_conformidad_menor">NC Menor</option>
                                <option value="no_conformidad_mayor">NC Mayor</option>
                                <option value="observacion">Observación</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                            <textarea value={formHallazgo.descripcion} onChange={e => setFormHallazgo({...formHallazgo, descripcion: e.target.value})}
                              required rows={2} placeholder="Describe el hallazgo..."
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Recomendación</label>
                            <input type="text" value={formHallazgo.recomendacion} onChange={e => setFormHallazgo({...formHallazgo, recomendacion: e.target.value})}
                              placeholder="Recomendación (opcional)"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setMostrarFormHallazgo(false)}
                              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                              Cancelar
                            </button>
                            <button type="submit"
                              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium transition">
                              Guardar hallazgo
                            </button>
                          </div>
                        </form>
                      )
                    )}
                  </div>
                )}
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
                  <textarea value={form.objetivos} onChange={e => setForm({...form, objetivos: e.target.value})}
                    placeholder="Describe los objetivos de la auditoría..." rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha programada</label>
                  <input type="datetime-local" value={form.fecha_programada} onChange={e => setForm({...form, fecha_programada: e.target.value})} required
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

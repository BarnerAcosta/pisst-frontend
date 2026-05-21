import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const coloresAsistencia = {
  presente:    'bg-green-100 text-green-700',
  ausente:     'bg-red-100 text-red-700',
  justificado: 'bg-yellow-100 text-yellow-700',
}

export default function Capacitaciones() {
  const { user } = useAuth()
  const esSST = user?.role?.toString?.().toLowerCase?.() === 'sst'

  const [capacitaciones, setCapacitaciones] = useState([])
  const [cobertura, setCobertura] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({ titulo: '', objetivos: '', duracion_horas: 1 })

  // Capacitación expandida
  const [expandida, setExpandida] = useState(null)
  const [sesiones, setSesiones] = useState([])
  const [cargandoSesiones, setCargandoSesiones] = useState(false)

  // Formulario sesión
  const [mostrarFormSesion, setMostrarFormSesion] = useState(false)
  const [formSesion, setFormSesion] = useState({ fecha: '', lugar: '' })

  // Sesión expandida (asistencia)
  const [sesionExpandida, setSesionExpandida] = useState(null)
  const [asistencia, setAsistencia] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [cargandoAsistencia, setCargandoAsistencia] = useState(false)

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    try {
      setCargando(true)
      const [resCap, resCob] = await Promise.all([
        api.get('/capacitaciones/'),
        api.get('/capacitaciones/cobertura').catch(() => ({ data: null })),
      ])
      setCapacitaciones(resCap.data)
      setCobertura(resCob.data)
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
      cargarDatos()
    } catch {
      setError('Error al crear la capacitación')
    }
  }

  async function expandirCapacitacion(cap) {
    if (expandida?.id === cap.id) { setExpandida(null); setSesiones([]); setSesionExpandida(null); return }
    setExpandida(cap)
    setMostrarFormSesion(false)
    setSesionExpandida(null)
    setCargandoSesiones(true)
    try {
      const [resSesiones, resUsers] = await Promise.all([
        api.get(`/capacitaciones/${cap.id}/sesiones`),
        esSST ? api.get('/usuarios/') : Promise.resolve({ data: [] }),
      ])
      setSesiones(resSesiones.data)
      setUsuarios(resUsers.data)
    } catch {
      setSesiones([])
    } finally {
      setCargandoSesiones(false)
    }
  }

  async function crearSesion(e) {
    e.preventDefault()
    try {
      const res = await api.post('/capacitaciones/sesiones', {
        ...formSesion,
        fecha: new Date(formSesion.fecha).toISOString(),
        capacitacion_id: expandida.id,
      })
      setSesiones(prev => [...prev, res.data])
      setMostrarFormSesion(false)
      setFormSesion({ fecha: '', lugar: '' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear sesión')
    }
  }

  async function expandirSesion(sesion) {
    if (sesionExpandida?.id === sesion.id) { setSesionExpandida(null); setAsistencia([]); return }
    setSesionExpandida(sesion)
    setCargandoAsistencia(true)
    try {
      const res = await api.get(`/capacitaciones/sesiones/${sesion.id}/asistencia`)
      setAsistencia(res.data)
    } catch {
      setAsistencia([])
    } finally {
      setCargandoAsistencia(false)
    }
  }

  async function registrarAsistencia(empleadoId, estado) {
    try {
      await api.post('/capacitaciones/asistencia', {
        sesion_id: sesionExpandida.id,
        empleado_id: empleadoId,
        estado,
      })
      setAsistencia(prev => {
        const existe = prev.find(a => a.empleado_id === empleadoId)
        if (existe) return prev.map(a => a.empleado_id === empleadoId ? { ...a, estado } : a)
        return [...prev, { empleado_id: empleadoId, estado, sesion_id: sesionExpandida.id }]
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar asistencia')
    }
  }

  function estadoAsistencia(empleadoId) {
    return asistencia.find(a => a.empleado_id === empleadoId)?.estado || null
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Capacitaciones</h1>
            <p className="text-gray-500 text-sm mt-1">
              {capacitaciones.length} programa{capacitaciones.length !== 1 ? 's' : ''} registrado{capacitaciones.length !== 1 ? 's' : ''}
            </p>
          </div>
          {esSST && (
            <button onClick={() => setMostrarFormulario(true)}
              className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              + Nueva capacitación
            </button>
          )}
        </div>

        {/* Cobertura */}
        {cobertura && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Cobertura del plan anual</p>
              <p className="text-xl font-bold text-blue-700">{cobertura.porcentaje_cobertura ?? 0}%</p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${cobertura.porcentaje_cobertura ?? 0}%` }}/>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span>{cobertura.sesiones_realizadas ?? 0} sesiones realizadas</span>
              <span>{cobertura.total_sesiones ?? 0} sesiones totales</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
            <button onClick={() => setError('')} className="ml-2 font-bold">✕</button>
          </div>
        )}

        {/* Lista capacitaciones */}
        {cargando ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : capacitaciones.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
            No hay capacitaciones registradas
          </div>
        ) : (
          <div className="space-y-3">
            {capacitaciones.map(cap => (
              <div key={cap.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

                {/* Fila principal */}
                <div className="p-4 cursor-pointer hover:bg-gray-50 transition" onClick={() => expandirCapacitacion(cap)}>
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
                    <span className="text-gray-400 text-sm">{expandida?.id === cap.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Panel expandido: sesiones */}
                {expandida?.id === cap.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">

                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sesiones</h3>
                      {esSST && (
                        <button onClick={() => setMostrarFormSesion(!mostrarFormSesion)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                          + Programar sesión
                        </button>
                      )}
                    </div>

                    {mostrarFormSesion && (
                      <form onSubmit={crearSesion} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 mb-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
                            <input type="datetime-local" value={formSesion.fecha} onChange={e => setFormSesion({...formSesion, fecha: e.target.value})} required
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Lugar</label>
                            <input type="text" value={formSesion.lugar} onChange={e => setFormSesion({...formSesion, lugar: e.target.value})}
                              placeholder="Sala de capacitaciones..."
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setMostrarFormSesion(false)}
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

                    {cargandoSesiones ? (
                      <p className="text-sm text-gray-400">Cargando sesiones...</p>
                    ) : sesiones.length === 0 ? (
                      <p className="text-sm text-gray-400">Sin sesiones programadas</p>
                    ) : (
                      <div className="space-y-2">
                        {sesiones.map(sesion => (
                          <div key={sesion.id} className="bg-white border border-gray-100 rounded-lg overflow-hidden">

                            {/* Fila sesión */}
                            <div className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 transition"
                              onClick={() => expandirSesion(sesion)}>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">
                                  {new Date(sesion.fecha).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                                {sesion.lugar && <p className="text-xs text-gray-500">{sesion.lugar}</p>}
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${sesion.activa ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {sesion.activa ? 'Activa' : 'Finalizada'}
                              </span>
                              <span className="text-gray-400 text-xs">{sesionExpandida?.id === sesion.id ? '▲' : '▼'}</span>
                            </div>

                            {/* Panel asistencia */}
                            {sesionExpandida?.id === sesion.id && esSST && (
                              <div className="border-t border-gray-100 p-3 bg-gray-50">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Asistencia</p>

                                {cargandoAsistencia ? (
                                  <p className="text-xs text-gray-400">Cargando...</p>
                                ) : usuarios.length === 0 ? (
                                  <p className="text-xs text-gray-400">Sin empleados registrados</p>
                                ) : (
                                  <div className="space-y-2">
                                    {usuarios.map(u => {
                                      const estado = estadoAsistencia(u.id)
                                      return (
                                        <div key={u.id} className="flex items-center justify-between gap-2">
                                          <div>
                                            <p className="text-xs font-medium text-gray-800">{u.nombre}</p>
                                            <p className="text-xs text-gray-400 capitalize">{u.role}</p>
                                          </div>
                                          <div className="flex gap-1">
                                            {['presente', 'ausente', 'justificado'].map(est => (
                                              <button key={est} onClick={() => registrarAsistencia(u.id, est)}
                                                className={`text-xs px-2 py-1 rounded-lg font-medium transition ${
                                                  estado === est
                                                    ? coloresAsistencia[est]
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}>
                                                {est.charAt(0).toUpperCase()}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
                  <input type="text" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})}
                    placeholder="Ej: Inducción SST para nuevos empleados" required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Objetivos</label>
                  <textarea value={form.objetivos} onChange={e => setForm({...form, objetivos: e.target.value})}
                    placeholder="Describe los objetivos de la capacitación..." rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Duración (horas)</label>
                  <input type="number" value={form.duracion_horas} onChange={e => setForm({...form, duracion_horas: parseInt(e.target.value)})}
                    min={1} required
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

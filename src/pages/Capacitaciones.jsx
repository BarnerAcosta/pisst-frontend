import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const coloresAsistencia = {
  presente:    'bg-green-100 text-green-700',
  ausente:     'bg-red-100 text-red-700',
  justificado: 'bg-yellow-100 text-yellow-700',
}

// Helper para convertir ISO a datetime-local sin cambios de zona horaria
function isoToDatetimeLocal(isoString) {
  if (!isoString) return ''
  // Si el string no tiene indicador de zona horaria, tratarlo como UTC
  if (!isoString.includes('Z') && !isoString.includes('+') && !isoString.match(/[+-]\d{2}:\d{2}$/)) {
    isoString = isoString + 'Z'
  }
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Helper para convertir datetime-local a ISO correctamente
function datetimeLocalToIso(datetimeLocalString) {
  if (!datetimeLocalString) return null
  const [date, time] = datetimeLocalString.split('T')
  const [year, month, day] = date.split('-')
  const [hours, minutes] = time.split(':')
  const dateObj = new Date(year, parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), 0)
  return dateObj.toISOString()
}

export default function Capacitaciones() {
  const { user } = useAuth()
  const esSST = user?.role === 'sst'

  const [capacitaciones, setCapacitaciones] = useState([])
  const [cobertura, setCobertura] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [areas, setAreas] = useState([])

  // Formulario nueva capacitación
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [form, setForm] = useState({ titulo: '', objetivos: '', duracion_horas: 1, area_ids: [] })

  // Edición de capacitación
  const [capacitacionEditando, setCapacitacionEditando] = useState(null)
  const [mostrarFormEditar, setMostrarFormEditar] = useState(false)
  const [formEditar, setFormEditar] = useState({ titulo: '', objetivos: '', duracion_horas: 1, activo: true })

  // Capacitación expandida
  const [expandida, setExpandida] = useState(null)
  const [sesiones, setSesiones] = useState([])
  const [cargandoSesiones, setCargandoSesiones] = useState(false)

  // Formulario sesión
  const [mostrarFormSesion, setMostrarFormSesion] = useState(false)
  const [formSesion, setFormSesion] = useState({ fecha: '', lugar: '', area_ids: [], empleado_ids: [] })
  const [empleadosPorArea, setEmpleadosPorArea] = useState([])

  // Reprogramación de sesión
  const [sesionReprogramando, setSesionReprogramando] = useState(null)
  const [mostrarFormReprogramar, setMostrarFormReprogramar] = useState(false)
  const [formReprogramar, setFormReprogramar] = useState({ fecha: '', lugar: '' })

  // Sesión expandida (asistencia)
  const [sesionExpandida, setSesionExpandida] = useState(null)
  const [asistencia, setAsistencia] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [cargandoAsistencia, setCargandoAsistencia] = useState(false)

  useEffect(() => { cargarDatos(); cargarAreas() }, [])

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

  async function cargarAreas() {
    try {
      const res = await api.get('/areas/')
      setAreas(res.data)
    } catch {
      // No mostrar error si falla cargar áreas, es opcional
    }
  }

  async function crearCapacitacion(e) {
    e.preventDefault()
    try {
      await api.post('/capacitaciones/', {
        titulo: form.titulo,
        objetivos: form.objetivos,
        duracion_horas: form.duracion_horas,
        ...(form.area_ids.length > 0 && { area_ids: form.area_ids }),
      })
      setMostrarFormulario(false)
      setForm({ titulo: '', objetivos: '', duracion_horas: 1, area_ids: [] })
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
        fecha: datetimeLocalToIso(formSesion.fecha),
        lugar: formSesion.lugar,
        capacitacion_id: expandida.id,
        ...(formSesion.empleado_ids.length > 0 && { empleado_ids: formSesion.empleado_ids }),
      })
      setSesiones(prev => [...prev, res.data])
      setMostrarFormSesion(false)
      setFormSesion({ fecha: '', lugar: '', area_ids: [], empleado_ids: [] })
      setEmpleadosPorArea([])
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

  async function editarCapacitacion(cap) {
    setCapacitacionEditando(cap)
    setFormEditar({
      titulo: cap.titulo || '',
      objetivos: cap.objetivos || '',
      duracion_horas: cap.duracion_horas || 1,
      activo: cap.activo ?? true,
    })
    setMostrarFormEditar(true)
  }

  async function guardarEdicionCapacitacion(e) {
    e.preventDefault()
    try {
      const payload = {}
      if (formEditar.titulo !== capacitacionEditando.titulo) payload.titulo = formEditar.titulo
      if (formEditar.objetivos !== capacitacionEditando.objetivos) payload.objetivos = formEditar.objetivos
      if (formEditar.duracion_horas !== capacitacionEditando.duracion_horas) payload.duracion_horas = formEditar.duracion_horas
      if (formEditar.activo !== capacitacionEditando.activo) payload.activo = formEditar.activo

      await api.patch(`/capacitaciones/${capacitacionEditando.id}`, payload)
      setMostrarFormEditar(false)
      setCapacitacionEditando(null)
      cargarDatos()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al editar la capacitación')
    }
  }

  async function cambiarAreasEnSesion(areaIds) {
    setFormSesion(prev => ({ ...prev, area_ids: areaIds }))
    if (areaIds.length > 0) {
      // Filtrar usuarios que pertenecen a las áreas seleccionadas
      const empleadosFiltered = usuarios.filter(u =>
        areaIds.includes(u.area_id) || (u.areas && u.areas.some(a => areaIds.includes(a.id)))
      )
      setEmpleadosPorArea(empleadosFiltered)
      setFormSesion(prev => ({ ...prev, empleado_ids: [] })) // Resetear selección de empleados
    } else {
      setEmpleadosPorArea([])
      setFormSesion(prev => ({ ...prev, empleado_ids: [] }))
    }
  }

  async function abrirReprogramarSesion(sesion) {
    setSesionReprogramando(sesion)
    setFormReprogramar({
      fecha: isoToDatetimeLocal(sesion.fecha),
      lugar: sesion.lugar || '',
    })
    setMostrarFormReprogramar(true)
  }

  async function guardarReprogramacionSesion(e) {
    e.preventDefault()
    try {
      const payload = {}
      if (formReprogramar.fecha && formReprogramar.fecha !== isoToDatetimeLocal(sesionReprogramando.fecha)) {
        payload.fecha = datetimeLocalToIso(formReprogramar.fecha)
      }
      if (formReprogramar.lugar && formReprogramar.lugar !== sesionReprogramando.lugar) {
        payload.lugar = formReprogramar.lugar
      }

      if (Object.keys(payload).length === 0) {
        setError('Debe cambiar al menos un campo para reprogramar')
        return
      }

      await api.patch(`/capacitaciones/sesiones/${sesionReprogramando.id}`, payload)
      setMostrarFormReprogramar(false)
      setSesionReprogramando(null)
      // Recargar sesiones de la capacitación expandida
      if (expandida) {
        const resSesiones = await api.get(`/capacitaciones/${expandida.id}/sesiones`)
        setSesiones(resSesiones.data)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al reprogramar la sesión')
    }
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
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{cap.titulo}</h3>
                        {esSST && (
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => editarCapacitacion(cap)}
                              className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-0.5 rounded transition"
                              title="Editar">
                              ✎
                            </button>
                            <button onClick={() => cambiarEstadoCapacitacion(cap, !cap.activo)}
                              className={`text-xs px-2 py-0.5 rounded transition font-medium ${
                                cap.activo
                                  ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
                                  : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                              }`}
                              title={cap.activo ? 'Suspender' : 'Activar'}>
                              {cap.activo ? '⊗' : '✓'}
                            </button>
                          </div>
                        )}
                      </div>
                      {cap.objetivos && (
                        <p className="text-sm text-gray-500 mb-1 line-clamp-2">{cap.objetivos}</p>
                      )}
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {cap.duracion_horas}h
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${cap.activo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {cap.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      {cap.areas && cap.areas.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {cap.areas.map(area => (
                            <span key={area.id} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                              {area.nombre}
                            </span>
                          ))}
                        </div>
                      )}
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
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Áreas (opcional)</label>
                          <div className="space-y-1 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                            {areas.length === 0 ? (
                              <p className="text-xs text-gray-400">No hay áreas disponibles</p>
                            ) : (
                              areas.map(area => (
                                <label key={area.id} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                                  <input type="checkbox" checked={formSesion.area_ids.includes(area.id)}
                                    onChange={e => {
                                      const newAreas = e.target.checked
                                        ? [...formSesion.area_ids, area.id]
                                        : formSesion.area_ids.filter(id => id !== area.id)
                                      cambiarAreasEnSesion(newAreas)
                                    }}
                                    className="rounded"/>
                                  {area.nombre}
                                </label>
                              ))
                            )}
                          </div>
                        </div>
                        {empleadosPorArea.length > 0 && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Empleados de las áreas seleccionadas</label>
                            <div className="space-y-1 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-gray-50">
                              {empleadosPorArea.map(emp => (
                                <label key={emp.id} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                                  <input type="checkbox" checked={formSesion.empleado_ids.includes(emp.id)}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        setFormSesion({...formSesion, empleado_ids: [...formSesion.empleado_ids, emp.id]})
                                      } else {
                                        setFormSesion({...formSesion, empleado_ids: formSesion.empleado_ids.filter(id => id !== emp.id)})
                                      }
                                    }}
                                    className="rounded"/>
                                  {emp.nombre} ({emp.role})
                                </label>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{formSesion.empleado_ids.length} empleado{formSesion.empleado_ids.length !== 1 ? 's' : ''} seleccionado{formSesion.empleado_ids.length !== 1 ? 's' : ''}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button type="button" onClick={() => {
                            setMostrarFormSesion(false)
                            setFormSesion({ fecha: '', lugar: '', area_ids: [], empleado_ids: [] })
                            setEmpleadosPorArea([])
                          }}
                            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                            Cancelar
                          </button>
                          <button type="submit"
                            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium">
                            Guardar sesión
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
                              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                {esSST && (
                                  <button onClick={() => abrirReprogramarSesion(sesion)}
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-0.5 rounded transition"
                                    title="Reprogramar">
                                    🔄
                                  </button>
                                )}
                                <span className={`text-xs px-2 py-0.5 rounded-full ${sesion.activa ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {sesion.activa ? 'Activa' : 'Finalizada'}
                                </span>
                              </div>
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
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
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
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Áreas dirigidas (opcional)</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2">
                    {areas.length === 0 ? (
                      <p className="text-xs text-gray-400">No hay áreas disponibles</p>
                    ) : (
                      areas.map(area => (
                        <label key={area.id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                          <input type="checkbox" checked={form.area_ids.includes(area.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setForm({...form, area_ids: [...form.area_ids, area.id]})
                              } else {
                                setForm({...form, area_ids: form.area_ids.filter(id => id !== area.id)})
                              }
                            }}
                            className="rounded"/>
                          {area.nombre}
                        </label>
                      ))
                    )}
                  </div>
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

        {/* Modal editar capacitación */}
        {mostrarFormEditar && capacitacionEditando && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h2 className="text-lg font-bold text-blue-900 mb-4">Editar capacitación</h2>
              <form onSubmit={guardarEdicionCapacitacion} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Título</label>
                  <input type="text" value={formEditar.titulo} onChange={e => setFormEditar({...formEditar, titulo: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Objetivos</label>
                  <textarea value={formEditar.objetivos} onChange={e => setFormEditar({...formEditar, objetivos: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Duración (horas)</label>
                  <input type="number" value={formEditar.duracion_horas} onChange={e => setFormEditar({...formEditar, duracion_horas: parseInt(e.target.value)})}
                    min={1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={formEditar.activo} onChange={e => setFormEditar({...formEditar, activo: e.target.checked})}
                      className="rounded"/>
                    Capacitación activa
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setMostrarFormEditar(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                    Cancelar
                  </button>
                  <button type="submit"
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium transition">
                    Guardar cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal reprogramar sesión */}
        {mostrarFormReprogramar && sesionReprogramando && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h2 className="text-lg font-bold text-blue-900 mb-4">Reprogramar sesión</h2>
              <form onSubmit={guardarReprogramacionSesion} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha (opcional)</label>
                  <input type="datetime-local" value={formReprogramar.fecha} onChange={e => setFormReprogramar({...formReprogramar, fecha: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  <p className="text-xs text-gray-500 mt-1">Dejar vacío para no cambiar la fecha actual</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lugar (opcional)</label>
                  <input type="text" value={formReprogramar.lugar} onChange={e => setFormReprogramar({...formReprogramar, lugar: e.target.value})}
                    placeholder="Sala de capacitaciones..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  <p className="text-xs text-gray-500 mt-1">Dejar vacío para no cambiar el lugar actual</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setMostrarFormReprogramar(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                    Cancelar
                  </button>
                  <button type="submit"
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium transition">
                    Reprogramar
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

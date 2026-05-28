import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const LIMIT = 20
const ESTADOS = ['borrador', 'en_revision', 'abierto', 'en_investigacion', 'cerrado']

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

export default function Incidentes() {
  const { user } = useAuth()
  const esSST = user?.role === 'sst'

  const [incidentes, setIncidentes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [pagina, setPagina] = useState(1)

  // Modal crear
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [form, setForm] = useState({ tipo: 'accidente', severidad: 'leve', fecha: '', lugar: '', descripcion: '' })

  // Modal detalle
  const [incidenteSeleccionado, setIncidenteSeleccionado] = useState(null)
  const [tabActiva, setTabActiva] = useState('info')
  const [guardando, setGuardando] = useState(false)

  // Investigación
  const [formInv, setFormInv] = useState({
    metodo_analisis: '5_por_que',
    causas_inmediatas: '',
    causas_basicas: '',
    factores_contribuyentes: '',
    descripcion_evento: '',
    lecciones_aprendidas: '',
  })

  // Acción correctiva
  const [acciones, setAcciones] = useState([])
  const [mostrarFormAccion, setMostrarFormAccion] = useState(false)
  const [formAccion, setFormAccion] = useState({ descripcion: '', prioridad: 'media', fecha_limite: '', responsable_id: '' })
  const [usuarios, setUsuarios] = useState([])

  const cargarIncidentes = useCallback(async () => {
    try {
      setCargando(true)
      const params = { skip: (pagina - 1) * LIMIT, limit: LIMIT }
      if (filtroEstado) params.estado = filtroEstado
      const res = await api.get('/incidentes/', { params })
      setIncidentes(res.data)
    } catch {
      setError('Error al cargar los incidentes')
    } finally {
      setCargando(false)
    }
  }, [filtroEstado, pagina])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void cargarIncidentes()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [cargarIncidentes])

  // Volver a página 1 cuando cambia el filtro
  useEffect(() => { setPagina(1) }, [filtroEstado])

  async function abrirDetalle(inc) {
    setIncidenteSeleccionado(inc)
    setTabActiva('info')
    setMostrarFormAccion(false)
    setFormAccion({ descripcion: '', prioridad: 'media', fecha_limite: '', responsable_id: '' })
    if (inc.investigacion) {
      setFormInv({
        metodo_analisis: inc.investigacion.metodo_analisis || '5_por_que',
        causas_inmediatas: inc.investigacion.causas_inmediatas || '',
        causas_basicas: inc.investigacion.causas_basicas || '',
        factores_contribuyentes: inc.investigacion.factores_contribuyentes || '',
        descripcion_evento: inc.investigacion.descripcion_evento || '',
        lecciones_aprendidas: inc.investigacion.lecciones_aprendidas || '',
      })
    } else {
      setFormInv({ metodo_analisis: '5_por_que', causas_inmediatas: '', causas_basicas: '', factores_contribuyentes: '', descripcion_evento: '', lecciones_aprendidas: '' })
    }
    // Cargar acciones y usuarios para SST
    try {
      const [resDetalle, resUsers] = await Promise.all([
        api.get(`/incidentes/${inc.id}`),
        esSST ? api.get('/usuarios/') : Promise.resolve({ data: [] }),
      ])
      setIncidenteSeleccionado(prev => prev?.id === inc.id ? resDetalle.data : prev)
      setAcciones(resDetalle.data.acciones_correctivas || [])
      setUsuarios(resUsers.data)
    } catch {
      setAcciones([])
    }
  }

  async function crearIncidente(e) {
    e.preventDefault()
    try {
      await api.post('/incidentes/', { ...form, fecha: new Date(form.fecha).toISOString() })
      setMostrarFormulario(false)
      setForm({ tipo: 'accidente', severidad: 'leve', fecha: '', lugar: '', descripcion: '' })
      cargarIncidentes()
    } catch {
      setError('Error al crear el incidente')
    }
  }

  async function cambiarEstado(nuevoEstado) {
    try {
      setGuardando(true)
      const res = await api.patch(`/incidentes/${incidenteSeleccionado.id}/estado`, { estado: nuevoEstado })
      setIncidenteSeleccionado(prev => ({ ...prev, estado: res.data.estado ?? nuevoEstado }))
      cargarIncidentes()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cambiar estado')
    } finally {
      setGuardando(false)
    }
  }

  async function guardarInvestigacion(e) {
    e.preventDefault()
    try {
      setGuardando(true)
      const res = await api.post(`/incidentes/${incidenteSeleccionado.id}/investigacion`, formInv)
      setIncidenteSeleccionado(prev => ({ ...prev, investigacion: res.data }))
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar investigación')
    } finally {
      setGuardando(false)
    }
  }

  async function crearAccion(e) {
    e.preventDefault()
    try {
      setGuardando(true)
      const payload = {
        ...formAccion,
        fecha_limite: new Date(formAccion.fecha_limite).toISOString(),
        responsable_id: formAccion.responsable_id || undefined,
      }
      const res = await api.post(`/incidentes/${incidenteSeleccionado.id}/acciones`, payload)
      setAcciones(prev => [...prev, res.data])
      setMostrarFormAccion(false)
      setFormAccion({ descripcion: '', prioridad: 'media', fecha_limite: '', responsable_id: '' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear acción')
    } finally {
      setGuardando(false)
    }
  }

  async function cerrarAccion(accionId) {
    const evidencia = window.prompt('Ingresa la evidencia del cierre:')
    if (!evidencia) return
    try {
      const res = await api.patch(`/incidentes/acciones/${accionId}`, { estado: 'cerrada', evidencia })
      setAcciones(prev => prev.map(a => a.id === accionId ? res.data : a))
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cerrar acción')
    }
  }

  async function descargarFurat() {
    try {
      const res = await api.get(`/incidentes/${incidenteSeleccionado.id}/furat`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `FURAT_${incidenteSeleccionado.id.slice(0,8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Error al generar el FURAT')
    }
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

        {/* Filtros */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {['', ...ESTADOS].map(estado => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filtroEstado === estado ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {estado === '' ? 'Todos' : estado.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
            <button onClick={() => setError('')} className="ml-2 font-bold">✕</button>
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
              <div
                key={inc.id}
                onClick={() => abrirDetalle(inc)}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-gray-900 capitalize">
                        {inc.tipo.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${coloresEstado[inc.estado]}`}>
                        {inc.estado.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${coloresSeveridad[inc.severidad]}`}>
                        {inc.severidad.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{inc.descripcion}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {inc.lugar} · {new Date(inc.fecha).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <span className="text-xs text-blue-500 whitespace-nowrap mt-1">Ver detalle →</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal crear incidente */}
        {mostrarFormulario && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h2 className="text-lg font-bold text-blue-900 mb-4">Nuevo incidente</h2>
              <form onSubmit={crearIncidente} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                    <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="accidente">Accidente</option>
                      <option value="incidente">Incidente</option>
                      <option value="cuasi_accidente">Cuasi accidente</option>
                      <option value="condicion_insegura">Condición insegura</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Severidad</label>
                    <select value={form.severidad} onChange={e => setForm({...form, severidad: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                  <input type="datetime-local" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lugar</label>
                  <input type="text" value={form.lugar} onChange={e => setForm({...form, lugar: e.target.value})}
                    placeholder="Ej: Bodega principal, piso 2" required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
                    placeholder="Describe qué ocurrió..." required rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setMostrarFormulario(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                    Cancelar
                  </button>
                  <button type="submit"
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium transition">
                    Guardar incidente
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal detalle incidente */}
        {incidenteSeleccionado && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

              {/* Header modal */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-blue-900 capitalize">
                    {incidenteSeleccionado.tipo?.replace(/_/g, ' ')}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${coloresEstado[incidenteSeleccionado.estado]}`}>
                      {incidenteSeleccionado.estado?.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${coloresSeveridad[incidenteSeleccionado.severidad]}`}>
                      {incidenteSeleccionado.severidad?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <button onClick={() => setIncidenteSeleccionado(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 px-6">
                {[
                  { id: 'info', label: 'Información' },
                  ...(esSST ? [{ id: 'investigacion', label: 'Investigación' }, { id: 'acciones', label: 'Acciones correctivas' }] : []),
                ].map(tab => (
                  <button key={tab.id} onClick={() => setTabActiva(tab.id)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition ${tabActiva === tab.id ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Contenido tabs */}
              <div className="flex-1 overflow-y-auto p-6">

                {/* Tab: Información */}
                {tabActiva === 'info' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Lugar</p>
                        <p className="font-medium text-gray-800">{incidenteSeleccionado.lugar}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Fecha</p>
                        <p className="font-medium text-gray-800">
                          {new Date(incidenteSeleccionado.fecha).toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Descripción</p>
                      <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3">{incidenteSeleccionado.descripcion}</p>
                    </div>
                    {incidenteSeleccionado.lesion && (
                      <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                        <p className="text-xs font-medium text-orange-700 mb-2">Lesión registrada</p>
                        <div className="text-sm text-gray-700 space-y-1">
                          <p>Tipo: {incidenteSeleccionado.lesion.tipo_lesion || '—'}</p>
                          <p>Parte afectada: {incidenteSeleccionado.lesion.parte_afectada || '—'}</p>
                          <p>Días de incapacidad: {incidenteSeleccionado.lesion.incapacidad_dias}</p>
                        </div>
                      </div>
                    )}
                    {/* Cambio de estado (SST) */}
                    {esSST && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Cambiar estado</p>
                        <div className="flex flex-wrap gap-2">
                          {ESTADOS.filter(e => e !== incidenteSeleccionado.estado).map(estado => (
                            <button key={estado} onClick={() => cambiarEstado(estado)} disabled={guardando}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:border-blue-400 hover:text-blue-700 text-gray-600 transition disabled:opacity-50">
                              → {estado.replace(/_/g, ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Descargar FURAT (SST) */}
                    {esSST && (
                      <button onClick={descargarFurat}
                        className="w-full border border-blue-200 text-blue-700 hover:bg-blue-50 py-2 rounded-lg text-sm font-medium transition">
                        Descargar FURAT (PDF)
                      </button>
                    )}
                  </div>
                )}

                {/* Tab: Investigación */}
                {tabActiva === 'investigacion' && esSST && (
                  <form onSubmit={guardarInvestigacion} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Método de análisis</label>
                      <select value={formInv.metodo_analisis} onChange={e => setFormInv({...formInv, metodo_analisis: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="5_por_que">5 Por Qué</option>
                        <option value="ishikawa">Ishikawa</option>
                        <option value="arbol_causas">Árbol de causas</option>
                        <option value="preliminary_hazard">Análisis preliminar</option>
                      </select>
                    </div>
                    {[
                      { key: 'descripcion_evento', label: 'Descripción del evento' },
                      { key: 'causas_inmediatas', label: 'Causas inmediatas' },
                      { key: 'causas_basicas', label: 'Causas básicas' },
                      { key: 'factores_contribuyentes', label: 'Factores contribuyentes' },
                      { key: 'lecciones_aprendidas', label: 'Lecciones aprendidas' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                        <textarea value={formInv[key]} onChange={e => setFormInv({...formInv, [key]: e.target.value})}
                          rows={2} placeholder={`Ingresa ${label.toLowerCase()}...`}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
                      </div>
                    ))}
                    <button type="submit" disabled={guardando}
                      className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                      {incidenteSeleccionado.investigacion ? 'Actualizar investigación' : 'Guardar investigación'}
                    </button>
                    {incidenteSeleccionado.investigacion && (
                      <p className="text-xs text-green-600 text-center">Investigación guardada</p>
                    )}
                  </form>
                )}

                {/* Tab: Acciones correctivas */}
                {tabActiva === 'acciones' && esSST && (
                  <div className="space-y-4">
                    {acciones.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No hay acciones correctivas registradas</p>
                    ) : (
                      <div className="space-y-3">
                        {acciones.map(accion => (
                          <div key={accion.id} className="border border-gray-100 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">{accion.descripcion}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    accion.estado === 'cerrada' ? 'bg-green-100 text-green-700' :
                                    accion.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {accion.estado}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    accion.prioridad === 'alta' ? 'bg-red-100 text-red-700' :
                                    accion.prioridad === 'media' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    Prioridad {accion.prioridad}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  Límite: {new Date(accion.fecha_limite).toLocaleDateString('es-CO')}
                                </p>
                                {accion.evidencia && (
                                  <p className="text-xs text-gray-500 mt-1">Evidencia: {accion.evidencia}</p>
                                )}
                              </div>
                              {accion.estado !== 'cerrada' && (
                                <button onClick={() => cerrarAccion(accion.id)}
                                  className="text-xs text-green-600 hover:text-green-800 font-medium whitespace-nowrap">
                                  Cerrar
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!mostrarFormAccion ? (
                      <button onClick={() => setMostrarFormAccion(true)}
                        className="w-full border-2 border-dashed border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 py-2 rounded-lg text-sm transition">
                        + Agregar acción correctiva
                      </button>
                    ) : (
                      <form onSubmit={crearAccion} className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                          <textarea value={formAccion.descripcion} onChange={e => setFormAccion({...formAccion, descripcion: e.target.value})}
                            required rows={2} placeholder="Describe la acción a tomar..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Prioridad</label>
                            <select value={formAccion.prioridad} onChange={e => setFormAccion({...formAccion, prioridad: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="baja">Baja</option>
                              <option value="media">Media</option>
                              <option value="alta">Alta</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha límite</label>
                            <input type="datetime-local" value={formAccion.fecha_limite} onChange={e => setFormAccion({...formAccion, fecha_limite: e.target.value})} required
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Responsable</label>
                          {usuarios.length > 0 ? (
                            <select value={formAccion.responsable_id} onChange={e => setFormAccion({...formAccion, responsable_id: e.target.value})} required
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="">Seleccionar...</option>
                              {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                            </select>
                          ) : (
                            <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                              No se pudieron cargar los usuarios. Cierra y vuelve a abrir el detalle.
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setMostrarFormAccion(false)}
                            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                            Cancelar
                          </button>
                          <button type="submit" disabled={guardando || usuarios.length === 0}
                            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                            Guardar
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {(pagina > 1 || incidentes.length === LIMIT) && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => setPagina(p => p - 1)}
              disabled={pagina === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ← Anterior
            </button>
            <span className="text-xs text-gray-500">Página {pagina}</span>
            <button
              onClick={() => setPagina(p => p + 1)}
              disabled={incidentes.length < LIMIT}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Siguiente →
            </button>
          </div>
        )}

      </div>
    </Layout>
  )
}

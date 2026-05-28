import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../services/api'

const coloresRol = {
  sst:      'bg-blue-100 text-blue-700',
  gerencia: 'bg-purple-100 text-purple-700',
  empleado: 'bg-gray-100 text-gray-700',
}

const LIMIT = 20
const formCrearVacio = { nombre: '', email: '', role: 'empleado', area_nombre: '', cargo_nombre: '' }

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [areas, setAreas] = useState([])
  const [cargos, setCargos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [errorAreas, setErrorAreas] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const [formCrear, setFormCrear] = useState(formCrearVacio)
  const [formEditar, setFormEditar] = useState({ nombre: '', activo: true, area_id: '', cargo_id: '' })

  // Gestión de áreas y cargos
  const [mostrarGestion, setMostrarGestion] = useState(false)
  const [nuevaArea, setNuevaArea] = useState('')
  const [guardandoArea, setGuardandoArea] = useState(false)
  const [nuevoCargo, setNuevoCargo] = useState({ nombre: '', area_id: '' })
  const [guardandoCargo, setGuardandoCargo] = useState(false)
  const [pagina, setPagina] = useState(1)

  useEffect(() => { cargarAreasCargos() }, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargarUsuarios() }, [pagina])

  async function cargarUsuarios() {
    try {
      setCargando(true)
      const res = await api.get('/usuarios/', { params: { skip: (pagina - 1) * LIMIT, limit: LIMIT } })
      setUsuarios(res.data)
    } catch {
      setError('Error al cargar los usuarios')
    } finally {
      setCargando(false)
    }
  }

  async function cargarAreasCargos() {
    setErrorAreas('')
    const [resAreas, resCargos] = await Promise.allSettled([
      api.get('/areas/'),
      api.get('/cargos/'),
    ])

    if (resAreas.status === 'fulfilled') {
      setAreas(resAreas.value.data)
    } else {
      setErrorAreas('No se pudieron cargar las áreas y cargos. Verifica tu conexión.')
    }

    if (resCargos.status === 'fulfilled') {
      setCargos(resCargos.value.data)
    }
  }

  async function crearUsuario(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      const payload = {
        nombre: formCrear.nombre,
        email: formCrear.email,
        role: formCrear.role,
        ...(formCrear.area_nombre  && { area_nombre:  formCrear.area_nombre }),
        ...(formCrear.cargo_nombre && { cargo_nombre: formCrear.cargo_nombre }),
      }
      await api.post('/usuarios/', payload)
      setMostrarFormulario(false)
      setFormCrear(formCrearVacio)
      setExito('Usuario creado. Se envió la contraseña temporal al correo registrado.')
      setTimeout(() => setExito(''), 5000)
      cargarUsuarios()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear usuario')
    } finally {
      setGuardando(false)
    }
  }

  async function actualizarUsuario(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      const payload = {
        nombre: formEditar.nombre,
        activo: formEditar.activo,
        area_id:  formEditar.area_id  || null,
        cargo_id: formEditar.cargo_id || null,
      }
      await api.patch(`/usuarios/${usuarioEditando.id}`, payload)
      setUsuarioEditando(null)
      cargarUsuarios()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar usuario')
    } finally {
      setGuardando(false)
    }
  }

  async function crearArea(e) {
    e.preventDefault()
    setGuardandoArea(true)
    try {
      await api.post('/areas/', { nombre: nuevaArea.trim() })
      setNuevaArea('')
      await cargarAreasCargos()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear el área')
    } finally {
      setGuardandoArea(false)
    }
  }

  async function crearCargo(e) {
    e.preventDefault()
    setGuardandoCargo(true)
    try {
      await api.post('/cargos/', { nombre: nuevoCargo.nombre.trim(), area_id: nuevoCargo.area_id })
      setNuevoCargo({ nombre: '', area_id: '' })
      await cargarAreasCargos()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear el cargo')
    } finally {
      setGuardandoCargo(false)
    }
  }

  function abrirEditar(u) {
    setUsuarioEditando(u)
    setFormEditar({ nombre: u.nombre, activo: u.activo, area_id: u.area_id ?? '', cargo_id: u.cargo_id ?? '' })
    setMostrarFormulario(false)
  }

  function cerrarModal() {
    setMostrarFormulario(false)
    setUsuarioEditando(null)
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Usuarios</h1>
            <p className="text-gray-500 text-sm mt-1">
              {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => { setMostrarFormulario(true); setUsuarioEditando(null) }}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            + Nuevo usuario
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
            <button onClick={() => setError('')} className="ml-2 font-bold">✕</button>
          </div>
        )}

        {exito && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
            {exito}
          </div>
        )}

        {errorAreas && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
            <span>{errorAreas}</span>
            <button onClick={cargarAreasCargos} className="ml-3 text-xs font-medium underline">Reintentar</button>
          </div>
        )}

        {cargando ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
            No hay usuarios registrados
          </div>
        ) : (
          <>
            {/* Tarjetas — móvil */}
            <div className="sm:hidden space-y-3">
              {usuarios.map(u => (
                <div key={u.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{u.nombre}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{u.email}</p>
                    </div>
                    <button onClick={() => abrirEditar(u)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0">
                      Editar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${coloresRol[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                      {areas.find(a => a.id === u.area_id)?.nombre ?? '—'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabla — escritorio */}
            <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Correo</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Rol</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Área</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
                    <th className="px-4 py-3"/>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {usuarios.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900">{u.nombre}</td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${coloresRol[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {areas.find(a => a.id === u.area_id)?.nombre ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => abrirEditar(u)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Panel de gestión de áreas y cargos */}
        <div className="mt-6">
          <button
            onClick={() => setMostrarGestion(v => !v)}
            className="flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 font-medium transition"
          >
            <svg className={`w-4 h-4 transition-transform ${mostrarGestion ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Gestionar áreas y cargos
          </button>

          {mostrarGestion && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Áreas */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Áreas <span className="text-gray-400 font-normal">({areas.length})</span>
                </h3>
                <div className="space-y-1 mb-3 max-h-28 overflow-y-auto">
                  {areas.length === 0
                    ? <p className="text-xs text-gray-400 italic">Sin áreas creadas</p>
                    : areas.map(a => (
                        <p key={a.id} className="text-xs text-gray-600">• {a.nombre}</p>
                      ))
                  }
                </div>
                <form onSubmit={crearArea} className="flex gap-2">
                  <input
                    type="text"
                    value={nuevaArea}
                    onChange={e => setNuevaArea(e.target.value)}
                    placeholder="Nueva área..."
                    required
                    className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={guardandoArea}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50"
                  >
                    +
                  </button>
                </form>
              </div>

              {/* Cargos */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Cargos <span className="text-gray-400 font-normal">({cargos.length})</span>
                </h3>
                <div className="space-y-1 mb-3 max-h-28 overflow-y-auto">
                  {cargos.length === 0
                    ? <p className="text-xs text-gray-400 italic">Sin cargos creados</p>
                    : cargos.map(c => (
                        <p key={c.id} className="text-xs text-gray-600">• {c.nombre}</p>
                      ))
                  }
                </div>
                {areas.length === 0 ? (
                  <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1.5">
                    Crea al menos un área antes de agregar cargos.
                  </p>
                ) : (
                  <form onSubmit={crearCargo} className="space-y-2">
                    <select
                      value={nuevoCargo.area_id}
                      onChange={e => setNuevoCargo({ ...nuevoCargo, area_id: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar área...</option>
                      {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={nuevoCargo.nombre}
                        onChange={e => setNuevoCargo({ ...nuevoCargo, nombre: e.target.value })}
                        placeholder="Nombre del cargo..."
                        required
                        className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={guardandoCargo}
                        className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Modal: crear usuario */}
        {mostrarFormulario && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-blue-900 mb-1">Nuevo usuario</h2>
              <p className="text-xs text-gray-500 mb-4">
                Se generará una contraseña temporal y se enviará al correo del usuario.
              </p>
              <form onSubmit={crearUsuario} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nombre completo</label>
                  <input type="text" value={formCrear.nombre} onChange={e => setFormCrear({...formCrear, nombre: e.target.value})} required
                    placeholder="Ej: Juan Pérez"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Correo electrónico</label>
                  <input type="email" value={formCrear.email} onChange={e => setFormCrear({...formCrear, email: e.target.value})} required
                    placeholder="correo@empresa.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rol</label>
                  <select value={formCrear.role} onChange={e => setFormCrear({...formCrear, role: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="empleado">Empleado</option>
                    <option value="sst">Encargado SST</option>
                    <option value="gerencia">Gerencia</option>
                  </select>
                </div>

                {/* Área */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Área <span className="text-gray-400">(opcional)</span>
                  </label>
                  {areas.length > 0 ? (
                    <select value={formCrear.area_nombre} onChange={e => setFormCrear({...formCrear, area_nombre: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Sin área asignada</option>
                      {areas.map(a => (
                        <option key={a.id} value={a.nombre}>{a.nombre}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" value={formCrear.area_nombre}
                      onChange={e => setFormCrear({...formCrear, area_nombre: e.target.value})}
                      placeholder="Nombre del área"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  )}
                </div>

                {/* Cargo */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Cargo <span className="text-gray-400">(opcional)</span>
                  </label>
                  {cargos.length > 0 ? (
                    <select value={formCrear.cargo_nombre} onChange={e => setFormCrear({...formCrear, cargo_nombre: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Sin cargo asignado</option>
                      {cargos.map(c => (
                        <option key={c.id} value={c.nombre}>{c.nombre}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" value={formCrear.cargo_nombre}
                      onChange={e => setFormCrear({...formCrear, cargo_nombre: e.target.value})}
                      placeholder="Nombre del cargo"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={cerrarModal}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                    Cancelar
                  </button>
                  <button type="submit" disabled={guardando}
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                    {guardando ? 'Creando...' : 'Crear usuario'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: editar usuario */}
        {usuarioEditando && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-blue-900 mb-4">Editar usuario</h2>
              <form onSubmit={actualizarUsuario} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nombre completo</label>
                  <input type="text" value={formEditar.nombre} onChange={e => setFormEditar({...formEditar, nombre: e.target.value})} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Área <span className="text-gray-400">(opcional)</span>
                  </label>
                  <select value={formEditar.area_id} onChange={e => setFormEditar({...formEditar, area_id: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Sin área asignada</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                  {areas.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      No hay áreas creadas.{' '}
                      <button type="button" onClick={() => { cerrarModal(); setMostrarGestion(true) }}
                        className="text-blue-600 hover:underline">
                        Crear áreas
                      </button>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Cargo <span className="text-gray-400">(opcional)</span>
                  </label>
                  <select value={formEditar.cargo_id} onChange={e => setFormEditar({...formEditar, cargo_id: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Sin cargo asignado</option>
                    {cargos.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                  {cargos.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      No hay cargos creados.{' '}
                      <button type="button" onClick={() => { cerrarModal(); setMostrarGestion(true) }}
                        className="text-blue-600 hover:underline">
                        Crear cargos
                      </button>
                    </p>
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={formEditar.activo} onChange={e => setFormEditar({...formEditar, activo: e.target.checked})}
                      className="rounded"/>
                    Usuario activo
                  </label>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
                  <p>Correo: <span className="font-medium text-gray-700">{usuarioEditando.email}</span></p>
                  <p>Rol: <span className={`font-medium px-1.5 py-0.5 rounded ${coloresRol[usuarioEditando.role]}`}>{usuarioEditando.role}</span></p>
                  <p className="mt-1 text-gray-400">El rol no se puede cambiar desde aquí.</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={cerrarModal}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                    Cancelar
                  </button>
                  <button type="submit" disabled={guardando}
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                    {guardando ? 'Guardando...' : 'Actualizar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {(pagina > 1 || usuarios.length === LIMIT) && (
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
              disabled={usuarios.length < LIMIT}
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

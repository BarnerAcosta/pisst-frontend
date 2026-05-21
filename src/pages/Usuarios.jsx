import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import api from '../services/api'

const coloresRol = {
  sst:      'bg-blue-100 text-blue-700',
  gerencia: 'bg-purple-100 text-purple-700',
  empleado: 'bg-gray-100 text-gray-700',
}

const areasSugeridas = [
  'Administración',
  'Operaciones',
  'Producción',
  'Logística',
  'Mantenimiento',
  'Calidad',
  'Recursos Humanos',
  'Seguridad y Salud en el Trabajo',
  'Comercial',
  'Tecnología',
]

function obtenerAreaUsuario(usuario) {
  return usuario?.area?.nombre || usuario?.area?.name || usuario?.area_nombre || usuario?.area || ''
}

export default function Usuarios() {
  const { user } = useAuth()
  const esSST = user?.role?.toString?.().toLowerCase?.() === 'sst'
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)

  // Crear: nombre, email, role
  const [formCrear, setFormCrear] = useState({ nombre: '', email: '', role: 'empleado', area: '' })

  // Editar: nombre, activo, area
  const [formEditar, setFormEditar] = useState({ nombre: '', activo: true, area: '' })

  useEffect(() => { cargarUsuarios() }, [])

  async function cargarUsuarios() {
    try {
      setCargando(true)
      const res = await api.get('/usuarios/')
      setUsuarios(res.data)
    } catch {
      setError('Error al cargar los usuarios')
    } finally {
      setCargando(false)
    }
  }

  async function crearUsuario(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      const payload = {
        ...formCrear,
        area: formCrear.area.trim() || undefined,
      }
      await api.post('/usuarios/', payload)
      setMostrarFormulario(false)
      setFormCrear({ nombre: '', email: '', role: 'empleado', area: '' })
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
        ...formEditar,
        area: formEditar.area.trim() || undefined,
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

  function abrirEditar(u) {
    setUsuarioEditando(u)
    setFormEditar({ nombre: u.nombre, activo: u.activo, area: obtenerAreaUsuario(u) })
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
          {esSST && (
            <button onClick={() => { setMostrarFormulario(true); setUsuarioEditando(null) }}
              className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              + Nuevo usuario
            </button>
          )}
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
                      {esSST && (
                        <button onClick={() => abrirEditar(u)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0">
                          Editar
                        </button>
                      )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${coloresRol[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                    {obtenerAreaUsuario(u) && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700">
                        {obtenerAreaUsuario(u)}
                      </span>
                    )}
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
                      <td className="px-4 py-3 text-gray-600">
                        {obtenerAreaUsuario(u) ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700">
                            {obtenerAreaUsuario(u)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Sin área</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {esSST && (
                          <button onClick={() => abrirEditar(u)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                            Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Modal: crear usuario */}
        {mostrarFormulario && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
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
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Área</label>
                  <input
                    type="text"
                    list="areas-usuario"
                    value={formCrear.area}
                    onChange={e => setFormCrear({...formCrear, area: e.target.value})}
                    placeholder="Ej: Producción"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="areas-usuario">
                    {areasSugeridas.map(area => <option key={area} value={area} />)}
                  </datalist>
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">Área</label>
                  <input
                    type="text"
                    list="areas-usuario"
                    value={formEditar.area}
                    onChange={e => setFormEditar({...formEditar, area: e.target.value})}
                    placeholder="Ej: Mantenimiento"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="areas-usuario">
                    {areasSugeridas.map(area => <option key={area} value={area} />)}
                  </datalist>
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
                  <p>Área: <span className="font-medium text-gray-700">{obtenerAreaUsuario(usuarioEditando) || 'Sin área'}</span></p>
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

      </div>
    </Layout>
  )
}

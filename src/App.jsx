import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Metricas from './pages/Metricas'
import Chat from './pages/Chat'
import Incidentes from './pages/Incidentes'
import Capacitaciones from './pages/Capacitaciones'
import Riesgos from './pages/Riesgos'
import Auditorias from './pages/Auditorias'
import Usuarios from './pages/Usuarios'
import ResetPassword from './pages/ResetPassword'


function PrivateRoute({ children, roles }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  const userRole = user?.role?.toString?.().toLowerCase?.()
  if (roles && !roles.map(r => r.toString().toLowerCase()).includes(userRole)) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user } = useAuth()

  const userRole = user?.role?.toString?.().toLowerCase?.()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/" element={
        <PrivateRoute>
          {userRole === 'sst'      ? <Navigate to="/dashboard" replace /> :
           userRole === 'gerencia' ? <Navigate to="/metricas" replace /> :
           userRole === 'empleado' ? <Navigate to="/chat" replace /> :
           <Navigate to="/login" replace />}
        </PrivateRoute>
      }/>

      <Route path="/dashboard" element={
        <PrivateRoute roles={['sst']}>
          <Dashboard />
        </PrivateRoute>
      }/>

      <Route path="/metricas" element={
        <PrivateRoute roles={['sst', 'gerencia']}>
          <Metricas />
        </PrivateRoute>
      }/>

      <Route path="/chat" element={
        <PrivateRoute>
          <Chat />
        </PrivateRoute>
      }/>

      <Route path="/incidentes" element={
       <PrivateRoute>
         <Incidentes />
       </PrivateRoute>
      }/>

      <Route path="/capacitaciones" element={
        <PrivateRoute roles={['sst']}>
          <Capacitaciones />
        </PrivateRoute>
      }/>

      <Route path="/riesgos" element={
        <PrivateRoute roles={['sst']}>
          <Riesgos />
        </PrivateRoute>
      }/>

      <Route path="/auditorias" element={
        <PrivateRoute roles={['sst']}>
          <Auditorias />
        </PrivateRoute>
      }/>

      <Route path="/usuarios" element={
        <PrivateRoute roles={['sst']}>
          <Usuarios />
        </PrivateRoute>
      }/>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
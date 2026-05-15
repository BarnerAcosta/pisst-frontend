import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Metricas from './pages/Metricas'
import Chat from './pages/Chat'
import Incidentes from './pages/Incidentes'
import Capacitaciones from './pages/Capacitaciones'
import Riesgos from './pages/Riesgos'


function PrivateRoute({ children, roles }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <PrivateRoute>
          {user?.role === 'sst' && <Navigate to="/dashboard" replace />}
          {user?.role === 'gerencia' && <Navigate to="/metricas" replace />}
          {user?.role === 'empleado' && <Navigate to="/chat" replace />}
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

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
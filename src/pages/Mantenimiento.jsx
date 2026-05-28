export default function Mantenimiento() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-blue-900 mb-2">Sistema en mantenimiento</h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          El servicio no está disponible temporalmente. Por favor intenta de nuevo en unos minutos.
        </p>
        <button
          onClick={() => window.location.href = '/login'}
          className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-medium transition"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  )
}

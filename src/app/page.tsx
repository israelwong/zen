export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          ZEN Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Plataforma de gestión empresarial moderna y eficiente
        </p>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Gestión</h3>
            <p className="text-gray-600">Administra tu negocio de manera eficiente</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Analytics</h3>
            <p className="text-gray-600">Analiza datos y toma decisiones informadas</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Colaboración</h3>
            <p className="text-gray-600">Trabaja en equipo de manera efectiva</p>
          </div>
        </div>
        <div className="mt-12">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Comenzar
          </button>
        </div>
      </div>
    </main>
  )
}

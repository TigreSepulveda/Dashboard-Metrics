export default function Dashboard() {
  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">📊 Panel de Control</h1>
        <p className="text-slate-500 mb-8">Métricas en tiempo real de tu aplicación</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-sm font-bold text-blue-600 mb-1">VENTAS TOTALES</p>
            <p className="text-3xl font-black text-slate-800">$12,840</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-sm font-bold text-purple-600 mb-1">USUARIOS</p>
            <p className="text-3xl font-black text-slate-800">1,245</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-sm font-bold text-orange-600 mb-1">RENDIMIENTO</p>
            <p className="text-3xl font-black text-slate-800">98.2%</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Actividad de la Semana</h2>
          <div className="flex items-end justify-around h-40 gap-2 bg-slate-50 p-4 rounded-xl">
            <div className="w-full bg-blue-400 h-20 rounded-t-lg"></div>
            <div className="w-full bg-blue-400 h-32 rounded-t-lg"></div>
            <div className="w-full bg-blue-600 h-40 rounded-t-lg"></div>
            <div className="w-full bg-blue-400 h-24 rounded-t-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
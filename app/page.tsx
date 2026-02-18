'use client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [metricas, setMetricas] = useState({
    arr: "...",
    profit: "...",
    billing: "..."
  });

  useEffect(() => {
    // REEMPLAZA ESTE LINK con tu enlace de "Publicar en la web" -> formato CSV
    const url = "TU_LINK_CSV_AQUÍ";

    fetch(url)
      .then(res => res.text())
      .then(csv => {
        const lineas = csv.split('\n');
        
        const extraerValor = (nombreMetrica) => {
          // Buscamos la fila que contenga el nombre exacto de tu columna E
          const fila = lineas.find(l => l.includes(nombreMetrica));
          if (fila) {
            const columnas = fila.split(',');
            // En tu sheet, el dato de Ene-2026 es la última columna con datos
            // Filtramos columnas vacías al final por si acaso
            const datosLimpios = columnas.filter(c => c.trim() !== "");
            let valor = datosLimpios[datosLimpios.length - 1];
            
            // Limpiamos comillas o espacios extras
            return valor.replace(/"/g, '').trim();
          }
          return "No encontrado";
        };

        setMetricas({
          arr: extraerValor("Actual ARR"),
          profit: extraerValor("Net Profit P&L"),
          billing: extraerValor("Total Billing")
        });
      })
      .catch(err => console.error("Error cargando Sheets:", err));
  }, []);

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 border-b border-slate-700 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-blue-400">📈 Financial Board</h1>
            <p className="text-slate-400">Datos reales de Google Sheets (Ene 2026)</p>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono">
            STATUS: LIVE_SYNC
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* ARR Card */}
          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <p className="text-blue-400 font-bold text-xs tracking-widest mb-2 uppercase">Actual ARR</p>
            <p className="text-4xl font-bold tracking-tight">${metricas.arr}</p>
          </div>

          {/* Profit Card */}
          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <p className="text-emerald-400 font-bold text-xs tracking-widest mb-2 uppercase">Net Profit P&L</p>
            <p className="text-4xl font-bold tracking-tight">${metricas.profit}</p>
          </div>

          {/* Billing Card */}
          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
            <p className="text-purple-400 font-bold text-xs tracking-widest mb-2 uppercase">Total Billing</p>
            <p className="text-4xl font-bold tracking-tight">${metricas.billing}</p>
          </div>
        </div>

        <div className="mt-12 p-6 bg-slate-800/50 border border-slate-700 rounded-2xl">
          <h2 className="text-lg font-bold mb-4 text-slate-300 italic">Notas del Reporte</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Este panel extrae automáticamente la última columna disponible de tu hoja de Google Sheets. 
            Cualquier cambio realizado en la nube se reflejará aquí al recargar la página.
          </p>
        </div>
      </div>
    </div>
  );
}
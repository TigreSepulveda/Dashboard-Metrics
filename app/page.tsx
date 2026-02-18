'use client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [metricas, setMetricas] = useState({
    arr: "Cargando...",
    profit: "Cargando...",
    billing: "Cargando..."
  });

  useEffect(() => {
    // REEMPLAZA ESTE LINK por el que copiaste en el paso 1
    const url = "TU_LINK_DE_GOOGLE_SHEETS_AQUÍ";

    fetch(url)
      .then(res => res.text())
      .then(csv => {
        const lineas = csv.split('\n');
        
        // Función para buscar un valor por el nombre de la métrica (Columna E)
        // y tomar el valor de la última columna (Ene-2026)
        const buscarValor = (nombre) => {
          const fila = lineas.find(l => l.includes(nombre));
          if (fila) {
            const columnas = fila.split(',');
            // Tomamos la última columna con datos (ajusta el índice si es necesario)
            return columnas[columnas.length - 1]; 
          }
          return "N/A";
        };

        setMetricas({
          arr: buscarValor("Actual ARR"),
          profit: buscarValor("Net Profit P&L"),
          billing: buscarValor("Total Billing")
        });
      });
  }, []);

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 border-b border-slate-700 pb-6">
          <h1 className="text-4xl font-black text-blue-400">📈 Dashboard Financiero</h1>
          <p className="text-slate-400">Datos sincronizados desde Google Sheets</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Tarjeta ARR */}
          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
            <p className="text-blue-400 font-bold text-sm tracking-widest mb-2 uppercase">Actual ARR</p>
            <p className="text-4xl font-mono">${metricas.arr}</p>
          </div>

          {/* Tarjeta Profit */}
          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
            <p className="text-green-400 font-bold text-sm tracking-widest mb-2 uppercase">Net Profit P&L</p>
            <p className="text-4xl font-mono">${metricas.profit}</p>
          </div>

          {/* Tarjeta Billing */}
          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
            <p className="text-purple-400 font-bold text-sm tracking-widest mb-2 uppercase">Total Billing</p>
            <p className="text-4xl font-mono">${metricas.billing}</p>
          </div>
        </div>
        
        <div className="mt-12 p-4 bg-blue-900/20 border border-blue-800 rounded-xl text-center">
          <p className="text-blue-300 text-sm">
            💡 Para actualizar: Cambia los datos en tu Sheets y refresca esta página.
          </p>
        </div>
      </div>
    </div>
  );
}
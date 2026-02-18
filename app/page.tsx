'use client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [metricas, setMetricas] = useState({ arr: "Cargando...", profit: "...", billing: "..." });

  useEffect(() => {
    // Reemplaza esto con tu link CSV de Google Sheets
    const url = "TU_URL_AQUÍ";

    fetch(url)
      .then(res => res.text())
      .then(csv => {
        const lineas = csv.split('\n');
        const buscarFila = (nombre) => {
          const fila = lineas.find(l => l.includes(nombre));
          if (!fila) return "0";
          const columnas = fila.split(',');
          return columnas[columnas.length - 1].replace(/"/g, '').trim();
        };

        setMetricas({
          arr: buscarFila("Actual ARR"),
          profit: buscarFila("Net Profit P&L"),
          billing: buscarFila("Total Billing")
        });
      })
      .catch(() => setMetricas({ arr: "Error", profit: "Error", billing: "Error" }));
  }, []);

  return (
    <div className="p-10 bg-slate-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8 text-blue-400">📊 Mi Financial Board</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <p className="text-xs text-slate-400 uppercase font-bold">Actual ARR</p>
          <p className="text-3xl font-mono">${metricas.arr}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <p className="text-xs text-slate-400 uppercase font-bold">Net Profit</p>
          <p className="text-3xl font-mono">${metricas.profit}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <p className="text-xs text-slate-400 uppercase font-bold">Total Billing</p>
          <p className="text-3xl font-mono">${metricas.billing}</p>
        </div>
      </div>
    </div>
  );
}
'use client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [metricas, setMetricas] = useState({ arr: "...", profit: "...", billing: "..." });

  useEffect(() => {
    // ASEGÚRATE de que este sea el link que termina en /pub?output=csv
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRi564nAqRM4F8wP9q5chBqEWl5LhGd9fV-KQltyJEOd0aL7mtbLHxiOpCswULwFfty7OAIUEB3Q4lR/pub?output=csv";

    fetch(url)
      .then(res => res.text())
      .then(csv => {
        const lineas = csv.split('\n');
        const buscar = (txt: string) => {
          const f = lineas.find(l => l.includes(txt));
          if (!f) return "0";
          const col = f.split(',');
          return col[col.length - 1].replace(/[致"$]/g, '').trim();
        };
        setMetricas({
          arr: buscar("Actual ARR"),
          profit: buscar("Net Profit P&L"),
          billing: buscar("Total Billing")
        });
      })
      .catch(() => console.log("Error de conexión"));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-10 font-sans">
      <h1 className="text-2xl font-bold mb-8 text-blue-400">Financial Metrics</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <p className="text-xs text-slate-400 uppercase">Actual ARR</p>
          <p className="text-2xl font-mono">${metricas.arr}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <p className="text-xs text-slate-400 uppercase">Net Profit</p>
          <p className="text-2xl font-mono">${metricas.profit}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <p className="text-xs text-slate-400 uppercase">Total Billing</p>
          <p className="text-2xl font-mono">${metricas.billing}</p>
        </div>
      </div>
    </div>
  );
}
'use client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [datosCompletos, setDatosCompletos] = useState<string[][]>([]);
  const [meses, setMeses] = useState<string[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [metricas, setMetricas] = useState({ arr: "...", profit: "...", billing: "..." });

  useEffect(() => {
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRi564nAqRM4F8wP9q5chBqEWl5LhGd9fV-KQltyJEOd0aL7mtbLHxiOpCswULwFfty7OAIUEB3Q4lR/pubhtml"; // REEMPLAZA CON TU LINK CSV

    fetch(url)
      .then(res => res.text())
      .then(csv => {
        const filas = csv.split('\n').map(f => f.split(','));
        setDatosCompletos(filas);

        // Extraemos los encabezados de meses (Fila 1, a partir de la columna AC en tu Excel)
        const encabezados = filas[0].filter(c => c.includes('-202'));
        setMeses(encabezados);
        setMesSeleccionado(encabezados[encabezados.length - 1]); // Selecciona el último por defecto
      });
  }, []);

  useEffect(() => {
    if (datosCompletos.length > 0 && mesSeleccionado) {
      const indiceColumna = datosCompletos[0].indexOf(mesSeleccionado);
      
      const buscarValor = (nombreMetrica: string) => {
        const fila = datosCompletos.find(f => f.join(' ').includes(nombreMetrica));
        if (fila && indiceColumna !== -1) {
          return fila[indiceColumna]?.replace(/[致"$]/g, '').trim() || "0";
        }
        return "N/A";
      };

      setMetricas({
        arr: buscarValor("Actual ARR"),
        profit: buscarValor("Net Profit P&L"),
        billing: buscarValor("Total Billing")
      });
    }
  }, [mesSeleccionado, datosCompletos]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              FINANCIAL REPORTING
            </h1>
            <p className="text-slate-400 mt-2 font-medium italic">Análisis de cierre mensual</p>
          </div>

          {/* Selector de Mes */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl">
            <label className="block text-xs font-black text-blue-500 mb-2 uppercase tracking-widest">Seleccionar Periodo</label>
            <select 
              value={mesSeleccionado} 
              onChange={(e) => setMesSeleccionado(e.target.value)}
              className="bg-slate-800 text-white border-none rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer w-48"
            >
              {meses.map(mes => <option key={mes} value={mes}>{mes}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card title="Actual ARR" value={metricas.arr} color="blue" />
          <Card title="Net Profit P&L" value={metricas.profit} color="emerald" />
          <Card title="Total Billing" value={metricas.billing} color="purple" />
        </div>
        
        <div className="mt-12 text-center text-slate-600 text-sm">
          Sincronizado con Google Sheets • Mostrando datos de {mesSeleccionado}
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, color }: { title: string, value: string, color: string }) {
  const colors: any = {
    blue: "from-blue-500/20 to-transparent border-blue-500/30 text-blue-400",
    emerald: "from-emerald-500/20 to-transparent border-emerald-500/30 text-emerald-400",
    purple: "from-purple-500/20 to-transparent border-purple-500/30 text-purple-400"
  };
  return (
    <div className={`bg-gradient-to-b ${colors[color]} p-8 rounded-3xl border shadow-2xl backdrop-blur-sm`}>
      <p className={`text-xs font-black tracking-widest uppercase mb-4 opacity-80`}>{title}</p>
      <p className="text-4xl font-mono font-bold tracking-tight">
        {value === "..." ? value : `$${Number(value).toLocaleString()}`}
      </p>
    </div>
  );
}
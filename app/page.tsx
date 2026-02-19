'use client';
import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [datosCompletos, setDatosCompletos] = useState<string[][]>([]);
  const [datosRevenue, setDatosRevenue] = useState<string[][]>([]);
  const [meses, setMeses] = useState<string[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [tipoSeleccionado, setTipoSeleccionado] = useState('Todos');
  const [metricas, setMetricas] = useState({ 
    arr: "0", profit: "0", revenue: "0", expenses: "0", billing: "0", CashFlow: "0" 
  });
  const [datosGrafica, setDatosGrafica] = useState<any[]>([]);

  const urlMetrics = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRi564nAqRM4F8wP9q5chBqEWl5LhGd9fV-KQltyJEOd0aL7mtbLHxiOpCswULwFfty7OAIUEB3Q4lR/pub?output=csv";
  const urlRevenue = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTxFLJDBn9OGXIL70MKffdHa0uOhqJYjSdaEi0a6nIQOwPuxiXM8ah3fo568J-1pTLtn8m9celQ5hx8/pub?output=csv";

  useEffect(() => {
    const procesarCSV = (csv: string) => {
      return csv.split('\n').filter(line => line.trim() !== '').map(l => {
        const res = []; let cel = ''; let q = false;
        for (let char of l) {
          if (char === '"') q = !q;
          else if (char === ',' && !q) { res.push(cel.trim()); cel = ''; }
          else cel += char;
        }
        res.push(cel.trim()); return res;
      });
    };

    Promise.all([
      fetch(urlMetrics).then(r => r.text()),
      fetch(urlRevenue).then(r => r.text())
    ]).then(([csvMet, csvRev]) => {
      const fMet = procesarCSV(csvMet);
      const fRev = procesarCSV(csvRev);
      
      setDatosCompletos(fMet);
      setDatosRevenue(fRev);

      // --- 1. DETECTAR MESES (Sincronizados) ---
      // Buscamos la fila de cabecera en el archivo de métricas (donde están los meses Jan-2025...)
      const filaHeader = fMet.find(r => r.some(c => /[A-Za-z]{3}-\d{4}/.test(c)));
      
      if (filaHeader) {
        const listaMeses = filaHeader.filter(c => {
          const match = c.match(/[A-Za-z]{3}-(\d{4})/);
          return match && parseInt(match[1]) >= 2025;
        });

        setMeses(listaMeses);
        setMesSeleccionado(listaMeses[0] || '');

        // --- 2. PREPARAR GRÁFICA ARR ---
        const filaARR = fMet.find(r => r.some(c => c === "Actual ARR"));
        if (filaARR) {
          setDatosGrafica(listaMeses.map(m => {
            const idx = filaHeader.indexOf(m);
            const val = filaARR[idx]?.replace(/[^0-9.-]/g, '') || "0";
            return { name: m, valor: parseFloat(val) };
          }));
        }
      }
    });
  }, []);

  // --- 3. ACTUALIZAR MÉTRICAS Y TABLA AL CAMBIAR MES ---
  useEffect(() => {
    if (datosCompletos.length > 0 && mesSeleccionado) {
      const filaHeader = datosCompletos.find(r => r.includes(mesSeleccionado));
      const idxCol = filaHeader ? filaHeader.indexOf(mesSeleccionado) : -1;

      const buscar = (nom: string) => {
        const fila = datosCompletos.find(r => r.some(c => c === nom));
        return (fila && idxCol !== -1) ? fila[idxCol].replace(/[^0-9.-]/g, '') : "0";
      };

      setMetricas({
        arr: buscar("Actual ARR"),
        profit: buscar("Net Profit P&L"),
        revenue: buscar("Total Revenue P&L"),
        expenses: buscar("Total Expenses P&L"),
        billing: buscar("Total Billing"),
        CashFlow: buscar("Total Cash")
      });
    }
  }, [mesSeleccionado, datosCompletos]);

  // --- 4. LÓGICA DE LA TABLA (ARCHIVO REVENUE) ---
  const filaHeaderRev = datosRevenue[2] || []; // Los meses están en la fila 3 (index 2)
  const idxColRev = filaHeaderRev.indexOf(mesSeleccionado);
  const idxBudget = 40; // Columna AO según tu lógica original
  const idxType = 14;   // Columna O (Type)
  const idxClient = 1;  // Columna B (Client)

  // Filtramos los datos de clientes (empezando desde la fila 7 para saltar totales y cabeceras)
  const tiposUnicos = ["Todos", ...Array.from(new Set(datosRevenue.slice(6).map(f => f[idxType]).filter(t => t)))];
  
  let filtradas = (idxColRev !== -1) 
    ? datosRevenue.slice(6).filter(f => f[idxClient] && f[idxColRev] && f[idxColRev] !== "0" && f[idxColRev] !== "$0") 
    : [];
    
  if (tipoSeleccionado !== "Todos") {
    filtradas = filtradas.filter(f => f[idxType] === tipoSeleccionado);
  }

  const tActual = filtradas.reduce((acc, f) => acc + parseFloat(f[idxColRev]?.replace(/[^0-9.-]/g, '') || "0"), 0);
  const tMeta = filtradas.reduce((acc, f) => acc + parseFloat(f[idxBudget]?.replace(/[^0-9.-]/g, '') || "0"), 0);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header con Selector Global */}
        <div className="flex justify-between items-center mb-10 bg-slate-900/40 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
          <h1 className="text-2xl font-black text-blue-400 italic uppercase italic">Financial Board</h1>
          <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} className="bg-slate-800 p-2 rounded-xl border border-slate-700 font-bold outline-none cursor-pointer">
            {meses.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Tarjetas Principales (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card title="Actual ARR" value={metricas.arr} color="#3b82f6" />
          <Card title="Net Profit" value={metricas.profit} color="#10b981" />
          <Card title="Total Revenue" value={metricas.revenue} color="#f59e0b" />
          <Card title="Total Expenses" value={metricas.expenses} color="#ef4444" />
          <Card title="Total Billing" value={metricas.billing} color="#ec4899" />
          <Card title="Cash Flow" value={metricas.CashFlow} color="#8b5cf6" />
        </div>

        {/* Gráfica de Tendencia */}
        <div className="bg-slate-900/20 p-8 rounded-[2.5rem] border border-white/5 h-[400px] mb-12 shadow-2xl">
          <h2 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8 text-center italic">ARR Trend (2025+)</h2>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={datosGrafica}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} formatter={(val: any) => `$${Number(val).toLocaleString()}`} />
              <Area type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={4} fillOpacity={0.1} fill="#3b82f6" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla Revenue (Leyendo de Revenue by Type) */}
        <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
            <h2 className="text-white text-lg font-black uppercase italic tracking-widest">Revenue Details</h2>
            <select value={tipoSeleccionado} onChange={(e) => setTipoSeleccionado(e.target.value)} className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-pink-400 font-bold outline-none w-full md:w-64">
              {tiposUnicos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 text-center">
            <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Total Actual</p>
              <p className="text-3xl font-mono font-bold text-blue-400">${tActual.toLocaleString()}</p>
            </div>
            <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Total Budget (Col. AO)</p>
              <p className="text-3xl font-mono font-bold text-slate-500">${tMeta.toLocaleString()}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-600 text-[11px] font-black uppercase border-b border-white/5">
                  <th className="pb-4">Client</th>
                  <th className="pb-4">Type</th>
                  <th className="pb-4 text-right">Actual</th>
                  <th className="pb-4 text-right">Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtradas.map((f, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-all">
                    <td className="py-5 font-bold text-slate-200">{f[idxClient]}</td>
                    <td className="py-5"><span className="text-pink-400/80 text-[10px] font-bold border border-pink-500/20 px-2 py-1 rounded-md">{f[idxType]}</span></td>
                    <td className="py-5 text-right font-mono font-bold text-blue-400">${(parseFloat(f[idxColRev]?.replace(/[^0-9.-]/g, '') || "0")).toLocaleString()}</td>
                    <td className="py-5 text-right font-mono text-slate-600">${(parseFloat(f[idxBudget]?.replace(/[^0-9.-]/g, '') || "0")).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, color }: { title: string, value: string, color: string }) {
  const num = parseFloat(value) || 0;
  return (
    <div className="bg-slate-900/60 p-8 rounded-[2rem] border-t-2 border-white/5 shadow-xl transition-all" style={{ borderColor: color }}>
      <p className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-40" style={{ color }}>{title}</p>
      <p className="text-3xl font-mono font-bold tracking-tighter">${num.toLocaleString()}</p>
    </div>
  );
}
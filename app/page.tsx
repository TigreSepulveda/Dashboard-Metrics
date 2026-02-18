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

  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRi564nAqRM4F8wP9q5chBqEWl5LhGd9fV-KQltyJEOd0aL7mtbLHxiOpCswULwFfty7OAIUEB3Q4lR/pub?output=csv";
  const urlRevenue = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTxFLJDBn9OGXIL70MKffdHa0uOhqJYjSdaEi0a6nIQOwPuxiXM8ah3fo568J-1pTLtn8m9celQ5hx8/pub?output=csv";

  useEffect(() => {
    const procesarLineaCSV = (linea: string) => {
      const resultado = [];
      let celda = '';
      let dentroComillas = false;
      for (let char of linea) {
        if (char === '"') dentroComillas = !dentroComillas;
        else if (char === ',' && !dentroComillas) {
          resultado.push(celda.trim());
          celda = '';
        } else celda += char;
      }
      resultado.push(celda.trim());
      return resultado;
    };

    Promise.all([
      fetch(url).then(res => res.text()),
      fetch(urlRevenue).then(res => res.text())
    ]).then(([csvFin, csvRev]) => {
      const filasFin = csvFin.split('\n').map(procesarLineaCSV);
      const filasRev = csvRev.split('\n').map(procesarLineaCSV);
      
      setDatosCompletos(filasFin);
      setDatosRevenue(filasRev);

      // Restauramos la detección de meses original (AB a AM son índices 27 a 38)
      const cabeceraRev = filasRev[0];
      const listaMeses = cabeceraRev.slice(27, 39).filter(m => m !== "" && m !== undefined);
      
      if (listaMeses.length > 0) {
        setMeses(listaMeses);
        setMesSeleccionado(listaMeses[0]);
        
        const filaARR = filasFin.find(f => f.some(c => c === "Actual ARR"));
        if (filaARR) {
          const history = listaMeses.map(mes => {
            const idx = filasFin[0].indexOf(mes);
            return {
              name: mes,
              valor: parseFloat(filaARR[idx]?.replace(/[致"$]/g, '').replace(/,/g, '') || "0")
            };
          });
          setDatosGrafica(history);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (datosCompletos.length > 0 && mesSeleccionado) {
      const indiceColumna = datosCompletos[0].indexOf(mesSeleccionado);
      const buscar = (nom: string) => {
        const f = datosCompletos.find(fil => fil.some(c => c === nom));
        return (f && indiceColumna !== -1) ? f[indiceColumna].replace(/[致"$]/g, '').replace(/,/g, '') : "0";
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

  // --- LÓGICA DE REVENUE BY TYPE ---
  const tiposUnicos = ["Todos", ...Array.from(new Set(datosRevenue.slice(1).map(f => f[14]).filter(t => t)))];

  const obtenerDatosFiltrados = () => {
    // Índices seguros para evitar errores de TypeScript
    const idxMes = datosRevenue.length > 0 ? datosRevenue[0].indexOf(mesSeleccionado) : -1;
    const idxMeta = 40; 

    if (idxMes === -1) return { filasFiltradas: [], totalActual: 0, totalMeta: 0, idxM: 0, idxA: 40 };

    let filtradas = datosRevenue.slice(1).filter(f => f[idxMes] && f[idxMes] !== "0" && f[idxMes] !== "");
    
    if (tipoSeleccionado !== "Todos") {
      filtradas = filtradas.filter(f => f[14] === tipoSeleccionado);
    }

    const totalActual = filtradas.reduce((acc, f) => acc + parseFloat(f[idxMes]?.replace(/[^0-9.-]/g, '') || "0"), 0);
    const totalMeta = filtradas.reduce((acc, f) => acc + parseFloat(f[idxMeta]?.replace(/[^0-9.-]/g, '') || "0"), 0);

    return { filasFiltradas: filtradas, totalActual, totalMeta, idxM: idxMes, idxA: idxMeta };
  };

  const { filasFiltradas, totalActual, totalMeta, idxM, idxA } = obtenerDatosFiltrados();

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
          <h1 className="text-2xl font-black text-blue-400 italic uppercase">Financial Analytics</h1>
          <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} className="bg-slate-800 p-2 rounded-xl border border-slate-700 font-bold">
            {meses.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Tarjetas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card title="Actual ARR" value={metricas.arr} color="#3b82f6" />
          <Card title="Net Profit" value={metricas.profit} color="#10b981" />
          <Card title="Total Revenue" value={metricas.revenue} color="#f59e0b" />
          <Card title="Total Expenses" value={metricas.expenses} color="#ef4444" />
          <Card title="Total Billing" value={metricas.billing} color="#ec4899" />
          <Card title="Cash Flow" value={metricas.CashFlow} color="#8b5cf6" />
        </div>

        {/* Gráfica de Tendencia */}
        <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 h-[400px] mb-12 shadow-2xl">
          <h2 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8 text-center italic">Tendencia Histórica: Actual ARR</h2>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={datosGrafica}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                formatter={(val: any) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(val))}
              />
              <Area type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={3} fillOpacity={0.1} fill="#3b82f6" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* REVENUE BY TYPE */}
        <div className="bg-slate-900/50 p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
            <h2 className="text-white text-lg font-black uppercase italic tracking-tighter">Revenue Detail by Type</h2>
            <div className="w-full md:w-64">
              <p className="text-[10px] font-black uppercase text-pink-500 mb-2">Filtrar por Type (Columna O)</p>
              <select value={tipoSeleccionado} onChange={(e) => setTipoSeleccionado(e.target.value)} className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700 text-pink-400 font-bold outline-none">
                {tiposUnicos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-center md:text-left">
            <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Total Actual ({tipoSeleccionado})</p>
              <p className="text-3xl font-mono font-bold text-blue-400">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalActual)}</p>
            </div>
            <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Total Budget (AO)</p>
              <p className="text-3xl font-mono font-bold text-slate-400">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalMeta)}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-[11px] font-black uppercase border-b border-slate-800">
                  <th className="pb-4">Cliente (B)</th>
                  <th className="pb-4">Type (O)</th>
                  <th className="pb-4 text-right">Actual</th>
                  <th className="pb-4 text-right">Budget (AO)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filasFiltradas.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-800/20 transition-all">
                    <td className="py-4 font-bold">{f[1]}</td>
                    <td className="py-4">
                      <span className="bg-pink-500/10 text-pink-400 px-2 py-1 rounded text-[10px] font-bold">
                        {f[14]}
                      </span>
                    </td>
                    <td className="py-4 text-right font-mono font-bold text-blue-400">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(f[idxM]?.replace(/[^0-9.-]/g, '') || 0))}
                    </td>
                    <td className="py-4 text-right font-mono text-slate-500">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(f[idxA]?.replace(/[^0-9.-]/g, '') || 0))}
                    </td>
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
  const num = parseFloat(value);
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  return (
    <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl" style={{ borderTop: `4px solid ${color}` }}>
      <p className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-40" style={{ color }}>{title}</p>
      <p className="text-3xl font-mono font-bold">{formatted}</p>
    </div>
  );
}
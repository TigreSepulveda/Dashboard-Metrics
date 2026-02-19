'use client';
import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [datosCompletos, setDatosCompletos] = useState<string[][]>([]);
  const [datosRevenue, setDatosRevenue] = useState<string[][]>([]); // Segundo archivo
  const [meses, setMeses] = useState<string[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [tipoSeleccionado, setTipoSeleccionado] = useState('Todos');
  const [metricas, setMetricas] = useState({ 
    arr: "0", profit: "0", revenue: "0", expenses: "0", billing: "0", CashFlow: "0" 
  });
  const [datosGrafica, setDatosGrafica] = useState<any[]>([]);

  const urlKPIs = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRi564nAqRM4F8wP9q5chBqEWl5LhGd9fV-KQltyJEOd0aL7mtbLHxiOpCswULwFfty7OAIUEB3Q4lR/pub?output=csv";
  const urlRevenue = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTxFLJDBn9OGXIL70MKffdHa0uOhqJYjSdaEi0a6nIQOwPuxiXM8ah3fo568J-1pTLtn8m9celQ5hx8/pub?output=csv";

  useEffect(() => {
    // TU FUNCIÓN ORIGINAL QUE FUNCIONA
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
      fetch(urlKPIs).then(res => res.text()),
      fetch(urlRevenue).then(res => res.text())
    ]).then(([csvKPI, csvRev]) => {
      // PROCESAMOS ARCHIVO 1 (KPIs)
      const filasKPI = csvKPI.split('\n').map(procesarLineaCSV);
      setDatosCompletos(filasKPI);

      // PROCESAMOS ARCHIVO 2 (Revenue)
      const filasRev = csvRev.split('\n').map(procesarLineaCSV);
      setDatosRevenue(filasRev);

      // TU LÓGICA DE MESES QUE FUNCIONA
      const listaMeses = filasKPI[0].filter(c => {
        const esFecha = /^[A-Z][a-z]{2}-\d{4}$/.test(c);
        if (!esFecha) return false;
        const año = parseInt(c.split('-')[1]);
        return año >= 2025;
      });

      if (listaMeses.length > 0) {
        setMeses(listaMeses);
        setMesSeleccionado(listaMeses[listaMeses.length - 1]);
        
        const filaARR = filasKPI.find(f => f.some(c => c === "Actual ARR"));
        if (filaARR) {
          const history = listaMeses.map(mes => {
            const idx = filasKPI[0].indexOf(mes);
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

  // EFECTO PARA ACTUALIZAR TARJETAS (ARCHIVO 1)
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

  // --- LÓGICA PARA LA TABLA DE ABAJO (ARCHIVO 2) ---
  const filaHeaderRev = datosRevenue[2] || []; // Las fechas están en la fila 3
  const idxColRev = filaHeaderRev.indexOf(mesSeleccionado);
  const idxBudget = 40; // Columna AO
  const idxType = 14;   // Columna O
  const idxClient = 1;  // Columna B

  const tiposUnicos = ["Todos", ...Array.from(new Set(datosRevenue.slice(6).map(f => f[idxType]).filter(t => t)))];
  
  let filtradas = (datosRevenue.length > 6 && idxColRev !== -1) 
    ? datosRevenue.slice(6).filter(f => f[idxClient] && f[idxColRev] && f[idxColRev] !== "0" && f[idxColRev] !== "$0") 
    : [];
    
  if (tipoSeleccionado !== "Todos") {
    filtradas = filtradas.filter(f => f[idxType] === tipoSeleccionado);
  }

  const limpiar = (v: string) => parseFloat(v?.replace(/[致"$]/g, '').replace(/,/g, '') || "0");

  const tActual = filtradas.reduce((acc, f) => acc + limpiar(f[idxColRev]), 0);
  const tMeta = filtradas.reduce((acc, f) => acc + limpiar(f[idxBudget]), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
          <h1 className="text-2xl font-black text-blue-400 italic tracking-tighter uppercase">Financial Analytics</h1>
          <select 
            value={mesSeleccionado} 
            onChange={(e) => setMesSeleccionado(e.target.value)}
            className="bg-slate-800 text-white p-2 rounded-xl outline-none border border-slate-700 font-bold cursor-pointer"
          >
            {meses.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Tarjetas de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card title="Actual ARR" value={metricas.arr} color="#3b82f6" />
          <Card title="Net Profit" value={metricas.profit} color="#10b981" />
          <Card title="Total Revenue" value={metricas.revenue} color="#f59e0b" />
          <Card title="Total Expenses" value={metricas.expenses} color="#ef4444" />
          <Card title="Total Billing" value={metricas.billing} color="#ec4899" />
          <Card title="Cash Flow" value={metricas.CashFlow} color="#8b5cf6" />
        </div>

        {/* Gráfica */}
        <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 h-[400px] mb-12">
          <h2 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">Tendencia Histórica: Actual ARR</h2>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={datosGrafica}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                formatter={(val: any) => `$${Number(val).toLocaleString()}`} 
              />
              <Area type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={3} fillOpacity={0.1} fill="#3b82f6" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* --- NUEVA PARTE: TABLA DE REVENUE --- */}
        <div className="bg-slate-900/30 p-10 rounded-[3rem] border border-slate-800">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-black italic uppercase tracking-widest text-blue-400">Revenue by Type</h2>
            <select 
              value={tipoSeleccionado} 
              onChange={(e) => setTipoSeleccionado(e.target.value)} 
              className="bg-slate-800 p-2 rounded-xl border border-slate-700 text-sm font-bold outline-none"
            >
              {tiposUnicos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Total Mes</p>
              <p className="text-3xl font-mono font-bold text-blue-400">${tActual.toLocaleString()}</p>
            </div>
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Budget (Meta AO)</p>
              <p className="text-3xl font-mono font-bold text-slate-400">${tMeta.toLocaleString()}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-[11px] font-black uppercase border-b border-slate-800">
                  <th className="pb-4">Cliente</th>
                  <th className="pb-4">Tipo</th>
                  <th className="pb-4 text-right">Monto Actual</th>
                  <th className="pb-4 text-right">Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtradas.map((f, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-all">
                    <td className="py-4 font-bold text-slate-300">{f[idxClient]}</td>
                    <td className="py-4 text-xs text-pink-400">{f[idxType]}</td>
                    <td className="py-4 text-right font-mono text-blue-400 font-bold">${limpiar(f[idxColRev]).toLocaleString()}</td>
                    <td className="py-4 text-right font-mono text-slate-500">${limpiar(f[idxBudget]).toLocaleString()}</td>
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
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  return (
    <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl">
      <p className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-40" style={{ color }}>{title}</p>
      <p className="text-3xl font-mono font-bold tracking-tighter">{formatted}</p>
    </div>
  );
}
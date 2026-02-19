'use client';
import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  // Estados para Archivo 1: KPIs
  const [datosKPIs, setDatosKPIs] = useState<string[][]>([]);
  const [meses, setMeses] = useState<string[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [metricas, setMetricas] = useState({ 
    arr: "0", profit: "0", revenue: "0", expenses: "0", billing: "0", CashFlow: "0" 
  });
  const [datosGrafica, setDatosGrafica] = useState<any[]>([]);

  // Estados para Archivo 2: Facturación
  const [datosRevenue, setDatosRevenue] = useState<string[][]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState('Todos');

  const urlKPIs = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRi564nAqRM4F8wP9q5chBqEWl5LhGd9fV-KQltyJEOd0aL7mtbLHxiOpCswULwFfty7OAIUEB3Q4lR/pub?output=csv";
  const urlRevenue = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTxFLJDBn9OGXIL70MKffdHa0uOhqJYjSdaEi0a6nIQOwPuxiXM8ah3fo568J-1pTLtn8m9celQ5hx8/pub?output=csv";

  // Función de limpieza reutilizable
  const limpiarValor = (valor: string) => {
    return valor ? valor.replace(/[致"$]/g, '').replace(/,/g, '').trim() : "0";
  };

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

    // --- PASO 1: CARGAR KPIS ---
    fetch(urlKPIs)
      .then(res => res.text())
      .then((textoKPI: string) => {
        const filasKPI = textoKPI.split('\n').map(procesarLineaCSV);
        setDatosKPIs(filasKPI);

        // Configurar meses y gráfica
        const listaMeses = filasKPI[0].filter(c => /^[A-Z][a-z]{2}-\d{4}$/.test(c));
        if (listaMeses.length > 0) {
          setMeses(listaMeses);
          const ultimoMes = listaMeses[listaMeses.length - 1];
          setMesSeleccionado(ultimoMes);
          
          const filaARR = filasKPI.find(f => f.some(c => c === "Actual ARR"));
          if (filaARR) {
            setDatosGrafica(listaMeses.map(mes => ({
              name: mes,
              valor: parseFloat(limpiarValor(filaARR[filasKPI[0].indexOf(mes)]))
            })));
          }
        }
        // --- PASO 2: CARGAR REVENUE (Solo después de terminar KPIs) ---
        return fetch(urlRevenue);
      })
      .then(res => res.text())
      .then((textoRev: string) => {
        const filasRev = textoRev.split('\n').map(procesarLineaCSV);
        setDatosRevenue(filasRev);
      })
      .catch(err => console.error("Error cargando archivos:", err));
  }, []);

  // Actualizar tarjetas de KPIs cuando cambie el mes
  useEffect(() => {
    if (datosKPIs.length > 0 && mesSeleccionado) {
      const idxCol = datosKPIs[0].indexOf(mesSeleccionado);
      const buscar = (nom: string) => {
        const f = datosKPIs.find(fil => fil.some(c => c === nom));
        return (f && idxCol !== -1) ? limpiarValor(f[idxCol]) : "0";
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
  }, [mesSeleccionado, datosKPIs]);

  // --- LÓGICA FILTRADO REVENUE ---
  const filaHeaderRev = datosRevenue[2] || [];
  const idxColRev = filaHeaderRev.indexOf(mesSeleccionado);
  const tiposUnicos = ["Todos", ...Array.from(new Set(datosRevenue.slice(6).map(f => f[14]).filter(t => t)))];

  let filtradas = (datosRevenue.length > 6 && idxColRev !== -1)
    ? datosRevenue.slice(6).filter(f => f[1] && f[idxColRev] && f[idxColRev] !== "0")
    : [];

  if (tipoSeleccionado !== "Todos") {
    filtradas = filtradas.filter(f => f[14] === tipoSeleccionado);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
          <h1 className="text-2xl font-black text-blue-400 italic tracking-tighter uppercase">AltScore Metrics</h1>
          <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} className="bg-slate-800 p-2 rounded-xl outline-none border border-slate-700 font-bold">
            {meses.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Tarjetas KPIs (Archivo 1) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card title="Actual ARR" value={metricas.arr} color="#3b82f6" />
          <Card title="Net Profit" value={metricas.profit} color="#10b981" />
          <Card title="Total Revenue" value={metricas.revenue} color="#f59e0b" />
          <Card title="Total Expenses" value={metricas.expenses} color="#ef4444" />
          <Card title="Total Billing" value={metricas.billing} color="#ec4899" />
          <Card title="Cash Flow" value={metricas.CashFlow} color="#8b5cf6" />
        </div>

        {/* Gráfica (Archivo 1) */}
        <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 h-[400px] mb-12 shadow-2xl">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={datosGrafica}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
              <Area type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={3} fillOpacity={0.1} fill="#3b82f6" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* TABLA FACTURACIÓN (Archivo 2) */}
        <div className="bg-slate-900/30 p-10 rounded-[3rem] border border-slate-800 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-black italic uppercase text-blue-400">Revenue by Type 2026</h2>
            <select value={tipoSeleccionado} onChange={(e) => setTipoSeleccionado(e.target.value)} className="bg-slate-800 p-2 rounded-xl border border-slate-700 text-sm font-bold">
              {tiposUnicos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-[11px] font-black uppercase border-b border-slate-800">
                  <th className="pb-4">Client (B)</th>
                  <th className="pb-4">Type (O)</th>
                  <th className="pb-4 text-right">Actual ({mesSeleccionado})</th>
                  <th className="pb-4 text-right">Budget (AO)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtradas.map((f, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-all">
                    <td className="py-4 font-bold text-slate-300">{f[1]}</td>
                    <td className="py-4 text-xs text-pink-400 font-bold uppercase">{f[14]}</td>
                    <td className="py-4 text-right font-mono text-blue-400 font-bold">
                      ${Number(limpiarValor(f[idxColRev])).toLocaleString()}
                    </td>
                    <td className="py-4 text-right font-mono text-slate-500 font-bold">
                      ${Number(limpiarValor(f[40])).toLocaleString()}
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
  const n = parseFloat(value) || 0;
  return (
    <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl">
      <p className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-40" style={{ color }}>{title}</p>
      <p className="text-3xl font-mono font-bold tracking-tighter">
        ${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}
      </p>
    </div>
  );
}
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

  // Función para unificar meses (ej: "ene-2026" y "Jan-2026" serán iguales para el código)
  const unificarMes = (txt: string) => {
    if (!txt) return "";
    const m = txt.toLowerCase().trim();
    if (m.includes('ene') || m.includes('jan')) return '01' + m.slice(-4);
    if (m.includes('feb')) return '02' + m.slice(-4);
    if (m.includes('mar')) return '03' + m.slice(-4);
    if (m.includes('abr') || m.includes('apr')) return '04' + m.slice(-4);
    if (m.includes('may')) return '05' + m.slice(-4);
    if (m.includes('jun')) return '06' + m.slice(-4);
    if (m.includes('jul')) return '07' + m.slice(-4);
    if (m.includes('ago') || m.includes('aug')) return '08' + m.slice(-4);
    if (m.includes('sep')) return '09' + m.slice(-4);
    if (m.includes('oct')) return '10' + m.slice(-4);
    if (m.includes('nov')) return '11' + m.slice(-4);
    if (m.includes('dic') || m.includes('dec')) return '12' + m.slice(-4);
    return txt;
  };

  useEffect(() => {
    const procesarCSV = (csv: string) => {
      return csv.split('\n').map(linea => {
        const res = []; let celda = ''; let q = false;
        for (let char of linea) {
          if (char === '"') q = !q;
          else if (char === ',' && !q) { res.push(celda.trim()); celda = ''; }
          else celda += char;
        }
        res.push(celda.trim());
        return res;
      });
    };

    Promise.all([
      fetch(url).then(r => r.text()),
      fetch(urlRevenue).then(r => r.text())
    ]).then(([csvFin, csvRev]) => {
      const fFin = procesarCSV(csvFin);
      const fRev = procesarCSV(csvRev);
      
      setDatosCompletos(fFin);
      setDatosRevenue(fRev);

      // 1. Extraer meses de la Hoja Revenue (Columnas AB a AM -> 27 a 38)
      const cabeceraRev = fRev[0];
      const listaMesesRev = cabeceraRev.slice(27, 39).filter(m => m !== "");
      
      if (listaMesesRev.length > 0) {
        setMeses(listaMesesRev);
        setMesSeleccionado(listaMesesRev[0]);

        // 2. Gráfica ARR (Buscamos en Hoja Finanzas usando los meses de la Hoja Revenue)
        const filaARR = fFin.find(f => f.some(c => c === "Actual ARR"));
        if (filaARR) {
          const history = listaMesesRev.map(mes => {
            const idx = fFin[0].findIndex(m => unificarMes(m) === unificarMes(mes));
            const val = idx !== -1 ? filaARR[idx]?.replace(/[致"$]/g, '').replace(/,/g, '') : "0";
            return { name: mes, valor: parseFloat(val || "0") };
          });
          setDatosGrafica(history);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (datosCompletos.length > 0 && mesSeleccionado) {
      // Buscamos la columna del mes seleccionado en la Hoja de Finanzas
      const idxCol = datosCompletos[0].findIndex(m => unificarMes(m) === unificarMes(mesSeleccionado));
      
      const buscarMetrica = (nombre: string) => {
        const fila = datosCompletos.find(f => f.some(c => c === nombre));
        return (fila && idxCol !== -1) ? fila[idxCol].replace(/[致"$]/g, '').replace(/,/g, '') : "0";
      };

      setMetricas({
        arr: buscarMetrica("Actual ARR"),
        profit: buscarMetrica("Net Profit P&L"),
        revenue: buscarMetrica("Total Revenue P&L"),
        expenses: buscarMetrica("Total Expenses P&L"),
        billing: buscarMetrica("Total Billing"),
        CashFlow: buscarMetrica("Total Cash")
      });
    }
  }, [mesSeleccionado, datosCompletos]);

  // --- LÓGICA DE LA TABLA INFERIOR ---
  const tiposUnicos = ["Todos", ...Array.from(new Set(datosRevenue.slice(1).map(f => f[14]).filter(t => t)))];

  const generarTabla = () => {
    const idxMesRev = datosRevenue.length > 0 ? datosRevenue[0].indexOf(mesSeleccionado) : -1;
    const idxMetaAO = 40;

    if (idxMesRev === -1) return { filtradas: [], tActual: 0, tMeta: 0 };

    let filtradas = datosRevenue.slice(1).filter(f => f[idxMesRev] && f[idxMesRev] !== "0" && f[idxMesRev] !== "");
    if (tipoSeleccionado !== "Todos") filtradas = filtradas.filter(f => f[14] === tipoSeleccionado);

    const tActual = filtradas.reduce((acc, f) => acc + parseFloat(f[idxMesRev]?.replace(/[^0-9.-]/g, '') || "0"), 0);
    const tMeta = filtradas.reduce((acc, f) => acc + parseFloat(f[idxMetaAO]?.replace(/[^0-9.-]/g, '') || "0"), 0);

    return { filtradas, tActual, tMeta, idxM: idxMesRev, idxA: idxMetaAO };
  };

  const { filtradas, tActual, tMeta, idxM, idxA } = generarTabla();

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10 bg-slate-900/40 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
          <h1 className="text-2xl font-black text-blue-400 italic tracking-tighter uppercase">Financial Analytics 2026</h1>
          <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
            <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} className="bg-transparent text-white font-bold outline-none cursor-pointer">
              {meses.map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
            </select>
          </div>
        </div>

        {/* Tarjetas Superiores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card title="Actual ARR" value={metricas.arr} color="#3b82f6" />
          <Card title="Net Profit" value={metricas.profit} color="#10b981" />
          <Card title="Total Revenue" value={metricas.revenue} color="#f59e0b" />
          <Card title="Total Expenses" value={metricas.expenses} color="#ef4444" />
          <Card title="Total Billing" value={metricas.billing} color="#ec4899" />
          <Card title="Cash Flow" value={metricas.CashFlow} color="#8b5cf6" />
        </div>

        {/* Gráfica de Tendencia */}
        <div className="bg-slate-900/20 p-8 rounded-[2.5rem] border border-white/5 h-[400px] mb-12 shadow-inner">
          <h2 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-center italic">Tendencia: Actual ARR</h2>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={datosGrafica}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                formatter={(val: any) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(val))}
              />
              <Area type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={4} fillOpacity={0.1} fill="#3b82f6" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Type */}
        <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
            <h2 className="text-white text-lg font-black uppercase italic tracking-widest">Revenue Detail</h2>
            <div className="w-full md:w-72 bg-slate-800 p-3 rounded-2xl border border-slate-700">
              <p className="text-[9px] font-black uppercase text-pink-500 mb-1 ml-1">Filtro por Type (Col. O)</p>
              <select value={tipoSeleccionado} onChange={(e) => setTipoSeleccionado(e.target.value)} className="w-full bg-transparent text-pink-400 font-bold outline-none cursor-pointer">
                {tiposUnicos.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Total Actual</p>
              <p className="text-3xl font-mono font-bold text-blue-400">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(tActual)}</p>
            </div>
            <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Total Budget (AO)</p>
              <p className="text-3xl font-mono font-bold text-slate-500">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(tMeta)}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-600 text-[11px] font-black uppercase border-b border-white/5">
                  <th className="pb-4">Cliente (B)</th>
                  <th className="pb-4">Type (O)</th>
                  <th className="pb-4 text-right text-blue-400">Actual</th>
                  <th className="pb-4 text-right">Budget (AO)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtradas.map((f, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-all">
                    <td className="py-5 font-bold text-slate-200">{f[1]}</td>
                    <td className="py-5"><span className="text-pink-400/80 text-[10px] font-bold border border-pink-500/20 px-2 py-1 rounded-md">{f[14]}</span></td>
                    <td className="py-5 text-right font-mono font-bold text-blue-400">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(f[idxM]?.replace(/[^0-9.-]/g, '') || 0))}
                    </td>
                    <td className="py-5 text-right font-mono text-slate-600">
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
    <div className="bg-slate-900/60 p-8 rounded-[2rem] border-t-2 border-white/5 shadow-xl transition-all hover:translate-y-[-4px]" style={{ borderColor: color }}>
      <p className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-40" style={{ color }}>{title}</p>
      <p className="text-3xl font-mono font-bold tracking-tighter">{formatted}</p>
    </div>
  );
}
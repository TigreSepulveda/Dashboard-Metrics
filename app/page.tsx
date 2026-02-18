'use client';
import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [datosCompletos, setDatosCompletos] = useState<string[][]>([]);
  const [meses, setMeses] = useState<string[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [metricas, setMetricas] = useState({ 
    arr: "0", profit: "0", revenue: "0", expenses: "0", billing: "0", CashFlow: "0" 
  });
  const [datosGrafica, setDatosGrafica] = useState<any[]>([]);

  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRi564nAqRM4F8wP9q5chBqEWl5LhGd9fV-KQltyJEOd0aL7mtbLHxiOpCswULwFfty7OAIUEB3Q4lR/pub?output=csv";

  useEffect(() => {
    fetch(url)
      .then(res => res.text())
      .then((csv: string) => {
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

        // 1. Declaramos las filas PRIMERO
        const filas = csv.split('\n').map(procesarLineaCSV);
        setDatosCompletos(filas);

        // 2. Ahora filtramos los meses usando las filas ya declaradas
        const listaMeses = filas[0].filter(c => {
          const esFecha = /^[A-Z][a-z]{2}-\d{4}$/.test(c);
          if (!esFecha) return false;
          const año = parseInt(c.split('-')[1]);
          return año >= 2025;
        });

        if (listaMeses.length > 0) {
          setMeses(listaMeses);
          setMesSeleccionado(listaMeses[listaMeses.length - 1]);
          
          const filaARR = filas.find(f => f.some(c => c === "Actual ARR"));
          if (filaARR) {
            const history = listaMeses.map(mes => {
              const idx = filas[0].indexOf(mes);
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
            {meses.map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
          </select>
        </div>

        {/* Tarjetas de Métricas - Ajustado a 3 columnas para que respiren */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card title="Actual ARR" value={metricas.arr} color="#3b82f6" />
          <Card title="Net Profit" value={metricas.profit} color="#10b981" />
          <Card title="Total Revenue" value={metricas.revenue} color="#f59e0b" />
          <Card title="Total Expenses" value={metricas.expenses} color="#ef4444" />
          <Card title="Total Billing" value={metricas.billing} color="#ec4899" />
          <Card title="Cash Flow" value={metricas.CashFlow} color="#8b5cf6" />
        </div>

        {/* Gráfica */}
        <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl h-[400px]">
          <h2 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">Tendencia Histórica: Actual ARR</h2>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={datosGrafica}>
              <defs>
                <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
               />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)}
              />
              <Area type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValor)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, color }: { title: string, value: string, color: string }) {
  const num = parseFloat(value);
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  return (
    <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl transition-all hover:border-slate-700">
      <p className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-40" style={{ color }}>{title}</p>
      <p className="text-3xl font-mono font-bold tracking-tighter">{formatted}</p>
    </div>
  );
}
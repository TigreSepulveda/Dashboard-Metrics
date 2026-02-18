'use client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [datosCompletos, setDatosCompletos] = useState<string[][]>([]);
  const [meses, setMeses] = useState<string[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [metricas, setMetricas] = useState({ arr: "...", profit: "...", billing: "..." });

  useEffect(() => {
    // URL integrada directamente
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRi564nAqRM4F8wP9q5chBqEWl5LhGd9fV-KQltyJEOd0aL7mtbLHxiOpCswULwFfty7OAIUEB3Q4lR/pub?output=csv"; 

    fetch(url)
      .then(res => res.text())
      .then(csv => {
        if (csv.trim().startsWith("<!DOCTYPE")) return;

        // Función avanzada para separar por comas ignorando las que están dentro de comillas (millones)
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

        const filas = csv.split('\n').map(procesarLineaCSV);
        setDatosCompletos(filas);

        // Identificar meses en la fila 1 (formato MMM-YYYY)
        const listaMeses = filas[0].filter(c => /^[A-Z][a-z]{2}-\d{4}$/.test(c));
        
        if (listaMeses.length > 0) {
          setMeses(listaMeses);
          setMesSeleccionado(listaMeses[listaMeses.length - 1]); // Selecciona el mes más reciente (Jan-2026)
        }
      });
  }, []);

  useEffect(() => {
    if (datosCompletos.length > 0 && mesSeleccionado) {
      const indiceColumna = datosCompletos[0].indexOf(mesSeleccionado);
      
      const buscarValor = (nombre: string) => {
        // Buscamos la fila que contiene el nombre exacto de la métrica
        const fila = datosCompletos.find(f => f.some(c => c === nombre));
        if (fila && indiceColumna !== -1) {
          let val = fila[indiceColumna] || "0";
          // Limpiamos símbolos y comas para que sea un número procesable
          return val.replace(/[致"$]/g, '').replace(/,/g, '');
        }
        return "0";
      };

      setMetricas({
        arr: buscarValor("Actual ARR"),
        profit: buscarValor("Net Profit P&L"),
        billing: buscarValor("Total Billing")
      });
    }
  }, [mesSeleccionado, datosCompletos]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Interactivo */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800 backdrop-blur-md">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-500 uppercase italic">
              Financial Board
            </h1>
            <p className="text-slate-500 font-bold text-xs tracking-widest mt-2 uppercase">Live Sync Mode • Google Sheets</p>
          </div>

          <div className="bg-slate-800 p-2 rounded-2xl border border-slate-700">
            <select 
              value={mesSeleccionado} 
              onChange={(e) => setMesSeleccionado(e.target.value)}
              className="bg-transparent text-blue-400 font-black px-4 py-2 outline-none cursor-pointer text-lg"
            >
              {meses.map(m => <option key={m} value={m} className="bg-slate-900 text-white">{m}</option>)}
            </select>
          </div>
        </div>

        {/* Tarjetas de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card title="Actual ARR" value={metricas.arr} color="blue" />
          <Card title="Net Profit P&L" value={metricas.profit} color="emerald" />
          <Card title="Total Billing" value={metricas.billing} color="purple" />
        </div>

        <p className="text-center mt-12 text-slate-700 text-[10px] font-black uppercase tracking-[0.3em]">
          Data Source: Altsore Financial Master Copy
        </p>
      </div>
    </div>
  );
}

function Card({ title, value, color }: { title: string, value: string, color: string }) {
  const styles: any = { 
    blue: "border-blue-500/30 text-blue-400 shadow-blue-500/5", 
    emerald: "border-emerald-500/30 text-emerald-400 shadow-emerald-500/5", 
    purple: "border-purple-500/30 text-purple-400 shadow-purple-500/5" 
  };
  
  const num = parseFloat(value);
  const formatted = isNaN(num) ? value : new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    maximumFractionDigits: 0 
  }).format(num);

  return (
    <div className={`bg-slate-900 p-10 rounded-[2.5rem] border-2 ${styles[color]} shadow-2xl transition-all hover:scale-[1.03] hover:bg-slate-800/50`}>
      <p className="text-[11px] font-black uppercase tracking-[0.25em] mb-6 opacity-40">{title}</p>
      <p className="text-4xl md:text-5xl font-mono font-bold tracking-tighter">{formatted}</p>
    </div>
  );
}

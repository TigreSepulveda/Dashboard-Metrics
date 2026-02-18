'use client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [datosCompletos, setDatosCompletos] = useState<string[][]>([]);
  const [meses, setMeses] = useState<string[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [metricas, setMetricas] = useState({ arr: "...", profit: "...", billing: "..." });

  useEffect(() => {
    // 1. REEMPLAZA CON TU LINK CSV (Asegúrate que termine en /pub?output=csv)
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRi564nAqRM4F8wP9q5chBqEWl5LhGd9fV-KQltyJEOd0aL7mtbLHxiOpCswULwFfty7OAIUEB3Q4lR/pubhtml"; 

    fetch(url)
      .then(res => res.text())
      .then(csv => {
        // Procesamos el CSV limpiando espacios y comillas
        const filas = csv.split('\n').map(f => f.split(',').map(c => c.trim().replace(/"/g, '')));
        setDatosCompletos(filas);

        // BUSCADOR MEJORADO: Filtramos la primera fila para encontrar cualquier cosa que parezca un mes (Ene-2025, Jan-2025, etc.)
        const fila1 = filas[0];
        const listaMeses = fila1.filter(celda => 
          celda.length > 3 && (celda.includes('-202') || /^[A-Za-z]{3}/.test(celda))
        );

        if (listaMeses.length > 0) {
          setMeses(listaMeses);
          setMesSeleccionado(listaMeses[listaMeses.length - 1]); // Selecciona el último mes por defecto
        }
      })
      .catch(err => console.error("Error cargando datos:", err));
  }, []);

  useEffect(() => {
    if (datosCompletos.length > 0 && mesSeleccionado) {
      // Encontramos exactamente en qué columna está el mes elegido
      const indiceColumna = datosCompletos[0].indexOf(mesSeleccionado);
      
      const buscarValor = (nombreMetrica: string) => {
        // Buscamos la fila que contenga el nombre de la métrica (ej. Actual ARR)
        const fila = datosCompletos.find(f => f.join(' ').includes(nombreMetrica));
        if (fila && indiceColumna !== -1) {
          let valor = fila[indiceColumna] || "0";
          // Quitamos símbolos que rompen el formato numérico
          return valor.replace(/[致"$]/g, '').trim();
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
            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 uppercase">
              Financial Reporting
            </h1>
            <p className="text-slate-500 mt-2 font-medium italic">Análisis de cierre mensual</p>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl w-full md:w-auto">
            <label className="block text-[10px] font-black text-blue-500 mb-2 uppercase tracking-[0.2em]">Seleccionar Periodo</label>
            <select 
              value={mesSeleccionado} 
              onChange={(e) => setMesSeleccionado(e.target.value)}
              className="bg-slate-800 text-white border-none rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer w-full md:w-48 font-bold"
            >
              {meses.length > 0 ? (
                meses.map(mes => <option key={mes} value={mes}>{mes}</option>)
              ) : (
                <option>Cargando periodos...</option>
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card title="Actual ARR" value={metricas.arr} color="blue" />
          <Card title="Net Profit P&L" value={metricas.profit} color="emerald" />
          <Card title="Total Billing" value={metricas.billing} color="purple" />
        </div>
        
        <div className="mt-12 text-center text-slate-700 text-xs font-bold uppercase tracking-widest">
          Sincronizado con Google Sheets • Datos de {mesSeleccionado || '---'}
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, color }: { title: string, value: string, color: string }) {
  const colors: any = {
    blue: "from-blue-500/10 to-transparent border-blue-500/20 text-blue-400",
    emerald: "from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-400",
    purple: "from-purple-500/10 to-transparent border-purple-500/20 text-purple-400"
  };
  
  // Formateador de números (añade comas)
  const formatNum = (val: string) => {
    if (val === "..." || val === "N/A") return val;
    const n = parseFloat(val.replace(/,/g, ''));
    return isNaN(n) ? val : n.toLocaleString('en-US');
  };

  return (
    <div className={`bg-slate-900 bg-gradient-to-b ${colors[color]} p-8 rounded-[2rem] border shadow-2xl backdrop-blur-md hover:scale-[1.02] transition-transform`}>
      <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-4 opacity-60">{title}</p>
      <p className="text-4xl font-mono font-bold tracking-tight">
        {value === "..." || value === "N/A" ? value : `$${formatNum(value)}`}
      </p>
    </div>
  );
}
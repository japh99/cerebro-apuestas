import React, { useState } from 'react';
import { 
  RefreshCw, Search, Copy, Check, ChevronDown, Trash2, Plus, Pencil, Zap, Activity 
} from 'lucide-react';
// Importamos la configuración desde el archivo que creamos en el paso 1
import { PYTHON_BACKEND_URL, getRandomKey, SPORTS_CONFIG } from '../config';

export default function Soccer() {
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState("LISTO PARA FÚTBOL");
  const [analyzingId, setAnalyzingId] = useState(null);
  const [generatedPrompts, setGeneratedPrompts] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  
  const [ratings, setRatings] = useState({});
  const [manualLines, setManualLines] = useState({}); 

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); 
  const [selectedLeague, setSelectedLeague] = useState(SPORTS_CONFIG.soccer.leagues[0].code);
  const [bankroll, setBankroll] = useState("50000");

  // --- MANEJADORES DE ESTADO (HANDLERS) ---
  const handleRatingChange = (matchId: any, team: any, value: any) => {
    setRatings((prev: any) => ({
        ...prev,
        [matchId]: { ...prev[matchId], [team]: value }
    }));
  };

  const handleAddLine = (matchId: any) => {
    setManualLines((prev: any) => ({
        ...prev,
        [matchId]: [...(prev[matchId] || [{ team: 'HOME', line: '', odds: '' }]), { team: 'HOME', line: '', odds: '' }]
    }));
  };

  const handleLineDataChange = (matchId: any, index: any, field: any, value: any) => {
    const currentLines = manualLines[matchId] || [];
    const newLines = [...currentLines];
    if (!newLines[index]) newLines[index] = { team: 'HOME', line: '', odds: '' };
    
    newLines[index] = { ...newLines[index], [field]: value };
    
    setManualLines((prev: any) => ({
        ...prev,
        [matchId]: newLines
    }));
  };

  const handleRemoveLine = (matchId: any, index: any) => {
    const currentLines = manualLines[matchId] || [];
    if (currentLines.length <= 1) return;
    const newLines = currentLines.filter((_: any, i: any) => i !== index);
    setManualLines((prev: any) => ({
        ...prev,
        [matchId]: newLines
    }));
  };

  // --- LÓGICA DE ESCANEO ---
  const escanear = async () => {
    setMatches([]); setGeneratedPrompts({}); setRatings({}); setManualLines({});
    setStatus("BUSCANDO PARTIDOS...");
    try {
      const apiKey = getRandomKey();
      const url = `https://api.the-odds-api.com/v4/sports/${selectedLeague}/odds/?apiKey=${apiKey}&regions=eu,us&markets=h2h&oddsFormat=decimal`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (!Array.isArray(data)) throw new Error(data.message || "Error API");
      
      const valid = data.filter((m: any) => {
          const mDate = new Date(m.commence_time);
          const start = new Date(selectedDate);
          const end = new Date(selectedDate);
          end.setDate(end.getDate() + 3); 
          return mDate >= start && mDate <= end;
      }).slice(0, 20);
      
      // Inicializar líneas vacías
      const initialLines = {};
      valid.forEach((m:any) => { 
          // @ts-ignore
          initialLines[m.id] = [{ team: 'HOME', line: '', odds: '' }]; 
      });
      setManualLines(initialLines);
      setMatches(valid);
      setStatus(valid.length === 0 ? "SIN PARTIDOS." : `✅ ${valid.length} ENCONTRADOS`);
    } catch (e: any) { setStatus(`❌ ERROR: ${e.message}`); }
  };

  // --- GENERACIÓN DE PROMPT ---
  const generarPrompt = async (match: any) => {
    // @ts-ignore
    const rHome = ratings[match.id]?.home;
    // @ts-ignore
    const rAway = ratings[match.id]?.away;
    // @ts-ignore
    const lines = manualLines[match.id] || [];
    const activeLines = lines.filter((l:any) => l.line && l.odds);

    if (!rHome || !rAway) { alert(`⚠️ Faltan los ELOs.`); return; }
    if (activeLines.length === 0) { alert("⚠️ Faltan líneas."); return; }

    setAnalyzingId(match.id);
    try {
      const res = await fetch(`${PYTHON_BACKEND_URL}/analizar_manual`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ elo_home: rHome, elo_away: rAway, sport: 'soccer' })
      });
      const data = await res.json();
      
      const linesFormatted = activeLines.map((l:any, i:number) => {
          const teamName = l.team === 'HOME' ? match.home_team : match.away_team;
          return `- Opción ${i + 1}: **${teamName}** [ ${l.line} ] @ ${l.odds}`;
      }).join("\n");

      const prompt = `## 🎯 ROL: GESTOR DE INVERSIONES FÚTBOL (BetSmart AI)
### 1. ⚙️ CAPITAL: $${bankroll} (Stake 1.4%: $${(parseInt(bankroll)/70).toFixed(0)})
### 2. 📋 EVENTO: ${match.home_team} vs ${match.away_team} (${SPORTS_CONFIG.soccer.leagues.find(l => l.code === selectedLeague)?.name})
### 3. 🧠 MATEMÁTICA (ELO):
- Local: ${rHome} | Visita: ${rAway}
- Diferencia: ${data.math.elo_diff_adjusted} pts.
- **PROYECCIÓN:** El modelo estima que el **${data.math.favorito}** debería ganar por un margen de **${Math.abs(data.math.expected_margin)} goles**.
### 4. 📉 LÍNEAS DE MERCADO:
${linesFormatted}
---
### 🕵️‍♂️ TU MISIÓN TÁCTICA:
1. **ANÁLISIS MATEMÁTICO:** Cruza la ventaja de ${data.math.expected_margin} goles con las líneas disponibles. ¿Cuál tiene valor?
2. **INVESTIGACIÓN DEPORTIVA (Browsing):**
   - **H2H:** Busca historial reciente.
   - **Lesiones:** ¿Falta el goleador o portero titular HOY?
   - **Contexto:** ¿Es Copa (rotaciones) o Liga?
3.  **VEREDICTO FINAL:** 
    - **Mejor Línea:** (Elige UNA).
    - **Stake:** (1-5).
    - **Monto:** ($ Pesos).
    - **Razón:** (Matemática + Contexto).`;

      // @ts-ignore
      setGeneratedPrompts(prev => ({...prev, [match.id]: prompt}));
    } catch (e) { alert("Error"); } finally { setAnalyzingId(null); }
  };

  const copiar = (id: any, text: any) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-[#111] p-4 rounded-xl border border-white/10 shadow-xl">
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
        <Activity className="text-emerald-500" />
        <h2 className="text-xl text-white font-bold tracking-widest">MÓDULO <span className="text-emerald-500">FÚTBOL</span></h2>
      </div>
      
      {/* CONTROLES */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="text-[10px] text-gray-500 block mb-1">FECHA</label>
                <input type="date" value={selectedDate} onChange={(e)=>setSelectedDate(e.target.value)} className="w-full bg-black border border-white/20 p-2 text-sm text-white rounded outline-none"/>
            </div>
            <div>
                <label className="text-[10px] text-gray-500 block mb-1">LIGA</label>
                <select value={selectedLeague} onChange={(e)=>setSelectedLeague(e.target.value)} className="w-full bg-black border border-white/20 p-2 text-sm text-white rounded outline-none">
                    {SPORTS_CONFIG.soccer.leagues.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
            </div>
        </div>
        <div>
            <label className="text-[10px] text-gray-500 block mb-1">CAPITAL</label>
            <input type="number" value={bankroll} onChange={(e)=>setBankroll(e.target.value)} className="w-full bg-black border border-white/20 p-2 text-sm text-white rounded outline-none" placeholder="Capital"/>
        </div>
        <button onClick={escanear} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded p-3 flex justify-center gap-2 transition-colors">
            {status.includes("...") ? <RefreshCw className="animate-spin"/> : <Search/>} {status}
        </button>
      </div>

      {/* RESULTADOS */}
      <div className="space-y-4">
          {matches.map((m:any) => (
             <div key={m.id} className="bg-[#0a0a0a] border border-white/10 p-5 rounded-lg hover:border-emerald-500/30 transition">
                <div className="flex justify-between items-center text-white font-bold mb-4 text-sm">
                    <span>{m.home_team}</span> <span className="text-gray-600 text-xs">VS</span> <span>{m.away_team}</span>
                </div>
                
                {/* @ts-ignore */}
                {!generatedPrompts[m.id] ? (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input type="number" placeholder="ELO Local" onChange={(e)=>handleRatingChange(m.id,'home',e.target.value)} className="w-full bg-black border border-white/20 p-2 text-center text-white text-xs rounded outline-none focus:border-emerald-500"/>
                            <input type="number" placeholder="ELO Visita" onChange={(e)=>handleRatingChange(m.id,'away',e.target.value)} className="w-full bg-black border border-white/20 p-2 text-center text-white text-xs rounded outline-none focus:border-emerald-500"/>
                        </div>

                        {/* LÍNEAS MANUALES */}
                        <div className="bg-[#111] p-3 rounded border border-white/5">
                             {/* @ts-ignore */}
                             {(manualLines[m.id]||[]).map((line:any, idx:number) => (
                                 <div key={idx} className="flex gap-2 mb-2 last:mb-0">
                                     <div className="relative w-1/3">
                                         <select value={line.team} onChange={(e)=>handleLineDataChange(m.id,idx,'team',e.target.value)} className="w-full bg-black text-white text-[10px] border border-white/20 rounded p-2 appearance-none outline-none">
                                            <option value="HOME">Local</option><option value="AWAY">Visita</option>
                                         </select>
                                         <ChevronDown size={10} className="absolute right-2 top-3 text-gray-500 pointer-events-none"/>
                                     </div>
                                     <input type="text" placeholder="Línea (-1.5)" value={line.line} onChange={(e)=>handleLineDataChange(m.id,idx,'line',e.target.value)} className="w-1/3 bg-black text-white text-xs border border-white/20 rounded text-center outline-none"/>
                                     <input type="number" placeholder="Cuota" value={line.odds} onChange={(e)=>handleLineDataChange(m.id,idx,'odds',e.target.value)} className="w-1/4 bg-black text-white text-xs border border-white/20 rounded text-center outline-none"/>
                                     <button onClick={()=>handleRemoveLine(m.id,idx)} className="text-red-500 hover:bg-red-900/20 p-2 rounded"><Trash2 size={12}/></button>
                                 </div>
                             ))}
                             <button onClick={()=>handleAddLine(m.id)} className="w-full bg-white/5 hover:bg-white/10 text-gray-400 text-xs py-2 rounded flex justify-center gap-1 mt-2 transition-colors"><Plus size={12}/> Agregar Línea</button>
                        </div>

                        <button onClick={()=>generarPrompt(m)} className="w-full border border-dashed border-white/20 text-emerald-400 hover:bg-emerald-900/10 py-2 rounded text-xs font-bold transition-colors">PROCESAR ESTRATEGIA</button>
                    </div>
                ) : (
                    <div className="animate-in fade-in">
                        <div className="mb-2 p-2 bg-emerald-900/20 rounded border border-emerald-500/20 text-center">
                            <p className="text-[10px] text-emerald-400 font-bold">PROMPT CREADO</p>
                        </div>
                        {/* @ts-ignore */}
                        <button onClick={()=>copiar(m.id, generatedPrompts[m.id])} className="w-full bg-emerald-600 text-white py-2 rounded font-bold text-xs flex justify-center gap-2 hover:bg-emerald-500 transition-colors">
                            {copiedId === m.id ? <Check size={16}/> : <Copy size={16}/>} COPIAR PROMPT
                        </button>
                    </div>
                )}
             </div>
          ))}
      </div>
    </div>
  );
}

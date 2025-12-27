// src/modules/Soccer.tsx
import React, { useState } from 'react';
import { 
  RefreshCw, Search, Copy, Check, ChevronDown, Trash2, Plus, Pencil, Zap 
} from 'lucide-react';
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

  // ... (Funciones auxiliares handleRatingChange, handleAddLine, etc. idénticas a la v35 pero solo usadas aquí) ...
  // Para ahorrar espacio en el chat, asumo que copias la lógica de gestión de estado (handles) aquí.
  // Si quieres te paso el bloque completo expandido de nuevo, pero es la misma lógica de "handle..." del código anterior.

  const handleRatingChange = (id, team, val) => setRatings(p => ({...p, [id]: {...p[id], [team]: val}}));
  const handleAddLine = (id) => setManualLines(p => ({...p, [id]: [...(p[id]||[{team:'HOME',line:'',odds:''}]), {team:'HOME',line:'',odds:''}]}));
  const handleLineDataChange = (id, idx, field, val) => {
    const lines = [...(manualLines[id]||[])];
    if(!lines[idx]) lines[idx]={team:'HOME',line:'',odds:''};
    lines[idx][field]=val;
    setManualLines(p => ({...p, [id]: lines}));
  };
  const handleRemoveLine = (id, idx) => {
    const lines = manualLines[id]||[];
    if(lines.length<=1) return;
    setManualLines(p => ({...p, [id]: lines.filter((_,i)=>i!==idx)}));
  };

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
      
      const initialLines = {};
      valid.forEach((m:any) => { initialLines[m.id] = [{ team: 'HOME', line: '', odds: '' }]; });
      setManualLines(initialLines);
      setMatches(valid);
      setStatus(valid.length === 0 ? "SIN PARTIDOS." : `✅ ${valid.length} ENCONTRADOS`);
    } catch (e: any) { setStatus(`❌ ERROR: ${e.message}`); }
  };

  const generarPrompt = async (match: any) => {
    const rHome = ratings[match.id]?.home;
    const rAway = ratings[match.id]?.away;
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
- **PROYECCIÓN:** ${data.math.favorito} gana por **${Math.abs(data.math.expected_margin)} goles**.
### 4. 📉 LÍNEAS:
${linesFormatted}
---
### 🕵️‍♂️ MISIÓN:
1. **MATEMÁTICA:** Cruza la ventaja de ${data.math.expected_margin} goles con las líneas.
2. **INVESTIGACIÓN:** H2H, Lesiones (Goleador/Portero), Contexto (Copa/Liga).
3. **VERDICTO:** Mejor Línea, Stake, Monto.`;

      setGeneratedPrompts(prev => ({...prev, [match.id]: prompt}));
    } catch (e) { alert("Error"); } finally { setAnalyzingId(null); }
  };

  const copiar = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-[#111] p-4 rounded-xl border border-white/10">
      <h2 className="text-xl text-emerald-500 font-bold mb-4 flex gap-2"><Activity/> MÓDULO FÚTBOL</h2>
      
      {/* CONTROLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input type="date" value={selectedDate} onChange={(e)=>setSelectedDate(e.target.value)} className="bg-black border border-white/20 p-2 text-white rounded"/>
        <select value={selectedLeague} onChange={(e)=>setSelectedLeague(e.target.value)} className="bg-black border border-white/20 p-2 text-white rounded">
             {SPORTS_CONFIG.soccer.leagues.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
        <input type="number" value={bankroll} onChange={(e)=>setBankroll(e.target.value)} className="bg-black border border-white/20 p-2 text-white rounded" placeholder="Capital"/>
        <button onClick={escanear} className="bg-emerald-600 text-white font-bold rounded p-2 flex justify-center gap-2">
            {status.includes("...") ? <RefreshCw className="animate-spin"/> : <Search/>} {status}
        </button>
      </div>

      {/* RESULTADOS */}
      <div className="space-y-4">
          {matches.map((m:any) => (
             <div key={m.id} className="bg-black/50 border border-white/10 p-4 rounded-lg">
                <div className="flex justify-between text-white font-bold mb-4">
                    <span>{m.home_team}</span> <span>VS</span> <span>{m.away_team}</span>
                </div>
                
                {!generatedPrompts[m.id] ? (
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <input type="number" placeholder="ELO Local" onChange={(e)=>handleRatingChange(m.id,'home',e.target.value)} className="w-full bg-black border border-white/20 p-2 text-center text-white text-xs rounded"/>
                            <input type="number" placeholder="ELO Visita" onChange={(e)=>handleRatingChange(m.id,'away',e.target.value)} className="w-full bg-black border border-white/20 p-2 text-center text-white text-xs rounded"/>
                        </div>
                        {/* Renderizado de líneas manuales simplificado aquí */}
                        <div className="space-y-2">
                             {(manualLines[m.id]||[]).map((line:any, idx:number) => (
                                 <div key={idx} className="flex gap-2">
                                     <select value={line.team} onChange={(e)=>handleLineDataChange(m.id,idx,'team',e.target.value)} className="bg-black text-white text-xs border border-white/20 rounded">
                                        <option value="HOME">Local</option><option value="AWAY">Visita</option>
                                     </select>
                                     <input type="text" placeholder="Línea" value={line.line} onChange={(e)=>handleLineDataChange(m.id,idx,'line',e.target.value)} className="bg-black text-white text-xs border border-white/20 rounded w-1/3 text-center"/>
                                     <input type="number" placeholder="Cuota" value={line.odds} onChange={(e)=>handleLineDataChange(m.id,idx,'odds',e.target.value)} className="bg-black text-white text-xs border border-white/20 rounded w-1/3 text-center"/>
                                     <button onClick={()=>handleRemoveLine(m.id,idx)}><Trash2 size={14} className="text-red-500"/></button>
                                 </div>
                             ))}
                             <button onClick={()=>handleAddLine(m.id)} className="w-full bg-white/5 text-gray-400 text-xs py-1 rounded flex justify-center gap-1"><Plus size={12}/> Agregar Línea</button>
                        </div>
                        <button onClick={()=>generarPrompt(m)} className="w-full bg-emerald-600/20 text-emerald-500 py-2 rounded text-xs font-bold border border-emerald-500/50">PROCESAR</button>
                    </div>
                ) : (
                    <button onClick={()=>copiar(m.id, generatedPrompts[m.id])} className="w-full bg-emerald-500 text-black py-2 rounded font-bold text-xs flex justify-center gap-2">
                        {copiedId === m.id ? <Check size={16}/> : <Copy size={16}/>} COPIAR PROMPT
                    </button>
                )}
             </div>
          ))}
      </div>
    </div>
  );
}

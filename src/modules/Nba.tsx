import React, { useState } from 'react';
import { 
  RefreshCw, Search, Copy, Check, ChevronDown, Trash2, Plus, Pencil, Dumbbell 
} from 'lucide-react';
import { PYTHON_BACKEND_URL, getRandomKey, SPORTS_CONFIG } from '../config';

export default function Nba() {
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState("LISTO PARA NBA");
  const [analyzingId, setAnalyzingId] = useState(null);
  const [generatedPrompts, setGeneratedPrompts] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  
  const [ratings, setRatings] = useState({});
  const [manualLines, setManualLines] = useState({}); 

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); 
  // NBA solo tiene una liga en la config por ahora
  const [selectedLeague, setSelectedLeague] = useState(SPORTS_CONFIG.nba.leagues[0].code);
  const [bankroll, setBankroll] = useState("50000");

  // --- HANDLERS ---
  const handleRatingChange = (id:any, team:any, val:any) => setRatings((p:any) => ({...p, [id]: {...p[id], [team]: val}}));
  
  const handleAddLine = (id:any) => setManualLines((p:any) => ({...p, [id]: [...(p[id]||[{team:'HOME',line:'',odds:''}]), {team:'HOME',line:'',odds:''}]}));
  
  const handleLineDataChange = (id:any, idx:any, field:any, val:any) => {
    const lines = [...(manualLines[id]||[])];
    if(!lines[idx]) lines[idx]={team:'HOME',line:'',odds:''};
    lines[idx][field]=val;
    setManualLines((p:any) => ({...p, [id]: lines}));
  };
  
  const handleRemoveLine = (id:any, idx:any) => {
    const lines = manualLines[id]||[];
    if(lines.length<=1) return;
    setManualLines((p:any) => ({...p, [id]: lines.filter((_:any,i:any)=>i!==idx)}));
  };

  // --- ESCANEO ---
  const escanear = async () => {
    setMatches([]); setGeneratedPrompts({}); setRatings({}); setManualLines({});
    setStatus("BUSCANDO JUEGOS...");
    try {
      const apiKey = getRandomKey();
      // En NBA pedimos spreads y totals
      const url = `https://api.the-odds-api.com/v4/sports/${selectedLeague}/odds/?apiKey=${apiKey}&regions=eu,us&markets=h2h,spreads,totals&oddsFormat=decimal`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (!Array.isArray(data)) throw new Error(data.message || "Error API");
      
      const valid = data.filter((m: any) => {
          const mDate = new Date(m.commence_time);
          const start = new Date(selectedDate);
          const end = new Date(selectedDate);
          end.setDate(end.getDate() + 2); 
          return mDate >= start && mDate <= end;
      }).slice(0, 15);
      
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

  // --- GENERAR PROMPT ---
  const generarPrompt = async (match: any) => {
    // @ts-ignore
    const rHome = ratings[match.id]?.home;
    // @ts-ignore
    const rAway = ratings[match.id]?.away;
    // @ts-ignore
    const lines = manualLines[match.id] || [];
    const activeLines = lines.filter((l:any) => l.line && l.odds);

    if (!rHome || !rAway) { alert(`⚠️ Faltan Power Ratings.`); return; }
    if (activeLines.length === 0) { alert("⚠️ Faltan líneas."); return; }

    setAnalyzingId(match.id);
    try {
      // Enviamos sport: 'nba'
      const res = await fetch(`${PYTHON_BACKEND_URL}/analizar_manual`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ elo_home: rHome, elo_away: rAway, sport: 'nba' })
      });
      const data = await res.json();
      
      const linesFormatted = activeLines.map((l:any, i:number) => {
          const teamName = l.team === 'HOME' ? match.home_team : match.away_team;
          return `- Opción ${i + 1}: **${teamName}** [ ${l.line} ] @ ${l.odds}`;
      }).join("\n");

      const prompt = `## 🏀 ROL: EXPERTO EN NBA (Capital Shield)
### 1. ⚙️ CAPITAL: $${bankroll} (Stake 1.4%: $${(parseInt(bankroll)/70).toFixed(0)})
### 2. 📋 EVENTO: ${match.home_team} vs ${match.away_team}
### 3. 🧠 MATEMÁTICA (POWER RATING):
- Local: ${rHome} | Visita: ${rAway}
- Diferencia Ajustada (+100 Local): ${data.math.elo_diff_adjusted} pts.
- **PROYECCIÓN:** ${data.math.favorito} gana por **${Math.abs(data.math.expected_margin)} puntos**.
### 4. 📉 LÍNEAS DE MERCADO:
${linesFormatted}
---
### 🕵️‍♂️ MISIÓN TÁCTICA (BUSCAR EN GOOGLE):
1. **MATEMÁTICA:** Cruza la ventaja de ${data.math.expected_margin} puntos con las líneas.
2. **FACTOR FATIGA (CRÍTICO):**
   - ¿Alguno jugó ayer (Back-to-Back)? Si es así, réstale rendimiento.
   - ¿Es el 3er partido en 4 noches?
3. **REPORTE DE LESIONES:**
   - Busca "NBA Injury Report Today". ¿Juegan las estrellas?
4. **VERDICTO:** Mejor Línea, Stake, Monto.`;

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
        <Dumbbell className="text-orange-500" />
        <h2 className="text-xl text-white font-bold tracking-widest">MÓDULO <span className="text-orange-500">NBA</span></h2>
      </div>
      
      {/* CONTROLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
            <label className="text-[10px] text-gray-500 block mb-1">FECHA</label>
            <input type="date" value={selectedDate} onChange={(e)=>setSelectedDate(e.target.value)} className="w-full bg-black border border-white/20 p-2 text-sm text-white rounded outline-none"/>
        </div>
        <div>
            <label className="text-[10px] text-gray-500 block mb-1">CAPITAL</label>
            <input type="number" value={bankroll} onChange={(e)=>setBankroll(e.target.value)} className="w-full bg-black border border-white/20 p-2 text-sm text-white rounded outline-none"/>
        </div>
        <button onClick={escanear} className="col-span-1 md:col-span-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded p-3 flex justify-center gap-2 transition-colors">
            {status.includes("...") ? <RefreshCw className="animate-spin"/> : <Search/>} {status}
        </button>
      </div>

      {/* RESULTADOS */}
      <div className="space-y-4">
          {matches.map((m:any) => (
             <div key={m.id} className="bg-black/50 border border-white/10 p-4 rounded-lg hover:border-orange-500/30 transition">
                <div className="flex justify-between text-white font-bold mb-4">
                    <span>{m.home_team}</span> <span className="text-orange-500 font-black">VS</span> <span>{m.away_team}</span>
                </div>
                
                {/* @ts-ignore */}
                {!generatedPrompts[m.id] ? (
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <input type="number" placeholder="PR Local" onChange={(e)=>handleRatingChange(m.id,'home',e.target.value)} className="w-full bg-black border border-white/20 p-2 text-center text-white text-xs rounded outline-none focus:border-orange-500 placeholder-gray-600"/>
                            <input type="number" placeholder="PR Visita" onChange={(e)=>handleRatingChange(m.id,'away',e.target.value)} className="w-full bg-black border border-white/20 p-2 text-center text-white text-xs rounded outline-none focus:border-orange-500 placeholder-gray-600"/>
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
                                     <input type="text" placeholder="Línea (-5.5)" value={line.line} onChange={(e)=>handleLineDataChange(m.id,idx,'line',e.target.value)} className="w-1/3 bg-black text-white text-xs border border-white/20 rounded text-center outline-none"/>
                                     <input type="number" placeholder="Cuota" value={line.odds} onChange={(e)=>handleLineDataChange(m.id,idx,'odds',e.target.value)} className="w-1/4 bg-black text-white text-xs border border-white/20 rounded text-center outline-none"/>
                                     <button onClick={()=>handleRemoveLine(m.id,idx)}><Trash2 size={14} className="text-red-500 hover:text-red-400 transition-colors"/></button>
                                 </div>
                             ))}
                             <button onClick={()=>handleAddLine(m.id)} className="w-full bg-white/5 hover:bg-white/10 text-gray-400 text-xs py-2 rounded flex justify-center gap-1 mt-2 transition-colors"><Plus size={12}/> Agregar Línea</button>
                        </div>
                        <button onClick={()=>generarPrompt(m)} className="w-full bg-orange-600/20 text-orange-500 py-2 rounded text-xs font-bold border border-orange-500/50">PROCESAR NBA</button>
                    </div>
                ) : (
                    <button onClick={()=>copiar(m.id, generatedPrompts[m.id])} className="w-full bg-orange-600 text-white py-2 rounded font-bold text-xs flex justify-center gap-2 hover:bg-orange-500 transition-colors">
                        {copiedId === m.id ? <Check size={16}/> : <Copy size={16}/>} COPIAR PROMPT
                    </button>
                )}
             </div>
          ))}
      </div>
    </div>
  );
}

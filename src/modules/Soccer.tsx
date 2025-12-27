import React, { useState } from 'react';
import { 
  RefreshCw, Search, Copy, Check, ChevronDown, Trash2, Plus, Pencil, Activity 
} from 'lucide-react';
import { PYTHON_BACKEND_URL, getRandomKey, SOCCER_LEAGUE_GROUPS } from '../config';

export default function Soccer() {
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState("LISTO PARA OPERAR");
  const [analyzingId, setAnalyzingId] = useState(null);
  const [generatedPrompts, setGeneratedPrompts] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  
  const [ratings, setRatings] = useState({});
  const [manualLines, setManualLines] = useState({}); 

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); 
  const [selectedLeague, setSelectedLeague] = useState('soccer_epl');
  const [bankroll, setBankroll] = useState("50000");

  // --- HANDLERS (Iguales a la versión anterior) ---
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
    setStatus("ESCANEO INICIADO...");
    try {
      const apiKey = getRandomKey();
      // Pedimos spreads y h2h
      const url = `https://api.the-odds-api.com/v4/sports/${selectedLeague}/odds/?apiKey=${apiKey}&regions=eu,us&markets=h2h,spreads&oddsFormat=decimal`;
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
      valid.forEach((m:any) => { 
          // @ts-ignore
          initialLines[m.id] = [{ team: 'HOME', line: '', odds: '' }]; 
      });
      setManualLines(initialLines);
      setMatches(valid);
      setStatus(valid.length === 0 ? "SIN PARTIDOS." : `✅ ${valid.length} ENCONTRADOS`);
    } catch (e: any) { setStatus(`❌ ERROR: ${e.message}`); }
  };

  const getLeagueName = (code: string) => {
      for (const group of SOCCER_LEAGUE_GROUPS) {
          const found = group.leagues.find(l => l.code === code);
          if (found) return found.name;
      }
      return code;
  };

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
### 2. 📋 EVENTO: ${match.home_team} vs ${match.away_team}
### 3. 🏆 TORNEO: ${getLeagueName(selectedLeague)}
### 4. 🧠 MATEMÁTICA (ELO):
- Local: ${rHome} | Visita: ${rAway}
- Diferencia: ${data.math.elo_diff_adjusted} pts.
- **PROYECCIÓN:** ${data.math.favorito} gana por **${Math.abs(data.math.expected_margin)} goles**.
### 5. 📉 LÍNEAS:
${linesFormatted}
---
### 🕵️‍♂️ MISIÓN:
1. **MATEMÁTICA:** Cruza la ventaja de ${data.math.expected_margin} goles con las líneas.
2. **INVESTIGACIÓN (Browsing):** H2H reciente, Lesiones HOY, Contexto de Copa.
3. **VERDICTO:** Mejor Línea, Stake, Monto.`;

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
    <div className="bg-[#111] p-5 rounded-2xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
             <Activity className="text-emerald-500" size={24}/>
        </div>
        <h2 className="text-2xl text-white font-bold tracking-widest">MÓDULO <span className="text-emerald-500">FÚTBOL</span></h2>
      </div>
      
      {/* CONTROLES */}
      <div className="bg-black/40 rounded-xl p-4 border border-white/5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Fecha</label>
                <input type="date" value={selectedDate} onChange={(e)=>setSelectedDate(e.target.value)} className="w-full bg-[#151515] border border-white/10 p-2.5 text-sm text-white rounded-lg outline-none focus:border-emerald-500/50 transition-colors"/>
            </div>
            <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Torneo</label>
                <select value={selectedLeague} onChange={(e)=>setSelectedLeague(e.target.value)} className="w-full bg-[#151515] border border-white/10 p-2.5 text-sm text-white rounded-lg outline-none focus:border-emerald-500/50 transition-colors">
                    {SOCCER_LEAGUE_GROUPS.map((group, idx) => (
                        <optgroup key={idx} label={group.label}>
                            {group.leagues.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                        </optgroup>
                    ))}
                </select>
            </div>
        </div>
        
        <div className="mb-4 space-y-1">
            <label className="text-[10px] text-gray-500 font-bold uppercase">Capital (COP)</label>
            <input type="number" value={bankroll} onChange={(e)=>setBankroll(e.target.value)} className="w-full bg-[#151515] border border-white/10 p-2.5 text-sm text-white rounded-lg outline-none focus:border-emerald-500/50 transition-colors" placeholder="Capital"/>
        </div>

        <button onClick={escanear} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg p-3 flex justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            {status.includes("...") ? <RefreshCw className="animate-spin"/> : <Search/>} {status}
        </button>
      </div>

      {/* RESULTADOS */}
      <div className="space-y-5">
          {matches.map((m:any) => (
             <div key={m.id} className="group bg-[#0a0a0a] border border-white/10 p-5 rounded-xl hover:border-emerald-500/30 transition-all shadow-lg">
                <div className="flex justify-between items-center text-white font-bold mb-1 text-base">
                    <span>{m.home_team}</span> 
                    <span className="text-gray-600 text-xs px-2 italic">VS</span> 
                    <span>{m.away_team}</span>
                </div>
                <div className="text-[10px] text-gray-500 mb-4 font-mono">{new Date(m.commence_time).toLocaleString()}</div>
                
                {/* @ts-ignore */}
                {!generatedPrompts[m.id] ? (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input type="number" placeholder="ELO Local" onChange={(e)=>handleRatingChange(m.id,'home',e.target.value)} className="flex-1 bg-black border border-white/20 p-2 text-center text-white text-xs rounded focus:border-emerald-500 outline-none placeholder-gray-700"/>
                            <input type="number" placeholder="ELO Visita" onChange={(e)=>handleRatingChange(m.id,'away',e.target.value)} className="flex-1 bg-black border border-white/20 p-2 text-center text-white text-xs rounded focus:border-emerald-500 outline-none placeholder-gray-700"/>
                        </div>
                        
                        <div className="bg-[#111] p-3 rounded-lg border border-white/5">
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] text-gray-400 font-bold uppercase">Líneas de Apuesta</span>
                                <span className="text-[9px] bg-white/5 px-2 rounded text-gray-500">MANUAL</span>
                             </div>
                             {/* @ts-ignore */}
                             {(manualLines[m.id]||[]).map((line:any, idx:number) => (
                                 <div key={idx} className="flex gap-2 mb-2 last:mb-0">
                                     <div className="relative w-1/3">
                                        <select value={line.team} onChange={(e)=>handleLineDataChange(m.id,idx,'team',e.target.value)} className="w-full bg-black text-white text-[10px] border border-white/20 rounded p-2 appearance-none outline-none">
                                            <option value="HOME">Local</option><option value="AWAY">Visita</option>
                                        </select>
                                        <ChevronDown size={10} className="absolute right-2 top-3 text-gray-500 pointer-events-none"/>
                                     </div>
                                     <input type="text" placeholder="-1.5" value={line.line} onChange={(e)=>handleLineDataChange(m.id,idx,'line',e.target.value)} className="bg-black text-white text-xs border border-white/20 rounded w-1/3 text-center outline-none focus:border-emerald-500"/>
                                     <input type="number" placeholder="1.90" value={line.odds} onChange={(e)=>handleLineDataChange(m.id,idx,'odds',e.target.value)} className="bg-black text-white text-xs border border-white/20 rounded w-1/3 text-center outline-none focus:border-emerald-500"/>
                                     <button onClick={()=>handleRemoveLine(m.id,idx)}><Trash2 size={14} className="text-red-500 hover:text-red-400 transition-colors"/></button>
                                 </div>
                             ))}
                             <button onClick={()=>handleAddLine(m.id)} className="w-full bg-white/5 hover:bg-white/10 text-gray-400 text-xs py-2 rounded flex justify-center gap-1 mt-2 transition-colors"><Plus size={12}/> Agregar Línea</button>
                        </div>

                        <button onClick={()=>generarPrompt(m)} className="w-full border border-dashed border-white/20 text-emerald-400 hover:bg-emerald-900/10 py-2.5 rounded text-xs font-bold transition-all flex items-center justify-center gap-2">
                            <Pencil size={12}/> GENERAR ESTRATEGIA
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in zoom-in-95">
                        <div className="mb-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-center">
                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                                <Zap size={12} className="fill-emerald-400"/> Prompt Generado
                            </p>
                        </div>
                        {/* @ts-ignore */}
                        <button onClick={()=>copiar(m.id, generatedPrompts[m.id])} className={`w-full py-3 rounded-lg font-bold text-xs flex justify-center gap-2 transition-all ${copiedId === m.id ? 'bg-emerald-500 text-black' : 'bg-white text-black hover:bg-gray-200'}`}>
                            {copiedId === m.id ? <Check size={16}/> : <Copy size={16}/>} {copiedId === m.id ? "COPIADO" : "COPIAR AL PORTAPAPELES"}
                        </button>
                    </div>
                )}
             </div>
          ))}
      </div>
    </div>
  );
}

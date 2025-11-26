cat << 'EOF' > src/App.tsx
import React, { useState } from 'react';
import { 
  Activity, RefreshCw, Zap, Search, Copy, Check, 
  Calendar, Globe, Wallet, TrendingUp, BarChart3, 
  ChevronRight, DollarSign, Shield, MousePointerClick,
  AlertTriangle, Terminal, Cpu, Bot, FileText, Globe2
} from 'lucide-react';

// ==========================================
// ⚙️ CONFIGURACIÓN DEL SISTEMA
// ==========================================
const PYTHON_BACKEND_URL = "https://cerebro-apuestas.onrender.com"; 

// 🔑 TUS LLAVES DE ODDS API
const ODDS_API_KEYS = [
  "734f30d0866696cf90d5029ac106cfba",
  "10fb6d9d7b3240906d0acea646068535",
  "a9ff72549c4910f1fa9659e175a35cc0",
  "25e9d8872877f5110254ff6ef42056c6",
  "6205cdb2cfd889e6fc44518f950f7dad",
  "d39a6f31abf6412d46b2c7185a5dfffe",
  "fbd5dece2a99c992cfd783aedfcd2ef3",
  "687ba857bcae9c7f33545dcbe59aeb2b",
  "f9ff83040b9d2afc1862094694f53da2",
  "f730fa9137a7cd927554df334af916dc",
  "9091ec0ea25e0cdfc161b91603e31a9a",
  "c0f7d526dd778654dfee7c0686124a77",
  "61a015bc1506aac11ec62901a6189dc6",
  "d585a73190a117c1041ccc78b92b23d9",
  "4056628d07b0b900175cb332c191cda0",
  "ac4d3eb2d6df42030568eadeee906770",
  "3cebba62ff5330d1a409160e6870bfd6",
  "358644d442444f95bd0b0278e4d3ea22",
  "45dff0519cde0396df06fc4bc1f9bce1",
  "a4f585765036f57be0966b39125f87a0",
  "349f8eff303fa0963424c54ba181535b",
  "f54405559ba5aaa27a9687992a84ae2f",
  "24772de60f0ebe37a554b179e0dd819f",
  "b7bdefecc83235f7923868a0f2e3e114",
  "3a9d3110045fd7373875bdbc7459c82c",
  "d2aa9011f39bfcb309b3ee1da6328573",
  "107ad40390a24eb61ee02ff976f3d3ac",
  "8f6358efeec75d6099147764963ae0f8",
  "672962843293d4985d0bed1814d3b716",
  "4b1867baf919f992554c77f493d258c5",
  "b3fd66af803adc62f00122d51da7a0e6",
  "53ded39e2281f16a243627673ad2ac8c",
  "bf785b4e9fba3b9cd1adb99b9905880b",
  "60e3b2a9a7324923d78bfc6dd6f3e5d3",
  "cc16776a60e3eee3e1053577216b7a29",
  "a0cc233165bc0ed04ee42feeaf2c9d30",
  "d2afc749fc6b64adb4d8361b0fe58b4b",
  "b351eb6fb3f5e95b019c18117e93db1b",
  "74dbc42e50dd64687dc1fad8af59c490",
  "7b4a5639cbe63ddf37b64d7e327d3e71",
  "20cec1e2b8c3fd9bb86d9e4fad7e6081",
  "1352436d9a0e223478ec83aec230b4aa",
  "29257226d1c9b6a15c141d989193ef72",
  "24677adc5f5ff8401c6d98ea033e0f0b",
  "54e84a82251def9696ba767d6e2ca76c",
  "ff3e9e3a12c2728c6c4ddea087bc51a9",
  "f3ff0fb5d7a7a683f88b8adec904e7b8",
  "1e0ab1ff51d111c88aebe4723020946a",
  "6f74a75a76f42fabaa815c4461c59980",
  "86de2f86b0b628024ef6d5546b479c0f"
];

const LEAGUES = [
  { code: 'soccer_uefa_champs_league', name: 'Champions League', flag: '🏆' },
  { code: 'soccer_epl', name: 'Premier League', flag: '🇬🇧' },
  { code: 'soccer_spain_la_liga', name: 'La Liga', flag: '🇪🇸' },
  { code: 'soccer_germany_bundesliga', name: 'Bundesliga', flag: '🇩🇪' },
  { code: 'soccer_italy_serie_a', name: 'Serie A', flag: '🇮🇹' },
  { code: 'soccer_france_ligue_one', name: 'Ligue 1', flag: '🇫🇷' },
  { code: 'soccer_netherlands_eredivisie', name: 'Eredivisie', flag: '🇳🇱' },
  { code: 'soccer_portugal_primeira_liga', name: 'Primeira Liga', flag: '🇵🇹' }
];

// --- UTILIDADES INTERNAS ---
const getRandomKey = () => {
    if (!ODDS_API_KEYS || ODDS_API_KEYS.length === 0) return null;
    return ODDS_API_KEYS[Math.floor(Math.random() * ODDS_API_KEYS.length)];
};

const TeamLogo = ({ url, name }) => {
    if (url) {
        return <img src={url} alt={name} className="w-12 h-12 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" onError={(e) => e.currentTarget.style.display = 'none'} />;
    }
    return (
        <div className="w-12 h-12 rounded-full bg-[#222] border border-white/10 flex items-center justify-center text-xs font-bold text-gray-500">
            {name ? name.substring(0, 2).toUpperCase() : "??"}
        </div>
    );
};

// ==========================================
// 🚀 COMPONENTE PRINCIPAL
// ==========================================
function App() {
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState("SISTEMA ONLINE");
  const [analyzingId, setAnalyzingId] = useState(null);
  const [generatedPrompts, setGeneratedPrompts] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); 
  const [selectedLeague, setSelectedLeague] = useState('soccer_epl');
  const [bankroll, setBankroll] = useState("50000");

  // --- FUNCIÓN 1: ESCANEAR MERCADO ---
  const escanear = async () => {
    setMatches([]); setGeneratedPrompts({});
    setStatus("INICIANDO PROTOCOLO DE ESCANEO...");
    try {
      const apiKey = getRandomKey();
      if (!apiKey) throw new Error("Faltan Keys");

      // 1. Obtener Cuotas
      let url = `https://api.the-odds-api.com/v4/sports/${selectedLeague}/odds/?apiKey=${apiKey}&regions=eu&markets=h2h,totals,btts&oddsFormat=decimal`;
      let res = await fetch(url);
      let rawData = await res.json();

      // Fallback si falla
      if (!res.ok || rawData.message || !Array.isArray(rawData)) {
        console.warn("Fallback activado...");
        url = `https://api.the-odds-api.com/v4/sports/${selectedLeague}/odds/?apiKey=${apiKey}&regions=eu&markets=h2h,totals&oddsFormat=decimal`;
        res = await fetch(url);
        rawData = await res.json();
      }

      if (rawData.message) throw new Error(rawData.message);
      if (!Array.isArray(rawData)) throw new Error("Error de conexión con proveedor");

      // Filtro de Fecha
      const valid = rawData.filter(m => m.commence_time.startsWith(selectedDate)).slice(0, 10);
      
      if (valid.length === 0) {
        setStatus("MERCADO CERRADO / SIN EVENTOS.");
        return;
      }

      // 2. Sincronizar con Python y obtener Logos
      setStatus(`PROCESANDO IMÁGENES DE ${valid.length} EVENTOS...`);
      const resPython = await fetch(`${PYTHON_BACKEND_URL}/sincronizar-cache`, {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ partidos: valid })
      });
      const dataPython = await resPython.json();
      
      const matchesWithLogos = valid.map(m => ({
        ...m,
        home_logo: dataPython.logos?.[m.home_team] || null,
        away_logo: dataPython.logos?.[m.away_team] || null
      }));
      
      setMatches(matchesWithLogos);
      setStatus(`✅ DATOS LISTOS: ${valid.length} EVENTOS`);

    } catch (e) {
      setStatus(`❌ ERROR: ${e.message}`);
    }
  };

  // --- FUNCIÓN 2: GENERAR PROMPT MAESTRO ---
  const generarPrompt = async (match) => {
    setAnalyzingId(match.id);
    try {
      // Extracción de Cuotas
      let oddHome = 0, oddDraw = 0, oddAway = 0;
      let over25 = "ND", under25 = "ND", bttsYes = "ND", bttsNo = "ND";

      for (const bookie of match.bookmakers) {
        const h2h = bookie.markets.find(m => m.key === 'h2h');
        if (h2h && oddHome === 0) {
            oddHome = h2h.outcomes.find(o => o.name === match.home_team)?.price;
            oddAway = h2h.outcomes.find(o => o.name === match.away_team)?.price;
            oddDraw = h2h.outcomes.find(o => o.name === 'Draw')?.price;
        }
        const totals = bookie.markets.find(m => m.key === 'totals');
        if (totals && over25 === "ND") {
            over25 = totals.outcomes.find(o => o.name === 'Over' && o.point === 2.5)?.price || "ND";
            under25 = totals.outcomes.find(o => o.name === 'Under' && o.point === 2.5)?.price || "ND";
        }
        const btts = bookie.markets.find(m => m.key === 'btts');
        if (btts && bttsYes === "ND") {
            bttsYes = btts.outcomes.find(o => o.name === 'Yes')?.price || "ND";
            bttsNo = btts.outcomes.find(o => o.name === 'No')?.price || "ND";
        }
      }

      // Llamada al Backend Matemático
      const res = await fetch(`${PYTHON_BACKEND_URL}/analizar_completo`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          home_team: match.home_team,
          away_team: match.away_team,
          odd_home: oddHome || 2.0,
          odd_draw: oddDraw || 3.0,
          odd_away: oddAway || 2.0
        })
      });
      const data = await res.json();
      
      // === EL PROMPT PARA KIMI / GPT (AQUÍ ESTÁ EL CAMBIO) ===
      const prompt = `📋 **ANÁLISIS TÉCNICO DE INVERSIÓN - BETSMART AI**

🔹 **CONFIGURACIÓN DE CAPITAL:**
- **Bankroll Total:** $${bankroll} COP
- **Unidad de Stake (2%):** $${(parseInt(bankroll)* 0.02).toFixed(0)} COP

⚽ **EVENTO:** ${match.home_team} vs ${match.away_team}
🏆 **LIGA:** ${LEAGUES.find(l => l.code === selectedLeague)?.name}
📅 **FECHA:** ${selectedDate}

📊 **LECTURA DE MERCADO (ODDS):**
- **Ganador:** 1[@${oddHome}] | X[@${oddDraw}] | 2[@${oddAway}]
- **Goles (2.5):** Over[@${over25}] | Under[@${under25}]
- **Ambos Marcan:** Sí[@${bttsYes}] | No[@${bttsNo}]

🧮 **INTELIGENCIA MATEMÁTICA (BACKEND):**
1. **Potencia ELO:**
   - Local: ${data.elo.home} | Visita: ${data.elo.away}
   - Diferencia Neta: ${data.elo.home - data.elo.away}
   *(Nota: >100 pts indica ventaja clara).*

2. **Estadísticas Reales (Media 5 Partidos):**
   - Ataque Local: ${data.stats.home.shots} tiros/p.
   - Ataque Visita: ${data.stats.away.shots} tiros/p.
   - Córners Promedio: L(${data.stats.home.corners}) - V(${data.stats.away.corners}).

3. **Predicción Algorítmica (.joblib):**
   - **Probabilidad BTTS (Sí):** ${data.model_result.btts_prob}%
   - **Probabilidad Over 2.5:** ${data.model_result.over_prob}%

📝 **INSTRUCCIONES CRÍTICAS PARA EL ASISTENTE:**
Actúa como un experto financiero deportivo.

1.  🚨 **PROTOCOLO DE BÚSQUEDA OBLIGATORIA:**
    Si alguna cuota en la sección "MERCADO" aparece como **"ND"** (No Disponible), **TU PRIMERA TAREA ES BUSCAR EN GOOGLE** las cuotas actuales para ese mercado específico (Ej: "Cuota BTTS ${match.home_team} vs ${match.away_team}"). ¡No realices el análisis sin tener la cuota real!

2.  **ANÁLISIS DE NOTICIAS:**
    Busca lesiones de titulares confirmadas en las últimas 24h.

3.  **CÁLCULO DE VALOR:**
    Cruza mi modelo matemático con la cuota (la que te di o la que buscaste).

4.  **ORDEN DE COMPRA:**
    Dame el STAKE (1-10), el MONTO en pesos y la selección final.`;

      setGeneratedPrompts(prev => ({...prev, [match.id]: prompt}));

    } catch (e) {
      alert("Error de cálculo en servidor");
    } finally {
      setAnalyzingId(null);
    }
  };

  const copiar = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-200 font-sans pb-32 selection:bg-indigo-500/30">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-900/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-4 md:p-8">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-10 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
                <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                    <Activity className="text-indigo-400" size={24}/>
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                BetSmart <span className="text-indigo-500">TITANIUM</span>
                </h1>
            </div>
            <p className="text-[10px] text-slate-500 font-bold tracking-[0.3em] uppercase pl-1">AI Powered Analytics</p>
          </div>
          <div className="hidden md:block">
             <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-mono border border-indigo-500/20 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></div> v13.0 SMART-SEARCH
             </span>
          </div>
        </div>

        {/* Dashboard Control */}
        <div className="bg-[#121212] rounded-2xl border border-white/10 p-6 mb-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-white"><Terminal size={100}/></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 relative z-10">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><DollarSign size={10}/> Capital</label>
                    <input type="number" value={bankroll} onChange={(e) => setBankroll(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500/50 transition-colors font-mono"/>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Calendar size={10}/> Fecha</label>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500/50 transition-colors"/>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Globe size={10}/> Mercado</label>
                    <div className="relative">
                        <select value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none appearance-none cursor-pointer">
                            {LEAGUES.map(l => <option key={l.code} value={l.code} className="bg-[#121212]">{l.flag} {l.name}</option>)}
                        </select>
                        <ChevronRight size={14} className="absolute right-4 top-4 text-slate-600 pointer-events-none"/>
                    </div>
                </div>
            </div>

            <button onClick={escanear} className="relative z-10 w-full bg-white hover:bg-gray-200 text-black py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,255,255,0.1)] transition-all active:scale-[0.99]">
                {status.includes("...") ? <RefreshCw className="animate-spin" size={18}/> : <Search size={18}/>}
                {status}
            </button>
        </div>

        {/* Grid de Partidos */}
        <div className="grid gap-6">
          {matches.map(m => (
            <div key={m.id} className="group bg-[#121212] rounded-2xl border border-white/5 overflow-hidden hover:border-indigo-500/30 transition-all duration-300 shadow-lg">
              
              {/* Header Tarjeta */}
              <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-white/[0.02] to-transparent">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{LEAGUES.find(l => l.code === selectedLeague)?.name}</span>
                </div>
                <div className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                    {m.commence_time.split('T')[1].slice(0,5)}
                </div>
              </div>

              {/* Cuerpo Tarjeta */}
              <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                
                {/* Equipos */}
                <div className="flex-1 w-full flex items-center justify-between">
                    <div className="flex flex-col items-center gap-3 w-24 text-center">
                        <TeamLogo url={m.home_logo} name={m.home_team} />
                        <span className="text-xs font-bold text-white leading-tight">{m.home_team}</span>
                    </div>

                    <div className="flex flex-col items-center px-2">
                        <span className="text-2xl font-black text-[#222] italic">VS</span>
                    </div>

                    <div className="flex flex-col items-center gap-3 w-24 text-center">
                        <TeamLogo url={m.away_logo} name={m.away_team} />
                        <span className="text-xs font-bold text-white leading-tight">{m.away_team}</span>
                    </div>
                </div>

                {/* Botón Acción */}
                <div className="w-full md:w-auto">
                    {!generatedPrompts[m.id] ? (
                        <button onClick={() => generarPrompt(m)} disabled={analyzingId === m.id} className="w-full md:w-40 py-3 bg-[#181818] hover:bg-[#222] border border-white/10 rounded-xl text-[10px] font-bold text-white flex items-center justify-center gap-2 transition-all group-hover:border-indigo-500/40 group-hover:text-indigo-300">
                            {analyzingId === m.id ? <RefreshCw className="animate-spin" size={14}/> : <Cpu size={14}/>}
                            {analyzingId === m.id ? "COMPUTANDO..." : "EJECUTAR IA"}
                        </button>
                    ) : (
                        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-2 text-center">
                                <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-center gap-1">
                                    <Globe2 size={10}/> Prompt + Search
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => copiar(m.id, generatedPrompts[m.id])} className={`flex-1 px-4 py-2 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 transition-all ${copiedId === m.id ? 'bg-emerald-500 text-black' : 'bg-white text-black hover:bg-gray-200'}`}>
                                    {copiedId === m.id ? <Check size={12}/> : <Copy size={12}/>} {copiedId === m.id ? "LISTO" : "COPIAR"}
                                </button>
                                <a href="https://kimi.moonshot.cn/" target="_blank" className="w-10 flex items-center justify-center bg-[#181818] border border-white/10 rounded-lg hover:border-white/30 text-slate-400 hover:text-white transition-colors" title="Ir a Kimi">
                                    <Bot size={16}/>
                                </a>
                            </div>
                        </div>
                    )}
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
EOF

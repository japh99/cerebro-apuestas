import React, { useState } from 'react';
import { 
  Activity, RefreshCw, Zap, Search, Copy, Check, 
  Calendar, Globe, Wallet, BarChart2, 
  ChevronRight, DollarSign, Shield, MousePointerClick, AlertTriangle,
  Flame, History, Swords, TrendingUp, Layers, ListFilter
} from 'lucide-react';

const PYTHON_BACKEND_URL = "https://cerebro-apuestas.onrender.com"; 

// 🔑 TUS LLAVES (Odds API)
const ODDS_API_KEYS = [
  "734f30d0866696cf90d5029ac106cfba",
  "10fb6d9d7b3240906d0acea646068535",
  "a9ff72549c4910f1fa9659e175a35cc0"
];

// 🌍 LISTA MAESTRA ORGANIZADA (Basada en tu API)
const LEAGUES = [
  // --- 🏆 TORNEOS INTERNACIONALES ---
  { code: 'soccer_uefa_champs_league', name: '🇪🇺 UEFA Champions League', flag: '🏆' },
  { code: 'soccer_conmebol_copa_libertadores', name: '🌎 Copa Libertadores', flag: '🏆' },
  { code: 'soccer_conmebol_copa_sudamericana', name: '🌎 Copa Sudamericana', flag: '🏆' },

  // --- 🇬🇧 INGLATERRA ---
  { code: 'soccer_epl', name: 'Premier League', flag: '🇬🇧' },
  { code: 'soccer_efl_champ', name: 'Championship (2ª)', flag: '🇬🇧' },
  { code: 'soccer_england_efl_cup', name: 'EFL Cup (Carabao)', flag: '🇬🇧' },

  // --- 🇪🇸 ESPAÑA ---
  { code: 'soccer_spain_la_liga', name: 'La Liga', flag: '🇪🇸' },
  { code: 'soccer_spain_segunda_division', name: 'La Liga 2', flag: '🇪🇸' },

  // --- 🇮🇹 ITALIA ---
  { code: 'soccer_italy_serie_a', name: 'Serie A', flag: '🇮🇹' },
  { code: 'soccer_italy_serie_b', name: 'Serie B', flag: '🇮🇹' },

  // --- 🇩🇪 ALEMANIA ---
  { code: 'soccer_germany_bundesliga', name: 'Bundesliga', flag: '🇩🇪' },
  { code: 'soccer_germany_bundesliga2', name: '2. Bundesliga', flag: '🇩🇪' },

  // --- 🇫🇷 FRANCIA ---
  { code: 'soccer_france_ligue_one', name: 'Ligue 1', flag: '🇫🇷' },
  { code: 'soccer_france_ligue_two', name: 'Ligue 2', flag: '🇫🇷' },

  // --- 🌎 AMÉRICA ---
  { code: 'soccer_brazil_campeonato', name: 'Brasileirão Serie A', flag: '🇧🇷' },
  { code: 'soccer_argentina_primera_division', name: 'Liga Profesional Arg', flag: '🇦🇷' },
  { code: 'soccer_mexico_ligamx', name: 'Liga MX', flag: '🇲🇽' },
  { code: 'soccer_usa_mls', name: 'MLS', flag: '🇺🇸' },
  { code: 'soccer_chile_campeonato', name: 'Primera División Chile', flag: '🇨🇱' },

  // --- 🇪🇺 OTRAS EUROPEAS ---
  { code: 'soccer_portugal_primeira_liga', name: 'Primeira Liga', flag: '🇵🇹' },
  { code: 'soccer_netherlands_eredivisie', name: 'Eredivisie', flag: '🇳🇱' },
  { code: 'soccer_turkey_super_league', name: 'Süper Lig', flag: '🇹🇷' }
];

const getRandomKey = () => {
    if (!ODDS_API_KEYS || ODDS_API_KEYS.length === 0) return null;
    return ODDS_API_KEYS[Math.floor(Math.random() * ODDS_API_KEYS.length)];
};

function App() {
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState("SISTEMA ONLINE");
  const [analyzingId, setAnalyzingId] = useState(null);
  const [generatedPrompts, setGeneratedPrompts] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [manualOdds, setManualOdds] = useState({});
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); 
  const [selectedLeague, setSelectedLeague] = useState('soccer_epl');
  const [bankroll, setBankroll] = useState("50000");

  // Manejar cambio de inputs manuales
  const handleManualOddChange = (matchId, type, value) => {
    setManualOdds(prev => ({
        ...prev,
        [matchId]: {
            ...prev[matchId],
            [type]: value
        }
    }));
  };

  const escanear = async () => {
    setMatches([]); setGeneratedPrompts({}); setManualOdds({});
    setStatus("BUSCANDO MERCADOS...");
    try {
      const apiKey = getRandomKey();
      if (!apiKey) throw new Error("Faltan Keys");

      // 1. Odds API - Pedimos spreads (Handicap) y h2h
      let url = `https://api.the-odds-api.com/v4/sports/${selectedLeague}/odds/?apiKey=${apiKey}&regions=eu&markets=h2h,totals,btts,spreads&oddsFormat=decimal`;
      let res = await fetch(url);
      let rawData = await res.json();

      // Fallback si falla la petición compleja
      if (!res.ok || rawData.message || !Array.isArray(rawData)) {
        console.warn("Reintentando modo simple...");
        url = `https://api.the-odds-api.com/v4/sports/${selectedLeague}/odds/?apiKey=${apiKey}&regions=eu&markets=h2h,totals&oddsFormat=decimal`;
        res = await fetch(url);
        rawData = await res.json();
      }

      if (rawData.message) throw new Error(rawData.message);
      if (!Array.isArray(rawData)) throw new Error("Error API Odds");

      const valid = rawData.filter((m: any) => {
          const mDate = new Date(m.commence_time);
          const start = new Date(selectedDate);
          const end = new Date(selectedDate);
          end.setDate(end.getDate() + 3); // Ventana de 3 días
          return mDate >= start && mDate <= end;
      }).slice(0, 15);

      if (valid.length === 0) {
        setStatus("SIN CUOTAS PARA ESTA FECHA.");
        return;
      }

      // Sincronizar con Python (Solo ELO, ya no stats de api-football)
      setStatus(`SINCRONIZANDO ELO...`);
      await fetch(`${PYTHON_BACKEND_URL}/sincronizar-cache`, {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ partidos: valid })
      });
      
      setMatches(valid);
      setStatus(`✅ ${valid.length} EVENTOS ENCONTRADOS`);

    } catch (e: any) {
      setStatus(`❌ ERROR: ${e.message}`);
    }
  };

  const generarPrompt = async (match: any) => {
    setAnalyzingId(match.id);
    try {
      let oddHome = 2.0, oddDraw = 3.0, oddAway = 2.0; 
      let spreadList: string[] = [];
      let over25 = "ND", under25 = "ND";

      // 1. Obtener Cuotas Base (1X2 y Totales)
      match.bookmakers.forEach((bookie: any) => {
          // 1X2
          const h2h = bookie.markets.find((m: any) => m.key === 'h2h');
          if (h2h) {
             const h = h2h.outcomes.find((o: any) => o.name === match.home_team)?.price;
             const a = h2h.outcomes.find((o: any) => o.name === match.away_team)?.price;
             const d = h2h.outcomes.find((o: any) => o.name === 'Draw')?.price;
             if (h) oddHome = h;
             if (a) oddAway = a;
             if (d) oddDraw = d;
          }
          // Goles
          const totals = bookie.markets.find((m: any) => m.key === 'totals');
          if (totals && over25 === "ND") {
              over25 = totals.outcomes.find((o: any) => o.name === 'Over' && o.point === 2.5)?.price || "ND";
              under25 = totals.outcomes.find((o: any) => o.name === 'Under' && o.point === 2.5)?.price || "ND";
          }
          // Spreads (Hándicap)
          const spreads = bookie.markets.find((m: any) => m.key === 'spreads');
          if (spreads) {
              spreads.outcomes.forEach((outcome: any) => {
                  const line = outcome.point;
                  const price = outcome.price;
                  const team = outcome.name === match.home_team ? "Local" : "Visita";
                  const formattedLine = `${team} [${line > 0 ? '+' : ''}${line}] @${price}`;
                  
                  if (!spreadList.includes(formattedLine) && price > 1.5 && price < 2.5) {
                      spreadList.push(formattedLine);
                  }
              });
          }
      });
      
      const finalSpreadText = spreadList.slice(0, 8).join("\n- ");
      
      // Cuotas Manuales BTTS
      const manualYes = manualOdds[match.id]?.bttsYes || "ND";
      const manualNo = manualOdds[match.id]?.bttsNo || "ND";

      // 2. CÁLCULO ELO (Backend)
      const res = await fetch(`${PYTHON_BACKEND_URL}/analizar_handicap`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ home_team: match.home_team, away_team: match.away_team, odd_home: oddHome, odd_away: oddAway })
      });
      const data = await res.json();
      
      // 3. PROMPT MAESTRO
      const prompt = `## 🎯 ROL: EXPERTO EN HÁNDICAP ASIÁTICO (BetSmart AI)

### 1. DATOS FINANCIEROS
- **Bankroll:** $${bankroll}
- **Stake 1/10:** $${(parseInt(bankroll)/70).toFixed(0)}

### 2. EL PARTIDO
- **Evento:** ${match.home_team} vs ${match.away_team}
- **Torneo:** ${LEAGUES.find(l => l.code === selectedLeague)?.name}
- **Fecha:** ${new Date(match.commence_time).toLocaleString()}

### 3. MERCADO (ODDS)
- **1X2:** 1[@${oddHome}] | X[@${oddDraw}] | 2[@${oddAway}]
- **Goles (2.5):** Over[@${over25}] | Under[@${under25}]
- **BTTS (Manual/API):** Sí[@${manualYes}] | No[@${manualNo}]

### 4. 📉 MENÚ DE HÁNDICAPS DISPONIBLES
Elige la línea con mayor valor matemático:
- ${finalSpreadText || "⚠️ No hay líneas asiáticas en la API. Usa DNB (Hándicap 0) o Europeo."}

### 5. 🧠 ANÁLISIS MATEMÁTICO (ELO)
- **Fuerza Local:** ${data.elo.home} pts.
- **Fuerza Visita:** ${data.elo.away} pts.
- **Fuente:** ${data.elo.source}
- **VENTAJA ESPERADA:** La matemática dice que el favorito debería ganar por **${Math.abs(data.math_prediction.expected_goal_diff)} goles**.

---

### 🕵️‍♂️ TU MISIÓN TÁCTICA (BUSCA EN INTERNET):

1.  **COMPARACIÓN:**
    - Mi modelo dice ventaja de **${data.math_prediction.expected_goal_diff}** goles.
    - Mira el "MENÚ DE HÁNDICAPS". ¿Hay alguna línea mal puesta?

2.  **INVESTIGACIÓN OBLIGATORIA:**
    - **H2H (Cara a Cara):** Últimos 5 partidos.
    - **Lesiones:** Bajas confirmadas hoy.
    - **Contexto:** ¿Es copa? ¿Juegan suplentes? ¿Hay altura (LatAm)?

3.  **VEREDICTO FINAL:**
    - **Mejor Línea:** (Elige una de la lista o sugiere DNB).
    - **Stake:** (1-5).
    - **Monto:** ($ Pesos).`;

      setGeneratedPrompts(prev => ({...prev, [match.id]: prompt}));

    } catch (e) {
      alert("Error analizando");
    } finally {
      setAnalyzingId(null);
    }
  };

  const copiar = (id: any, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const TeamLogo = ({ url, name }: any) => {
    if (url) {
        return <img src={url} alt={name} className="w-10 h-10 object-contain drop-shadow-md" onError={(e) => e.currentTarget.style.display = 'none'} />;
    }
    return (
        <div className="w-10 h-10 rounded-full bg-[#222] border border-white/10 flex items-center justify-center text-xs font-bold text-gray-500">
            {name ? name.substring(0, 2).toUpperCase() : "??"}
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 font-mono p-4">
      <div className="max-w-2xl mx-auto">
        <div className="border-b border-white/20 pb-4 mb-6 flex justify-between items-center">
            <h1 className="text-xl font-bold text-emerald-500 tracking-widest">CAPITAL<span className="text-white">SHIELD</span></h1>
            <span className="text-[10px] text-gray-500">v24 GLOBAL</span>
        </div>

        <div className="bg-[#111] p-4 border border-white/10 rounded-lg mb-6">
            <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                    <label className="text-[10px] text-gray-500 block mb-1">CAPITAL</label>
                    <input type="number" value={bankroll} onChange={(e) => setBankroll(e.target.value)} className="w-full bg-black border border-white/20 p-2 text-sm text-white"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">FECHA INICIO</label>
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-black border border-white/20 p-2 text-sm text-white"/>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">LIGA</label>
                        <select value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)} className="w-full bg-black border border-white/20 p-2 text-sm text-white">
                            {LEAGUES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            <button onClick={escanear} className="w-full bg-white text-black font-bold py-3 rounded hover:bg-gray-200 transition">
                {status.includes("...") ? <RefreshCw className="animate-spin inline mr-2"/> : <Search className="inline mr-2"/>}
                {status}
            </button>
        </div>

        <div className="space-y-4">
            {matches.map((m: any) => (
                <div key={m.id} className="bg-[#0a0a0a] border border-white/10 p-4 rounded-lg hover:border-emerald-500/50 transition">
                    <div className="flex justify-between items-center text-sm font-bold text-white mb-1">
                        <span className="flex-1">{m.home_team}</span>
                        <span className="px-2 text-gray-600 text-xs">vs</span>
                        <span className="flex-1 text-right">{m.away_team}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mb-4 flex items-center gap-2">
                         <span>{new Date(m.commence_time).toLocaleString()}</span>
                         <span className="bg-emerald-900/30 text-emerald-400 px-2 rounded flex items-center gap-1"><ListFilter size={10}/> HANDICAP + ODDS</span>
                    </div>
                    
                    {/* INPUTS MANUALES BTTS */}
                    <div className="flex gap-2 mb-4 justify-center">
                        <input 
                            type="number" 
                            placeholder="BTTS SÍ" 
                            onChange={(e) => handleManualOddChange(m.id, 'bttsYes', e.target.value)}
                            className="w-20 bg-[#111] border border-white/10 rounded p-1 text-[10px] text-center text-white"
                        />
                        <input 
                            type="number" 
                            placeholder="BTTS NO" 
                            onChange={(e) => handleManualOddChange(m.id, 'bttsNo', e.target.value)}
                            className="w-20 bg-[#111] border border-white/10 rounded p-1 text-[10px] text-center text-white"
                        />
                    </div>

                    {!generatedPrompts[m.id] ? (
                        <button onClick={() => generarPrompt(m)} className="w-full border border-dashed border-white/20 py-2 text-xs text-emerald-400 hover:bg-emerald-900/10 transition">
                            {analyzingId === m.id ? "CALCULANDO..." : "ANALIZAR MERCADO"}
                        </button>
                    ) : (
                        <button onClick={() => copiar(m.id, generatedPrompts[m.id])} className={`w-full py-2 text-xs font-bold ${copiedId === m.id ? 'bg-emerald-600 text-white' : 'bg-white text-black'}`}>
                            {copiedId === m.id ? "COPIADO" : "COPIAR ANÁLISIS"}
                        </button>
                    )}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default App;

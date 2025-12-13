cat << 'EOF' > src/App.tsx
import React, { useState } from 'react';
import { 
  Activity, RefreshCw, Zap, Search, Copy, Check, 
  Calendar, Globe, Wallet, BarChart2, 
  ChevronRight, DollarSign, Shield, MousePointerClick, AlertTriangle,
  History, Swords
} from 'lucide-react';

const PYTHON_BACKEND_URL = "https://cerebro-apuestas.onrender.com"; 
// 🔑 TUS LLAVES
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
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); 
  const [selectedLeague, setSelectedLeague] = useState('soccer_epl');
  const [bankroll, setBankroll] = useState("50000");

  const escanear = async () => {
    setMatches([]); setGeneratedPrompts({});
    setStatus("BUSCANDO EVENTOS...");
    try {
      const apiKey = getRandomKey();
      if (!apiKey) throw new Error("Faltan Keys");

      let url = `https://api.the-odds-api.com/v4/sports/${selectedLeague}/odds/?apiKey=${apiKey}&regions=eu&markets=h2h,totals,btts&oddsFormat=decimal`;
      let res = await fetch(url);
      let rawData = await res.json();

      if (!res.ok || rawData.message || !Array.isArray(rawData)) {
        url = `https://api.the-odds-api.com/v4/sports/${selectedLeague}/odds/?apiKey=${apiKey}&regions=eu&markets=h2h,totals&oddsFormat=decimal`;
        res = await fetch(url);
        rawData = await res.json();
      }

      if (rawData.message) throw new Error(rawData.message);
      if (!Array.isArray(rawData)) throw new Error("Error API Odds");

      const valid = rawData.filter(m => m.commence_time.startsWith(selectedDate)).slice(0, 10);
      
      if (valid.length === 0) {
        setStatus("MERCADO CERRADO HOY.");
        return;
      }

      setStatus(`PROCESANDO IMÁGENES...`);
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
      setStatus(`✅ LISTO: ${valid.length} EVENTOS`);

    } catch (e) {
      setStatus(`❌ ERROR: ${e.message}`);
    }
  };

  const generarPrompt = async (match) => {
    setAnalyzingId(match.id);
    try {
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
      
      // === PROMPT MAESTRO v15 (CON H2H IA) ===
      const prompt = `## 🕵️‍♂️ ROL: ANALISTA DEPORTIVO (BetSmart AI)

### 1. 🏦 GESTIÓN DE CAPITAL
- **Bankroll:** $${bankroll} COP
- **Stake 1/10:** $${(parseInt(bankroll)/70).toFixed(0)} COP

### 2. 📋 EVENTO
- **Partido:** ${match.home_team} vs ${match.away_team}
- **Liga:** ${LEAGUES.find(l => l.code === selectedLeague)?.name}

### 3. 📊 MERCADO (ODDS)
- **1X2:** 1[@${oddHome}] | X[@${oddDraw}] | 2[@${oddAway}]
- **Goles:** Over[@${over25}] | Under[@${under25}]
- **BTTS:** Sí[@${bttsYes}] | No[@${bttsNo}]

### 4. 🩻 RADIOGRAFÍA TÉCNICA (Backend)
**🏠 LOCAL (${match.home_team}):**
- **🔥 MOMENTUM:** [ ${data.stats.home.form} ] (Últimos 5)
- **Calidad (xG):** Ataque ${data.stats.home.xg_for} | Defensa ${data.stats.home.xg_against}
- **Volumen:** ${data.stats.home.shots} tiros/p.

**✈️ VISITA (${match.away_team}):**
- **🔥 MOMENTUM:** [ ${data.stats.away.form} ] (Últimos 5)
- **Calidad (xG):** Ataque ${data.stats.away.xg_for} | Defensa ${data.stats.away.xg_against}
- **Volumen:** ${data.stats.away.shots} tiros/p.

### 5. 🧠 CEREBRO MATEMÁTICO (.joblib)
- **ELO:** ${data.elo.home} vs ${data.elo.away} (Dif: ${data.elo.home - data.elo.away})
- **PROBABILIDAD IA:** BTTS: ${data.model_result.btts_prob}% | Over 2.5: ${data.model_result.over_prob}%

---

### 🎯 TUS INSTRUCCIONES DE EJECUCIÓN (Browsing Mode):

1.  🚨 **INVESTIGACIÓN H2H (HISTORIAL):**
    Busca en internet los últimos 5 enfrentamientos directos entre ${match.home_team} y ${match.away_team}. ¿Hay una "Paternidad" clara o tendencia de goles (Over/BTTS) entre ellos?

2.  **INVESTIGACIÓN DE NOTICIAS:**
    Busca lesiones de titulares confirmadas HOY.

3.  **CÁLCULO DE VALOR FINAL:**
    Si faltan cuotas en la sección 3 ("ND"), búscalas.
    Cruza: **(Matemática + Forma Reciente + H2H Histórico + Noticias)**.

4.  **VEREDICTO:**
    Dame la APUESTA, el STAKE y el MONTO ($).`;

      setGeneratedPrompts(prev => ({...prev, [match.id]: prompt}));

    } catch (e) {
      alert("Error");
    } finally {
      setAnalyzingId(null);
    }
  };

  const copiar = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const TeamLogo = ({ url, name }) => {
    if (url) {
        return <img src={url} alt={name} className="w-10 h-10 object-contain drop-shadow-md" onError={(e) => e.currentTarget.style.display = 'none'} />;
    }
    return (
        <div className="w-10 h-10 rounded-full bg-[#222] border border-white/10 flex items-center justify-center text-xs font-bold text-gray-500">
            {name.substring(0, 2).toUpperCase()}
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans pb-32">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        
        <div className="flex justify-between items-end mb-10 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Activity className="text-emerald-500" size={28}/>
                BetSmart <span className="text-emerald-500">VISUAL</span>
            </h1>
            <p className="text-xs text-slate-500 font-bold tracking-widest uppercase pl-1 mt-1">Next Gen Sports Terminal</p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] rounded-xl border border-white/10 p-5 mb-8 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Capital</label>
                    <input type="number" value={bankroll} onChange={(e) => setBankroll(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50 transition-colors"/>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Fecha</label>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500/50 transition-colors"/>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Mercado</label>
                    <div className="relative">
                        <select value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none appearance-none cursor-pointer">
                            {LEAGUES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
                        </select>
                        <ChevronRight size={12} className="absolute right-3 top-3 text-slate-600 rotate-90 pointer-events-none"/>
                    </div>
                </div>
            </div>
            <button onClick={escanear} className="w-full bg-white hover:bg-gray-200 text-black py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all">
                {status.includes("...") ? <RefreshCw className="animate-spin" size={18}/> : <Search size={18}/>}
                {status}
            </button>
        </div>

        <div className="grid gap-5">
          {matches.map(m => (
            <div key={m.id} className="group bg-[#0a0a0a] rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all shadow-lg relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex-1 w-full flex items-center justify-between">
                    <div className="flex flex-col items-center gap-2 w-24">
                        <TeamLogo url={m.home_logo} name={m.home_team} />
                        <span className="text-xs font-bold text-white text-center leading-tight">{m.home_team}</span>
                    </div>
                    <div className="flex flex-col items-center px-4">
                        <span className="text-[10px] font-bold text-slate-600 mb-1">VS</span>
                        <span className="text-[10px] font-mono text-emerald-500 bg-emerald-900/20 px-2 py-0.5 rounded">{m.commence_time.split('T')[1].slice(0,5)}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 w-24">
                        <TeamLogo url={m.away_logo} name={m.away_team} />
                        <span className="text-xs font-bold text-white text-center leading-tight">{m.away_team}</span>
                    </div>
                </div>
                <div className="w-full md:w-auto flex flex-col gap-2">
                    {!generatedPrompts[m.id] ? (
                        <button onClick={() => generarPrompt(m)} disabled={analyzingId === m.id} className="w-full md:w-32 py-2.5 bg-[#151515] hover:bg-[#222] border border-white/10 rounded-lg text-[10px] font-bold text-white flex items-center justify-center gap-2 transition-all group-hover:border-emerald-500/30 group-hover:text-emerald-400">
                            {analyzingId === m.id ? <RefreshCw className="animate-spin" size={12}/> : <Zap size={12}/>}
                            ANALIZAR
                        </button>
                    ) : (
                        <div className="flex gap-2 animate-in fade-in">
                            <button onClick={() => copiar(m.id, generatedPrompts[m.id])} className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 transition-all ${copiedId === m.id ? 'bg-emerald-500 text-black' : 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'}`}>
                                {copiedId === m.id ? <Check size={12}/> : <Copy size={12}/>} {copiedId === m.id ? "LISTO" : "COPIAR"}
                            </button>
                            <a href="https://chat.openai.com" target="_blank" className="w-10 flex items-center justify-center bg-[#151515] border border-white/10 rounded-lg hover:border-white/30 text-slate-400 hover:text-white transition-colors">
                                <MousePointerClick size={14}/>
                            </a>
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

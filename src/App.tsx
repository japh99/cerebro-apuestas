import React, { useState } from 'react';
import { 
  Activity, RefreshCw, Zap, Search, Copy, Check, 
  Calendar, Globe, Wallet, TrendingUp, BarChart2, 
  ChevronRight, DollarSign, Shield, MousePointerClick
} from 'lucide-react';

// === CONFIGURACIÓN ===
const PYTHON_BACKEND_URL = "https://cerebro-apuestas.onrender.com"; 
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
  const [status, setStatus] = useState("Sistema Listo");
  const [analyzingId, setAnalyzingId] = useState(null);
  const [generatedPrompts, setGeneratedPrompts] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); 
  const [selectedLeague, setSelectedLeague] = useState('soccer_epl');
  const [bankroll, setBankroll] = useState("50000");

  const escanear = async () => {
    setMatches([]); setGeneratedPrompts({});
    setStatus("Analizando...");
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
      if (!Array.isArray(rawData)) throw new Error("Error API");

      const valid = rawData.filter(m => m.commence_time.startsWith(selectedDate)).slice(0, 10);
      
      if (valid.length === 0) {
        setStatus("Sin partidos.");
        return;
      }

      await fetch(`${PYTHON_BACKEND_URL}/sincronizar-cache`, {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ partidos: valid })
      });
      
      setMatches(valid);
      setStatus(`Resultados: ${valid.length}`);

    } catch (e) {
      setStatus(`Error: ${e.message}`);
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
      
      const prompt = `Actúa como Analista BetSmart.
CAPITAL: $${bankroll} (Stake 1/10: $${(parseInt(bankroll)/10).toFixed(0)})
PARTIDO: ${match.home_team} vs ${match.away_team} (${LEAGUES.find(l => l.code === selectedLeague)?.name})
MERCADO: 1[${oddHome}] X[${oddDraw}] 2[${oddAway}] | Over[${over25}] | BTTS[${bttsYes}]
ELO: ${data.elo.home} vs ${data.elo.away}
STATS (5p): Local ${data.stats.home.shots} tiros, Visita ${data.stats.away.shots}.
MODELO: BTTS ${data.model_result.btts_prob}% | Over ${data.model_result.over_prob}%
VEREDICTO: Compara modelo vs mercado. Busca noticias. Dame la mejor apuesta y monto.`;

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

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans pb-32 relative">
      
      {/* BACKGROUND GRID (REJILLA ESTILO IMAGEN) */}
      <div className="fixed inset-0 pointer-events-none" 
           style={{
             backgroundImage: 'linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)',
             backgroundSize: '40px 40px',
             opacity: 0.3
           }}>
      </div>
      <div className="fixed inset-0 bg-gradient-to-b from-transparent to-[#050505] pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto p-6">
        
        {/* HEADER ESTILO TARJETA FLOTANTE */}
        <div className="flex justify-between items-center mb-8 bg-[#111] border border-white/5 p-4 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Activity className="text-black" size={24} strokeWidth={2.5}/>
            </div>
            <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight leading-none">BetSmart<span className="text-emerald-500">AI</span></h1>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Professional Prediction</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-full border border-white/5">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-bold text-gray-400">Modelos ML Activos</span>
          </div>
        </div>

        {/* TITULO SECCION */}
        <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                <Zap size={12}/> Próximos Eventos - IA Analysis
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">Calendario Inteligente</h2>
            <p className="text-sm text-gray-500 max-w-xl">
                Sistema híbrido que combina algoritmos <strong className="text-white">Random Forest</strong> con análisis semántico de noticias en tiempo real para maximizar la precisión en mercados O/U 2.5 y BTTS.
            </p>
        </div>

        {/* PANEL DE CONTROL */}
        <div className="bg-[#111] rounded-2xl border border-white/10 p-6 mb-10 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase mb-2 block">Bankroll</label>
                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-emerald-500/50 transition-colors">
                    <Wallet size={16} className="text-emerald-500"/>
                    <input type="number" value={bankroll} onChange={(e) => setBankroll(e.target.value)} className="bg-transparent w-full text-white font-mono text-sm outline-none placeholder-gray-700"/>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase mb-2 block">Fecha</label>
                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-indigo-500/50 transition-colors">
                    <Calendar size={16} className="text-indigo-500"/>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent w-full text-white font-sans text-sm outline-none"/>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase mb-2 block">Mercado</label>
                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 relative focus-within:border-purple-500/50 transition-colors">
                    <Globe size={16} className="text-purple-500"/>
                    <select value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)} className="bg-transparent w-full text-white text-sm outline-none appearance-none cursor-pointer">
                        {LEAGUES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                    <ChevronRight size={14} className="absolute right-4 text-gray-600 rotate-90 pointer-events-none"/>
                </div>
              </div>
            </div>
            <button onClick={escanear} className="w-full bg-white hover:bg-gray-200 text-black py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.99]">
              {status.includes("...") ? <RefreshCw className="animate-spin" size={18}/> : <Search size={18}/>}
              {status.toUpperCase()}
            </button>
        </div>

        {/* CARDS ESTILO IMAGEN */}
        <div className="grid gap-6">
          {matches.map(m => (
            <div key={m.id} className="group bg-[#111] rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all duration-300 shadow-lg relative overflow-hidden">
              
              {/* HEADER CARD */}
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <Trophy size={12} className="text-indigo-500"/> {LEAGUES.find(l => l.code === selectedLeague)?.name}
                </div>
                <div className="bg-[#1a1a1a] px-3 py-1 rounded-md border border-white/5 text-[10px] font-mono text-emerald-400 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {m.commence_time.split('T')[1].slice(0,5)}
                </div>
              </div>

              {/* TEAMS VS */}
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/5 flex items-center justify-center text-lg font-bold text-gray-500">
                        {m.home_team.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white leading-none">{m.home_team}</h3>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">HOME</p>
                    </div>
                </div>

                <div className="text-2xl font-black text-[#222] italic select-none">VS</div>

                <div className="flex items-center gap-4 flex-row-reverse text-right">
                    <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/5 flex items-center justify-center text-lg font-bold text-gray-500">
                        {m.away_team.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white leading-none">{m.away_team}</h3>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">AWAY</p>
                    </div>
                </div>
              </div>

              {/* BOTÓN ACCIÓN */}
              <div className="relative z-10">
                {!generatedPrompts[m.id] ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#151515] rounded-lg border border-white/5 p-3 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-500">O/U 2.5</span>
                            <span className="text-emerald-400 font-mono text-sm font-bold">--</span>
                        </div>
                        <button onClick={() => generarPrompt(m)} disabled={analyzingId === m.id} className="bg-[#151515] hover:bg-[#222] rounded-lg border border-white/5 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors">
                            {analyzingId === m.id ? <RefreshCw className="animate-spin" size={14}/> : <Zap size={14} className="text-emerald-500"/>}
                            {analyzingId === m.id ? "ANALIZANDO..." : "CALCULAR IA"}
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-[#151515] rounded-lg border border-white/5 p-3 flex justify-between items-center group-hover:border-emerald-500/20 transition-colors">
                                <span className="text-[10px] font-bold text-gray-500">ESTRATEGIA</span>
                                <span className="text-emerald-400 font-mono text-xs font-bold flex items-center gap-1"><Check size={10}/> LISTA</span>
                            </div>
                            <div className="bg-[#151515] rounded-lg border border-white/5 p-3 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-gray-500">MODELO</span>
                                <span className="text-indigo-400 font-mono text-xs font-bold">RANDOM FOREST</span>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <button onClick={() => copiar(m.id, generatedPrompts[m.id])} className={`flex-1 py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${copiedId === m.id ? 'bg-emerald-500 text-black' : 'bg-white text-black hover:bg-gray-200'}`}>
                                {copiedId === m.id ? <Check size={14}/> : <Copy size={14}/>}
                                {copiedId === m.id ? "COPIADO" : "COPIAR PROMPT"}
                            </button>
                            <a href="https://chat.openai.com" target="_blank" className="w-12 flex items-center justify-center bg-[#1a1a1a] border border-white/10 rounded-lg hover:border-white/30 transition-colors text-gray-400 hover:text-white" title="GPT">
                                <MousePointerClick size={16}/>
                            </a>
                        </div>
                    </div>
                )}
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;

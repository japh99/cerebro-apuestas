import React, { useState } from 'react';
import { Activity, RefreshCw, Zap, Search, Copy, Check, TrendingUp, AlertTriangle, Layers } from 'lucide-react';

const PYTHON_BACKEND_URL = "https://cerebro-apuestas.onrender.com"; 

// 🔑 PEGA TUS LLAVES AQUÍ
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
  { code: 'soccer_epl', name: 'Premier League' },
  { code: 'soccer_spain_la_liga', name: 'La Liga' },
  { code: 'soccer_uefa_champs_league', name: 'Champions League' },
  { code: 'soccer_germany_bundesliga', name: 'Bundesliga' },
  { code: 'soccer_italy_serie_a', name: 'Serie A' },
  { code: 'soccer_france_ligue_one', name: 'Ligue 1' }
];

const getRandomKey = () => ODDS_API_KEYS[Math.floor(Math.random() * ODDS_API_KEYS.length)];

function App() {
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState("SISTEMA HÁNDICAP LISTO");
  const [analyzingId, setAnalyzingId] = useState(null);
  const [generatedPrompts, setGeneratedPrompts] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  
  const [selectedLeague, setSelectedLeague] = useState('soccer_epl');
  const [bankroll, setBankroll] = useState("50000");

  const escanear = async () => {
    setMatches([]); setGeneratedPrompts({});
    setStatus("BUSCANDO LÍNEAS ASIÁTICAS...");
    try {
      const apiKey = getRandomKey();
      // Pedimos 'spreads' (Hándicap)
      const url = `https://api.the-odds-api.com/v4/sports/${selectedLeague}/odds/?apiKey=${apiKey}&regions=eu&markets=h2h,spreads&oddsFormat=decimal`;
      const res = await fetch(url);
      const data = await res.json();

      if (!Array.isArray(data)) throw new Error(data.message || "Error API");

      // Filtro para partidos cercanos (48h)
      const now = new Date();
      const valid = data.filter((m: any) => {
          const matchDate = new Date(m.commence_time);
          const diffHours = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          return diffHours > 0 && diffHours < 48; 
      }).slice(0, 10);

      setMatches(valid);
      setStatus(`✅ ${valid.length} PARTIDOS CON LÍNEAS`);

    } catch (e: any) {
      setStatus(`❌ ERROR: ${e.message}`);
    }
  };

  const generarPrompt = async (match: any) => {
    setAnalyzingId(match.id);
    try {
      // 1. EXTRAER MEJOR HÁNDICAP
      let spreadLine = "ND", spreadOdd = "ND", spreadTeam = "ND";
      let oddHome = 2.0, oddAway = 2.0; 

      // Cuotas base
      const h2h = match.bookmakers[0]?.markets.find((m: any) => m.key === 'h2h');
      if (h2h) {
          oddHome = h2h.outcomes.find((o: any) => o.name === match.home_team)?.price || 2.0;
          oddAway = h2h.outcomes.find((o: any) => o.name === match.away_team)?.price || 2.0;
      }

      // Buscar Spread Principal
      for (const bookie of match.bookmakers) {
          const spreads = bookie.markets.find((m: any) => m.key === 'spreads');
          if (spreads) {
              const outcome = spreads.outcomes[0]; 
              spreadTeam = outcome.name;
              spreadLine = outcome.point > 0 ? `+${outcome.point}` : `${outcome.point}`;
              spreadOdd = outcome.price;
              break; 
          }
      }

      // 2. CÁLCULO PYTHON
      const res = await fetch(`${PYTHON_BACKEND_URL}/analizar_handicap`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ home_team: match.home_team, away_team: match.away_team, odd_home: oddHome, odd_away: oddAway })
      });
      const data = await res.json();
      
      // 3. PROMPT TÁCTICO DETALLADO (Tu Lista de Chequeo)
      const prompt = `## 🎯 ROL: ESPECIALISTA EN HÁNDICAP ASIÁTICO (BetSmart AI)

### 1. DATOS FINANCIEROS
- **Bankroll:** $${bankroll}
- **Stake 1/10:** $${(parseInt(bankroll)/70).toFixed(0)}

### 2. EL PARTIDO
- **Evento:** ${match.home_team} vs ${match.away_team} (${LEAGUES.find(l => l.code === selectedLeague)?.name})
- **Línea de Mercado:** **${spreadTeam} [ ${spreadLine} ] @ ${spreadOdd}**

### 3. BASE MATEMÁTICA (ELO)
- Diferencia Real: **${data.elo.diff_real} puntos**.
- **Ventaja Esperada:** El Local debería ganar por **${data.math_prediction.expected_goal_diff} goles**.
${data.elo.is_estimated ? '(⚠️ ELO Estimado)' : '(✅ ELO Oficial ClubElo)'}

---

### 🕵️‍♂️ TU MISIÓN: ANÁLISIS CUALITATIVO PROFUNDO
Usa tu capacidad de búsqueda para responder estas preguntas ANTES de decidir:

#### A. SI ANALIZAMOS UN HÁNDICAP POSITIVO (Underdog):
1.  **Rendimiento reciente:** ¿Mantiene racha positiva o pierde por la mínima?
2.  **Defensa:** ¿Suele perder por poca diferencia? (Clave para +1.5 o +1).
3.  **H2H:** ¿Suele competir bien contra este rival?
4.  **Localía:** ¿El underdog juega en casa? (Más valor).

#### B. SI ANALIZAMOS UN HÁNDICAP NEGATIVO (Favorito):
1.  **Capacidad goleadora:** ¿Gana por goleada o por la mínima?
2.  **Motivación:** ¿Necesita diferencia de goles o va a rotar plantilla?
3.  **Eficacia:** ¿Su xG ofensivo es alto?

#### C. CONTEXTO GENERAL:
1.  **Bajas Sensibles:** ¿Falta el portero o goleador?
2.  **Dinámica:** ¿Cómo empiezan los partidos (rápido/lento)?
3.  **Condiciones:** ¿Clima o estado del campo?

### 🏆 VEREDICTO FINAL
Compara mi "Ventaja Matemática" (${data.math_prediction.expected_goal_diff}) con la "Línea del Mercado" (${spreadLine}).

- **¿Hay Valor?**
- **Recomendación:** (Hándicap / DNB / Pasar)
- **Stake:** (1-5)`;

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

  return (
    <div className="min-h-screen bg-black text-gray-200 font-mono p-4">
      <div className="max-w-2xl mx-auto">
        <div className="border-b border-white/20 pb-4 mb-6 flex justify-between items-center">
            <h1 className="text-xl font-bold text-emerald-500 tracking-widest">HANDICAP<span className="text-white">SNIPER</span></h1>
        </div>

        <div className="bg-[#111] p-4 border border-white/10 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="text-[10px] text-gray-500 block mb-1">CAPITAL</label>
                    <input type="number" value={bankroll} onChange={(e) => setBankroll(e.target.value)} className="w-full bg-black border border-white/20 p-2 text-sm text-white"/>
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 block mb-1">LIGA</label>
                    <select value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)} className="w-full bg-black border border-white/20 p-2 text-sm text-white">
                        {LEAGUES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
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
                    <div className="flex justify-between text-sm font-bold text-white mb-4">
                        <span>{m.home_team}</span>
                        <span className="text-gray-600">vs</span>
                        <span>{m.away_team}</span>
                    </div>
                    
                    {!generatedPrompts[m.id] ? (
                        <button onClick={() => generarPrompt(m)} className="w-full border border-dashed border-white/20 py-2 text-xs text-emerald-400 hover:bg-emerald-900/10 transition">
                            {analyzingId === m.id ? "CALCULANDO..." : "ANALIZAR SPREAD"}
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

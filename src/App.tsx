import React, { useState } from 'react';
import { 
  Activity, RefreshCw, Zap, Search, Copy, Check, 
  Calendar, Globe, Wallet, BarChart2, 
  ChevronRight, DollarSign, Shield, MousePointerClick, AlertTriangle
} from 'lucide-react';

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
  { code: 'soccer_epl', name: 'Premier League', flag: '🇬🇧' },
  { code: 'soccer_spain_la_liga', name: 'La Liga', flag: '🇪🇸' },
  { code: 'soccer_uefa_champs_league', name: 'Champions League', flag: '🏆' },
  { code: 'soccer_italy_serie_a', name: 'Serie A', flag: '🇮🇹' },
  { code: 'soccer_germany_bundesliga', name: 'Bundesliga', flag: '🇩🇪' },
  { code: 'basketball_nba', name: 'NBA', flag: '🏀' }, // Ejemplo otro deporte
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
    setStatus("ESCANEO DE MERCADOS...");
    try {
      const apiKey = getRandomKey();
      if (!apiKey || apiKey.includes("PEGA")) throw new Error("Faltan Keys");

      // AGREGAMOS 'spreads' A LA URL
      let url = `https://api.the-odds-api.com/v4/sports/${selectedLeague}/odds/?apiKey=${apiKey}&regions=eu&markets=h2h,totals,btts,spreads&oddsFormat=decimal`;
      
      let res = await fetch(url);
      let rawData = await res.json();

      if (!res.ok || rawData.message) throw new Error(rawData.message || "Error API");

      const valid = rawData.filter(m => m.commence_time.startsWith(selectedDate)).slice(0, 10);
      
      if (valid.length === 0) {
        setStatus("SIN EVENTOS PARA HOY.");
        return;
      }
      
      setMatches(valid);
      setStatus(`✅ ${valid.length} OPORTUNIDADES ENCONTRADAS`);

    } catch (e) {
      setStatus(`❌ ERROR: ${e.message}`);
    }
  };

  const generarPrompt = async (match) => {
    setAnalyzingId(match.id);
    try {
      let oddHome = 0, oddDraw = 0, oddAway = 0;
      let over25 = "ND", under25 = "ND", bttsYes = "ND";
      // Variables nuevas para Handicap
      let spreadHome = "ND", spreadHomeOdd = "ND";
      let spreadAway = "ND", spreadAwayOdd = "ND";

      for (const bookie of match.bookmakers) {
        // 1X2
        const h2h = bookie.markets.find(m => m.key === 'h2h');
        if (h2h && oddHome === 0) {
            oddHome = h2h.outcomes.find(o => o.name === match.home_team)?.price;
            oddAway = h2h.outcomes.find(o => o.name === match.away_team)?.price;
            oddDraw = h2h.outcomes.find(o => o.name === 'Draw')?.price;
        }
        // Totals
        const totals = bookie.markets.find(m => m.key === 'totals');
        if (totals && over25 === "ND") {
            over25 = totals.outcomes.find(o => o.name === 'Over' && o.point === 2.5)?.price || "ND";
            under25 = totals.outcomes.find(o => o.name === 'Under' && o.point === 2.5)?.price || "ND";
        }
        // BTTS
        const btts = bookie.markets.find(m => m.key === 'btts');
        if (btts && bttsYes === "ND") {
            bttsYes = btts.outcomes.find(o => o.name === 'Yes')?.price || "ND";
        }
        // SPREADS (HANDICAP)
        const spreads = bookie.markets.find(m => m.key === 'spreads');
        if (spreads && spreadHome === "ND") {
            const h = spreads.outcomes.find(o => o.name === match.home_team);
            const a = spreads.outcomes.find(o => o.name === match.away_team);
            if (h) { spreadHome = h.point; spreadHomeOdd = h.price; }
            if (a) { spreadAway = a.point; spreadAwayOdd = a.price; }
        }
      }

      // Backend Math
      const res = await fetch(`${PYTHON_BACKEND_URL}/analizar_completo`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          home_team: match.home_team,
          away_team: match.away_team,
          odd_home: oddHome || 2.0
        })
      });
      const data = await res.json();
      
      // PROMPT CON HÁNDICAP ASIÁTICO
      const prompt = `## 🕵️‍♂️ ROL: ANALISTA DEPORTIVO (BetSmart AI)

### 1. 🏦 GESTIÓN DE CAPITAL
- **Bankroll:** $${bankroll} COP
- **Stake 1/10:** $${(parseInt(bankroll)/70).toFixed(0)} COP

### 2. 📋 EVENTO
- **Partido:** ${match.home_team} vs ${match.away_team}
- **Liga:** ${LEAGUES.find(l => l.code === selectedLeague)?.name}

### 3. 📊 MERCADO DE HÁNDICAPS (SPREADS)
Aquí está la línea principal que ofrece el mercado hoy:
- **${match.home_team}:** Hándicap [ ${spreadHome} ] @ ${spreadHomeOdd}
- **${match.away_team}:** Hándicap [ ${spreadAway} ] @ ${spreadAwayOdd}
*(Ej: -1.5 significa que debe ganar por 2 goles o más)*

### 4. 📉 OTROS MERCADOS
- **1X2:** 1[@${oddHome}] | X[@${oddDraw}] | 2[@${oddAway}]
- **Goles (2.5):** Over[@${over25}] | Under[@${under25}]

### 5. 🧠 DATOS MATEMÁTICOS
- **ELO:** ${data.elo.home} vs ${data.elo.away} (Dif: ${data.elo.home - data.elo.away})
- **Stats:** Local ${data.stats.home.shots} tiros, Visita ${data.stats.away.shots} tiros.

### 🎯 TU MISIÓN:
1.  **ANÁLISIS DE SPREAD:** ¿Es capaz el favorito de cubrir el hándicap ${spreadHome > 0 ? spreadAway : spreadHome}?
2.  **VALOR:** Compara la dificultad del hándicap con la diferencia de ELO.
3.  **VEREDICTO:** ¿Apostamos al Hándicap, al Ganador directo o pasamos?`;

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
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans p-4">
      {/* (Mismo diseño de Header y Dashboard que tenías antes...) */}
      <div className="max-w-3xl mx-auto mt-10">
        {matches.map(m => (
            <div key={m.id} className="bg-[#111] p-4 rounded-xl border border-white/10 mb-4">
                <h3 className="text-white font-bold">{m.home_team} vs {m.away_team}</h3>
                <div className="mt-4">
                    {!generatedPrompts[m.id] ? (
                        <button onClick={() => generarPrompt(m)} className="w-full bg-emerald-600 text-white py-2 rounded">
                            ANALIZAR HÁNDICAP
                        </button>
                    ) : (
                        <button onClick={() => copiar(m.id, generatedPrompts[m.id])} className="w-full bg-white text-black py-2 rounded">
                            {copiedId === m.id ? "COPIADO" : "COPIAR ANÁLISIS"}
                        </button>
                    )}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}

export default App;

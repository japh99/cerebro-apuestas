import React, { useState } from 'react';
import { 
  Activity, RefreshCw, Zap, Search, Copy, Check, 
  Calendar, Globe, Wallet, BarChart2, 
  ChevronRight, DollarSign, Shield, MousePointerClick, AlertTriangle,
  Flame, History, Swords, TrendingUp, Layers, ListFilter, Pencil, Trophy
} from 'lucide-react';

const PYTHON_BACKEND_URL = "https://cerebro-apuestas.onrender.com"; 

// 🔑 TUS LLAVES (Odds API)
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

// 🌍 ORGANIZACIÓN POR GRUPOS
const LEAGUE_GROUPS = [
  {
    label: "🏆 INTERNACIONAL",
    leagues: [
      { code: 'soccer_uefa_champs_league', name: 'Champions League' },
      { code: 'soccer_uefa_europa_league', name: 'Europa League' },
      { code: 'soccer_uefa_europa_conference_league', name: 'Conference League' },
      { code: 'soccer_conmebol_copa_libertadores', name: 'Copa Libertadores' },
      { code: 'soccer_conmebol_copa_sudamericana', name: 'Copa Sudamericana' }
    ]
  },
  {
    label: "🇬🇧 INGLATERRA",
    leagues: [
      { code: 'soccer_epl', name: 'Premier League' },
      { code: 'soccer_efl_champ', name: 'Championship' },
      { code: 'soccer_england_efl_cup', name: 'EFL Cup' },
      { code: 'soccer_fa_cup', name: 'FA Cup' }
    ]
  },
  {
    label: "🇪🇸 ESPAÑA",
    leagues: [
      { code: 'soccer_spain_la_liga', name: 'La Liga' },
      { code: 'soccer_spain_segunda_division', name: 'La Liga 2' },
      { code: 'soccer_spain_copa_del_rey', name: 'Copa del Rey' }
    ]
  },
  {
    label: "🇮🇹 ITALIA",
    leagues: [
      { code: 'soccer_italy_serie_a', name: 'Serie A' },
      { code: 'soccer_italy_serie_b', name: 'Serie B' },
      { code: 'soccer_italy_coppa_italia', name: 'Coppa Italia' }
    ]
  },
  {
    label: "🇩🇪 ALEMANIA",
    leagues: [
      { code: 'soccer_germany_bundesliga', name: 'Bundesliga' },
      { code: 'soccer_germany_dfb_pokal', name: 'DFB Pokal' }
    ]
  },
  {
    label: "🇫🇷 FRANCIA",
    leagues: [
      { code: 'soccer_france_ligue_one', name: 'Ligue 1' }
    ]
  },
  {
    label: "🌎 AMÉRICA",
    leagues: [
      { code: 'soccer_brazil_campeonato', name: 'Brasileirão A' },
      { code: 'soccer_argentina_primera_division', name: 'Argentina Liga Pro' },
      { code: 'soccer_mexico_ligamx', name: 'Liga MX' },
      { code: 'soccer_usa_mls', name: 'MLS' },
      { code: 'soccer_chile_campeonato', name: 'Chile Primera' }
    ]
  },
  {
    label: "🇪🇺 OTRAS",
    leagues: [
      { code: 'soccer_portugal_primeira_liga', name: 'Portugal' },
      { code: 'soccer_netherlands_eredivisie', name: 'Holanda' },
      { code: 'soccer_turkey_super_league', name: 'Turquía' },
      { code: 'soccer_belgium_first_div', name: 'Bélgica' }
    ]
  }
];

const getRandomKey = () => {
    if (!ODDS_API_KEYS || ODDS_API_KEYS.length === 0) return null;
    return ODDS_API_KEYS[Math.floor(Math.random() * ODDS_API_KEYS.length)];
};

function App() {
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState("SISTEMA MANUAL LISTO");
  const [analyzingId, setAnalyzingId] = useState(null);
  const [generatedPrompts, setGeneratedPrompts] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [elos, setElos] = useState({});

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); 
  const [selectedLeague, setSelectedLeague] = useState('soccer_epl');
  const [bankroll, setBankroll] = useState("50000");

  // Obtener nombre bonito de la liga
  const getLeagueName = (code) => {
    for (const group of LEAGUE_GROUPS) {
      const found = group.leagues.find(l => l.code === code);
      if (found) return found.name;
    }
    return code;
  };

  const handleEloChange = (matchId, team, value) => {
    setElos(prev => ({
        ...prev,
        [matchId]: { ...prev[matchId], [team]: value }
    }));
  };

  const escanear = async () => {
    setMatches([]); setGeneratedPrompts({}); setElos({});
    setStatus("BUSCANDO HÁNDICAPS...");
    try {
      const apiKey = getRandomKey();
      if (!apiKey) throw new Error("Faltan Keys");

      const url = `https://api.the-odds-api.com/v4/sports/${selectedLeague}/odds/?apiKey=${apiKey}&regions=eu&markets=h2h,spreads&oddsFormat=decimal`;
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

      setMatches(valid);
      
      if (valid.length === 0) {
          setStatus("SIN CUOTAS.");
      } else {
          setStatus(`✅ ${valid.length} EVENTOS ENCONTRADOS`);
      }

    } catch (e: any) {
      setStatus(`❌ ERROR: ${e.message}`);
    }
  };

  const generarPrompt = async (match: any) => {
    const eloHome = elos[match.id]?.home;
    const eloAway = elos[match.id]?.away;

    if (!eloHome || !eloAway) {
        alert("⚠️ FALTA ELO: Ingresa los puntos ELO de ambos equipos para calcular la ventaja real.");
        return;
    }

    setAnalyzingId(match.id);
    try {
      let spreadList: string[] = [];
      let oddHome = "ND", oddAway = "ND", oddDraw = "ND";

      // 1. Obtener 1X2
      const h2h = match.bookmakers[0]?.markets.find((m: any) => m.key === 'h2h');
      if (h2h) {
          oddHome = h2h.outcomes.find((o: any) => o.name === match.home_team)?.price;
          oddAway = h2h.outcomes.find((o: any) => o.name === match.away_team)?.price;
          oddDraw = h2h.outcomes.find((o: any) => o.name === 'Draw')?.price;
      }

      // 2. Extraer Spreads
      match.bookmakers.forEach((bookie: any) => {
          const spreads = bookie.markets.find((m: any) => m.key === 'spreads');
          if (spreads) {
              spreads.outcomes.forEach((outcome: any) => {
                  const line = outcome.point;
                  const price = outcome.price;
                  const team = outcome.name === match.home_team ? "Local" : "Visita";
                  const formattedLine = `• ${team} [ ${line > 0 ? '+' : ''}${line} ] @ ${price} (${bookie.title})`;
                  
                  if (!spreadList.includes(formattedLine) && Math.abs(line) <= 3.5) {
                      spreadList.push(formattedLine);
                  }
              });
          }
      });
      
      const spreadsText = spreadList.length > 0 ? spreadList.join("\n") : "⚠️ No hay líneas asiáticas en la API. Usa DNB o Europeo.";

      // 3. Backend Matemático
      const res = await fetch(`${PYTHON_BACKEND_URL}/analizar_manual`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ elo_home: eloHome, elo_away: eloAway })
      });
      const data = await res.json();
      
      // 4. PROMPT MAESTRO DETALLADO (DEEP DIVE)
      const prompt = `## 🕵️‍♂️ ROL: AUDITOR DE RIESGOS DEPORTIVOS (BetSmart AI)

### 1. 🏦 GESTIÓN DE CAPITAL
- **Bankroll:** $${bankroll} COP
- **Stake 1.4%:** $${(parseInt(bankroll)/70).toFixed(0)} COP

### 2. 📋 EXPEDIENTE DEL PARTIDO
- **Evento:** ${match.home_team} vs ${match.away_team}
- **Liga:** ${getLeagueName(selectedLeague)}
- **Cuotas 1X2:** 1:${oddHome} | X:${oddDraw} | 2:${oddAway}

### 3. 🧠 LA VERDAD MATEMÁTICA (ELO REAL)
He ingresado manualmente el ELO real de ClubElo/Oficial:
- **ELO Local:** ${eloHome}
- **ELO Visita:** ${eloAway}
- **Diferencia Ajustada (Localía +100pts):** ${data.math.elo_diff_adjusted} puntos.
- **PROYECCIÓN ALGORÍTMICA:** El **${data.math.favorito}** tiene una superioridad teórica para ganar por un margen de **${Math.abs(data.math.expected_goals_diff)} goles**.

### 4. 📉 MENÚ DE OPORTUNIDADES (HÁNDICAPS)
Aquí están las líneas que ofrece el mercado. Tu trabajo es encontrar la "Línea Incorrecta":
${spreadsText}

---

### 🔎 TU PROTOCOLO DE INVESTIGACIÓN OBLIGATORIO (Deep Search):

Actúa como un detective. No asumas nada. Busca en Google/Bing y responde:

#### A. VALIDACIÓN DE MOTIVACIÓN & ESTADO (Crucial):
1.  **Calendario:** ¿Alguno jugó hace menos de 72 horas? ¿Tienen Champions la próxima semana? (Riesgo de rotación).
2.  **Enfermería:** Busca "Lesionados ${match.home_team} hoy" y "Alineación probable ${match.away_team}". ¿Falta el goleador o el cerebro del equipo?
3.  **La "Trampa" de la Copa:** Si es Copa, busca declaraciones del técnico. ¿Van con titulares o juveniles?

#### B. ANÁLISIS DE ESTILOS (Táctico):
- Si mi modelo sugiere goleada: ¿El favorito suele matar los partidos o gana 1-0 y se duerme?
- Si mi modelo sugiere igualdad: ¿El underdog es un equipo "rocoso" que empata mucho?
- **H2H:** ¿Cómo quedaron los últimos 3 partidos en este estadio?

#### C. CÁLCULO DE VALOR FINAL:
- Cruza mi **Proyección Matemática (${data.math.expected_goals_diff} goles)** con la realidad que investigaste.
- ¿La línea del mercado es generosa?

### 🏆 VEREDICTO DE INVERSIÓN:
- **Selección:** (Elige la línea específica del menú o DNB).
- **Stake (1-5):** (Ajusta según riesgo de lesiones/rotación).
- **Monto:** ($ Pesos).
- **Tesis de Inversión:** (Explica por qué la matemática y la realidad coinciden).`;

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
            <span className="text-[10px] text-gray-500">v30 DEEP-SEARCH</span>
        </div>

        {/* CONTROLES */}
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
                        <label className="text-[10px] text-gray-500 block mb-1">LIGA / COPA</label>
                        <select value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)} className="w-full bg-black border border-white/20 p-2 text-sm text-white cursor-pointer">
                            {LEAGUE_GROUPS.map((group, idx) => (
                                <optgroup key={idx} label={group.label}>
                                    {group.leagues.map(l => (
                                        <option key={l.code} value={l.code}>{l.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            <button onClick={escanear} className="w-full bg-white text-black font-bold py-3 rounded hover:bg-gray-200 transition">
                {status.includes("...") ? <RefreshCw className="animate-spin inline mr-2"/> : <Search className="inline mr-2"/>}
                {status}
            </button>
        </div>

        {/* LISTA DE PARTIDOS */}
        <div className="space-y-4">
            {matches.map((m: any) => (
                <div key={m.id} className="bg-[#0a0a0a] border border-white/10 p-5 rounded-lg hover:border-emerald-500/50 transition relative">
                    
                    <div className="flex justify-between items-center text-sm font-bold text-white mb-2">
                        <span className="flex-1">{m.home_team}</span>
                        <span className="px-2 text-gray-600 text-xs">vs</span>
                        <span className="flex-1 text-right">{m.away_team}</span>
                    </div>
                    
                    <div className="text-[10px] text-gray-500 mb-4 text-center">
                        {new Date(m.commence_time).toLocaleString()}
                    </div>
                    
                    {/* INPUTS DE ELO MANUAL */}
                    {!generatedPrompts[m.id] && (
                        <div className="flex gap-4 mb-4 mt-2 bg-[#111] p-3 rounded border border-white/5">
                            <div className="flex-1">
                                <label className="text-[9px] text-emerald-500 block mb-1 font-bold text-center">ELO LOCAL</label>
                                <input 
                                    type="number" 
                                    placeholder="Ej: 1950" 
                                    onChange={(e) => handleEloChange(m.id, 'home', e.target.value)}
                                    className="w-full bg-black border border-white/20 p-2 text-center text-white text-sm rounded focus:border-emerald-500 outline-none"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[9px] text-emerald-500 block mb-1 font-bold text-center">ELO VISITA</label>
                                <input 
                                    type="number" 
                                    placeholder="Ej: 1720" 
                                    onChange={(e) => handleEloChange(m.id, 'away', e.target.value)}
                                    className="w-full bg-black border border-white/20 p-2 text-center text-white text-sm rounded focus:border-emerald-500 outline-none"
                                />
                            </div>
                        </div>
                    )}
                    
                    {!generatedPrompts[m.id] ? (
                        <button onClick={() => generarPrompt(m)} className="w-full border border-dashed border-white/20 py-3 text-xs text-emerald-400 hover:bg-emerald-900/10 transition flex items-center justify-center gap-2">
                            <Pencil size={12}/> GENERAR ANÁLISIS
                        </button>
                    ) : (
                        <div className="animate-in fade-in">
                            <div className="mb-2 p-2 bg-emerald-900/20 rounded border border-emerald-500/20 text-center">
                                <p className="text-[10px] text-emerald-400 font-bold">PROMPT CREADO CON ÉXITO</p>
                            </div>
                            <button onClick={() => copiar(m.id, generatedPrompts[m.id])} className={`w-full py-3 text-xs font-bold rounded ${copiedId === m.id ? 'bg-emerald-600 text-white' : 'bg-white text-black'}`}>
                                {copiedId === m.id ? "COPIADO" : "COPIAR ANÁLISIS"}
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default App;

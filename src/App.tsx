import React, { useState } from 'react';
import { 
  Activity, RefreshCw, Zap, Search, Copy, Check, 
  Calendar, Globe, Wallet, BarChart2, 
  ChevronRight, DollarSign, Shield, MousePointerClick, AlertTriangle,
  Flame, History, Swords, TrendingUp, Layers, ListFilter, Pencil, MapPin
} from 'lucide-react';

const PYTHON_BACKEND_URL = "https://cerebro-apuestas.onrender.com"; 

// 🔑 TUS LLAVES (Odds API - Solo para traer la lista de partidos)
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

// 🌍 LISTA MAESTRA DE TORNEOS
const LEAGUES = [
  { code: 'soccer_uefa_champs_league', name: '🏆 Champions League' },
  { code: 'soccer_conmebol_copa_libertadores', name: '🌎 Copa Libertadores' },
  { code: 'soccer_epl', name: '🇬🇧 Premier League' },
  { code: 'soccer_spain_la_liga', name: '🇪🇸 La Liga' },
  { code: 'soccer_italy_serie_a', name: '🇮🇹 Serie A' },
  { code: 'soccer_germany_bundesliga', name: '🇩🇪 Bundesliga' },
  { code: 'soccer_usa_mls', name: '🇺🇸 MLS' },
  { code: 'soccer_brazil_campeonato', name: '🇧🇷 Brasileirão' },
  { code: 'soccer_argentina_primera_division', name: '🇦🇷 Liga Profesional' },
  { code: 'soccer_mexico_ligamx', name: '🇲🇽 Liga MX' },
  { code: 'soccer_england_efl_cup', name: '🇬🇧 EFL Cup' },
  { code: 'soccer_spain_copa_del_rey', name: '🇪🇸 Copa del Rey' }
];

const getRandomKey = () => ODDS_API_KEYS[Math.floor(Math.random() * ODDS_API_KEYS.length)];

function App() {
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState("SISTEMA MANUAL LISTO");
  const [analyzingId, setAnalyzingId] = useState(null);
  const [generatedPrompts, setGeneratedPrompts] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  
  // Estados de Configuración
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); 
  const [selectedLeague, setSelectedLeague] = useState('soccer_epl');
  const [bankroll, setBankroll] = useState("50000");
  
  // Estado: MODO REGIÓN (LatAm vs Europa)
  const [regionMode, setRegionMode] = useState('LATAM'); // 'LATAM' o 'EUROPA'

  // Estado: Datos Manuales (ELOs + Cuotas)
  const [manualData, setManualData] = useState({});

  // Manejar cambios en inputs manuales
  const handleManualInput = (matchId, field, value) => {
    setManualData(prev => ({
        ...prev,
        [matchId]: {
            ...prev[matchId],
            [field]: value
        }
    }));
  };

  const escanear = async () => {
    setMatches([]); setGeneratedPrompts({}); setManualData({});
    setStatus("BUSCANDO PARTIDOS...");
    try {
      const apiKey = getRandomKey();
      // Solo pedimos H2H para tener la lista de partidos (los spreads los pones tú)
      const url = `https://api.the-odds-api.com/v4/sports/${selectedLeague}/odds/?apiKey=${apiKey}&regions=eu&markets=h2h&oddsFormat=decimal`;
      const res = await fetch(url);
      const data = await res.json();

      if (!Array.isArray(data)) throw new Error(data.message || "Error API");

      const valid = data.filter((m: any) => {
          const mDate = new Date(m.commence_time);
          const start = new Date(selectedDate);
          const end = new Date(selectedDate);
          end.setDate(end.getDate() + 3); 
          return mDate >= start && mDate <= end;
      }).slice(0, 15);

      setMatches(valid);
      
      if (valid.length === 0) {
          setStatus("SIN PARTIDOS.");
      } else {
          setStatus(`✅ ${valid.length} EVENTOS. INGRESA DATOS.`);
      }

    } catch (e: any) {
      setStatus(`❌ ERROR: ${e.message}`);
    }
  };

  const generarPrompt = async (match: any) => {
    const inputs = manualData[match.id] || {};
    
    // Validación
    if (!inputs.eloHome || !inputs.eloAway) {
        alert("⚠️ Faltan los ELOs para calcular la matemática.");
        return;
    }
    if (!inputs.optionA || !inputs.optionB) {
        alert("⚠️ Ingresa al menos una línea de Hándicap/Cuota que veas en tu casa de apuestas.");
        return;
    }

    setAnalyzingId(match.id);
    try {
      // 1. CÁLCULO MATEMÁTICO (Backend)
      const res = await fetch(`${PYTHON_BACKEND_URL}/analizar_manual`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ elo_home: inputs.eloHome, elo_away: inputs.eloAway })
      });
      const data = await res.json();
      
      // 2. CONTEXTO REGIONAL
      const regionContext = regionMode === 'LATAM' 
        ? "MODO LATAM: Prioriza líneas agresivas (1.5, 2.5) y valor en cuotas altas. Cuidado con la altura y viajes." 
        : "MODO EUROPA: Prioriza líneas ajustadas (0.75, 1.0, 1.25) y gestión de riesgo conservadora.";

      // 3. PROMPT MAESTRO MANUAL
      const prompt = `## 🎯 ROL: GESTOR DE INVERSIONES (BetSmart AI)

### 1. ⚙️ CONFIGURACIÓN DE ESCENARIO
- **Capital:** $${bankroll} COP
- **Stake Base:** $${(parseInt(bankroll)/70).toFixed(0)} COP
- **Enfoque de Mercado:** ${regionContext}

### 2. 📋 EL EVENTO
- **Partido:** ${match.home_team} vs ${match.away_team}
- **Liga:** ${LEAGUES.find(l => l.code === selectedLeague)?.name}
- **Fecha:** ${new Date(match.commence_time).toLocaleString()}

### 3. 🧠 LA VERDAD MATEMÁTICA (ELO REAL)
- **ELO Local:** ${inputs.eloHome} | **ELO Visita:** ${inputs.eloAway}
- **Diferencia Ajustada:** ${data.math.elo_diff_adjusted} puntos.
- **PROYECCIÓN:** El modelo matemático estima que el **${data.math.favorito}** tiene ventaja para ganar por un margen de **${Math.abs(data.math.expected_goals_diff)} goles**.

### 4. 📉 LÍNEAS DE MERCADO (INGRESADAS POR EL USUARIO)
Estas son las opciones reales que tengo en mi casa de apuestas ahora mismo:
- **OPCIÓN A:** ${inputs.optionA}
- **OPCIÓN B:** ${inputs.optionB}

---

### 🕵️‍♂️ TU MISIÓN TÁCTICA (BUSCAR EN INTERNET):

1.  **ANÁLISIS DE HÁNDICAP:**
    - Cruza mi **Proyección (${data.math.expected_goals_diff} goles)** con las OPCIONES A y B.
    - ¿Cuál línea tiene más probabilidad de cumplirse?

2.  **INVESTIGACIÓN OBLIGATORIA:**
    - **H2H:** Últimos 5 partidos.
    - **Lesiones:** Bajas confirmadas HOY.
    - **Factor Cancha:** (Si es LATAM, revisa si hay altura o clima extremo).

3.  **VEREDICTO FINAL:**
    - **Selección:** (Elige A o B, o sugiere DNB).
    - **Stake:** (1-5).
    - **Monto:** ($ Pesos).
    - **Razón:** (Matemática + Noticias).`;

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
    // Logo simple sin API externa para no complicar
    return (
        <div className="w-10 h-10 rounded-full bg-[#222] border border-white/10 flex items-center justify-center text-xs font-bold text-gray-500">
            {name.substring(0, 2).toUpperCase()}
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 font-mono p-4">
      <div className="max-w-2xl mx-auto">
        
        {/* HEADER & REGION SWITCH */}
        <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
            <div>
                <h1 className="text-xl font-bold text-emerald-500 tracking-widest">HANDICAP<span className="text-white">CONTROL</span></h1>
                <span className="text-[10px] text-gray-500">v29 MANUAL</span>
            </div>
            <div className="flex bg-[#111] rounded-lg p-1 border border-white/10">
                <button 
                    onClick={() => setRegionMode('LATAM')}
                    className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${regionMode === 'LATAM' ? 'bg-emerald-600 text-white' : 'text-gray-500'}`}
                >
                    🌎 LATAM
                </button>
                <button 
                    onClick={() => setRegionMode('EUROPA')}
                    className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${regionMode === 'EUROPA' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                >
                    🇪🇺 EUROPA
                </button>
            </div>
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
                        <label className="text-[10px] text-gray-500 block mb-1">LIGA</label>
                        <select value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)} className="w-full bg-black border border-white/20 p-2 text-sm text-white cursor-pointer">
                            {LEAGUES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
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
                    
                    {/* Header Partido */}
                    <div className="flex justify-between items-center text-sm font-bold text-white mb-2">
                        <span className="flex-1">{m.home_team}</span>
                        <span className="px-2 text-gray-600 text-xs">vs</span>
                        <span className="flex-1 text-right">{m.away_team}</span>
                    </div>
                    
                    <div className="text-[10px] text-gray-500 mb-4 text-center">
                        {new Date(m.commence_time).toLocaleString()}
                    </div>
                    
                    {!generatedPrompts[m.id] ? (
                        <div className="space-y-3">
                            {/* INPUTS ELO */}
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-[9px] text-emerald-500 block mb-1 font-bold text-center">ELO LOCAL</label>
                                    <input 
                                        type="number" placeholder="Ej: 1900" 
                                        onChange={(e) => handleManualInput(m.id, 'eloHome', e.target.value)}
                                        className="w-full bg-black border border-white/20 p-2 text-center text-white text-sm rounded focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[9px] text-emerald-500 block mb-1 font-bold text-center">ELO VISITA</label>
                                    <input 
                                        type="number" placeholder="Ej: 1700" 
                                        onChange={(e) => handleManualInput(m.id, 'eloAway', e.target.value)}
                                        className="w-full bg-black border border-white/20 p-2 text-center text-white text-sm rounded focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* INPUTS CUOTAS MANUALES */}
                            <div className="bg-[#111] p-3 rounded border border-white/5">
                                <label className="text-[9px] text-gray-500 block mb-2 font-bold uppercase">Ingresa las líneas que ves en tu Casa de Apuestas:</label>
                                <div className="space-y-2">
                                    <input 
                                        type="text" placeholder="Opción A (Ej: Local -1.5 @ 2.10)" 
                                        onChange={(e) => handleManualInput(m.id, 'optionA', e.target.value)}
                                        className="w-full bg-black border border-white/20 p-2 text-xs text-white rounded focus:border-indigo-500 outline-none"
                                    />
                                    <input 
                                        type="text" placeholder="Opción B (Ej: Visita +1.5 @ 1.75)" 
                                        onChange={(e) => handleManualInput(m.id, 'optionB', e.target.value)}
                                        className="w-full bg-black border border-white/20 p-2 text-xs text-white rounded focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <button onClick={() => generarPrompt(m)} className="w-full border border-dashed border-white/20 py-3 text-xs text-emerald-400 hover:bg-emerald-900/10 transition flex items-center justify-center gap-2 mt-2">
                                <Pencil size={12}/> PROCESAR ESTRATEGIA
                            </button>
                        </div>
                    ) : (
                        <div className="animate-in fade-in">
                            <div className="mb-2 p-2 bg-emerald-900/20 rounded border border-emerald-500/20 text-center">
                                <p className="text-[10px] text-emerald-400 font-bold">PROMPT CREADO (MODO {regionMode})</p>
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

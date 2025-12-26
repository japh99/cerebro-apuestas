import React, { useState } from 'react';
import { 
  Activity, RefreshCw, Zap, Search, Copy, Check, 
  Calendar, Globe, Wallet, BarChart2, 
  ChevronRight, DollarSign, Shield, MousePointerClick, AlertTriangle,
  Flame, History, Swords, TrendingUp, Layers, ListFilter, Pencil, MapPin,
  Plus, X, Trash2, ChevronDown, Trophy, Home
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

// 🌍 CONFIGURACIÓN MAESTRA DE DEPORTES Y LIGAS
const SPORTS_CONFIG = {
  soccer: {
    name: "FÚTBOL",
    icon: "⚽",
    color: "emerald",
    ratingName: "ELO",
    metric: "Goles",
    leagues: [
      // --- 🏆 INTERNACIONAL ---
      { code: 'soccer_uefa_champs_league', name: '🇪🇺 UEFA Champions League' },
      { code: 'soccer_uefa_europa_league', name: '🇪🇺 UEFA Europa League' },
      { code: 'soccer_uefa_europa_conference_league', name: '🇪🇺 Conference League' },
      { code: 'soccer_conmebol_copa_libertadores', name: '🌎 Copa Libertadores' },
      { code: 'soccer_conmebol_copa_sudamericana', name: '🌎 Copa Sudamericana' },

      // --- 🇬🇧 INGLATERRA ---
      { code: 'soccer_epl', name: '🇬🇧 Premier League' },
      { code: 'soccer_efl_champ', name: '🇬🇧 Championship (2ª)' },
      { code: 'soccer_england_league1', name: '🇬🇧 League One (3ª)' },
      { code: 'soccer_england_league2', name: '🇬🇧 League Two (4ª)' },
      { code: 'soccer_england_efl_cup', name: '🇬🇧 EFL Cup (Carabao)' },
      { code: 'soccer_fa_cup', name: '🇬🇧 FA Cup' },

      // --- 🇪🇸 ESPAÑA ---
      { code: 'soccer_spain_la_liga', name: '🇪🇸 La Liga' },
      { code: 'soccer_spain_segunda_division', name: '🇪🇸 La Liga 2' },
      { code: 'soccer_spain_copa_del_rey', name: '🇪🇸 Copa del Rey' },

      // --- 🇮🇹 ITALIA ---
      { code: 'soccer_italy_serie_a', name: '🇮🇹 Serie A' },
      { code: 'soccer_italy_serie_b', name: '🇮🇹 Serie B' },
      { code: 'soccer_italy_coppa_italia', name: '🇮🇹 Coppa Italia' },

      // --- 🇩🇪 ALEMANIA ---
      { code: 'soccer_germany_bundesliga', name: '🇩🇪 Bundesliga' },
      { code: 'soccer_germany_bundesliga2', name: '🇩🇪 2. Bundesliga' },
      { code: 'soccer_germany_dfb_pokal', name: '🇩🇪 DFB Pokal' },

      // --- 🇫🇷 FRANCIA ---
      { code: 'soccer_france_ligue_one', name: '🇫🇷 Ligue 1' },
      { code: 'soccer_france_ligue_two', name: '🇫🇷 Ligue 2' },
      { code: 'soccer_france_coupe_de_france', name: '🇫🇷 Coupe de France' },

      // --- 🌎 AMÉRICA ---
      { code: 'soccer_brazil_campeonato', name: '🇧🇷 Brasileirão A' },
      { code: 'soccer_brazil_serie_b', name: '🇧🇷 Brasileirão B' },
      { code: 'soccer_argentina_primera_division', name: '🇦🇷 Liga Profesional' },
      { code: 'soccer_mexico_ligamx', name: '🇲🇽 Liga MX' },
      { code: 'soccer_usa_mls', name: '🇺🇸 MLS' },
      { code: 'soccer_chile_campeonato', name: '🇨🇱 Primera Chile' },

      // --- 🇪🇺 RESTO EUROPA ---
      { code: 'soccer_portugal_primeira_liga', name: '🇵🇹 Primeira Liga' },
      { code: 'soccer_netherlands_eredivisie', name: '🇳🇱 Eredivisie' },
      { code: 'soccer_turkey_super_league', name: '🇹🇷 Süper Lig' },
      { code: 'soccer_belgium_first_div', name: '🇧🇪 Pro League' },
      { code: 'soccer_scotland_premiership', name: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Premiership' },
      { code: 'soccer_austria_bundesliga', name: '🇦🇹 Bundesliga' },
      { code: 'soccer_denmark_superliga', name: '🇩🇰 Superliga' },
      { code: 'soccer_norway_eliteserien', name: '🇳🇴 Eliteserien' },
      { code: 'soccer_sweden_allsvenskan', name: '🇸🇪 Allsvenskan' },
      { code: 'soccer_switzerland_superleague', name: '🇨🇭 Super League' },
      { code: 'soccer_greece_super_league', name: '🇬🇷 Super League' },

      // --- 🌏 ASIA ---
      { code: 'soccer_japan_j_league', name: '🇯🇵 J League' },
      { code: 'soccer_korea_kleague1', name: '🇰🇷 K League 1' },
      { code: 'soccer_china_superleague', name: '🇨🇳 Super League' }
    ]
  },
  nba: {
    name: "BALONCESTO",
    icon: "🏀",
    color: "orange",
    ratingName: "POWER RATING",
    metric: "Puntos",
    leagues: [
      { code: 'basketball_nba', name: '🇺🇸 NBA' },
      { code: 'basketball_euroleague', name: '🇪🇺 Euroliga' }
    ]
  },
  mlb: {
    name: "BÉISBOL",
    icon: "⚾",
    color: "blue",
    ratingName: "TEAM RATING",
    metric: "Carreras",
    leagues: [
      { code: 'baseball_mlb', name: '🇺🇸 MLB' },
      { code: 'baseball_npb', name: '🇯🇵 NPB (Japón)' }
    ]
  }
};

const getRandomKey = () => ODDS_API_KEYS[Math.floor(Math.random() * ODDS_API_KEYS.length)];

function App() {
  // --- NAVEGACIÓN ---
  const [currentSport, setCurrentSport] = useState(null); 
  
  // --- ESTADOS ---
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState("LISTO");
  const [analyzingId, setAnalyzingId] = useState(null);
  const [generatedPrompts, setGeneratedPrompts] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  
  const [ratings, setRatings] = useState({});
  const [manualLines, setManualLines] = useState({}); 

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); 
  const [selectedLeague, setSelectedLeague] = useState('');
  const [bankroll, setBankroll] = useState("50000");

  // Reset al cambiar deporte
  const selectSport = (sportKey) => {
    setCurrentSport(sportKey);
    setMatches([]);
    setGeneratedPrompts({});
    setRatings({});
    setManualLines({});
    setSelectedLeague(SPORTS_CONFIG[sportKey].leagues[0].code);
    setStatus(`MODO ${SPORTS_CONFIG[sportKey].name}`);
  };

  const handleRatingChange = (matchId, team, value) => {
    setRatings(prev => ({
        ...prev,
        [matchId]: { ...prev[matchId], [team]: value }
    }));
  };

  // Gestión de líneas dinámicas
  const handleAddLine = (matchId) => {
    setManualLines(prev => ({
        ...prev,
        [matchId]: [...(prev[matchId] || [{ team: 'HOME', line: '', odds: '' }]), { team: 'HOME', line: '', odds: '' }]
    }));
  };

  const handleLineDataChange = (matchId, index, field, value) => {
    const currentLines = manualLines[matchId] || [];
    const newLines = [...currentLines];
    if (!newLines[index]) newLines[index] = { team: 'HOME', line: '', odds: '' };
    newLines[index] = { ...newLines[index], [field]: value };
    setManualLines(prev => ({ ...prev, [matchId]: newLines }));
  };

  const handleRemoveLine = (matchId, index) => {
    const currentLines = manualLines[matchId] || [];
    if (currentLines.length <= 1) return;
    const newLines = currentLines.filter((_, i) => i !== index);
    setManualLines(prev => ({ ...prev, [matchId]: newLines }));
  };

  const escanear = async () => {
    setMatches([]); setGeneratedPrompts({});
    setStatus("ESCANEO INICIADO...");
    try {
      const apiKey = getRandomKey();
      
      // La URL depende del deporte
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

      // Inicializar líneas
      const initialLines = {};
      valid.forEach(m => {
          initialLines[m.id] = [{ team: 'HOME', line: '', odds: '' }];
      });
      setManualLines(initialLines);

      setMatches(valid);
      
      if (valid.length === 0) setStatus("SIN PARTIDOS.");
      else setStatus(`✅ ${valid.length} EVENTOS ENCONTRADOS`);

    } catch (e: any) {
      setStatus(`❌ ERROR: ${e.message}`);
    }
  };

  const generarPrompt = async (match: any) => {
    const rHome = ratings[match.id]?.home;
    const rAway = ratings[match.id]?.away;
    const lines = manualLines[match.id] || [];
    const activeLines = lines.filter(l => l.line && l.odds);
    
    const config = SPORTS_CONFIG[currentSport];

    if (!rHome || !rAway) { alert(`⚠️ Faltan los ${config.ratingName}.`); return; }
    if (activeLines.length === 0) { alert("⚠️ Faltan líneas de apuesta."); return; }

    setAnalyzingId(match.id);
    try {
      const res = await fetch(`${PYTHON_BACKEND_URL}/analizar_manual`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
            elo_home: rHome, 
            elo_away: rAway,
            sport: currentSport 
        })
      });
      const data = await res.json();
      
      const linesFormatted = activeLines.map((l, i) => {
          const teamName = l.team === 'HOME' ? match.home_team : match.away_team;
          return `- Opción ${i + 1}: **${teamName}** [ ${l.line} ] @ ${l.odds}`;
      }).join("\n");

      // --- CONTEXTO ESPECÍFICO POR DEPORTE ---
      let sportInstructions = "";
      if (currentSport === 'soccer') {
          sportInstructions = `
          - **H2H:** Busca historial reciente.
          - **Lesiones:** ¿Falta el goleador?
          - **Contexto:** ¿Es Copa (rotaciones) o Liga?
          - **Localía:** ¿Hay altura o viaje largo?`;
      } else if (currentSport === 'nba') {
          sportInstructions = `
          - **FATIGA (Clave):** ¿Es Back-to-Back?
          - **ESTRELLAS:** Busca "NBA Injury Report". ¿Juegan todos?
          - **MATCHUP:** Defensa vs Ataque.`;
      } else if (currentSport === 'mlb') {
          sportInstructions = `
          - **PITCHERS:** Busca "Starting Pitchers today".
          - **BULLPEN:** ¿Están descansados?`;
      }

      const prompt = `## 🎯 ROL: GESTOR DE INVERSIONES ${config.name} (BetSmart AI)

### 1. ⚙️ CAPITAL
- **Bankroll:** $${bankroll} COP
- **Stake Base:** $${(parseInt(bankroll)/70).toFixed(0)} COP

### 2. 📋 EL EVENTO
- **Deporte:** ${config.name}
- **Partido:** ${match.home_team} vs ${match.away_team}
- **Competición:** ${config.leagues.find(l => l.code === selectedLeague)?.name}
- **Fecha:** ${new Date(match.commence_time).toLocaleString()}

### 3. 🧠 ANÁLISIS MATEMÁTICO (${config.ratingName})
- **${config.ratingName} Local:** ${rHome} | **Visita:** ${rAway}
- **Diferencia Ajustada:** ${data.math.elo_diff_adjusted} pts.
- **PROYECCIÓN:** El modelo estima que el **${data.math.favorito}** debería ganar por un margen de **${Math.abs(data.math.expected_margin)} ${data.math.unit}**.

### 4. 📉 LÍNEAS DE MERCADO
${linesFormatted}

---

### 🕵️‍♂️ TU MISIÓN TÁCTICA (BUSCAR EN INTERNET):

1.  **ANÁLISIS MATEMÁTICO:**
    - Cruza mi ventaja matemática (${data.math.expected_margin} ${data.math.unit}) con las Opciones.
    - ¿Cuál línea tiene valor?

2.  **INVESTIGACIÓN OBLIGATORIA (Browsing):**
    ${sportInstructions}

3.  **VEREDICTO FINAL:** 
    - **Mejor Línea:** (Elige UNA).
    - **Stake:** (1-5).
    - **Monto:** ($ Pesos).
    - **Razón:** (Matemática + Contexto).`;

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

  // --- VISTA: SELECCIÓN DE DEPORTE ---
  if (!currentSport) {
      return (
          <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center font-mono">
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                  <Shield size={40} className="text-emerald-500"/> Capital<span className="text-emerald-500">Shield</span>
              </h1>
              <p className="text-slate-500 mb-10 tracking-widest text-xs uppercase">Multi-Sport Arbitrage & Value System</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                  {Object.entries(SPORTS_CONFIG).map(([key, conf]) => (
                      <button 
                          key={key}
                          onClick={() => selectSport(key)}
                          className={`group relative p-8 rounded-2xl border border-white/10 bg-[#111] hover:bg-[#151515] transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-${conf.color}-500/20`}
                      >
                          <div className={`text-6xl mb-4 grayscale group-hover:grayscale-0 transition-all`}>{conf.icon}</div>
                          <h2 className="text-2xl font-bold mb-2">{conf.name}</h2>
                          <p className="text-xs text-slate-500 uppercase tracking-wider">Motor {conf.ratingName}</p>
                          <div className={`absolute bottom-0 left-0 w-full h-1 bg-${conf.color}-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
                      </button>
                  ))}
              </div>
          </div>
      );
  }

  // --- VISTA: DASHBOARD DEPORTE ---
  const config = SPORTS_CONFIG[currentSport];

  return (
    <div className="min-h-screen bg-black text-gray-200 font-mono p-4">
      <div className="max-w-2xl mx-auto">
        
        {/* HEADER */}
        <div className="border-b border-white/20 pb-4 mb-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <button onClick={() => setCurrentSport(null)} className="bg-[#222] p-2 rounded hover:bg-[#333]"><ChevronRight className="rotate-180" size={16}/></button>
                <h1 className="text-xl font-bold tracking-widest text-white">{config.name}<span className={`text-${config.color}-500`}>PRO</span></h1>
            </div>
            <span className="text-[10px] text-gray-500">MÓDULO ACTIVO</span>
        </div>

        {/* CONTROLES */}
        <div className="bg-[#111] p-4 border border-white/10 rounded-lg mb-6">
            <div className="grid grid-cols-1 gap-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">FECHA</label>
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-black border border-white/20 p-2 text-sm text-white"/>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">COMPETICIÓN</label>
                        <select value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)} className="w-full bg-black border border-white/20 p-2 text-sm text-white cursor-pointer">
                            {config.leagues.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 block mb-1">CAPITAL (COP)</label>
                    <input type="number" value={bankroll} onChange={(e) => setBankroll(e.target.value)} className="w-full bg-black border border-white/20 p-2 text-sm text-white"/>
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
                <div key={m.id} className="bg-[#0a0a0a] border border-white/10 p-5 rounded-lg hover:border-white/30 transition relative">
                    
                    <div className="flex justify-between items-center text-sm font-bold text-white mb-2">
                        <span className="flex-1">{m.home_team}</span>
                        <span className="px-2 text-gray-600 text-xs">vs</span>
                        <span className="flex-1 text-right">{m.away_team}</span>
                    </div>
                    
                    <div className="text-[10px] text-gray-500 mb-4 text-center">
                        {new Date(m.commence_time).toLocaleString()}
                    </div>
                    
                    {!generatedPrompts[m.id] ? (
                        <div className="space-y-4">
                            {/* INPUTS DE RATING */}
                            <div className="flex gap-2">
                                <input 
                                    type="number" placeholder={`${config.ratingName} Local`} 
                                    onChange={(e) => handleRatingChange(m.id, 'home', e.target.value)}
                                    className="w-full bg-black border border-white/20 p-2 text-center text-white text-xs rounded outline-none focus:border-white"
                                />
                                <input 
                                    type="number" placeholder={`${config.ratingName} Visita`} 
                                    onChange={(e) => handleRatingChange(m.id, 'away', e.target.value)}
                                    className="w-full bg-black border border-white/20 p-2 text-center text-white text-xs rounded outline-none focus:border-white"
                                />
                            </div>

                            {/* LÍNEAS DINÁMICAS */}
                            <div className="bg-[#111] p-3 rounded border border-white/5">
                                <label className="text-[9px] text-gray-500 block mb-2 font-bold uppercase flex justify-between items-center">
                                    <span>LÍNEAS DE APUESTA</span>
                                </label>
                                <div className="space-y-2">
                                    {(manualLines[m.id] || []).map((line: any, idx: number) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <div className="relative w-1/3">
                                                <select 
                                                    value={line.team} 
                                                    onChange={(e) => handleLineDataChange(m.id, idx, 'team', e.target.value)}
                                                    className="w-full bg-black border border-white/20 p-2 text-[10px] text-white rounded appearance-none outline-none"
                                                >
                                                    <option value="HOME">{m.home_team}</option>
                                                    <option value="AWAY">{m.away_team}</option>
                                                </select>
                                                <ChevronDown size={10} className="absolute right-2 top-3 text-gray-500 pointer-events-none"/>
                                            </div>
                                            <input 
                                                type="text" placeholder="Línea (Ej: -1.5)"
                                                value={line.line}
                                                onChange={(e) => handleLineDataChange(m.id, idx, 'line', e.target.value)}
                                                className="w-1/3 bg-black border border-white/20 p-2 text-xs text-white rounded text-center outline-none"
                                            />
                                            <input 
                                                type="number" placeholder="Cuota"
                                                value={line.odds}
                                                onChange={(e) => handleLineDataChange(m.id, idx, 'odds', e.target.value)}
                                                className="w-1/4 bg-black border border-white/20 p-2 text-xs text-white rounded text-center outline-none"
                                            />
                                            <button onClick={() => handleRemoveLine(m.id, idx)} className="text-red-500 hover:bg-red-900/20 p-2 rounded">
                                                <Trash2 size={12}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => handleAddLine(m.id)} className="mt-3 w-full py-1.5 bg-[#1a1a1a] hover:bg-[#222] border border-white/10 rounded text-[10px] text-gray-400 flex items-center justify-center gap-1 transition">
                                    <Plus size={10}/> AGREGAR LÍNEA
                                </button>
                            </div>

                            <button onClick={() => generarPrompt(m)} className="w-full border border-dashed border-white/20 py-3 text-xs text-emerald-400 hover:bg-emerald-900/10 transition flex items-center justify-center gap-2">
                                <Pencil size={12}/> PROCESAR
                            </button>
                        </div>
                    ) : (
                        <div className="animate-in fade-in">
                            <div className="mb-2 p-2 bg-emerald-900/20 rounded border border-emerald-500/20 text-center">
                                <p className="text-[10px] text-emerald-400 font-bold">ANÁLISIS LISTO</p>
                            </div>
                            <button onClick={() => copiar(m.id, generatedPrompts[m.id])} className={`w-full py-3 text-xs font-bold rounded ${copiedId === m.id ? 'bg-emerald-600 text-white' : 'bg-white text-black'}`}>
                                {copiedId === m.id ? "COPIADO" : "COPIAR AL CHAT"}
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

import React, { useState, useEffect } from 'react';
import { Shield, Zap, Copy, ExternalLink, RefreshCw, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';

const DATA_URL = "https://raw.githubusercontent.com/japh99/capital-shield/main/data/opportunities.json";
// OJO: Si estás usando el backend en vivo (Render) directamente, cambia la URL de abajo en la función escanear,
// pero como estamos usando el script Python en GitHub Actions para generar el JSON, usamos esta.
// Si estás usando la versión "En Vivo" (Render directo), el cambio es en la llamada fetch.
// Asumo que estamos usando la versión "En Vivo" (Render) que te di antes.
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
  { code: 'soccer_epl', name: '🇬🇧 Premier League' },
  { code: 'soccer_spain_la_liga', name: '🇪🇸 La Liga' },
  { code: 'soccer_uefa_champs_league', name: '🏆 Champions League' },
  { code: 'soccer_italy_serie_a', name: '🇮🇹 Serie A' },
  { code: 'soccer_germany_bundesliga', name: '🇩🇪 Bundesliga' },
  { code: 'basketball_nba', name: '🏀 NBA' },
  { code: 'baseball_mlb', name: '⚾ MLB' }
];

const getRandomKey = () => ODDS_API_KEYS[Math.floor(Math.random() * ODDS_API_KEYS.length)];

function App() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState('soccer_epl');
  const [copiedId, setCopiedId] = useState(null);

  const escanear = async () => {
    setLoading(true);
    setOpportunities([]);
    try {
      const apiKey = getRandomKey();
      const res = await fetch(`${PYTHON_BACKEND_URL}/analizar_mercado`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ api_key: apiKey, league: selectedLeague })
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      setOpportunities(data);
      
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyPrompt = (op: any) => {
    // Detectar si hay estimaciones
    const isEstimated = op.details.est_h || op.details.est_a;
    const warningText = isEstimated ? "⚠️ ATENCIÓN: El ELO es ESTIMADO (no oficial). Verifica la calidad de los equipos manualmente." : "✅ ELO OFICIAL (ClubElo).";

    const prompt = `🤖 ROL: Analista Capital Shield.
    
DETECTADO VALOR MATEMÁTICO:
⚽ ${op.match}
💰 Cuota Mercado: ${op.details.market_odd} (Valor: +${op.profit}%)
🧮 Cuota Justa: ${op.details.fair_odd}
📊 ELO: ${op.details.elo_h} ${op.details.est_h ? '(Est)' : ''} vs ${op.details.elo_a} ${op.details.est_a ? '(Est)' : ''}

${warningText}

TU TAREA:
1. Si el ELO es estimado, busca en Google si los equipos son parejos o si la cuota es una trampa.
2. Busca Noticias de Lesiones.
3. VEREDICTO: ¿Apuesto o es un error de cálculo?`;
    
    navigator.clipboard.writeText(prompt);
    setCopiedId(op.match);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans p-4">
      <div className="max-w-3xl mx-auto">
        
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="text-emerald-500" /> Capital<span className="text-emerald-500">Shield</span>
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Arbitrage & Value Engine</p>
          </div>
          <div className="flex gap-2">
            <select 
                value={selectedLeague} 
                onChange={(e) => setSelectedLeague(e.target.value)}
                className="bg-[#111] border border-white/10 text-xs rounded-lg px-3 py-2 outline-none text-white cursor-pointer"
            >
                {LEAGUES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
            <button onClick={escanear} className="bg-white hover:bg-gray-200 text-black p-2 rounded-lg transition-colors">
                <RefreshCw className={loading ? "animate-spin" : ""} size={18}/>
            </button>
          </div>
        </div>

        <div className="grid gap-4">
            
            {!loading && opportunities.length === 0 && (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
                    <p className="text-slate-500 text-sm">Sin discrepancias matemáticas en este mercado.</p>
                </div>
            )}

            {opportunities.map((op: any, idx) => (
                <div key={idx} className={`relative bg-[#0a0a0a] rounded-xl overflow-hidden border ${op.type === 'SUREBET' ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'border-blue-500/30'}`}>
                    
                    <div className="p-4 flex justify-between items-start border-b border-white/5 bg-white/[0.02]">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${op.type === 'SUREBET' ? 'bg-emerald-500 text-black' : 'bg-blue-600 text-white'}`}>
                                    {op.type}
                                </span>
                            </div>
                            <h3 className="font-bold text-white text-lg">{op.match}</h3>
                        </div>
                        <div className="text-right">
                            <span className={`text-xl font-bold font-mono ${op.type === 'SUREBET' ? 'text-emerald-400' : 'text-blue-400'}`}>
                                +{op.profit}%
                            </span>
                            <p className="text-[9px] text-slate-500 uppercase">Beneficio</p>
                        </div>
                    </div>

                    <div className="p-4">
                        {op.type === 'SUREBET' ? (
                            <div className="bg-[#111] p-3 rounded text-xs font-mono text-slate-300 border border-emerald-500/30">
                                {op.details["1"].odd} | {op.details["X"].odd} | {op.details["2"].odd}
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between gap-4 mb-4">
                                    <div className="flex-1 bg-[#111] p-2 rounded border border-white/5 flex justify-between px-4 items-center">
                                        <div className="text-center">
                                            <p className="text-[10px] text-slate-500">MERCADO</p>
                                            <p className="text-lg font-bold text-white">{op.details.market_odd}</p>
                                        </div>
                                        <div className="w-px bg-white/10 h-8"></div>
                                        <div className="text-center relative">
                                            <p className="text-[10px] text-slate-500">ELO DIFF</p>
                                            <div className="flex items-center gap-1">
                                                <p className="text-lg font-bold text-blue-400">
                                                    {op.details.elo_h - op.details.elo_a}
                                                </p>
                                                {/* ICONO DE ALERTA SI ES ESTIMADO */}
                                                {(op.details.est_h || op.details.est_a) && (
                                                    <div className="relative group/tooltip">
                                                        <AlertTriangle size={14} className="text-yellow-500 cursor-help"/>
                                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[9px] font-bold px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity">
                                                            ELO ESTIMADO
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => copyPrompt(op)}
                                    className="w-full py-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all"
                                >
                                    {copiedId === op.match ? <Check size={14}/> : <Zap size={14}/>}
                                    {copiedId === op.match ? "PROMPT COPIADO" : "VALIDAR CON IA"}
                                </button>
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

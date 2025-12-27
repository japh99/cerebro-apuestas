import React, { useState } from 'react';
import { Shield, ChevronLeft, Activity, Dumbbell, Target } from 'lucide-react';
import Soccer from './modules/Soccer';
import Nba from './modules/Nba'; 

function App() {
  const [module, setModule] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-mono p-4 relative overflow-hidden">
      
      {/* Background Grid Sutil */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      {/* NAVBAR */}
      <div className="relative z-10 max-w-5xl mx-auto flex justify-between items-center mb-12 border-b border-white/10 pb-6 pt-4">
          <div className="flex items-center gap-3">
            {module && (
                <button onClick={() => setModule(null)} className="bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors border border-white/5">
                    <ChevronLeft className="text-gray-300"/>
                </button>
            )}
            <div>
                <h1 className="text-2xl font-black text-white tracking-tighter flex items-center gap-2">
                    <Shield className="text-emerald-500 fill-emerald-500/20" size={32}/> 
                    CAPITAL<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">SHIELD</span>
                </h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] pl-1 font-bold">Intelligent Sports Trading</p>
            </div>
          </div>
          <div className="hidden md:block px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] text-gray-400 font-mono">
             v36.0 STABLE
          </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {!module ? (
           // MENU PRINCIPAL (HUB)
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
              
              {/* FÚTBOL CARD (ACTIVA) */}
              <button 
                onClick={() => setModule('soccer')} 
                className="group relative h-64 bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 flex flex-col justify-end overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(16,185,129,0.15)] hover:border-emerald-500/50"
              >
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                 <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-emerald-500/20"></div>
                 
                 <div className="relative z-10 text-left">
                    <div className="text-5xl mb-4 grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:-translate-y-2">⚽</div>
                    <h2 className="text-3xl font-black text-white mb-2 group-hover:text-emerald-400 transition-colors">FÚTBOL</h2>
                    <p className="text-xs text-gray-500 group-hover:text-gray-300 border-l-2 border-white/10 pl-3 group-hover:border-emerald-500 transition-all">
                        Motor ELO • Hándicap Asiático • Copas
                    </p>
                 </div>
              </button>
              
              {/* NBA CARD (AHORA ACTIVA 🏀) */}
              <button 
                onClick={() => setModule('nba')}
                className="group relative h-64 bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 flex flex-col justify-end overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(249,115,22,0.15)] hover:border-orange-500/50"
              >
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                 <div className="absolute top-0 right-0 p-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-orange-500/20"></div>
                 
                 <div className="relative z-10 text-left">
                    <div className="text-5xl mb-4 grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:-translate-y-2">🏀</div>
                    <h2 className="text-3xl font-black text-white mb-2 group-hover:text-orange-400 transition-colors">NBA</h2>
                    <p className="text-xs text-gray-500 group-hover:text-gray-300 border-l-2 border-white/10 pl-3 group-hover:border-orange-500 transition-all">
                        Power Ratings • Fatiga • Spreads
                    </p>
                 </div>
              </button>

              {/* MLB CARD (INACTIVA) */}
              <button className="group relative h-64 bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 flex flex-col justify-end overflow-hidden opacity-50 cursor-not-allowed">
                 <div className="relative z-10 text-left">
                    <div className="text-5xl mb-4 text-blue-500/30">⚾</div>
                    <h2 className="text-3xl font-black text-white/30 mb-2">MLB</h2>
                    <p className="text-xs text-gray-700 font-mono uppercase tracking-widest">
                        Próximamente
                    </p>
                 </div>
              </button>

           </div>
        ) : (
           // CARGAR MÓDULO SELECCIONADO
           <div className="animate-in fade-in zoom-in-95 duration-300 px-2">
             {module === 'soccer' && <Soccer />}
             {module === 'nba' && <Nba />}
           </div>
        )}
      </div>
    </div>
  );
}

export default App;

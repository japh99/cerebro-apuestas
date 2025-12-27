// src/App.tsx
import React, { useState } from 'react';
import { Shield, ChevronLeft } from 'lucide-react';
import Soccer from './modules/Soccer';
// import Nba from './modules/Nba'; // Descomentar cuando crees el archivo
// import Mlb from './modules/Mlb'; // Descomentar cuando crees el archivo

function App() {
  const [module, setModule] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-black text-gray-200 font-mono p-4">
      
      {/* NAVBAR */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-8 border-b border-white/20 pb-4">
          <div className="flex items-center gap-2">
            {module && (
                <button onClick={() => setModule(null)} className="bg-white/10 p-1 rounded hover:bg-white/20">
                    <ChevronLeft/>
                </button>
            )}
            <h1 className="text-xl font-bold text-emerald-500 tracking-widest">CAPITAL<span className="text-white">SHIELD</span></h1>
          </div>
          <span className="text-[10px] text-gray-500">MODULAR v1.0</span>
      </div>

      <div className="max-w-4xl mx-auto">
        {!module ? (
           // MENU PRINCIPAL
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button onClick={() => setModule('soccer')} className="p-8 bg-[#111] border border-white/10 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-900/10 transition group">
                 <div className="text-4xl mb-4 grayscale group-hover:grayscale-0">⚽</div>
                 <h2 className="text-2xl font-bold text-white mb-2">FÚTBOL</h2>
                 <p className="text-xs text-gray-500">Motor ELO + Hándicap</p>
              </button>
              
              <button className="p-8 bg-[#111] border border-white/10 rounded-2xl opacity-50 cursor-not-allowed">
                 <div className="text-4xl mb-4">🏀</div>
                 <h2 className="text-2xl font-bold text-white mb-2">NBA</h2>
                 <p className="text-xs text-gray-500">Próximamente...</p>
              </button>

              <button className="p-8 bg-[#111] border border-white/10 rounded-2xl opacity-50 cursor-not-allowed">
                 <div className="text-4xl mb-4">⚾</div>
                 <h2 className="text-2xl font-bold text-white mb-2">MLB</h2>
                 <p className="text-xs text-gray-500">Próximamente...</p>
              </button>
           </div>
        ) : (
           // CARGAR MÓDULO
           <>
             {module === 'soccer' && <Soccer />}
             {/* {module === 'nba' && <Nba />} */}
           </>
        )}
      </div>
    </div>
  );
}

export default App;

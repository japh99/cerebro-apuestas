import React, { useState } from 'react';
import { Shield, ChevronLeft } from 'lucide-react';
import Soccer from './modules/Soccer';
import Nba from './modules/Nba'; // <--- IMPORTAMOS EL NUEVO MODULO

function App() {
  const [module, setModule] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-black text-gray-200 font-mono p-4">
      
      {/* NAVBAR */}
      <div className="max-w-2xl mx-auto flex justify-between items-center mb-8 border-b border-white/20 pb-4">
          <div className="flex items-center gap-2">
            {module && (
                <button onClick={() => setModule(null)} className="bg-white/10 p-1 rounded hover:bg-white/20">
                    <ChevronLeft/>
                </button>
            )}
            <h1 className="text-xl font-bold text-emerald-500 tracking-widest">CAPITAL<span className="text-white">SHIELD</span></h1>
          </div>
          <span className="text-[10px] text-gray-500">MODULAR v2.0</span>
      </div>

      <div className="max-w-2xl mx-auto">
        {!module ? (
           // MENU PRINCIPAL
           <div className="grid grid-cols-1 gap-6">
              {/* BOTON FUTBOL */}
              <button onClick={() => setModule('soccer')} className="p-6 bg-[#111] border border-white/10 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-900/10 transition group flex items-center gap-4">
                 <div className="text-4xl grayscale group-hover:grayscale-0">⚽</div>
                 <div className="text-left">
                    <h2 className="text-xl font-bold text-white">FÚTBOL</h2>
                    <p className="text-xs text-gray-500">Motor ELO + Hándicap</p>
                 </div>
              </button>
              
              {/* BOTON NBA (AHORA ACTIVO) */}
              <button onClick={() => setModule('nba')} className="p-6 bg-[#111] border border-white/10 rounded-2xl hover:border-orange-500/50 hover:bg-orange-900/10 transition group flex items-center gap-4">
                 <div className="text-4xl grayscale group-hover:grayscale-0">🏀</div>
                 <div className="text-left">
                    <h2 className="text-xl font-bold text-white">NBA</h2>
                    <p className="text-xs text-gray-500">Power Ratings + Fatiga</p>
                 </div>
              </button>

              {/* BOTON MLB (AUN INACTIVO) */}
              <button className="p-6 bg-[#111] border border-white/10 rounded-2xl opacity-50 cursor-not-allowed flex items-center gap-4">
                 <div className="text-4xl">⚾</div>
                 <div className="text-left">
                    <h2 className="text-xl font-bold text-white">MLB</h2>
                    <p className="text-xs text-gray-500">Próximamente...</p>
                 </div>
              </button>
           </div>
        ) : (
           // CARGAR MÓDULO
           <div className="animate-in fade-in zoom-in-95 duration-300">
             {module === 'soccer' && <Soccer />}
             {module === 'nba' && <Nba />}
           </div>
        )}
      </div>
    </div>
  );
}

export default App;


import React, { useState } from 'react';
import { Player, Position } from '../types';

interface PitchProps {
  players: Player[];
  formation: string;
  onPlayerClick: (player: Player) => void;
  highlightedPlayerId?: string | null;
  onSwapPlayers?: (sourceId: string, targetId: string) => void;
}

// Coordinate system: bottom %, left %
// Index mapping roughly: 0=GK, 1-4=DEF, 5-8=MID, 9-10=FWD (varies by formation)
const FORMATIONS: Record<string, { left: number; bottom: number; role?: string }[]> = {
  '4-4-2': [
    { left: 50, bottom: 4 },  // GK
    { left: 15, bottom: 25 }, // LB
    { left: 38, bottom: 22 }, // CB
    { left: 62, bottom: 22 }, // CB
    { left: 85, bottom: 25 }, // RB
    { left: 15, bottom: 55 }, // LM
    { left: 38, bottom: 50 }, // CM
    { left: 62, bottom: 50 }, // CM
    { left: 85, bottom: 55 }, // RM
    { left: 35, bottom: 82 }, // ST
    { left: 65, bottom: 82 }, // ST
  ],
  '4-3-3': [
    { left: 50, bottom: 4 },  // GK
    { left: 15, bottom: 25 }, // LB
    { left: 38, bottom: 22 }, // CB
    { left: 62, bottom: 22 }, // CB
    { left: 85, bottom: 25 }, // RB
    { left: 25, bottom: 50 }, // CM
    { left: 50, bottom: 45 }, // CDM
    { left: 75, bottom: 50 }, // CM
    { left: 15, bottom: 80 }, // LW
    { left: 50, bottom: 85 }, // ST
    { left: 85, bottom: 80 }, // RW
  ],
  '3-5-2': [
    { left: 50, bottom: 4 },  // GK
    { left: 20, bottom: 22 }, // CB
    { left: 50, bottom: 20 }, // CB
    { left: 80, bottom: 22 }, // CB
    { left: 10, bottom: 45 }, // LWB
    { left: 35, bottom: 50 }, // CM
    { left: 50, bottom: 45 }, // CDM
    { left: 65, bottom: 50 }, // CM
    { left: 90, bottom: 45 }, // RWB
    { left: 35, bottom: 82 }, // ST
    { left: 65, bottom: 82 }, // ST
  ],
  '5-3-2': [
    { left: 50, bottom: 4 },  // GK
    { left: 10, bottom: 28 }, // LWB
    { left: 30, bottom: 22 }, // CB
    { left: 50, bottom: 20 }, // CB
    { left: 70, bottom: 22 }, // CB
    { left: 90, bottom: 28 }, // RWB
    { left: 30, bottom: 50 }, // CM
    { left: 50, bottom: 45 }, // CM
    { left: 70, bottom: 50 }, // CM
    { left: 35, bottom: 82 }, // ST
    { left: 65, bottom: 82 }, // ST
  ],
  '4-2-3-1': [
    { left: 50, bottom: 4 },  // GK
    { left: 15, bottom: 25 }, // LB
    { left: 38, bottom: 22 }, // CB
    { left: 62, bottom: 22 }, // CB
    { left: 85, bottom: 25 }, // RB
    { left: 35, bottom: 42 }, // CDM
    { left: 65, bottom: 42 }, // CDM
    { left: 15, bottom: 65 }, // LAM
    { left: 50, bottom: 65 }, // CAM
    { left: 85, bottom: 65 }, // RAM
    { left: 50, bottom: 85 }, // ST
  ]
};

const Pitch: React.FC<PitchProps> = ({ players, formation, onPlayerClick, highlightedPlayerId, onSwapPlayers }) => {
  // Get exactly 11 starters. Ensure we don't crash if we have fewer.
  const startingXI = players.filter(p => p.squadStatus === 'STARTING').slice(0, 11);
  const formationConfig = FORMATIONS[formation] || FORMATIONS['4-4-2'];

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, player: Player) => {
      setDraggedId(player.id);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', player.id);
  };

  const handleDragOver = (e: React.DragEvent, targetPlayer: Player) => {
      e.preventDefault(); 
      if (!draggedId || draggedId === targetPlayer.id) return;
      setDragOverId(targetPlayer.id);
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = () => {
      setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetPlayer: Player) => {
      e.preventDefault();
      setDragOverId(null);
      const sourceId = e.dataTransfer.getData('text/plain');
      
      if (sourceId && sourceId !== targetPlayer.id && onSwapPlayers) {
           onSwapPlayers(sourceId, targetPlayer.id);
      }
      setDraggedId(null);
  };

  const handleDragEnd = () => {
      setDraggedId(null);
      setDragOverId(null);
  };

  // Check if player position matches the slot roughly (Logic can be improved)
  // e.g. index 0 should be GK.
  const isOutOfPosition = (index: number, player: Player) => {
      if (index === 0 && player.position !== Position.GK) return true;
      if (index > 0 && player.position === Position.GK) return true;
      return false;
  };

  return (
    <div className="relative w-full aspect-[2/3] md:aspect-[3/4] lg:aspect-[4/3] bg-pitch rounded-xl overflow-hidden shadow-inner border-[4px] border-slate-800/50">
      {/* Pitch Markings */}
      <div className="absolute inset-4 border-2 border-white/30 rounded-sm pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 border-b-2 border-x-2 border-white/30 rounded-b-sm pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-t-2 border-x-2 border-white/30 rounded-t-sm pointer-events-none"></div>
      <div className="absolute top-1/2 left-0 w-full h-px bg-white/30 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-full pointer-events-none"></div>
      
      {/* Lawn Stripes Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{
             backgroundImage: 'linear-gradient(0deg, transparent 50%, rgba(0,0,0,0.2) 50%)',
             backgroundSize: '100% 10%'
           }}>
      </div>

      {startingXI.map((p, index) => {
          const config = formationConfig[index] || { left: 50, bottom: 50 };
          const outOfPos = isOutOfPosition(index, p);

          return (
            <div 
                key={p.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, p)}
                onDragOver={(e) => handleDragOver(e, p)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, p)}
                onDragEnd={handleDragEnd}
                onClick={() => onPlayerClick(p)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-grab active:cursor-grabbing transition-all hover:z-30 ${
                    highlightedPlayerId === p.id ? 'scale-125 z-20' : 'z-10'
                } ${draggedId === p.id ? 'opacity-50' : 'opacity-100'}`}
                style={{
                    left: `${config.left}%`,
                    bottom: `${config.bottom}%`,
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                <div className={`w-10 h-10 rounded-full border-2 shadow-lg flex items-center justify-center text-xs font-bold text-white relative overflow-hidden transition-all ${
                    dragOverId === p.id ? 'border-dashed border-yellow-400 bg-slate-800 scale-110' : 
                    highlightedPlayerId === p.id ? 'border-yellow-400 bg-emerald-900' : 
                    outOfPos ? 'bg-red-900 border-red-500' : 'bg-slate-900 border-white group-hover:border-emerald-400'
                }`}>
                    {p.rating}
                    {outOfPos && <div className="absolute inset-0 bg-red-500/30 animate-pulse"></div>}
                </div>
                
                <div className={`mt-1 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white font-bold backdrop-blur-sm truncate max-w-[80px] pointer-events-none transition-colors ${
                    highlightedPlayerId === p.id ? 'text-yellow-400' : ''
                }`}>
                    {p.name.split(' ').pop()}
                </div>

                {/* Position Label tooltip */}
                <div className="absolute -top-6 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-600">
                    {p.position}
                </div>
            </div>
          );
      })}
    </div>
  );
};

export default Pitch;

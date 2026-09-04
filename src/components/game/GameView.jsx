import React from 'react';
import { useGameSocket } from '../../context/SocketContext';
import { useProximity } from '../../context/ProximityContext';
import { RoleModal } from './RoleModal';
import { DrawingPhase } from './DrawingPhase';
import { DrawingIntermission } from './DrawingIntermission';
import { VotingPhase } from './VotingPhase';
import { VotingResultsPhase } from './VotingResultsPhase';
import { EjectionReveal } from './EjectionReveal';
import { RevealPhase } from './RevealPhase';
import { GameOverPodium } from './GameOverPodium';

export const GameView = () => {
  const { roomState } = useGameSocket();

  if (!roomState) return null;

  const phase = roomState.phase;

  return (
    <div className="w-full flex-1 flex flex-col relative h-[calc(100vh-3.5rem)] min-h-0 pb-2.5 overflow-hidden">
      {/* 1. ROLE REVEAL Phase */}
      {phase === 'ROLE_REVEAL' && (
        <>
          <RoleModal />
          <DrawingPhase />
        </>
      )}

      {/* 2. TURN-BASED DRAWING Phase & INTERMISSION */}
      {(phase === 'DRAWING' || phase === 'DRAWING_INTERMISSION') && <DrawingPhase />}

      {/* 4. VOTING Phase */}
      {phase === 'VOTING' && <VotingPhase />}

      {/* 5. VOTING RESULTS REVEAL (5s wait screen showing who voted whom) */}
      {phase === 'VOTING_RESULTS' && <VotingResultsPhase />}

      {/* 6. EJECTION REVEAL (Among Us Typewriter Animation) */}
      {phase === 'EJECTION_REVEAL' && <EjectionReveal />}

      {/* 7. REVEAL & SCORING Phase */}
      {phase === 'REVEAL_SCORING' && <RevealPhase />}

      {/* 7. GAME OVER Podium */}
      {phase === 'GAME_OVER' && <GameOverPodium />}
    </div>
  );
};

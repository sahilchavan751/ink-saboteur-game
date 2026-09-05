import React, { useEffect, Suspense, lazy } from 'react';
import { SocketProvider, useGameSocket } from './context/SocketContext';
import { ProximityProvider } from './context/ProximityContext';
import { Header } from './components/common/Header';
import { LobbyView } from './components/lobby/LobbyView';
import { Preloader } from './components/common/Preloader';
import { startBackgroundMusic } from './utils/sound';

const RoomLobby = lazy(() =>
  import('./components/lobby/RoomLobby').then((m) => ({ default: m.RoomLobby }))
);
const GameView = lazy(() =>
  import('./components/game/GameView').then((m) => ({ default: m.GameView }))
);

const MainContent = () => {
  const { roomState } = useGameSocket();
  const isLobby = !roomState || roomState.phase === 'LOBBY';

  useEffect(() => {
    startBackgroundMusic();
  }, []);

  return (
    <div className="h-screen max-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden selection:bg-zinc-700 selection:text-white">
      {/* Background Container with Subtle Zoom (Slow Ken Burns Breathing Effect) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Lobby Background */}
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 animate-subtle-zoom ${
            isLobby ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: "url('/background.webp')" }}
        />

        {/* Game Screen Background */}
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 animate-subtle-zoom ${
            !isLobby ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: "url('/background-game.webp')" }}
        />
      </div>

      {/* Persistent Minimalist Header - Only shown in game/room, hidden for main lobby and cinematic ejection screen */}
      {roomState && roomState.phase !== 'EJECTION_REVEAL' && <Header />}

      {/* Main Content Area */}
      <main className="flex-1 w-full relative z-10 flex flex-col min-h-0">
        <Suspense fallback={null}>
          {!roomState ? (
            <LobbyView />
          ) : roomState.phase === 'LOBBY' ? (
            <RoomLobby />
          ) : (
            <GameView />
          )}
        </Suspense>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <SocketProvider>
      <ProximityProvider>
        <Preloader />
        <MainContent />
      </ProximityProvider>
    </SocketProvider>
  );
}

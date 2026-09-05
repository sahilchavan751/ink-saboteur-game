import React, { useEffect } from 'react';
import { SocketProvider, useGameSocket } from './context/SocketContext';
import { ProximityProvider } from './context/ProximityContext';
import { Header } from './components/common/Header';
import { LobbyView } from './components/lobby/LobbyView';
import { RoomLobby } from './components/lobby/RoomLobby';
import { GameView } from './components/game/GameView';
import { Preloader } from './components/common/Preloader';
import { startBackgroundMusic } from './utils/sound';

const MainContent = () => {
  const { roomState } = useGameSocket();
  const isLobby = !roomState || roomState.phase === 'LOBBY';

  useEffect(() => {
    startBackgroundMusic();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-x-hidden selection:bg-zinc-700 selection:text-white">
      {/* Lobby Background */}
      <div
        className={`fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ${
          isLobby ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundImage: "url('/background.webp')" }}
      />

      {/* Game Screen Background */}
      <div
        className={`fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ${
          !isLobby ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundImage: "url('/background-game.webp')" }}
      />

      {/* Persistent Minimalist Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 w-full relative z-10 flex flex-col min-h-0">
        {!roomState ? (
          <LobbyView />
        ) : roomState.phase === 'LOBBY' ? (
          <RoomLobby />
        ) : (
          <GameView />
        )}
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

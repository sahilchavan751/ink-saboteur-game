import React from 'react';
import { SocketProvider, useGameSocket } from './context/SocketContext';
import { ProximityProvider } from './context/ProximityContext';
import { Header } from './components/common/Header';
import { LobbyView } from './components/lobby/LobbyView';
import { RoomLobby } from './components/lobby/RoomLobby';
import { GameView } from './components/game/GameView';

const MainContent = () => {
  const { roomState } = useGameSocket();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-x-hidden selection:bg-zinc-700 selection:text-white">
      {/* Persistent Minimalist Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 w-full relative z-10">
        {!roomState ? (
          <LobbyView />
        ) : roomState.phase === 'LOBBY' ? (
          <RoomLobby />
        ) : (
          <GameView />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="w-full py-4 text-center text-xs text-zinc-500 font-mono border-t border-zinc-900">
        <p>From Luxvore Studio</p>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <SocketProvider>
      <ProximityProvider>
        <MainContent />
      </ProximityProvider>
    </SocketProvider>
  );
}

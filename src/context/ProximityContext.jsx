import React, { createContext, useContext, useState } from 'react';
import { useGameSocket } from './SocketContext';
import { useProximityChat } from '../hooks/useProximityChat';

const ProximityContext = createContext(null);

export const ProximityProvider = ({ children }) => {
  const { roomState, socket, remoteCursors } = useGameSocket();
  const [localCursor, setLocalCursor] = useState({ x: 0.5, y: 0.5 });

  const roomCode = roomState?.code;
  const myPlayerId = socket?.id;
  const players = roomState?.players || [];
  const isInGame = Boolean(roomState && roomState.phase !== 'LOBBY');

  const proximityState = useProximityChat({
    roomCode,
    myPlayerId,
    players,
    remoteCursors,
    localCursor,
    isInGame
  });

  return (
    <ProximityContext.Provider
      value={{
        ...proximityState,
        localCursor,
        setLocalCursor
      }}
    >
      {children}
    </ProximityContext.Provider>
  );
};

export const useProximity = () => {
  const context = useContext(ProximityContext);
  if (!context) {
    return {
      isProximityEnabled: false,
      toggleProximity: () => {},
      isMuted: false,
      toggleMute: () => {},
      isVoiceAudioMuted: false,
      toggleVoiceAudioMute: () => {},
      isSpeaking: false,
      speakingPeers: {},
      micError: null,
      sendProximityMessage: () => {},
      proximityMessages: [],
      localCursor: { x: 0.5, y: 0.5 },
      setLocalCursor: () => {}
    };
  }
  return context;
};

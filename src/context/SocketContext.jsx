import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  onChildAdded,
  push,
  onDisconnect,
  serverTimestamp
} from 'firebase/database';
import { db } from '../firebase';
import { getRandomPromptPair, getShuffledPromptPair } from '../utils/promptBank';
import { playStrokeSound, playTick, playReveal } from '../utils/sound';

const GameContext = createContext(null);

const getOrCreatePlayerId = () => {
  let id = localStorage.getItem('ink_saboteur_player_uid');
  if (!id) {
    id = 'p_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).slice(-4);
    localStorage.setItem('ink_saboteur_player_uid', id);
  }
  return id;
};

export const SocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [timer, setTimer] = useState({ timeRemaining: 0, phase: 'LOBBY' });
  const [strokes, setStrokes] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [error, setError] = useState(null);
  const [firebaseRuleAlert, setFirebaseRuleAlert] = useState(false);
  const [loadingRoom, setLoadingRoom] = useState(false);

  const playerIdRef = useRef(getOrCreatePlayerId());
  const myPlayerId = playerIdRef.current;
  const isHostRef = useRef(false);
  const tickerRef = useRef(null);

  // Monitor database connection
  useEffect(() => {
    const connectedRef = ref(db, '.info/connected');
    const unsubscribe = onValue(connectedRef, (snap) => {
      setConnected(!!snap.val());
    });
    return () => unsubscribe();
  }, []);

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Authoritative host ticker managing turns and phases
  const runPhaseTimer = useCallback((activeRoomCode) => {
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }

    tickerRef.current = setInterval(async () => {
      if (!isHostRef.current) return;

      try {
        const roomRef = ref(db, `rooms/${activeRoomCode}`);
        const snap = await get(roomRef);
        if (!snap.exists()) {
          clearInterval(tickerRef.current);
          return;
        }

        const data = snap.val();
        const phase = data.phase;

        // Turn-based drawing countdown
        if (phase === 'DRAWING') {
          const currentTurnRemaining = (data.turnTimeRemaining ?? data.turnDuration ?? 10) - 1;

          if (currentTurnRemaining > 0) {
            await update(roomRef, {
              turnTimeRemaining: currentTurnRemaining,
              lastActivity: Date.now()
            });
          } else {
            await advanceDrawingTurn(activeRoomCode, data);
          }
          return;
        }

        // Standard phase countdowns
        const currentTime = (data.timeRemaining ?? 0) - 1;

        if (currentTime > 0) {
          await update(roomRef, {
            timeRemaining: currentTime,
            lastActivity: Date.now()
          });
        } else {
          await advancePhase(activeRoomCode, data);
        }
      } catch (err) {
        console.warn('Ticker update error:', err);
      }
    }, 1000);
  }, []);

  // Turn advancement with multi-turn draw chances
  const advanceDrawingTurn = async (activeRoomCode, currentData) => {
    const roomRef = ref(db, `rooms/${activeRoomCode}`);
    const turnOrder = currentData.turnOrder || Object.keys(currentData.players || {});
    const drawChances = currentData.drawChances || 2;
    const totalTurns = turnOrder.length * drawChances;
    const nextTurnIndex = (currentData.currentTurnIndex ?? 0) + 1;

    if (nextTurnIndex < totalTurns) {
      const nextPlayerId = turnOrder[nextTurnIndex % turnOrder.length];
      await update(roomRef, {
        currentTurnIndex: nextTurnIndex,
        activePlayerId: nextPlayerId,
        turnTimeRemaining: currentData.turnDuration || 10,
        lastActivity: Date.now()
      });
    } else {
      // All players completed all draw chances -> Enter Review Intermission before voting
      await update(roomRef, {
        phase: 'DRAWING_INTERMISSION',
        timeRemaining: currentData.intermissionDuration || 5,
        lastActivity: Date.now()
      });
    }
  };

  // Phase transitions with tie-handling logic
  const advancePhase = async (activeRoomCode, currentData) => {
    const phase = currentData.phase;
    const roomRef = ref(db, `rooms/${activeRoomCode}`);

    if (phase === 'ROLE_REVEAL') {
      const turnOrder = currentData.turnOrder || Object.keys(currentData.players || {});
      const firstPlayerId = turnOrder[0] || currentData.hostId;
      const turnDur = currentData.turnDuration || 10;

      await update(roomRef, {
        phase: 'DRAWING',
        currentTurnIndex: 0,
        activePlayerId: firstPlayerId,
        turnTimeRemaining: turnDur,
        lastActivity: Date.now()
      });
    } else if (phase === 'DRAWING_INTERMISSION') {
      const playerUpdates = {};
      if (currentData.players) {
        Object.keys(currentData.players).forEach((pid) => {
          playerUpdates[`players/${pid}/hasVoted`] = false;
          playerUpdates[`players/${pid}/voteTargetId`] = null;
        });
      }

      await update(roomRef, {
        phase: 'VOTING',
        timeRemaining: currentData.votingDuration || 30,
        votes: null,
        lastActivity: Date.now(),
        ...playerUpdates
      });
    } else if (phase === 'VOTING') {
      // Tally votes including SKIP and self-votes
      const votes = currentData.votes || {};
      const players = currentData.players || {};
      const saboteurId = currentData.saboteurId;

      const voteCounts = {};
      Object.keys(players).forEach((p) => { voteCounts[p] = 0; });
      let skipCount = 0;

      const votersByTarget = {};
      Object.entries(votes).forEach(([voterId, targetId]) => {
        if (targetId === 'SKIP') {
          skipCount += 1;
        } else if (voteCounts[targetId] !== undefined) {
          voteCounts[targetId] += 1;
        }

        if (!votersByTarget[targetId]) votersByTarget[targetId] = [];
        const voter = players[voterId];
        if (voter) {
          votersByTarget[targetId].push({
            id: voterId,
            name: voter.name,
            avatar: voter.avatar,
            color: voter.color,
            isSelf: voterId === targetId
          });
        }
      });

      let highestPlayerVotes = -1;
      Object.values(voteCounts).forEach((c) => {
        if (c > highestPlayerVotes) highestPlayerVotes = c;
      });

      const mostVoted = Object.keys(voteCounts).filter(
        (id) => voteCounts[id] === highestPlayerVotes && highestPlayerVotes > 0
      );

      // Tie or Skip condition:
      // 1. Skip count >= highest player votes (players chose to skip or tied with skip)
      // 2. More than 1 player shares the highest votes
      // 3. Or no player received any votes
      const isSkipWon = skipCount >= highestPlayerVotes && skipCount > 0;
      const isTie = isSkipWon || mostVoted.length !== 1 || highestPlayerVotes <= 0;

      let accusedPlayerId = null;
      let isSaboteurCaught = false;
      let saboteurEscaped = false;
      const playerScoresThisRound = {};

      if (!isTie) {
        accusedPlayerId = mostVoted[0];
        isSaboteurCaught = accusedPlayerId === saboteurId;
        saboteurEscaped = !isSaboteurCaught;

        Object.entries(players).forEach(([pid, player]) => {
          let roundGain = 0;
          if (pid === saboteurId) {
            if (saboteurEscaped) roundGain += 200;
          } else {
            if (player.voteTargetId === saboteurId) roundGain += 100;
          }
          playerScoresThisRound[pid] = roundGain;
        });
      }

      const roundResults = {
        round: currentData.currentRound,
        isTie,
        isSkipWon,
        skipCount,
        saboteurId,
        citizenPrompt: currentData.citizenPrompt,
        saboteurPrompt: currentData.saboteurPrompt,
        category: currentData.category,
        votes,
        voteCounts,
        votersByTarget,
        accusedPlayerId,
        isSaboteurCaught,
        saboteurEscaped,
        saboteurGuessedPrompt: null,
        saboteurGuessCorrect: false,
        playerScoresThisRound
      };

      // 5-SECOND RESULTS REVEAL WAIT SCREEN (Shows who voted whom!)
      await update(roomRef, {
        phase: 'VOTING_RESULTS',
        timeRemaining: 5,
        roundResults,
        lastActivity: Date.now()
      });
    } else if (phase === 'VOTING_RESULTS') {
      // 5-second results screen completed -> Proceed to Among Us Ejection Reveal
      const results = currentData.roundResults;
      const playerScoreUpdates = {};

      if (!results?.isTie && results?.playerScoresThisRound) {
        Object.entries(currentData.players || {}).forEach(([pid, player]) => {
          const gain = results.playerScoresThisRound[pid] || 0;
          playerScoreUpdates[`players/${pid}/roundScore`] = gain;
          playerScoreUpdates[`players/${pid}/score`] = (player.score || 0) + gain;
        });
      }

      await update(roomRef, {
        phase: 'EJECTION_REVEAL',
        timeRemaining: 6,
        lastActivity: Date.now(),
        ...playerScoreUpdates
      });
    } else if (phase === 'EJECTION_REVEAL') {
      const results = currentData.roundResults;

      // REQUIREMENT: If the vote tied, CONTINUE THE GAME (DO NOT go to next round!)
      if (results?.isTie) {
        // Resume drawing on the same round with existing strokes intact!
        const existingPlayerIds = Object.keys(currentData.players || {});
        let turnOrder = (currentData.turnOrder || []).filter((pid) => existingPlayerIds.includes(pid));
        if (turnOrder.length === 0) {
          turnOrder = existingPlayerIds;
        }
        const firstPlayerId = turnOrder[0] || currentData.hostId;
        const turnDur = currentData.turnDuration || 10;

        const playerResetUpdates = {};
        if (currentData.players) {
          Object.keys(currentData.players).forEach((pid) => {
            playerResetUpdates[`players/${pid}/hasVoted`] = false;
            playerResetUpdates[`players/${pid}/voteTargetId`] = null;
          });
        }

        // REQUIREMENT: If the vote tied, CONTINUE THE GAME with strokes wiped for a fresh tie-breaker round
        // Wipe canvas strokes in Firebase on tie, keeping prompts, category, hint, and roles intact
        await remove(ref(db, `rooms/${activeRoomCode}/strokes`));

        await update(roomRef, {
          phase: 'DRAWING',
          turnOrder,
          currentTurnIndex: 0,
          activePlayerId: firstPlayerId,
          turnTimeRemaining: turnDur,
          strokes: null,
          votes: null,
          roundResults: null,
          isTieBreaker: true,
          lastActivity: Date.now(),
          ...playerResetUpdates
        });
        return;
      }

      // If someone was voted out, proceed to scoring & prompt guess challenge
      await update(roomRef, {
        phase: 'REVEAL_SCORING',
        timeRemaining: 15,
        lastActivity: Date.now()
      });
    } else if (phase === 'REVEAL_SCORING') {
      // Advance to next round or Game Over
      if ((currentData.currentRound || 1) >= (currentData.maxRounds || 5)) {
        await update(roomRef, {
          phase: 'GAME_OVER',
          timeRemaining: 0,
          lastActivity: Date.now()
        });
        if (tickerRef.current) clearInterval(tickerRef.current);
      } else {
        await startNewRound(activeRoomCode, currentData);
      }
    }
  };

  const startNewRound = async (activeRoomCode, currentData) => {
    const roomRef = ref(db, `rooms/${activeRoomCode}`);
    const nextRoundNum = (currentData.currentRound || 0) + 1;
    const usedPrompts = currentData.usedPrompts || [];
    const { pair, updatedUsed } = getShuffledPromptPair(usedPrompts);
    const playerIds = Object.keys(currentData.players || {});
    
    // Shuffle turn order so order varies each round
    const shuffledOrder = [...playerIds].sort(() => Math.random() - 0.5);
    const randomSaboteur = playerIds[Math.floor(Math.random() * playerIds.length)];

    const playerRoundUpdates = {};
    const turnDur = currentData.turnDuration || 10;

    playerIds.forEach((pid) => {
      const isSab = pid === randomSaboteur;
      playerRoundUpdates[`players/${pid}/isSaboteur`] = isSab;
      playerRoundUpdates[`players/${pid}/prompt`] = isSab ? pair.promptB : pair.promptA;
      playerRoundUpdates[`players/${pid}/hasVoted`] = false;
      playerRoundUpdates[`players/${pid}/voteTargetId`] = null;
      playerRoundUpdates[`players/${pid}/roundScore`] = 0;
    });

    await update(roomRef, {
      phase: 'ROLE_REVEAL',
      timeRemaining: 6,
      currentRound: nextRoundNum,
      category: pair.category,
      hint: pair.hint,
      citizenPrompt: pair.promptA,
      saboteurPrompt: pair.promptB,
      saboteurId: randomSaboteur,
      turnOrder: shuffledOrder,
      currentTurnIndex: 0,
      activePlayerId: shuffledOrder[0],
      turnTimeRemaining: turnDur,
      strokes: null,
      votes: null,
      roundResults: null,
      isTieBreaker: false,
      usedPrompts: updatedUsed,
      lastActivity: Date.now(),
      ...playerRoundUpdates
    });

    setStrokes([]);
    runPhaseTimer(activeRoomCode);
  };

  // Real-time room listener with auto-delete when empty
  useEffect(() => {
    if (!roomCode) {
      setRoomState(null);
      setStrokes([]);
      setRemoteCursors({});
      if (tickerRef.current) clearInterval(tickerRef.current);
      return;
    }

    const roomRef = ref(db, `rooms/${roomCode}`);

    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        setRoomState(null);
        setRoomCode(null);
        setError('Room has been closed or removed.');
        return;
      }

      const data = snapshot.val();
      const rawPlayers = data.players || {};
      const playerIds = Object.keys(rawPlayers);

      // Auto-delete room if all players left
      if (playerIds.length === 0) {
        remove(roomRef);
        setRoomState(null);
        setRoomCode(null);
        return;
      }

      const playersList = Object.values(rawPlayers);
      const myPlayerData = rawPlayers[myPlayerId];
      const amIHost = !!(myPlayerData?.isHost || data.hostId === myPlayerId);
      isHostRef.current = amIHost;

      if (amIHost && data.phase !== 'LOBBY' && data.phase !== 'GAME_OVER' && !tickerRef.current) {
        runPhaseTimer(roomCode);
      }

      const currentTimerVal = data.phase === 'DRAWING' ? (data.turnTimeRemaining ?? 0) : (data.timeRemaining ?? 0);

      setTimer((prev) => {
        if (data.phase !== prev.phase && (data.phase === 'VOTING_RESULTS' || data.phase === 'REVEAL_SCORING' || data.phase === 'EJECTION_REVEAL')) {
          playReveal();
        }
        if (data.phase === 'DRAWING' && currentTimerVal <= 3 && currentTimerVal > 0 && currentTimerVal !== prev.timeRemaining) {
          playTick(true);
        }
        return { timeRemaining: currentTimerVal, phase: data.phase };
      });

      const isRevealMode = data.phase === 'EJECTION_REVEAL' || data.phase === 'REVEAL_SCORING' || data.phase === 'GAME_OVER';
      const isResultsAvailable = isRevealMode || data.phase === 'VOTING_RESULTS';

      const publicPlayers = playersList.map((p) => {
        const isSelf = p.id === myPlayerId;
        return {
          id: p.id,
          name: p.name,
          color: p.color,
          avatar: p.avatar,
          isHost: p.isHost,
          score: p.score || 0,
          roundScore: p.roundScore || 0,
          isReady: p.isReady || false,
          hasVoted: p.hasVoted || false,
          voteTargetId: p.voteTargetId || null,
          isSaboteur: isRevealMode ? p.isSaboteur : (isSelf ? p.isSaboteur : null),
          prompt: isRevealMode ? p.prompt : (isSelf ? p.prompt : null)
        };
      });

      setRoomState({
        code: data.code,
        phase: data.phase,
        currentRound: data.currentRound || 0,
        maxRounds: data.maxRounds || 5,
        turnDuration: data.turnDuration || 10,
        drawChances: data.drawChances || 2,
        currentChance: Math.min(
          data.drawChances || 2,
          Math.floor((data.currentTurnIndex || 0) / Math.max(1, (data.turnOrder || playerIds).length)) + 1
        ),
        totalTurns: Math.max(1, (data.turnOrder || playerIds).length) * (data.drawChances || 2),
        votingDuration: data.votingDuration || 30,
        intermissionDuration: data.intermissionDuration || 5,
        maxPlayers: data.maxPlayers || 8,
        turnOrder: data.turnOrder || playerIds,
        currentTurnIndex: data.currentTurnIndex || 0,
        activePlayerId: data.activePlayerId || data.hostId,
        turnTimeRemaining: data.turnTimeRemaining ?? data.turnDuration ?? 10,
        timeRemaining: currentTimerVal,
        category: data.category || '',
        hint: data.hint || '',
        myRole: myPlayerData ? {
          isSaboteur: myPlayerData.isSaboteur,
          prompt: myPlayerData.prompt,
          hasVoted: myPlayerData.hasVoted,
          isHost: amIHost,
          isMyTurn: data.activePlayerId === myPlayerId && data.phase === 'DRAWING'
        } : null,
        strokesCount: strokes.length,
        roundResults: isResultsAvailable ? (
          data.phase === 'VOTING_RESULTS' ? {
            round: data.roundResults?.round,
            isTie: data.roundResults?.isTie,
            isSkipWon: data.roundResults?.isSkipWon,
            skipCount: data.roundResults?.skipCount,
            votes: data.roundResults?.votes,
            voteCounts: data.roundResults?.voteCounts,
            votersByTarget: data.roundResults?.votersByTarget,
            accusedPlayerId: data.roundResults?.accusedPlayerId,
          } : data.roundResults
        ) : null,
        isTieBreaker: !!data.isTieBreaker,
        players: publicPlayers
      });

      // Host early check: if in VOTING and everyone voted -> early advance
      if (amIHost && data.phase === 'VOTING') {
        const allVoted = playersList.length > 0 && playersList.every((p) => p.hasVoted);
        if (allVoted && (data.timeRemaining > 1)) {
          advancePhase(roomCode, data);
        }
      }
    }, (err) => {
      if (err.message && err.message.includes('PERMISSION_DENIED')) {
        setFirebaseRuleAlert(true);
      }
    });

    // Realtime incremental stroke listener
    const strokesRef = ref(db, `rooms/${roomCode}/strokes`);
    const unsubscribeStrokesReset = onValue(strokesRef, (snap) => {
      if (!snap.exists()) {
        setStrokes([]);
      }
    });

    const unsubscribeStrokesAdded = onChildAdded(strokesRef, (snapshot) => {
      const stroke = snapshot.val();
      if (stroke) {
        setStrokes((prev) => {
          if (prev.some((s) => s.id === stroke.id)) return prev;
          return [...prev, stroke];
        });
        if (stroke.playerId !== myPlayerId) {
          playStrokeSound();
        }
      }
    });

    // Remote cursors listener
    const cursorsRef = ref(db, `rooms/${roomCode}/cursors`);
    const unsubscribeCursors = onValue(cursorsRef, (snapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.val();
        const filtered = {};
        Object.entries(raw).forEach(([pid, c]) => {
          if (pid !== myPlayerId) filtered[pid] = c;
        });
        setRemoteCursors(filtered);
      } else {
        setRemoteCursors({});
      }
    });

    return () => {
      unsubscribeRoom();
      unsubscribeStrokesReset();
      unsubscribeStrokesAdded();
      unsubscribeCursors();
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [roomCode, myPlayerId, runPhaseTimer]);

  // Actions
  const createRoom = useCallback(async (hostName, color, avatar) => {
    setError(null);
    setFirebaseRuleAlert(false);
    setLoadingRoom(true);

    const code = generateRoomCode();
    const roomRef = ref(db, `rooms/${code}`);

    const newRoom = {
      code,
      hostId: myPlayerId,
      createdAt: serverTimestamp(),
      lastActivity: Date.now(),
      phase: 'LOBBY',
      currentRound: 0,
      maxRounds: 5,
      turnDuration: 10,
      drawChances: 2,
      votingDuration: 30,
      intermissionDuration: 5,
      maxPlayers: 8,
      timeRemaining: 0,
      whiteboardPattern: 'dotted',
      usedPrompts: [],
      players: {
        [myPlayerId]: {
          id: myPlayerId,
          name: hostName.trim().slice(0, 16) || 'Artist_1',
          color: color || '#18181b',
          avatar: avatar || '🦊',
          isHost: true,
          score: 0,
          roundScore: 0,
          hasVoted: false,
          voteTargetId: null,
          prompt: '',
          isSaboteur: false
        }
      }
    };

    try {
      await set(roomRef, newRoom);

      const myPlayerRef = ref(db, `rooms/${code}/players/${myPlayerId}`);
      onDisconnect(myPlayerRef).remove();
      const myCursorRef = ref(db, `rooms/${code}/cursors/${myPlayerId}`);
      onDisconnect(myCursorRef).remove();

      setRoomCode(code);
      isHostRef.current = true;
      setLoadingRoom(false);
      return { success: true, roomCode: code };
    } catch (err) {
      setLoadingRoom(false);
      if (err.message && err.message.includes('PERMISSION_DENIED')) {
        setFirebaseRuleAlert(true);
        setError('Firebase Permission Denied: Realtime Database rules need to be enabled in Firebase Console.');
      } else {
        setError(err.message);
      }
      throw err;
    }
  }, [myPlayerId]);

  const joinRoom = useCallback(async (code, playerName, color, avatar) => {
    setError(null);
    setFirebaseRuleAlert(false);
    setLoadingRoom(true);
    const cleanCode = (code || '').toUpperCase().trim();
    if (!cleanCode) {
      setLoadingRoom(false);
      throw new Error('Please enter a 4-letter room code');
    }

    try {
      const roomRef = ref(db, `rooms/${cleanCode}`);
      const snap = await get(roomRef);

      if (!snap.exists()) {
        setLoadingRoom(false);
        throw new Error(`Room "${cleanCode}" not found. Please verify the code.`);
      }

      const data = snap.val();
      const existingPlayers = data.players || {};
      const count = Object.keys(existingPlayers).length;

      if (count >= (data.maxPlayers || 8) && !existingPlayers[myPlayerId]) {
        setLoadingRoom(false);
        throw new Error('Room is full');
      }

      const playerObj = {
        id: myPlayerId,
        name: playerName.trim().slice(0, 16) || `Artist_${count + 1}`,
        color: color || '#18181b',
        avatar: avatar || '🦊',
        isHost: count === 0 || data.hostId === myPlayerId,
        score: existingPlayers[myPlayerId]?.score || 0,
        roundScore: 0,
        hasVoted: false,
        voteTargetId: null,
        prompt: '',
        isSaboteur: false
      };

      await update(ref(db, `rooms/${cleanCode}/players`), { [myPlayerId]: playerObj });
      await update(roomRef, { lastActivity: Date.now() });

      const myPlayerRef = ref(db, `rooms/${cleanCode}/players/${myPlayerId}`);
      onDisconnect(myPlayerRef).remove();
      const myCursorRef = ref(db, `rooms/${cleanCode}/cursors/${myPlayerId}`);
      onDisconnect(myCursorRef).remove();

      setRoomCode(cleanCode);
      isHostRef.current = playerObj.isHost;
      setLoadingRoom(false);
      return { success: true, roomCode: cleanCode };
    } catch (err) {
      setLoadingRoom(false);
      if (err.message && err.message.includes('PERMISSION_DENIED')) {
        setFirebaseRuleAlert(true);
        setError('Firebase Permission Denied: Realtime Database rules need to be enabled in Firebase Console.');
      } else {
        setError(err.message);
      }
      throw err;
    }
  }, [myPlayerId]);

  const updateSettings = useCallback(async (settings) => {
    if (!roomCode || !isHostRef.current) return;
    await update(ref(db, `rooms/${roomCode}`), {
      maxPlayers: Number(settings.maxPlayers),
      turnDuration: Number(settings.turnDuration),
      drawChances: Number(settings.drawChances || 2),
      votingDuration: Number(settings.votingDuration),
      intermissionDuration: Number(settings.intermissionDuration),
      maxRounds: Number(settings.maxRounds),
      whiteboardPattern: settings.whiteboardPattern || 'dotted',
      lastActivity: Date.now()
    });
    return { success: true };
  }, [roomCode]);

  const startGame = useCallback(async () => {
    if (!roomCode || !isHostRef.current) return;
    const snap = await get(ref(db, `rooms/${roomCode}`));
    if (!snap.exists()) return;
    const data = snap.val();

    const resetPlayerScores = {};
    if (data.players) {
      Object.keys(data.players).forEach((pid) => {
        resetPlayerScores[`players/${pid}/score`] = 0;
        resetPlayerScores[`players/${pid}/roundScore`] = 0;
      });
    }

    await update(ref(db, `rooms/${roomCode}`), {
      currentRound: 0,
      lastActivity: Date.now(),
      ...resetPlayerScores
    });

    await startNewRound(roomCode, { ...data, currentRound: 0 });
    return { success: true };
  }, [roomCode]);

  // Turn Pass / Done Action
  const passTurn = useCallback(async () => {
    if (!roomCode) return;
    const snap = await get(ref(db, `rooms/${roomCode}`));
    if (!snap.exists()) return;
    const data = snap.val();
    if (data.phase !== 'DRAWING' || data.activePlayerId !== myPlayerId) return;

    await advanceDrawingTurn(roomCode, data);
  }, [roomCode, myPlayerId]);

  const drawStroke = useCallback((strokeData) => {
    if (!roomCode) return;
    const strokesRef = ref(db, `rooms/${roomCode}/strokes`);
    const newStrokeRef = push(strokesRef);
    const strokeWithId = {
      ...strokeData,
      id: newStrokeRef.key,
      playerId: myPlayerId,
      timestamp: Date.now()
    };

    setStrokes((prev) => [...prev, strokeWithId]);
    set(newStrokeRef, strokeWithId);
    playStrokeSound();
  }, [roomCode, myPlayerId]);

  const sendCursor = useCallback((coords) => {
    if (!roomCode) return;
    const cursorRef = ref(db, `rooms/${roomCode}/cursors/${myPlayerId}`);
    set(cursorRef, {
      playerId: myPlayerId,
      x: coords.x,
      y: coords.y,
      isDrawing: !!coords.isDrawing,
      name: roomState?.players?.find(p => p.id === myPlayerId)?.name || 'Player',
      color: roomState?.players?.find(p => p.id === myPlayerId)?.color || '#18181b',
      avatar: roomState?.players?.find(p => p.id === myPlayerId)?.avatar || '🦊',
      timestamp: Date.now()
    });
  }, [roomCode, myPlayerId, roomState]);

  const submitVote = useCallback(async (targetPlayerId) => {
    if (!roomCode) return;
    await update(ref(db, `rooms/${roomCode}/votes`), { [myPlayerId]: targetPlayerId });
    await update(ref(db, `rooms/${roomCode}/players/${myPlayerId}`), {
      hasVoted: true,
      voteTargetId: targetPlayerId
    });
    return { success: true };
  }, [roomCode, myPlayerId]);

  const submitSaboteurGuess = useCallback(async (guess) => {
    if (!roomCode) return;
    const snap = await get(ref(db, `rooms/${roomCode}`));
    if (!snap.exists()) return;
    const data = snap.val();

    const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const cleanGuess = normalize(guess);
    const cleanTarget = normalize(data.citizenPrompt);

    let isMatch = (cleanGuess === cleanTarget) ||
      (cleanTarget.length > 3 && cleanGuess.includes(cleanTarget)) ||
      (cleanGuess.length > 3 && cleanTarget.includes(cleanGuess));

    if (!isMatch) {
      const targetWords = cleanTarget.split(' ').filter((w) => w.length > 2);
      const guessWords = cleanGuess.split(' ').filter((w) => w.length > 2);
      if (targetWords.some((tw) => guessWords.includes(tw)) && targetWords.length > 0) {
        isMatch = true;
      }
    }

    const updates = {
      'roundResults/saboteurGuessedPrompt': guess,
      'roundResults/saboteurGuessCorrect': isMatch
    };

    if (isMatch) {
      const currentScore = data.players?.[myPlayerId]?.score || 0;
      const currentRoundScore = data.players?.[myPlayerId]?.roundScore || 0;
      updates[`players/${myPlayerId}/score`] = currentScore + 50;
      updates[`players/${myPlayerId}/roundScore`] = currentRoundScore + 50;
      updates[`roundResults/playerScoresThisRound/${myPlayerId}`] = currentRoundScore + 50;
    }

    await update(ref(db, `rooms/${roomCode}`), updates);
    return { success: true, isMatch };
  }, [roomCode, myPlayerId]);

  const wipeCanvas = useCallback(async () => {
    if (!roomCode || !isHostRef.current) return;
    await remove(ref(db, `rooms/${roomCode}/strokes`));
    setStrokes([]);
    return { success: true };
  }, [roomCode]);

  const nextRound = useCallback(async () => {
    if (!roomCode || !isHostRef.current) return;
    const snap = await get(ref(db, `rooms/${roomCode}`));
    if (!snap.exists()) return;
    await advancePhase(roomCode, snap.val());
    return { success: true };
  }, [roomCode]);

  const playAgain = useCallback(async () => {
    if (!roomCode || !isHostRef.current) return;
    const snap = await get(ref(db, `rooms/${roomCode}`));
    if (!snap.exists()) return;
    const data = snap.val();

    const playerResets = {};
    if (data.players) {
      Object.keys(data.players).forEach((pid) => {
        playerResets[`players/${pid}/score`] = 0;
        playerResets[`players/${pid}/roundScore`] = 0;
        playerResets[`players/${pid}/hasVoted`] = false;
        playerResets[`players/${pid}/voteTargetId`] = null;
        playerResets[`players/${pid}/isSaboteur`] = false;
        playerResets[`players/${pid}/prompt`] = '';
      });
    }

    await update(ref(db, `rooms/${roomCode}`), {
      phase: 'LOBBY',
      currentRound: 0,
      timeRemaining: 0,
      strokes: null,
      votes: null,
      roundResults: null,
      isTieBreaker: false,
      lastActivity: Date.now(),
      ...playerResets
    });

    setStrokes([]);
    if (tickerRef.current) clearInterval(tickerRef.current);
    return { success: true };
  }, [roomCode]);

  const leaveRoom = useCallback(async () => {
    if (roomCode) {
      try {
        const roomRef = ref(db, `rooms/${roomCode}`);
        const playersRef = ref(db, `rooms/${roomCode}/players`);
        const snap = await get(playersRef);

        if (snap.exists()) {
          const players = snap.val() || {};
          const remainingKeys = Object.keys(players).filter((k) => k !== myPlayerId);

          if (remainingKeys.length === 0) {
            await remove(roomRef);
          } else {
            await remove(ref(db, `rooms/${roomCode}/players/${myPlayerId}`));
            await remove(ref(db, `rooms/${roomCode}/cursors/${myPlayerId}`));

            if (isHostRef.current && remainingKeys.length > 0) {
              const nextHostId = remainingKeys[0];
              await update(roomRef, {
                hostId: nextHostId,
                [`players/${nextHostId}/isHost`]: true,
                lastActivity: Date.now()
              });
            }
          }
        } else {
          await remove(roomRef);
        }
      } catch (err) {
        console.warn('Leave room cleanup error:', err);
      }
    }

    setRoomCode(null);
    setRoomState(null);
    setStrokes([]);
    setRemoteCursors({});
    if (tickerRef.current) clearInterval(tickerRef.current);
  }, [roomCode, myPlayerId]);

  return (
    <GameContext.Provider
      value={{
        socket: { id: myPlayerId },
        connected,
        roomState,
        timer,
        strokes,
        remoteCursors,
        error,
        setError,
        loadingRoom,
        firebaseRuleAlert,
        setFirebaseRuleAlert,
        createRoom,
        joinRoom,
        updateSettings,
        startGame,
        passTurn,
        drawStroke,
        sendCursor,
        submitVote,
        submitSaboteurGuess,
        nextRound,
        playAgain,
        leaveRoom,
        wipeCanvas
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGameSocket = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameSocket must be used within a SocketProvider');
  }
  return context;
};

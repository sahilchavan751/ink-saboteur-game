import { useState, useEffect, useRef, useCallback } from 'react';
import { ref, set, push, onValue, onChildAdded, remove, off } from 'firebase/database';
import { db } from '../firebase';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// Maximum distance on normalized canvas (0 to ~1.4) before voice is inaudible
const MAX_PROXIMITY_DISTANCE = 0.45;
const FULL_VOLUME_DISTANCE = 0.10;

export const useProximityChat = ({
  roomCode,
  myPlayerId,
  players = [],
  remoteCursors = {},
  localCursor = { x: 0.5, y: 0.5 },
  isInGame = false
}) => {
  const [isProximityEnabled, setIsProximityEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingPeers, setSpeakingPeers] = useState({});
  const [micError, setMicError] = useState(null);
  const [proximityMessages, setProximityMessages] = useState([]);

  // Audio Context & Stream Refs
  const localStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const peersRef = useRef({}); // { [peerId]: { pc, gainNode, pannerNode, analyser, audioEl } }
  const pendingCandidatesRef = useRef({}); // { [peerId]: [candidate] }
  const animFrameRef = useRef(null);

  // 1. Cleanup all WebRTC & AudioContext resources
  const cleanupProximity = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close and remove peer connections
    Object.entries(peersRef.current).forEach(([peerId, peerObj]) => {
      try {
        if (peerObj.pc) peerObj.pc.close();
        if (peerObj.audioEl) {
          peerObj.audioEl.srcObject = null;
          peerObj.audioEl.remove();
        }
      } catch (e) {}
    });
    peersRef.current = {};

    // Close AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }

    setIsSpeaking(false);
    setSpeakingPeers({});
    pendingCandidatesRef.current = {};

    // Remove signaling records for myPlayerId
    if (roomCode && myPlayerId) {
      remove(ref(db, `rooms/${roomCode}/voiceSignaling/${myPlayerId}`)).catch(() => {});
    }
  }, [roomCode, myPlayerId]);

  // 2. Initialize Microphone and AudioContext
  const startLocalAudio = useCallback(async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      localStreamRef.current = stream;

      // Create Web Audio Context
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      // Analyser for local speaking detection
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      return stream;
    } catch (err) {
      console.warn('Microphone access failed:', err);
      setMicError(err.name === 'NotAllowedError'
        ? 'Microphone permission denied. Proximity text chat is still active.'
        : 'No microphone found or access error.');
      throw err;
    }
  }, []);

  // 3. Connect to a remote peer via WebRTC
  const createPeerConnection = useCallback((peerId, isOfferer, stream) => {
    if (peersRef.current[peerId]?.pc) {
      return peersRef.current[peerId].pc;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    const audioCtx = audioContextRef.current;

    let gainNode = null;
    let pannerNode = null;
    let peerAnalyser = null;
    let audioEl = null;

    if (audioCtx) {
      gainNode = audioCtx.createGain();
      gainNode.gain.value = 0.8;

      if (audioCtx.createStereoPanner) {
        pannerNode = audioCtx.createStereoPanner();
        pannerNode.pan.value = 0;
        gainNode.connect(pannerNode);
        pannerNode.connect(audioCtx.destination);
      } else {
        gainNode.connect(audioCtx.destination);
      }

      peerAnalyser = audioCtx.createAnalyser();
      peerAnalyser.fftSize = 256;
      gainNode.connect(peerAnalyser);
    }

    // Add local tracks if available
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    // Handle remote track
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (audioCtx && gainNode) {
        try {
          const remoteSource = audioCtx.createMediaStreamSource(remoteStream);
          remoteSource.connect(gainNode);
        } catch (e) {}
      }

      // Reliable HTML5 audio element for cross-browser playback
      let audioEl = peersRef.current[peerId]?.audioEl;
      if (!audioEl) {
        audioEl = document.createElement('audio');
        audioEl.autoplay = true;
        audioEl.playsInline = true;
        document.body.appendChild(audioEl);
      }
      audioEl.srcObject = remoteStream;
      audioEl.volume = 0.8;
      audioEl.play().catch((err) => console.warn('Audio element play err:', err));

      if (peersRef.current[peerId]) {
        peersRef.current[peerId].audioEl = audioEl;
      }
    };

    // Send ICE candidates to Firebase
    pc.onicecandidate = (event) => {
      if (event.candidate && roomCode) {
        const candRef = push(ref(db, `rooms/${roomCode}/voiceSignaling/${peerId}/${myPlayerId}/candidates`));
        set(candRef, event.candidate.toJSON());
      }
    };

    peersRef.current[peerId] = {
      pc,
      gainNode,
      pannerNode,
      analyser: peerAnalyser,
      audioEl
    };

    // If I'm the offerer, create and upload the offer
    if (isOfferer) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          set(ref(db, `rooms/${roomCode}/voiceSignaling/${peerId}/${myPlayerId}/offer`), {
            type: pc.localDescription.type,
            sdp: pc.localDescription.sdp
          });
        })
        .catch((e) => console.warn('Offer creation error:', e));
    }

    return pc;
  }, [roomCode, myPlayerId]);

  // 4. Toggle Proximity Chat ON / OFF
  const toggleProximity = useCallback(async () => {
    if (isProximityEnabled) {
      cleanupProximity();
      setIsProximityEnabled(false);
    } else {
      try {
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        const stream = await startLocalAudio();
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        setIsProximityEnabled(true);

        // Initiate mesh with other players in the room
        players.forEach((p) => {
          if (p.id !== myPlayerId) {
            // Offerer is deterministic: lower player ID initiates
            const isOfferer = myPlayerId < p.id;
            createPeerConnection(p.id, isOfferer, stream);
          }
        });
      } catch (e) {
        // Fallback: enabled in text-only mode
        setIsProximityEnabled(true);
      }
    }
  }, [isProximityEnabled, cleanupProximity, startLocalAudio, players, myPlayerId, createPeerConnection]);

  // 5. Toggle Mic Mute
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const nextMuted = !isMuted;
      audioTrack.enabled = !nextMuted;
      setIsMuted(nextMuted);
    }
  }, [isMuted]);

  // 6. WebRTC Signaling Listener (Firebase)
  useEffect(() => {
    if (!isProximityEnabled || !roomCode || !myPlayerId) return;

    const incomingRef = ref(db, `rooms/${roomCode}/voiceSignaling/${myPlayerId}`);

    const unsubscribeSignaling = onValue(incomingRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.val();

      Object.entries(data).forEach(async ([senderId, message]) => {
        let peerObj = peersRef.current[senderId];

        // Create PC if not already created
        if (!peerObj?.pc) {
          const stream = localStreamRef.current;
          createPeerConnection(senderId, false, stream);
          peerObj = peersRef.current[senderId];
        }

        const pc = peerObj?.pc;
        if (!pc) return;

        // Drain helper for buffered ICE candidates
        const drainCandidates = async () => {
          const pending = pendingCandidatesRef.current[senderId] || [];
          for (const cand of pending) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {}
          }
          pendingCandidatesRef.current[senderId] = [];
        };

        // Handle incoming Offer
        if (message.offer && pc.signalingState === 'stable') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
            await drainCandidates();
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await set(ref(db, `rooms/${roomCode}/voiceSignaling/${senderId}/${myPlayerId}/answer`), {
              type: answer.type,
              sdp: answer.sdp
            });
          } catch (err) {
            console.warn('Error handling offer:', err);
          }
        }

        // Handle incoming Answer
        if (message.answer && pc.signalingState === 'have-local-offer') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(message.answer));
            await drainCandidates();
          } catch (err) {
            console.warn('Error handling answer:', err);
          }
        }

        // Handle incoming ICE Candidates
        if (message.candidates) {
          const cands = Object.values(message.candidates);
          for (const cand of cands) {
            if (pc.remoteDescription && pc.remoteDescription.type) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (err) {}
            } else {
              if (!pendingCandidatesRef.current[senderId]) {
                pendingCandidatesRef.current[senderId] = [];
              }
              pendingCandidatesRef.current[senderId].push(cand);
            }
          }
        }
      });
    });

    return () => {
      off(incomingRef);
    };
  }, [isProximityEnabled, roomCode, myPlayerId, createPeerConnection]);

  // 7. Dynamic Distance-Based Spatial Audio Calculation loop
  useEffect(() => {
    if (!isProximityEnabled) return;

    const updateSpatialAudio = () => {
      const myPos = localCursor || { x: 0.5, y: 0.5 };
      const currentSpeakingPeers = {};

      Object.entries(peersRef.current).forEach(([peerId, peerObj]) => {
        const { gainNode, pannerNode, analyser, audioEl } = peerObj;
        const peerCursor = remoteCursors[peerId];

        let vol = 0.75;
        let pan = 0;

        if (peerCursor && isInGame) {
          // Distance on normalized canvas (0 to 1)
          const dx = peerCursor.x - myPos.x;
          const dy = peerCursor.y - myPos.y;
          const dist = Math.hypot(dx, dy);

          if (dist <= FULL_VOLUME_DISTANCE) {
            vol = 1.0;
          } else if (dist < MAX_PROXIMITY_DISTANCE) {
            vol = Math.max(0, 1 - (dist - FULL_VOLUME_DISTANCE) / (MAX_PROXIMITY_DISTANCE - FULL_VOLUME_DISTANCE));
          } else {
            vol = 0;
          }

          pan = Math.max(-1, Math.min(1, dx * 2.5));
        }

        if (gainNode && audioContextRef.current) {
          // Smooth linear volume ramp
          gainNode.gain.setTargetAtTime(vol, audioContextRef.current.currentTime, 0.05);
          // Stereo Left/Right Pan
          if (pannerNode) {
            pannerNode.pan.setTargetAtTime(pan, audioContextRef.current.currentTime, 0.05);
          }
        }

        // Also control fallback HTML5 audio element volume directly
        if (audioEl) {
          audioEl.volume = Math.max(0, Math.min(1, vol));
          if (audioEl.paused && vol > 0.05) {
            audioEl.play().catch(() => {});
          }
        }

        // Check speaking amplitude of remote peer
        if (analyser) {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((acc, v) => acc + v, 0) / dataArray.length;
          if (avg > 18) {
            currentSpeakingPeers[peerId] = true;
          }
        }
      });

      // Check local speaking
      if (analyserRef.current && !isMuted) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((acc, v) => acc + v, 0) / dataArray.length;
        setIsSpeaking(avg > 18);
      } else {
        setIsSpeaking(false);
      }

      setSpeakingPeers(currentSpeakingPeers);
      animFrameRef.current = requestAnimationFrame(updateSpatialAudio);
    };

    animFrameRef.current = requestAnimationFrame(updateSpatialAudio);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isProximityEnabled, localCursor, remoteCursors, isInGame, isMuted]);

  // 8. Proximity Text Messages (Live Speech Bubbles on Canvas)
  const sendProximityMessage = useCallback((text) => {
    if (!roomCode || !text.trim()) return;
    const msgRef = push(ref(db, `rooms/${roomCode}/proximityMessages`));
    set(msgRef, {
      id: msgRef.key,
      playerId: myPlayerId,
      text: text.trim().slice(0, 70),
      x: localCursor?.x ?? 0.5,
      y: localCursor?.y ?? 0.5,
      timestamp: Date.now()
    });
  }, [roomCode, myPlayerId, localCursor]);

  // Listen for proximity text messages
  useEffect(() => {
    if (!roomCode) return;
    const messagesRef = ref(db, `rooms/${roomCode}/proximityMessages`);

    const unsubscribeMessages = onChildAdded(messagesRef, (snapshot) => {
      const msg = snapshot.val();
      if (!msg) return;

      setProximityMessages((prev) => [...prev.slice(-15), msg]);

      // Auto-expire speech bubble from active list after 5 seconds
      setTimeout(() => {
        setProximityMessages((prev) => prev.filter((m) => m.id !== msg.id));
      }, 5000);
    });

    return () => {
      off(messagesRef);
    };
  }, [roomCode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanupProximity();
  }, [cleanupProximity]);

  return {
    isProximityEnabled,
    toggleProximity,
    isMuted,
    toggleMute,
    isSpeaking,
    speakingPeers,
    micError,
    sendProximityMessage,
    proximityMessages
  };
};

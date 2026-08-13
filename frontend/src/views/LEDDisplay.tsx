import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Volume2, VolumeX, Building2, Radio, BellRing, MapPin } from 'lucide-react';
import { io } from 'socket.io-client';
import { fetchApi, SOCKET_URL } from '../api';
 
export const LEDDisplay = () => {
  const [searchParams] = useSearchParams();
  const urlAdminId = searchParams.get('adminId') || '';

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(urlAdminId);
  const [displayData, setDisplayData] = useState<any[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastCallAnnouncement, setLastCallAnnouncement] = useState<string>('');
 
  // Sequential Announcement Queue System & Full-Screen Overlay State
  const [announcementQueue, setAnnouncementQueue] = useState<any[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activeAnnouncingToken, setActiveAnnouncingToken] = useState<any | null>(null);
 
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);
 
  const activeTokenRef = useRef<any>(null);
  useEffect(() => {
    activeTokenRef.current = activeAnnouncingToken;
  }, [activeAnnouncingToken]);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const res = await fetchApi('/admin/branches');
      setBranches(res.branches || []);
    } catch (err) {
      console.error("Failed to load branches:", err);
    }
  };
 
  useEffect(() => {
    loadDisplayData();
 
    // Preload speech voices
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
 
    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });
 
    socket.on('counter_next', (data) => {
      loadDisplayData();
      if (data.token) {
        const newToken = data.token;
        setAnnouncementQueue((prev) => {
          // Ignore duplicate rapid announcement clicks for the exact same token
          const isAlreadyInQueue = prev.some(
            (item) => item.token?.id === newToken.id || item.token?.tokenNumber === newToken.tokenNumber
          );
          const isCurrentlyActive =
            activeTokenRef.current?.id === newToken.id ||
            activeTokenRef.current?.tokenNumber === newToken.tokenNumber;
 
          if (isAlreadyInQueue || isCurrentlyActive) {
            console.log("Duplicate rapid announcement click ignored for token:", newToken.tokenNumber);
            return prev;
          }
          return [...prev, { token: newToken, queueId: Math.random() }];
        });
      }
    });
 
    socket.on('queue_updated', () => {
      loadDisplayData();
    });
 
    return () => {
      socket.disconnect();
    };
  }, [selectedBranchId, urlAdminId]);
 
  // Process Announcement Queue Sequentially
  useEffect(() => {
    if (!isSpeaking && announcementQueue.length > 0) {
      const currentItem = announcementQueue[0];
      processNextAnnouncement(currentItem);
    }
  }, [announcementQueue, isSpeaking]);
 
  const loadDisplayData = async () => {
    try {
      const targetAdminId = selectedBranchId || urlAdminId;
      const endpoint = targetAdminId ? `/admin/display?adminId=${targetAdminId}` : '/admin/display';
      const data = await fetchApi(endpoint);
      const rawList = data.displayData || [];
      setDisplayData(rawList);
    } catch (err: any) {
      console.error("Display load error:", err);
    }
  };
 
  const getFemaleVoice = (): SpeechSynthesisVoice | null => {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;
 
    let voice = voices.find(
      (v) => (v.lang.includes('en-IN') || v.name.includes('India')) && (v.name.includes('Female') || v.name.includes('Heera') || v.name.includes('Google') || v.name.includes('Veena'))
    );
    if (!voice) {
      voice = voices.find((v) => v.lang.includes('en-IN') || v.lang.includes('en_IN'));
    }
    if (!voice) {
      voice = voices.find((v) =>
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('zira') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('karen') ||
        v.name.toLowerCase().includes('victoria')
      );
    }
    return voice || voices[0];
  };
 
  const processNextAnnouncement = (item: { token: any }) => {
    const { token } = item;
    if (!token) {
      setAnnouncementQueue((prev) => prev.slice(1));
      return;
    }
 
    const tokenSpoken = token.tokenNumber.split('').join(' ');
    const counterName = token.counter?.name || 'Counter';
 
    setLastCallAnnouncement(`${token.tokenNumber} → ${counterName}`);
 
    // Lock engine & show zoomed card / full screen overlay modal immediately
    setIsSpeaking(true);
    setActiveAnnouncingToken(token);
 
    const startTime = Date.now();
    let finished = false;
 
    const finishAnnouncement = () => {
      if (finished) return;
      finished = true;
 
      const elapsed = Date.now() - startTime;
      const minDisplayDuration = 10000; // Guaranteed minimum 4.5s display time
      const remainingTime = Math.max(0, minDisplayDuration - elapsed);
 
      setTimeout(() => {
        // Hide zoomed card / full screen overlay modal
        setActiveAnnouncingToken(null);
 
        // Wait 2-second gap before starting next queued announcement
        setTimeout(() => {
          setIsSpeaking(false);
          setAnnouncementQueue((prev) => prev.slice(1));
        }, 2000);
      }, remainingTime);
    };
 
    if (soundEnabledRef.current) {
      const text = `Attention please. Token number ${tokenSpoken}, please proceed to ${counterName}`;
      if ((window as any).AndroidTTS) {
        try {
          (window as any).AndroidTTS.speak(text);
          // Wait 5 seconds to simulate native TTS speaking completion
          setTimeout(() => {
            finishAnnouncement();
          }, 5000);
        } catch (err) {
          console.error("Native TTS error:", err);
          finishAnnouncement();
        }
      } else if (window.speechSynthesis) {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          const voice = getFemaleVoice();
          if (voice) utterance.voice = voice;
          utterance.lang = voice?.lang || 'en-IN';
          utterance.rate = 0.85;
          utterance.pitch = 1.15;
          utterance.volume = 1.0;
 
          utterance.onend = finishAnnouncement;
          utterance.onerror = finishAnnouncement;
 
          // Safety fallback timer (max 6s)
          setTimeout(() => {
            finishAnnouncement();
          }, 6000);
 
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.error("Speech synthesis error:", err);
          finishAnnouncement();
        }
      } else {
        finishAnnouncement();
      }
    } else {
      finishAnnouncement();
    }
  };
 
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', padding: 'clamp(10px, 2.5vw, 24px)' }}>
      {/* Top Header Banner */}
      <div className="display-header-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: '#ffffff', padding: 'clamp(12px, 3vw, 18px) clamp(14px, 3vw, 26px)', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#0f2b5c', padding: '10px', borderRadius: '12px', flexShrink: 0, color: 'white' }}>
            <Building2 size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(1rem, 2.8vw, 2rem)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', lineHeight: 1.2, color: '#0f172a' }}>
              Provident Fund Office - Queue Status Display
            </h1>
            <span style={{ color: '#475569', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <Radio size={14} style={{ color: '#16a34a' }} /> Real-time Live Synchronization Active
            </span>
          </div>
        </div>
 
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {branches.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#eff6ff', border: '1px solid #93c5fd', padding: '6px 14px', borderRadius: '30px' }}>
              <MapPin size={15} style={{ color: '#1d4ed8' }} />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#1d4ed8', fontWeight: 800, fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}
              >
                <option value="">All Offices / Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city || 'Branch'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {lastCallAnnouncement && (
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#b45309', padding: '6px 14px', borderRadius: '30px', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BellRing size={15} /> Last Called: {lastCallAnnouncement}
            </div>
          )}
 
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              padding: '8px 16px',
              borderRadius: '30px',
              border: soundEnabled ? '1px solid #86efac' : '1px solid #fca5a5',
              background: soundEnabled ? '#f0fdf4' : '#fef2f2',
              color: soundEnabled ? '#15803d' : '#b91c1c',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem'
            }}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />} Voice Announcement: {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
 
      {/* Almost Full-Screen Announcement Overlay Modal */}
      {activeAnnouncingToken && (
        <div
          className="animate-fade"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '12px'
          }}
        >
          <div
            className="animate-slide"
            style={{
              width: '94vw',
              maxWidth: '1200px',
              maxHeight: '92vh',
              overflowY: 'auto',
              background: 'linear-gradient(135deg, #0f2b5c 0%, #1e40af 100%)',
              border: '4px solid #60a5fa',
              borderRadius: '24px',
              boxShadow: '0 30px 90px rgba(29, 78, 216, 0.6), 0 0 50px rgba(96, 165, 250, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 'clamp(18px, 4vw, 45px) clamp(14px, 4vw, 36px)',
              color: '#ffffff',
              position: 'relative'
            }}
          >
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#fde047',
                padding: '6px 16px',
                borderRadius: '30px',
                fontSize: 'clamp(0.72rem, 2vw, 0.95rem)',
                fontWeight: 800,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                backdropFilter: 'blur(4px)'
              }}
            >
              <Volume2 size={18} style={{ color: '#fde047' }} /> LIVE ANNOUNCEMENT IN PROGRESS
            </div>
 
            <h2 style={{ fontSize: 'clamp(1.1rem, 3vw, 2.6rem)', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', margin: '6px 0', letterSpacing: '1px', lineHeight: 1.2 }}>
              {activeAnnouncingToken.counter?.name || 'COUNTER'}
            </h2>
 
            <div style={{ margin: '10px 0' }}>
              <span style={{ fontSize: 'clamp(0.78rem, 2vw, 1rem)', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#93c5fd', fontWeight: 700 }}>
                PLEASE PROCEED TO COUNTER WITH TOKEN
              </span>
              <h1 style={{ fontSize: 'clamp(3.5rem, 10vw, 9rem)', fontWeight: 900, color: '#facc15', fontFamily: 'monospace', margin: '4px 0', lineHeight: 1, textShadow: '0 0 40px rgba(250, 204, 21, 0.5)' }}>
                {activeAnnouncingToken.tokenNumber}
              </h1>
            </div>
 
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '12px 20px', borderRadius: '16px', backdropFilter: 'blur(4px)', width: '100%', maxWidth: '800px' }}>
              <h3 style={{ fontSize: 'clamp(1rem, 2.5vw, 2rem)', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Visitor: {activeAnnouncingToken.visitorName}
              </h3>
              {activeAnnouncingToken.issue?.name && (
                <p style={{ fontSize: 'clamp(0.82rem, 1.8vw, 1.1rem)', color: '#cbd5e1', marginTop: '4px', margin: '4px 0 0 0' }}>
                  Service / Claim: <strong style={{ color: '#93c5fd' }}>{activeAnnouncingToken.issue.name}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
 
      {/* 3 Cards Per Row Grid Layout (Mobile Responsive) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(14px, 3vw, 24px)' }}>
        {displayData.map((item, index) => {
          const isAnnouncingThisCard = !!activeAnnouncingToken && (() => {
            if (activeAnnouncingToken.counterId === item.counter?.id || activeAnnouncingToken.counter?.id === item.counter?.id) {
              return true;
            }
            const tokenPrefix = activeAnnouncingToken.tokenNumber ? activeAnnouncingToken.tokenNumber.charAt(0).toUpperCase() : '';
            const counterPrefix = item.counter?.tokenPrefix ? item.counter.tokenPrefix.charAt(0).toUpperCase() : '';
            if (tokenPrefix && counterPrefix && tokenPrefix === counterPrefix) {
              return true;
            }
            const activeName = activeAnnouncingToken.counter?.name || '';
            const itemCounterName = item.counter?.name || '';
            if (activeName && itemCounterName) {
              const activeNum = activeName.match(/Counter\s*(\d+)/i)?.[1];
              const itemNum = itemCounterName.match(/Counter\s*(\d+)/i)?.[1];
              if (activeNum && itemNum && activeNum === itemNum) {
                return true;
              }
            }
            return false;
          })();
 
          const servingTokenToDisplay = isAnnouncingThisCard ? activeAnnouncingToken : item.currentServing;
          const isServing = !!servingTokenToDisplay;
 
          return (
            <div
              key={item.counter?.id || index}
              className={isAnnouncingThisCard ? 'announce-zoom' : ''}
              style={{
                background: isAnnouncingThisCard ? '#eff6ff' : '#ffffff',
                border: isAnnouncingThisCard ? '4px solid #1d4ed8' : isServing ? '2px solid #0f2b5c' : '1px solid #cbd5e1',
                borderRadius: '20px',
                padding: 'clamp(18px, 4vw, 28px) clamp(12px, 3vw, 22px)',
                textAlign: 'center',
                boxShadow: isAnnouncingThisCard ? '0 25px 60px rgba(29, 78, 216, 0.4)' : isServing ? '0 8px 24px rgba(15, 43, 92, 0.12)' : '0 2px 10px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '340px',
                position: 'relative',
                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease, border-color 0.4s ease'
              }}
            >
              {/* Active Announcement Badge overlay on Card */}
              {isAnnouncingThisCard && (
                <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#1d4ed8', color: 'white', padding: '4px 16px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(29,78,216,0.4)', zIndex: 10 }}>
                  <Volume2 size={14} /> NOW ANNOUNCING
                </div>
              )}
              {/* Counter Title Header */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
                <h2 style={{ fontSize: 'clamp(1.05rem, 3.5vw, 1.35rem)', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  {item.counter?.name}
                </h2>
                <span style={{ fontSize: '0.82rem', color: '#1d4ed8', background: '#eff6ff', border: '1px solid #93c5fd', padding: '3px 10px', borderRadius: '6px', marginTop: '6px', display: 'inline-block', fontWeight: 800, fontFamily: 'monospace' }}>
                  Prefix: {item.counter?.tokenPrefix}
                </span>
              </div>
 
              {/* Token Number Display */}
              <div style={{ margin: '18px 0' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: 700 }}>
                  Currently Serving Token
                </span>
                {servingTokenToDisplay ? (
                  <div>
                    <h1 style={{ fontSize: 'clamp(3rem, 11vw, 4.2rem)', fontWeight: 900, color: isAnnouncingThisCard ? '#1d4ed8' : '#0f2b5c', fontFamily: 'monospace', margin: '4px 0', lineHeight: 1.1 }}>
                      {servingTokenToDisplay.tokenNumber}
                    </h1>
                    <p style={{ fontSize: 'clamp(0.92rem, 2.8vw, 1.05rem)', color: '#334155', fontWeight: 700 }}>
                      {servingTokenToDisplay.visitorName}
                    </p>
                  </div>
                ) : (
                  <h1 style={{ fontSize: 'clamp(2.2rem, 7vw, 2.8rem)', fontWeight: 700, color: '#94a3b8', margin: '14px 0' }}>
                    ---
                  </h1>
                )}
              </div>
 
              {/* Waiting Count Ticker */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '10px 12px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Waiting in Queue:</span>
                <strong style={{ color: '#b45309', fontSize: '1.05rem', background: '#fef3c7', padding: '2px 10px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                  {item.waitingCount || 0}
                </strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

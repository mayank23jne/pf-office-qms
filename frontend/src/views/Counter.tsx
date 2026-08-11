import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, SkipForward, RotateCcw, Volume2, LogOut, UserCheck, Clock, Layers, FileText, CheckCircle2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { fetchApi } from '../api';
import { Toast } from '../components/Toast';

export const Counter = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [counterData, setCounterData] = useState<any>(null);
  const [currentServing, setCurrentServing] = useState<any>(null);
  const [waitingList, setWaitingList] = useState<any[]>([]);
  const [skippedList, setSkippedList] = useState<any[]>([]);
  const [assignedIssues, setAssignedIssues] = useState<any[]>([]);
  const [counterTokens, setCounterTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' }>({ message: '', type: 'success' });

  useEffect(() => {
    loadQueue();

    // Connect to WebSocket for real-time queue synchronization
    const socket = io();
    socket.on('queue_updated', (data) => {
      if (!user.counterId || data.counterId === user.counterId) {
        loadQueue();
      }
    });

    socket.on('counter_next', (data) => {
      if (!user.counterId || data.counterId === user.counterId) {
        loadQueue();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const loadQueue = async () => {
    try {
      const data = await fetchApi('/queue/current');
      setCounterData(data.counter);
      setCurrentServing(data.currentServing);
      setWaitingList(data.waitingList || []);
      setSkippedList(data.skippedList || []);
      setAssignedIssues(data.assignedIssues || []);
      setCounterTokens(data.counterTokens || []);
    } catch (err: any) {
      console.error("Counter queue load error:", err);
      const errMsg = err.message || "Failed to load counter queue";
      setError(errMsg);
      setToast({ message: errMsg, type: 'error' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleNext = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      await fetchApi('/queue/next', { method: 'POST' });
      loadQueue();
    } catch (err: any) {
      const errMsg = err.message || "Failed to call next token";
      setError(errMsg);
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      await fetchApi('/queue/skip', { method: 'POST' });
      loadQueue();
    } catch (err: any) {
      const errMsg = err.message || "Failed to skip token";
      setError(errMsg);
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRecall = async (tokenId: number) => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      await fetchApi('/queue/recall', {
        method: 'POST',
        body: JSON.stringify({ tokenId })
      });
      loadQueue();
    } catch (err: any) {
      const errMsg = err.message || "Failed to recall token";
      setError(errMsg);
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIssueStatus = async (issueId: number, newStatus: string) => {
    try {
      setError('');
      setMessage('');
      await fetchApi(`/queue/issue-status/${issueId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      const msg = "PF Issue status updated successfully";
      setMessage(msg);
      setToast({ message: msg, type: 'success' });
      loadQueue();
    } catch (err: any) {
      const errMsg = err.message || "Failed to update PF issue status";
      setError(errMsg);
      setToast({ message: errMsg, type: 'error' });
    }
  };

  const handleUpdateTokenStatus = async (tokenId: number, newStatus: string) => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      await fetchApi(`/queue/token-status/${tokenId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      const msg = `Token status updated to ${newStatus}`;
      setMessage(msg);
      setToast({ message: msg, type: 'success' });
      loadQueue();
    } catch (err: any) {
      const errMsg = err.message || "Failed to update token status";
      setError(errMsg);
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const [isAnnouncing, setIsAnnouncing] = useState(false);

  const handleReannounce = async () => {
    if (isAnnouncing) return;
    setIsAnnouncing(true);
    try {
      if (currentServing) {
        await fetchApi('/queue/announce', {
          method: 'POST',
          body: JSON.stringify({ tokenId: currentServing.id })
        });
      }
    } catch (err: any) {
      console.error("Announce error:", err);
    } finally {
      setTimeout(() => {
        setIsAnnouncing(false);
      }, 3000);
    }
  };

  return (
    <>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, message: '' })} />
      <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '60px' }}>

      {/* Main Workspace Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Left Column: Serving Widget & Assigned Issues */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Currently Serving Widget */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '30px' }}>
            <span style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Currently Serving Token
            </span>

            {currentServing ? (
              <div style={{ width: '100%', margin: '16px 0' }}>
                <h1 style={{ fontSize: '4.5rem', fontWeight: 800, color: '#1d4ed8', fontFamily: 'monospace', margin: 0 }}>
                  {currentServing.tokenNumber}
                </h1>
                <h3 style={{ fontSize: '1.2rem', color: '#0f172a', margin: '8px 0' }}>
                  {currentServing.visitorName}
                </h3>
                <p style={{ color: '#475569', fontSize: '0.9rem' }}>
                  Issue: <strong style={{ color: '#990000' }}>{currentServing.issue?.name}</strong>
                </p>
                {currentServing.otherIssue && (
                  <div style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#b45309', padding: '10px 14px', borderRadius: '8px', marginTop: '10px', textAlign: 'left', fontSize: '0.88rem' }}>
                    <strong>Custom Issue Details:</strong> {currentServing.otherIssue}
                  </div>
                )}
                {(currentServing.mobile || currentServing.uan) && (
                  <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0f172a', padding: '8px 16px', borderRadius: '8px', display: 'inline-flex', gap: '15px', marginTop: '10px', fontSize: '0.85rem' }}>
                    {currentServing.mobile && <span>Mobile: <strong>{currentServing.mobile}</strong></span>}
                    {currentServing.uan && <span>UAN: <strong>{currentServing.uan}</strong></span>}
                  </div>
                )}

                {/* Inline Token Status Management Box */}
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #cbd5e1', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', background: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>Status:</span>
                    <select
                      value={currentServing.status}
                      onChange={(e) => handleUpdateTokenStatus(currentServing.id, e.target.value)}
                      disabled={loading}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        background: currentServing.status === 'COMPLETED' ? '#f0fdf4' : currentServing.status === 'SKIPPED' ? '#fef2f2' : '#eff6ff',
                        color: currentServing.status === 'COMPLETED' ? '#15803d' : currentServing.status === 'SKIPPED' ? '#b91c1c' : '#1d4ed8',
                        borderColor: currentServing.status === 'COMPLETED' ? '#86efac' : currentServing.status === 'SKIPPED' ? '#fca5a5' : '#93c5fd'
                      }}
                    >
                      <option value="SERVING">SERVING (In Progress)</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="SKIPPED">SKIPPED</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ margin: '30px 0', color: '#64748b' }}>
                <UserCheck size={64} style={{ opacity: 0.2, marginBottom: '10px' }} />
                <h3 style={{ color: '#0f172a' }}>No Token Currently Being Served</h3>
                <p style={{ fontSize: '0.85rem' }}>Click <strong>Call Next Token</strong> to serve the next waiting visitor.</p>
              </div>
            )}

            {/* Action Control Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '10px', width: '100%' }}>
              <button
                className="btn-primary"
                onClick={handleNext}
                disabled={loading || waitingList.length === 0}
                style={{
                  flex: '1 1 180px',
                  padding: '14px 20px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  background: '#16a34a',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Play size={20} /> Call Next Token ({waitingList.length})
              </button>

              {currentServing && (
                <>
                  <button
                    onClick={handleSkip}
                    disabled={loading}
                    style={{
                      padding: '14px 20px',
                      borderRadius: '8px',
                      border: '1px solid #fca5a5',
                      background: '#fee2e2',
                      color: '#b91c1c',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <SkipForward size={18} /> Skip
                  </button>
                  <button
                    onClick={handleReannounce}
                    disabled={isAnnouncing}
                    style={{
                      padding: '14px 20px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: isAnnouncing ? '#e2e8f0' : '#f1f5f9',
                      color: isAnnouncing ? '#94a3b8' : '#334155',
                      fontWeight: 600,
                      cursor: isAnnouncing ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      opacity: isAnnouncing ? 0.7 : 1
                    }}
                  >
                    <Volume2 size={18} /> {isAnnouncing ? 'Announcing...' : 'Announce'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Assigned PF Issues & Editable Status Module (Token-Wise Listing) */}
          <div className="glass-panel">
            <h3 style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
              <FileText size={18} style={{ color: '#0f2b5c' }} /> Assigned PF Issues & Status Management
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '14px' }}>
              Token-wise listing showing visitor token, selected PF issue, and current processing status.
            </p>

            {counterTokens.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No token records found for this counter yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
                {counterTokens.map((t) => (
                  <div key={t.id} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #cbd5e1', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: '#1d4ed8', fontSize: '1.05rem', fontFamily: 'monospace' }}>{t.tokenNumber}</strong>
                        <span style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.9rem' }}>{t.visitorName}</span>
                      </div>
                      <span style={{ fontSize: '0.82rem', color: '#475569', display: 'block', marginTop: '2px' }}>
                        Issue: <strong style={{ color: '#990000' }}>{t.issue?.name}</strong>
                      </span>
                    </div>
                    <div>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        padding: '4px 12px',
                        borderRadius: '6px',
                        background: t.status === 'COMPLETED' ? '#f0fdf4' : t.status === 'SERVING' ? '#eff6ff' : t.status === 'SKIPPED' ? '#fef2f2' : '#fef3c7',
                        color: t.status === 'COMPLETED' ? '#15803d' : t.status === 'SERVING' ? '#1d4ed8' : t.status === 'SKIPPED' ? '#b91c1c' : '#b45309',
                        border: t.status === 'COMPLETED' ? '1px solid #86efac' : t.status === 'SERVING' ? '1px solid #93c5fd' : t.status === 'SKIPPED' ? '1px solid #fca5a5' : '1px solid #fde68a'
                      }}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Waiting Queue & Skipped Queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Waiting Queue */}
          <div className="glass-panel" style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
              <Clock size={18} style={{ color: '#b45309' }} /> Waiting Queue ({waitingList.length})
            </h3>
            {waitingList.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                Queue is empty. No visitors waiting for this counter.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                {waitingList.map((t, idx) => (
                  <div key={t.id} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #cbd5e1' }}>
                    <div>
                      <strong style={{ color: '#1d4ed8', fontSize: '1.1rem', fontFamily: 'monospace' }}>#{idx + 1} - {t.tokenNumber}</strong>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>{t.visitorName} ({t.issue?.name})</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fde68a', fontWeight: 700 }}>WAITING</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skipped Tokens List */}
          <div className="glass-panel" style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
              <RotateCcw size={18} style={{ color: '#dc2626' }} /> Skipped Tokens ({skippedList.length})
            </h3>
            {skippedList.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '15px 0' }}>
                No skipped tokens for this counter today.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                {skippedList.map((t) => (
                  <div key={t.id} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #fca5a5' }}>
                    <div>
                      <strong style={{ color: '#dc2626', fontSize: '1.1rem', fontFamily: 'monospace' }}>{t.tokenNumber}</strong>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>{t.visitorName}</span>
                    </div>
                    <button
                      onClick={() => handleRecall(t.id)}
                      disabled={loading}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#0f2b5c',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <RotateCcw size={14} /> Recall
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

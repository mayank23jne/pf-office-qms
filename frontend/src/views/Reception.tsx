import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Printer, Search, Ticket, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchApi } from '../api';
import { SearchableSelect } from '../components/SearchableSelect';

export const Reception = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [issues, setIssues] = useState<any[]>([]);
  const [visitorName, setVisitorName] = useState('');
  const [mobile, setMobile] = useState('');
  const [uan, setUan] = useState('');
  const [selectedIssueId, setSelectedIssueId] = useState('');
  const [otherIssueText, setOtherIssueText] = useState('');
  const [isOtherSelected, setIsOtherSelected] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generated token modal state
  const [lastToken, setLastToken] = useState<any>(null);

  // QR Code Modal State
  const [showQRModal, setShowQRModal] = useState(false);

  // Audit Registry tokens list & Filters
  const [todayTokens, setTodayTokens] = useState<any[]>([]);
  const [counters, setCounters] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounterFilter, setSelectedCounterFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [issuesRes, tokensRes, countersRes] = await Promise.all([
        fetchApi('/queue/issues'),
        fetchApi('/queue/today-tokens'),
        fetchApi('/admin/display')
      ]);
      setIssues(issuesRes.issues || []);
      if (issuesRes.issues && issuesRes.issues.length > 0) {
        setSelectedIssueId(issuesRes.issues[0].id.toString());
      }
      setTodayTokens(tokensRes.tokens || []);
      setCounters(countersRes.displayData?.map((d: any) => d.counter) || []);
    } catch (err: any) {
      console.error("Reception data load error:", err);
    }
  };

  // const handleIssueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   const val = e.target.value;
  //   setSelectedIssueId(val);
  //   const selectedObj = issues.find((i) => i.id.toString() === val);
  //   if (selectedObj && (selectedObj.name.includes("Other") || selectedObj.name.includes("Custom"))) {
  //     setIsOtherSelected(true);
  //   } else {
  //     setIsOtherSelected(false);
  //     setOtherIssueText('');
  //   }
  // };

  // const handleLogout = () => {
  //   localStorage.removeItem('token');
  //   localStorage.removeItem('user');
  //   navigate('/login');
  // };

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) {
      setError("Visitor name is required");
      return;
    }

    if (!mobile.trim() || mobile.trim().length !== 10 || !/^\d{10}$/.test(mobile.trim())) {
      setError("Valid 10-digit mobile number is required");
      return;
    }

    if (!uan.trim() || uan.trim().length !== 12 || !/^\d{12}$/.test(uan.trim())) {
      setError("Valid 12-digit UAN number is required");
      return;
    }

    if (!selectedIssueId) {
      setError("Please select an issue");
      return;
    }

    if (isOtherSelected && !otherIssueText.trim()) {
      setError("Please describe the custom issue in the text area");
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await fetchApi('/queue/generate', {
        method: 'POST',
        body: JSON.stringify({
          visitorName,
          mobile,
          uan,
          issueId: selectedIssueId,
          otherIssue: isOtherSelected ? otherIssueText : null
        })
      });

      setLastToken(data.token);
      setVisitorName('');
      setMobile('');
      setUan('');
      setOtherIssueText('');
      setIsOtherSelected(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to generate token");
    } finally {
      setLoading(false);
    }
  };

  const publicQRUrl = `${window.location.protocol}//${window.location.host}/register-qr`;

  // Filtering Logic
  const filteredTokens = todayTokens.filter((t) => {
    const matchesSearch = 
      t.tokenNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.visitorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.mobile && t.mobile.includes(searchQuery)) ||
      (t.uan && t.uan.includes(searchQuery));

    const matchesCounter = selectedCounterFilter === 'ALL' || t.counterId?.toString() === selectedCounterFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || t.status === selectedStatusFilter;

    return matchesSearch && matchesCounter && matchesStatus;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredTokens.length / pageSize) || 1;
  const paginatedTokens = filteredTokens.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Token Generator Form */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: '#0f172a' }}>
              <User size={20} style={{ color: '#0f2b5c' }} /> Reception Desk Registration Form
            </h3>
            {/* <button 
              className="btn-primary" 
              onClick={() => setShowQRModal(true)}
              style={{ background: '#0f2b5c', color: 'white', display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 16px', fontSize: '0.88rem', borderRadius: '8px' }}
            >
              <QrCode size={18} /> Show Visitor QR Code
            </button> */}
          </div>

          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleGenerateToken} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#334155', marginBottom: '6px', fontWeight: 600 }}>Select PF Issue / Service *</label>
              <SearchableSelect
                options={issues.map((iss) => ({
                  id: iss.id,
                  name: iss.name,
                  tokenPrefix: iss.counter?.tokenPrefix,
                  counterName: iss.counter?.name
                }))}
                value={selectedIssueId}
                onChange={(val) => {
                  setSelectedIssueId(val);
                  const selectedObj = issues.find((i) => i.id.toString() === val);
                  if (selectedObj && (selectedObj.name.includes("Other") || selectedObj.name.includes("Custom"))) {
                    setIsOtherSelected(true);
                  } else {
                    setIsOtherSelected(false);
                    setOtherIssueText('');
                  }
                }}
                required
              />
            </div>

            {isOtherSelected && (
              <div className="animate-fade">
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#b45309', marginBottom: '6px', fontWeight: 600 }}>Specify Custom Issue Details *</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Describe visitor custom issue..."
                  value={otherIssueText}
                  onChange={(e) => setOtherIssueText(e.target.value)}
                  required={isOtherSelected}
                  style={{ resize: 'vertical' }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#334155', marginBottom: '6px', fontWeight: 600 }}>Visitor Full Name *</label>
              <input
                type="text"
                className="input-field"
                placeholder="Full Name"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#334155', marginBottom: '6px', fontWeight: 600 }}>Mobile Number (10 Digits - Numbers Only) *</label>
              <input
                type="tel"
                className="input-field"
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#334155', marginBottom: '6px', fontWeight: 600 }}>UAN Number (12 Digits - Numbers Only) *</label>
              <input
                type="text"
                className="input-field"
                placeholder="12-digit UAN"
                value={uan}
                onChange={(e) => setUan(e.target.value.replace(/\D/g, ''))}
                maxLength={12}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontWeight: 700, fontSize: '1rem', marginTop: '8px', background: '#0f2b5c', color: 'white', borderRadius: '8px' }}
            >
              {loading ? "Generating..." : "Generate Token Ticket"}
            </button>
          </form>
        </div>

        {/* Ticket Slip Preview */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          {lastToken ? (
            <div style={{ width: '100%', maxWidth: '380px', background: '#f8fafc', border: '2px dashed #0f2b5c', borderRadius: '14px', padding: '24px' }}>
              <div style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                ✓ Generated Token Ticket Slip
              </div>
              <h1 style={{ fontSize: '3.6rem', fontWeight: 900, color: '#0f2b5c', fontFamily: 'monospace', margin: '5px 0' }}>
                {lastToken.tokenNumber}
              </h1>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#990000', margin: '6px 0' }}>
                {lastToken.counter?.name}
              </p>
              <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '10px' }}>
                Issue: {issues.find((i) => i.id === lastToken.issueId)?.name}
              </span>

              {lastToken.otherIssue && (
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', color: '#b45309', marginBottom: '12px', textAlign: 'left' }}>
                  Custom Details: {lastToken.otherIssue}
                </div>
              )}

              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '10px', fontSize: '0.85rem', color: '#475569', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Visitor: <strong>{lastToken.visitorName}</strong></div>
                <div>Mobile: <strong>{lastToken.mobile}</strong></div>
                <div>UAN: <strong>{lastToken.uan}</strong></div>
              </div>
              <button 
                className="btn-primary" 
                onClick={() => window.print()}
                style={{ marginTop: '16px', width: '100%', display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center', background: '#0f2b5c', color: 'white', borderRadius: '8px' }}
              >
                <Printer size={16} /> Print Token Ticket Slip
              </button>
            </div>
          ) : (
            <div style={{ color: '#64748b', textAlign: 'center' }}>
              <Ticket size={48} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <p>Generate a token from the desk form to view the printable slip here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Renamed Audit Registry with Filters & Pagination */}
      <div className="glass-panel">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>All Visitor Token Log & History (Latest First)</h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Overall token records in descending order ({filteredTokens.length} matching / {todayTokens.length} total)
            </span>
          </div>

          {/* Filter Controls Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {/* Filter by Counter */}
            <select
              className="input-field"
              value={selectedCounterFilter}
              onChange={(e) => { setSelectedCounterFilter(e.target.value); setCurrentPage(1); }}
              style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem', background: '#ffffff', color: '#0f172a' }}
            >
              <option value="ALL">All Counters</option>
              {counters.map((c) => (
                <option key={c.id} value={c.id.toString()}>{c.name}</option>
              ))}
            </select>

            {/* Filter by Status */}
            <select
              className="input-field"
              value={selectedStatusFilter}
              onChange={(e) => { setSelectedStatusFilter(e.target.value); setCurrentPage(1); }}
              style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem', background: '#ffffff', color: '#0f172a' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="WAITING">WAITING</option>
              <option value="SERVING">SERVING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="SKIPPED">SKIPPED</option>
            </select>

            {/* Search Filter Input */}
            <div style={{ position: 'relative', width: '200px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Search token, name..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{ paddingLeft: '30px', padding: '8px 10px 8px 30px', fontSize: '0.85rem', background: '#ffffff' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            </div>
          </div>
        </div>

        {/* Audit Registry Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#1e293b', background: '#f1f5f9', fontSize: '0.85rem' }}>
              <th style={{ padding: '10px' }}>Token #</th>
              <th style={{ padding: '10px' }}>Visitor Name</th>
              <th style={{ padding: '10px' }}>Mobile</th>
              <th style={{ padding: '10px' }}>UAN</th>
              <th style={{ padding: '10px' }}>Counter</th>
              <th style={{ padding: '10px' }}>Service Issue</th>
              <th style={{ padding: '10px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTokens.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '25px', color: '#64748b' }}>
                  No token records match the selected filters.
                </td>
              </tr>
            ) : (
              paginatedTokens.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
                  <td style={{ padding: '10px', fontWeight: 800, color: '#1d4ed8', fontFamily: 'monospace' }}>{t.tokenNumber}</td>
                  <td style={{ padding: '10px', color: '#0f172a' }}>{t.visitorName}</td>
                  <td style={{ padding: '10px', color: '#334155' }}>{t.mobile}</td>
                  <td style={{ padding: '10px', color: '#334155' }}>{t.uan}</td>
                  <td style={{ padding: '10px', color: '#990000', fontWeight: 600 }}>{t.counter?.name}</td>
                  <td style={{ padding: '10px', color: '#334155' }}>
                    {t.issue?.name}
                    {t.otherIssue && <span style={{ display: 'block', fontSize: '0.75rem', color: '#b45309' }}>Custom Note: {t.otherIssue}</span>}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      padding: '3px 9px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: t.status === 'WAITING' ? '#fef3c7' : t.status === 'SERVING' ? '#f3e8ff' : t.status === 'COMPLETED' ? '#f0fdf4' : '#fef2f2',
                      color: t.status === 'WAITING' ? '#b45309' : t.status === 'SERVING' ? '#7e22ce' : t.status === 'COMPLETED' ? '#15803d' : '#b91c1c',
                      border: t.status === 'WAITING' ? '1px solid #fde68a' : t.status === 'SERVING' ? '1px solid #e9d5ff' : t.status === 'COMPLETED' ? '1px solid #86efac' : '1px solid #fca5a5'
                    }}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
          <span style={{ color: '#64748b' }}>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredTokens.length} items)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#f1f5f9',
                color: '#334155',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600
              }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#f1f5f9',
                color: '#334155',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600
              }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Visitor QR Modal */}
      {showQRModal && (
        <div 
          onClick={() => setShowQRModal(false)}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(15, 23, 42, 0.65)', 
            backdropFilter: 'blur(6px)', 
            display: 'flex', 
            alignItems: 'flex-start', 
            justifyContent: 'center', 
            zIndex: 1000, 
            padding: '70px 16px 20px 16px',
            overflowY: 'auto'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="animate-slide" 
            style={{ 
              width: '100%', 
              maxWidth: '380px', 
              margin: '0 auto', 
              background: '#ffffff', 
              textAlign: 'center', 
              border: '1px solid #cbd5e1',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(15,23,42,0.2)',
              padding: '24px 20px'
            }}
          >
            <h3 style={{ marginBottom: '6px', fontSize: '1.2rem', color: '#0f172a' }}>Scan QR Code for Self Registration</h3>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '14px' }}>
              Visitors can scan this QR code on their smartphone to generate a token instantly.
            </p>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'inline-block', marginBottom: '14px' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(publicQRUrl)}`} 
                alt="Visitor Self Registration QR Code"
                style={{ width: '160px', height: '160px', display: 'block' }}
              />
            </div>

            <p style={{ fontSize: '0.78rem', color: '#1d4ed8', wordBreak: 'break-all', marginBottom: '14px', background: '#eff6ff', border: '1px solid #93c5fd', padding: '8px 10px', borderRadius: '8px', fontWeight: 600 }}>
              {publicQRUrl}
            </p>

            <button 
              onClick={() => setShowQRModal(false)}
              style={{ width: '100%', padding: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

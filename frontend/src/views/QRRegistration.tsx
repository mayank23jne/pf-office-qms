import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Printer, QrCode, Ticket } from 'lucide-react';
import { fetchApi } from '../api';
import { SearchableSelect } from '../components/SearchableSelect';

export const QRRegistration = () => {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlAdminId = searchParams.get('adminId') || '';

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(urlAdminId);
  const [issues, setIssues] = useState<any[]>([]);
  const [visitorName, setVisitorName] = useState('');
  const [mobile, setMobile] = useState('');
  const [uan, setUan] = useState('');
  const [selectedIssueId, setSelectedIssueId] = useState('');
  const [otherIssueText, setOtherIssueText] = useState('');
  const [isOtherSelected, setIsOtherSelected] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generated token pass state
  const [tokenPass, setTokenPass] = useState<any>(null);
  const [waitingAhead, setWaitingAhead] = useState<number>(0);

  // Show QR Modal inside QR page
  const [showShareQR, setShowShareQR] = useState(false);

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
    loadIssues();
    if (tokenId) {
      loadTokenPass(tokenId);
    }
  }, [tokenId, selectedBranchId, urlAdminId]);

  const loadIssues = async () => {
    try {
      const targetAdminId = selectedBranchId || urlAdminId;
      const endpoint = targetAdminId ? `/queue/issues?adminId=${targetAdminId}` : '/queue/issues';
      const data = await fetchApi(endpoint);
      setIssues(data.issues || []);
      if (data.issues && data.issues.length > 0) {
        setSelectedIssueId(data.issues[0].id.toString());
      }
    } catch (err: any) {
      console.error("Failed to load issues:", err);
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

  const loadTokenPass = async (id: string) => {
    try {
      setLoading(true);
      const data = await fetchApi(`/queue/token-status/${id}`);
      setTokenPass(data.token);
      setWaitingAhead(data.waitingAhead || 0);
    } catch (err: any) {
      setError("Token ticket not found or expired.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!mobile.trim() || mobile.trim().length !== 10 || !/^\d{10}$/.test(mobile.trim())) {
      setError("Valid 10-digit mobile number is required.");
      return;
    }

    if (!uan.trim() || uan.trim().length !== 12 || !/^\d{12}$/.test(uan.trim())) {
      setError("Valid 12-digit UAN number is required.");
      return;
    }

    if (!selectedIssueId) {
      setError("Please select a PF Service Issue.");
      return;
    }

    if (isOtherSelected && !otherIssueText.trim()) {
      setError("Please describe your custom issue details in the text area.");
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await fetchApi('/queue/generate-public', {
        method: 'POST',
        body: JSON.stringify({
          visitorName,
          mobile,
          uan,
          issueId: selectedIssueId,
          otherIssue: isOtherSelected ? otherIssueText : null
        })
      });

      setTokenPass(data.token);
      setWaitingAhead(data.waitingAhead || 0);
      navigate(`/token-pass/${data.token.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to generate token ticket.");
    } finally {
      setLoading(false);
    }
  };

  const currentQRUrl = `${window.location.protocol}//${window.location.host}/register-qr`;

  if (tokenPass) {
    return (
      <div className="animate-scale" style={{ maxWidth: '520px', margin: '15px auto', padding: '0 10px' }}>
        <div className="glass-panel" style={{ textAlign: 'center', border: '1px solid #cbd5e1', boxShadow: '0 15px 40px rgba(15,23,42,0.08)', background: '#ffffff' }}>
          <div style={{ background: '#16a34a', color: 'white', display: 'inline-flex', padding: '8px 18px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 700, gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
            <CheckCircle2 size={18} /> Digital Token Pass Created
          </div>

          <p style={{ color: '#64748b', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Your Assigned Token Number</p>
          <h1 style={{ fontSize: '4.2rem', fontWeight: 900, color: '#0f2b5c', margin: '4px 0', fontFamily: 'monospace' }}>
            {tokenPass.tokenNumber}
          </h1>

          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '18px', margin: '20px 0', border: '1px solid #cbd5e1', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.92rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '10px' }}>
              <span style={{ color: '#64748b' }}>Assigned Counter</span>
              <strong style={{ color: '#990000', fontSize: '1.05rem' }}>{tokenPass.counter?.name}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '10px' }}>
              <span style={{ color: '#64748b' }}>Service Issue</span>
              <strong style={{ color: '#0f172a', textAlign: 'right' }}>{tokenPass.issue?.name}</strong>
            </div>

            {tokenPass.otherIssue && (
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#b45309', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Custom Details:</span>
                <p style={{ marginTop: '2px', fontSize: '0.88rem' }}>{tokenPass.otherIssue}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '10px' }}>
              <span style={{ color: '#64748b' }}>Visitor Name</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{tokenPass.visitorName}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '10px' }}>
              <span style={{ color: '#64748b' }}>Mobile Number</span>
              <span style={{ color: '#0f172a' }}>{tokenPass.mobile}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '10px' }}>
              <span style={{ color: '#64748b' }}>UAN Number</span>
              <span style={{ color: '#0f172a' }}>{tokenPass.uan}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>Queue Status</span>
              <span style={{ color: tokenPass.status === 'WAITING' ? '#b45309' : '#15803d', fontWeight: 800 }}>
                {tokenPass.status} ({waitingAhead} visitors ahead)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
            <button className="btn-primary" onClick={() => window.print()} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#0f2b5c', color: 'white', padding: '12px 24px', borderRadius: '8px', fontSize: '0.95rem' }}>
              <Printer size={18} /> Save / Print Pass Ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ maxWidth: '540px', margin: '15px auto', padding: '0 10px' }}>
      <div className="glass-panel animate-slide" style={{ border: '1px solid #cbd5e1', boxShadow: '0 10px 30px rgba(15,23,42,0.06)', background: '#ffffff' }}>
        {/* Clean Header displaying ONLY Title and Share Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '22px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#0f2b5c', padding: '8px', borderRadius: '8px', color: 'white', flexShrink: 0 }}>
                <Ticket size={22} />
              </div>
              <h2 style={{ fontSize: 'clamp(1.15rem, 3.5vw, 1.45rem)', fontWeight: 800, lineHeight: 1.2, color: '#0f172a' }}>Visitor Token Registration</h2>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '4px' }}>
              Provident Fund Office - Self Service Queue Portal
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowShareQR(true)}
            style={{ background: '#eff6ff', border: '1px solid #93c5fd', color: '#1d4ed8', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.82rem', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            <QrCode size={16} /> Share QR
          </button>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>


          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#334155', marginBottom: '6px', fontWeight: 600 }}>
              Select PF Issue / Service Required *
            </label>
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

          {/* Conditional Textarea for Other Issue */}
          {isOtherSelected && (
            <div className="animate-fade">
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#b45309', marginBottom: '6px', fontWeight: 700 }}>
                Specify Custom Issue Details *
              </label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Please describe your specific PF problem or inquiry..."
                value={otherIssueText}
                onChange={(e) => setOtherIssueText(e.target.value)}
                required={isOtherSelected}
                style={{ resize: 'vertical' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#334155', marginBottom: '6px', fontWeight: 600 }}>
              Visitor Full Name *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter your full name"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#334155', marginBottom: '6px', fontWeight: 600 }}>
              Mobile Number (10 Digits - Numbers Only) *
            </label>
            <input
              type="tel"
              className="input-field"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              maxLength={10}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#334155', marginBottom: '6px', fontWeight: 600 }}>
              UAN Number (12 Digits - Numbers Only) *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. 100123456789"
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
            style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 800, marginTop: '8px', background: '#0f2b5c', color: 'white' }}
          >
            {loading ? "Generating Ticket..." : "Generate Token Ticket"}
          </button>
        </form>
      </div>

      {/* Share QR Code Modal */}
      {showShareQR && (
        <div 
          onClick={() => setShowShareQR(false)}
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
              padding: '24px 20px',
              marginTop:'130px'
            }}
          >
            <h3 style={{ marginBottom: '6px', fontSize: '1.2rem', color: '#0f172a' }}>PF Office Registration QR Code</h3>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '14px' }}>
              Scan this QR code using any smartphone camera to open this self-registration form.
            </p>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'inline-block', marginBottom: '14px' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(currentQRUrl)}`} 
                alt="Registration QR Code"
                style={{ width: '160px', height: '160px', display: 'block' }}
              />
            </div>

            <p style={{ fontSize: '0.78rem', color: '#1d4ed8', wordBreak: 'break-all', marginBottom: '14px', background: '#eff6ff', border: '1px solid #93c5fd', padding: '8px 10px', borderRadius: '8px', fontWeight: 600 }}>
              {currentQRUrl}
            </p>

            <button 
              onClick={() => setShowShareQR(false)}
              style={{ width: '100%', padding: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              Close Modal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

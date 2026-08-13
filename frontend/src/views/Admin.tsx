import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Edit2, Trash2, RefreshCw, Layers, LayoutGrid, FileText, Link2, X } from 'lucide-react';
import { fetchApi } from '../api';
import { Toast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';

export const Admin = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [activeTab, setActiveTab] = useState<'stats' | 'counters' | 'issues' | 'users'>('stats');

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [countersList, setCountersList] = useState<any[]>([]);
  const [issuesList, setIssuesList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' }>({ message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Dynamic Office Links Modal State
  const [showLinksModal, setShowLinksModal] = useState(false);

  // Counter Modal State
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [editingCounterId, setEditingCounterId] = useState<number | null>(null);
  const [counterForm, setCounterForm] = useState({ name: '', tokenPrefix: '', status: 'ACTIVE' });

  // Issue Modal State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [editingIssueId, setEditingIssueId] = useState<number | null>(null);
  const [issueForm, setIssueForm] = useState({ name: '', counterId: '', status: 'PENDING' });

  // Assign Issues to Counter Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningCounter, setAssigningCounter] = useState<any>(null);
  const [selectedAssignIssueIds, setSelectedAssignIssueIds] = useState<number[]>([]);

  // User Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    name: '',
    role: 'COUNTER',
    counterId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (showCounterModal || showIssueModal || showAssignModal || showUserModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showCounterModal, showIssueModal, showAssignModal, showUserModal]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, countersRes, issuesRes, usersRes] = await Promise.all([
        fetchApi('/admin/stats'),
        fetchApi('/admin/counters'),
        fetchApi('/admin/issues'),
        fetchApi('/admin/users')
      ]);
      setStats(statsRes);
      setCountersList(countersRes.counters || []);
      setIssuesList(issuesRes.issues || []);
      setUsersList(usersRes.users || []);
    } catch (err: any) {
      console.error("Admin load error:", err);
      const msg = err.message || "Failed to load admin dashboard data";
      setError(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // const handleLogout = () => {
  //   localStorage.removeItem('token');
  //   localStorage.removeItem('user');
  //   navigate('/login');
  // };

  // --- Counter Master Handlers ---
  const handleOpenCreateCounter = () => {
    setEditingCounterId(null);
    setCounterForm({ name: '', tokenPrefix: '', status: 'ACTIVE' });
    setShowCounterModal(true);
  };

  const handleOpenEditCounter = (c: any) => {
    setEditingCounterId(c.id);
    setCounterForm({ name: c.name, tokenPrefix: c.tokenPrefix, status: c.status });
    setShowCounterModal(true);
  };

  const handleSaveCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      if (editingCounterId) {
        await fetchApi(`/admin/counters/${editingCounterId}`, {
          method: 'PUT',
          body: JSON.stringify(counterForm)
        });
        const msg = "Counter updated successfully";
        setMessage(msg);
        setToast({ message: msg, type: 'success' });
      } else {
        await fetchApi('/admin/counters', {
          method: 'POST',
          body: JSON.stringify(counterForm)
        });
        const msg = "Counter created successfully";
        setMessage(msg);
        setToast({ message: msg, type: 'success' });
      }
      setShowCounterModal(false);
      loadData();
    } catch (err: any) {
      const errMsg = err.message || "Failed to save counter";
      setError(errMsg);
      setToast({ message: errMsg, type: 'error' });
    }
  };

  const handleDeleteCounter = (c: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Counter',
      message: `Are you sure you want to delete counter "${c.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await fetchApi(`/admin/counters/${c.id}`, { method: 'DELETE' });
          const msg = "Counter deleted successfully";
          setMessage(msg);
          setToast({ message: msg, type: 'success' });
          loadData();
        } catch (err: any) {
          const errMsg = err.message || "Failed to delete counter";
          setError(errMsg);
          setToast({ message: errMsg, type: 'error' });
        }
      }
    });
  };

  const handleOpenAssignModal = async (counter: any) => {
    setAssigningCounter(counter);
    try {
      const res = await fetchApi(`/admin/counters/${counter.id}/assigned-issues`);
      const assigned = res.issues || [];
      setSelectedAssignIssueIds(assigned.map((i: any) => i.id));
      setShowAssignModal(true);
    } catch (err: any) {
      const errMsg = "Failed to load assigned issues";
      setError(errMsg);
      setToast({ message: errMsg, type: 'error' });
    }
  };

  const handleSaveAssignedIssues = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningCounter) return;
    try {
      await fetchApi(`/admin/counters/${assigningCounter.id}/assign-issues`, {
        method: 'POST',
        body: JSON.stringify({ issueIds: selectedAssignIssueIds })
      });
      const msg = `Assigned issues updated for ${assigningCounter.name}`;
      setMessage(msg);
      setToast({ message: msg, type: 'success' });
      setShowAssignModal(false);
      loadData();
    } catch (err: any) {
      const errMsg = err.message || "Failed to update assigned issues";
      setError(errMsg);
      setToast({ message: errMsg, type: 'error' });
    }
  };

  const toggleIssueCheckbox = (issueId: number) => {
    setSelectedAssignIssueIds(prev =>
      prev.includes(issueId) ? prev.filter(id => id !== issueId) : [...prev, issueId]
    );
  };

  // --- PF Issues Master Handlers ---
  const handleOpenCreateIssue = () => {
    setEditingIssueId(null);
    setIssueForm({ name: '', counterId: countersList.length > 0 ? countersList[0].id.toString() : '', status: 'PENDING' });
    setShowIssueModal(true);
  };

  const handleOpenEditIssue = (iss: any) => {
    setEditingIssueId(iss.id);
    setIssueForm({
      name: iss.name,
      counterId: iss.counterId ? iss.counterId.toString() : '',
      status: iss.status || 'PENDING'
    });
    setShowIssueModal(true);
  };

  const handleSaveIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      if (editingIssueId) {
        await fetchApi(`/admin/issues/${editingIssueId}`, {
          method: 'PUT',
          body: JSON.stringify(issueForm)
        });
        const msg = "PF Issue updated successfully";
        setMessage(msg);
        setToast({ message: msg, type: 'success' });
      } else {
        await fetchApi('/admin/issues', {
          method: 'POST',
          body: JSON.stringify(issueForm)
        });
        const msg = "PF Issue created successfully";
        setMessage(msg);
        setToast({ message: msg, type: 'success' });
      }
      setShowIssueModal(false);
      loadData();
    } catch (err: any) {
      const errMsg = err.message || "Failed to save PF issue";
      setError(errMsg);
      setToast({ message: errMsg, type: 'error' });
    }
  };

  const handleDeleteIssue = (iss: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete PF Issue',
      message: `Are you sure you want to delete PF Issue "${iss.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await fetchApi(`/admin/issues/${iss.id}`, { method: 'DELETE' });
          const msg = "PF Issue deleted successfully";
          setMessage(msg);
          setToast({ message: msg, type: 'success' });
          loadData();
        } catch (err: any) {
          const errMsg = err.message || "Failed to delete issue";
          setError(errMsg);
          setToast({ message: errMsg, type: 'error' });
        }
      }
    });
  };

  // --- Employee Handlers ---
  const handleOpenCreateUser = () => {
    setEditingUserId(null);
    setUserForm({
      username: '',
      password: '',
      name: '',
      role: 'COUNTER',
      counterId: countersList.length > 0 ? countersList[0].id.toString() : ''
    });
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u: any) => {
    setEditingUserId(u.id);
    setUserForm({
      username: u.username,
      password: '',
      name: u.name,
      role: u.role,
      counterId: u.counterId ? u.counterId.toString() : ''
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      if (editingUserId) {
        await fetchApi(`/admin/users/${editingUserId}`, {
          method: 'PUT',
          body: JSON.stringify(userForm)
        });
        const msg = "Employee updated successfully";
        setMessage(msg);
        setToast({ message: msg, type: 'success' });
      } else {
        await fetchApi('/admin/users', {
          method: 'POST',
          body: JSON.stringify(userForm)
        });
        const msg = "Employee account created successfully";
        setMessage(msg);
        setToast({ message: msg, type: 'success' });
      }
      setShowUserModal(false);
      loadData();
    } catch (err: any) {
      const errMsg = err.message || "Failed to save employee";
      setError(errMsg);
      setToast({ message: errMsg, type: 'error' });
    }
  };

  const handleDeleteUser = (u: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Employee Account',
      message: `Are you sure you want to delete employee account "${u.name}" (${u.username})? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await fetchApi(`/admin/users/${u.id}`, { method: 'DELETE' });
          const msg = "Employee account deleted successfully";
          setMessage(msg);
          setToast({ message: msg, type: 'success' });
          loadData();
        } catch (err: any) {
          const errMsg = err.message || "Failed to delete employee";
          setError(errMsg);
          setToast({ message: errMsg, type: 'error' });
        }
      }
    });
  };

  return (
    <>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, message: '' })} />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
      <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '60px' }}>
        {/* Management Navigation Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('stats')}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: activeTab === 'stats' ? 'none' : '1px solid #cbd5e1',
                background: activeTab === 'stats' ? '#0f2b5c' : '#f1f5f9',
                color: activeTab === 'stats' ? 'white' : '#334155',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <LayoutGrid size={18} /> System Dashboard
            </button>

            {/* <button
              onClick={() => setShowLinksModal(true)}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid #1d4ed8',
                background: '#eff6ff',
                color: '#1d4ed8',
                cursor: 'pointer',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Link2 size={18} /> Office Links & QR
            </button> */}

          <button
            onClick={() => setActiveTab('counters')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: activeTab === 'counters' ? 'none' : '1px solid #cbd5e1',
              background: activeTab === 'counters' ? '#0f2b5c' : '#f1f5f9',
              color: activeTab === 'counters' ? 'white' : '#334155',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Layers size={18} /> Counter Master ({countersList.length})
          </button>

          <button
            onClick={() => setActiveTab('issues')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: activeTab === 'issues' ? 'none' : '1px solid #cbd5e1',
              background: activeTab === 'issues' ? '#0f2b5c' : '#f1f5f9',
              color: activeTab === 'issues' ? 'white' : '#334155',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FileText size={18} /> PF Issues Master ({issuesList.length})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: activeTab === 'users' ? 'none' : '1px solid #cbd5e1',
              background: activeTab === 'users' ? '#0f2b5c' : '#f1f5f9',
              color: activeTab === 'users' ? 'white' : '#334155',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Users size={18} /> Employees & Mapping ({usersList.length})
          </button>
        </div>

        <button onClick={loadData} disabled={loading} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '8px 16px', fontSize: '0.85rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Tab 1: Stats */}
      {activeTab === 'stats' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div className="glass-panel" style={{ borderLeft: '4px solid #1d4ed8' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Total Tokens</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '6px 0', color: '#1d4ed8' }}>{stats.totalTokens}</h2>
            </div>
            <div className="glass-panel" style={{ borderLeft: '4px solid #b45309' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Currently Waiting</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '6px 0', color: '#b45309' }}>{stats.waitingTokens}</h2>
            </div>
            <div className="glass-panel" style={{ borderLeft: '4px solid #7e22ce' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Currently Serving</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '6px 0', color: '#7e22ce' }}>{stats.servingTokens}</h2>
            </div>
            <div className="glass-panel" style={{ borderLeft: '4px solid #15803d' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Completed Tokens</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '6px 0', color: '#15803d' }}>{stats.completedTokens}</h2>
            </div>
            <div className="glass-panel" style={{ borderLeft: '4px solid #990000' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Active Counters</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '6px 0', color: '#990000' }}>{stats.activeCounters}</h2>
            </div>
          </div>

          {/* Restored Counter Status Breakdown Section with Current Navy-Blue Theme */}
          <div style={{ marginTop: '10px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} style={{ color: '#0f2b5c' }} /> Counter-Wise Status & Performance Metrics
            </h3>

            {(!stats.counterBreakdown || stats.counterBreakdown.length === 0) ? (
              <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                No counter metrics available.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {stats.counterBreakdown.map((item: any) => (
                  <div key={item.counter.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', borderTop: '4px solid #0f2b5c' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #93c5fd', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                          [{item.counter.tokenPrefix}]
                        </span>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>
                          {item.counter.name}
                        </h4>
                      </div>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: item.counter.status === 'ACTIVE' ? '#f0fdf4' : '#fef2f2',
                        color: item.counter.status === 'ACTIVE' ? '#15803d' : '#b91c1c',
                        border: item.counter.status === 'ACTIVE' ? '1px solid #86efac' : '1px solid #fca5a5'
                      }}>
                        {item.counter.status}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 700, display: 'block' }}>Waiting</span>
                        <strong style={{ fontSize: '1.1rem', color: '#b45309' }}>{item.waiting}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 700, display: 'block' }}>Serving</span>
                        <strong style={{ fontSize: '1.1rem', color: '#1d4ed8' }}>{item.serving}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700, display: 'block' }}>Completed</span>
                        <strong style={{ fontSize: '1.1rem', color: '#15803d' }}>{item.completed}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700, display: 'block' }}>Skipped</span>
                        <strong style={{ fontSize: '1.1rem', color: '#dc2626' }}>{item.skipped}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: '#475569', paddingTop: '6px', borderTop: '1px dashed #cbd5e1' }}>
                      <span>Total Tokens Processed:</span>
                      <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{item.total}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Counter Master */}
      {activeTab === 'counters' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Counter Master Management</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Add, edit, delete counters and assign PF issues.</p>
            </div>
            <button className="btn-primary" onClick={handleOpenCreateCounter} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#0f2b5c', color: 'white', borderRadius: '8px' }}>
              <Plus size={18} /> Add New Counter
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#1e293b', background: '#f1f5f9', fontSize: '0.85rem' }}>
                <th style={{ padding: '12px' }}>Prefix</th>
                <th style={{ padding: '12px' }}>Counter Name</th>
                <th style={{ padding: '12px' }}>Assigned Operator</th>
                <th style={{ padding: '12px' }}>Assigned Issues</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {countersList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No counters found. Click "Add New Counter" to create one.</td>
                </tr>
              ) : (
                countersList.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                    <td style={{ padding: '12px', fontWeight: 800, color: '#1d4ed8', fontFamily: 'monospace', fontSize: '1.1rem' }}>{c.tokenPrefix}</td>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>{c.name}</td>
                    <td style={{ padding: '12px' }}>
                      {c.User ? (
                        <span style={{ color: '#15803d', fontWeight: 600 }}>{c.User.name} ({c.User.username})</span>
                      ) : (
                        <span style={{ color: '#64748b' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '280px' }}>
                        {c.assignedIssues && c.assignedIssues.length > 0 ? (
                          c.assignedIssues.map((ci: any) => (
                            <span key={ci.issue?.id} style={{ background: '#eff6ff', border: '1px solid #93c5fd', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                              {ci.issue?.name}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>None</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 9px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: c.status === 'ACTIVE' ? '#f0fdf4' : '#fef2f2',
                        color: c.status === 'ACTIVE' ? '#15803d' : '#b91c1c',
                        border: c.status === 'ACTIVE' ? '1px solid #86efac' : '1px solid #fca5a5'
                      }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleOpenAssignModal(c)} style={{ background: '#eff6ff', border: '1px solid #93c5fd', color: '#1d4ed8', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                          <Link2 size={14} /> Assign Issues
                        </button>
                        <button onClick={() => handleOpenEditCounter(c)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button onClick={() => handleDeleteCounter(c)} style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: PF Issues Master */}
      {activeTab === 'issues' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>PF Issues Master Management</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Add, edit, delete PF claim types and set issue status.</p>
            </div>
            <button className="btn-primary" onClick={handleOpenCreateIssue} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#0f2b5c', color: 'white', borderRadius: '8px' }}>
              <Plus size={18} /> Add New PF Issue
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#1e293b', background: '#f1f5f9', fontSize: '0.85rem' }}>
                <th style={{ padding: '12px' }}>ID</th>
                <th style={{ padding: '12px' }}>PF Issue Name</th>
                <th style={{ padding: '12px' }}>Primary Counter</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {issuesList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No PF issues found. Click "Add New PF Issue" to create one.</td>
                </tr>
              ) : (
                issuesList.map((iss) => (
                  <tr key={iss.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#64748b' }}>#{iss.id}</td>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>{iss.name}</td>
                    <td style={{ padding: '12px' }}>
                      {iss.counter ? (
                        <span style={{ color: '#1d4ed8', fontWeight: 600 }}>
                          [{iss.counter.tokenPrefix}] {iss.counter.name}
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 9px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: iss.status === 'RESOLVED' ? '#f0fdf4' : iss.status === 'IN_PROGRESS' ? '#eff6ff' : '#fef3c7',
                        color: iss.status === 'RESOLVED' ? '#15803d' : iss.status === 'IN_PROGRESS' ? '#1d4ed8' : '#b45309',
                        border: iss.status === 'RESOLVED' ? '1px solid #86efac' : iss.status === 'IN_PROGRESS' ? '1px solid #93c5fd' : '1px solid #fde68a'
                      }}>
                        {iss.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleOpenEditIssue(iss)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button onClick={() => handleDeleteIssue(iss)} style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Employees & Counter Mapping */}
      {activeTab === 'users' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Employee Accounts & Counter Mapping</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Create operator accounts and map them to physical counters.</p>
            </div>
            <button className="btn-primary" onClick={handleOpenCreateUser} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#0f2b5c', color: 'white', borderRadius: '8px' }}>
              <Plus size={18} /> Add New Employee
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#1e293b', background: '#f1f5f9', fontSize: '0.85rem' }}>
                <th style={{ padding: '12px' }}>Full Name</th>
                <th style={{ padding: '12px' }}>Username</th>
                <th style={{ padding: '12px' }}>System Role</th>
                <th style={{ padding: '12px' }}>Assigned Counter</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.filter((u) => u.role !== 'SUPER_ADMIN').length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No employee accounts found.</td>
                </tr>
              ) : (
                usersList.filter((u) => u.role !== 'SUPER_ADMIN').map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>{u.name}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#1d4ed8' }}>{u.username}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 9px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: u.role === 'CITY_ADMIN' || u.role === 'ADMIN' ? '#f3e8ff' : u.role === 'RECEPTION' ? '#eff6ff' : '#f0fdf4',
                        color: u.role === 'CITY_ADMIN' || u.role === 'ADMIN' ? '#7e22ce' : u.role === 'RECEPTION' ? '#1d4ed8' : '#15803d',
                        border: u.role === 'CITY_ADMIN' || u.role === 'ADMIN' ? '1px solid #e9d5ff' : u.role === 'RECEPTION' ? '1px solid #93c5fd' : '1px solid #86efac'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {u.Counter ? (
                        <span style={{ color: '#b45309', fontWeight: 600 }}>
                          [{u.Counter.tokenPrefix}] {u.Counter.name}
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleOpenEditUser(u)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button onClick={() => handleDeleteUser(u)} style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* Counter Modal */}
      {showCounterModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div className="animate-slide" style={{ width: '100%', maxWidth: '640px', maxHeight: '88vh', overflowY: 'auto', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)', padding: '30px 36px', position: 'relative', margin: 'auto' }}>
            <button onClick={() => setShowCounterModal(false)} style={{ position: 'absolute', top: '22px', right: '22px', background: '#f1f5f9', border: 'none', color: '#64748b', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <div style={{ marginBottom: '20px' }}>
              <h3 className="font-sora" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={24} style={{ color: '#0f2b5c' }} /> {editingCounterId ? "Edit Counter Details" : "Add New Counter"}
              </h3>
              <p style={{ color: '#475569', fontSize: '0.88rem', marginTop: '4px' }}>Configure counter prefix and operational status.</p>
            </div>
            <form onSubmit={handleSaveCounter} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px', color: '#334155', fontWeight: 600 }}>Counter Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Counter 1 (PF Withdrawal & Advance)"
                  value={counterForm.name}
                  onChange={(e) => setCounterForm({ ...counterForm, name: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', fontSize: '0.95rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a' }}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px', color: '#334155', fontWeight: 600 }}>Token Prefix *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. W, P, K"
                    value={counterForm.tokenPrefix}
                    onChange={(e) => setCounterForm({ ...counterForm, tokenPrefix: e.target.value.toUpperCase() })}
                    maxLength={4}
                    style={{ width: '100%', padding: '12px 16px', fontSize: '0.95rem', fontWeight: 700, fontFamily: 'monospace', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#1d4ed8' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px', color: '#334155', fontWeight: 600 }}>Operational Status *</label>
                  <select
                    className="input-field"
                    value={counterForm.status}
                    onChange={(e) => setCounterForm({ ...counterForm, status: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', fontSize: '0.95rem', fontWeight: 700, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: counterForm.status === 'ACTIVE' ? '#15803d' : '#b91c1c', cursor: 'pointer' }}
                  >
                    <option value="ACTIVE" style={{ background: '#ffffff', color: '#15803d' }}>ACTIVE</option>
                    <option value="INACTIVE" style={{ background: '#ffffff', color: '#b91c1c' }}>INACTIVE</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setShowCounterModal(false)} style={{ padding: '10px 22px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', cursor: 'pointer', fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 28px', borderRadius: '8px', fontWeight: 700, fontSize: '0.92rem', background: '#0f2b5c', color: 'white' }}>
                  Save Counter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PF Issue Modal */}
      {showIssueModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div className="animate-slide" style={{ width: '100%', maxWidth: '640px', maxHeight: '88vh', overflowY: 'auto', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)', padding: '30px 36px', position: 'relative', margin: 'auto' }}>
            <button onClick={() => setShowIssueModal(false)} style={{ position: 'absolute', top: '22px', right: '22px', background: '#f1f5f9', border: 'none', color: '#64748b', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <div style={{ marginBottom: '20px' }}>
              <h3 className="font-sora" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={24} style={{ color: '#0f2b5c' }} /> {editingIssueId ? "Edit PF Claim Issue" : "Add New PF Claim Issue"}
              </h3>
              <p style={{ color: '#475569', fontSize: '0.88rem', marginTop: '4px' }}>Configure PF claim title, default counter, and processing status.</p>
            </div>
            <form onSubmit={handleSaveIssue} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px', color: '#334155', fontWeight: 600 }}>PF Issue Name / Service Title *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Form 19 - Final PF Settlement"
                  value={issueForm.name}
                  onChange={(e) => setIssueForm({ ...issueForm, name: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', fontSize: '0.95rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a' }}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px', color: '#334155', fontWeight: 600 }}>Primary Counter</label>
                  <select
                    className="input-field"
                    value={issueForm.counterId}
                    onChange={(e) => setIssueForm({ ...issueForm, counterId: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', fontSize: '0.92rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', cursor: 'pointer' }}
                  >
                    <option value="" style={{ background: '#ffffff' }}>Unassigned</option>
                    {countersList.map((c) => (
                      <option key={c.id} value={c.id.toString()} style={{ background: '#ffffff' }}>[{c.tokenPrefix}] {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px', color: '#334155', fontWeight: 600 }}>Issue Status *</label>
                  <select
                    className="input-field"
                    value={issueForm.status}
                    onChange={(e) => setIssueForm({ ...issueForm, status: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', fontSize: '0.92rem', fontWeight: 700, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: issueForm.status === 'RESOLVED' ? '#15803d' : issueForm.status === 'IN_PROGRESS' ? '#1d4ed8' : '#b45309', cursor: 'pointer' }}
                  >
                    <option value="PENDING" style={{ background: '#ffffff', color: '#b45309' }}>PENDING</option>
                    <option value="IN_PROGRESS" style={{ background: '#ffffff', color: '#1d4ed8' }}>IN_PROGRESS</option>
                    <option value="RESOLVED" style={{ background: '#ffffff', color: '#15803d' }}>RESOLVED</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setShowIssueModal(false)} style={{ padding: '10px 22px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', cursor: 'pointer', fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 28px', borderRadius: '8px', fontWeight: 700, fontSize: '0.92rem', background: '#0f2b5c', color: 'white' }}>
                  Save PF Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Issues to Counter Modal */}
      {showAssignModal && assigningCounter && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div className="animate-slide" style={{ width: '100%', maxWidth: '720px', maxHeight: '88vh', overflowY: 'auto', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)', padding: '30px 36px', position: 'relative', margin: 'auto' }}>
            <button onClick={() => setShowAssignModal(false)} style={{ position: 'absolute', top: '22px', right: '22px', background: '#f1f5f9', border: 'none', color: '#64748b', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <div style={{ marginBottom: '18px' }}>
              <h3 className="font-sora" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link2 size={24} style={{ color: '#0f2b5c' }} /> Assign PF Issues to {assigningCounter.name}
              </h3>
              <p style={{ color: '#475569', fontSize: '0.88rem', marginTop: '4px' }}>
                Select one or multiple PF claim types that can be handled by counter operator <strong>[{assigningCounter.tokenPrefix}]</strong>.
              </p>
            </div>
            <form onSubmit={handleSaveAssignedIssues} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px' }}>
                {issuesList.length === 0 ? (
                  <div style={{ color: '#64748b', textAlign: 'center', padding: '14px', fontSize: '0.9rem', gridColumn: '1 / -1' }}>No PF issues available to assign.</div>
                ) : (
                  issuesList.map((iss) => {
                    const isChecked = selectedAssignIssueIds.includes(iss.id);
                    return (
                      <label
                        key={iss.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: isChecked ? '#eff6ff' : '#ffffff',
                          border: isChecked ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
                          color: isChecked ? '#1e40af' : '#334155',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleIssueCheckbox(iss.id)}
                          style={{ width: '18px', height: '18px', accentColor: '#1d4ed8', cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: isChecked ? 700 : 500, fontSize: '0.9rem' }}>{iss.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setShowAssignModal(false)} style={{ padding: '10px 22px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', cursor: 'pointer', fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 28px', borderRadius: '8px', fontWeight: 700, fontSize: '0.92rem', background: '#0f2b5c', color: 'white' }}>
                  Save Issue Assignments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      {showUserModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div className="animate-slide" style={{ width: '100%', maxWidth: '640px', maxHeight: '88vh', overflowY: 'auto', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)', padding: '30px 36px', position: 'relative', margin: 'auto' }}>
            <button onClick={() => setShowUserModal(false)} style={{ position: 'absolute', top: '22px', right: '22px', background: '#f1f5f9', border: 'none', color: '#64748b', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <div style={{ marginBottom: '20px' }}>
              <h3 className="font-sora" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={24} style={{ color: '#0f2b5c' }} /> {editingUserId ? "Edit Employee Account" : "Add New Employee Account"}
              </h3>
              <p style={{ color: '#475569', fontSize: '0.88rem', marginTop: '4px' }}>Create employee credentials and map to physical counters.</p>
            </div>
            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px', color: '#334155', fontWeight: 600 }}>Full Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Full Name"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', fontSize: '0.95rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px', color: '#334155', fontWeight: 600 }}>Username *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Username"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    disabled={!!editingUserId}
                    style={{ width: '100%', padding: '12px 16px', fontSize: '0.95rem', fontWeight: 600, fontFamily: 'monospace', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#1d4ed8' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: userForm.role === 'COUNTER' ? '1fr 1fr' : '1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px', color: '#334155', fontWeight: 600 }}>System Role *</label>
                  <select
                    className="input-field"
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', fontSize: '0.92rem', fontWeight: 700, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', cursor: 'pointer' }}
                  >
                    <option value="COUNTER" style={{ background: '#ffffff' }}>Counter Operator</option>
                    <option value="RECEPTION" style={{ background: '#ffffff' }}>Reception Desk Operator</option>
                    <option value="ADMIN" style={{ background: '#ffffff' }}>System Admin</option>
                  </select>
                </div>

                {userForm.role === 'COUNTER' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px', color: '#334155', fontWeight: 600 }}>Assigned Counter</label>
                    <select
                      className="input-field"
                      value={userForm.counterId}
                      onChange={(e) => setUserForm({ ...userForm, counterId: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', fontSize: '0.92rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#b45309', cursor: 'pointer' }}
                    >
                      <option value="" style={{ background: '#ffffff', color: '#0f172a' }}>Select Counter...</option>
                      {countersList.map((c) => (
                        <option key={c.id} value={c.id.toString()} style={{ background: '#ffffff', color: '#0f172a' }}>[{c.tokenPrefix}] {c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px', color: '#334155', fontWeight: 600 }}>
                  Password {editingUserId ? "(Leave blank to keep current)" : "*"}
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Enter password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', fontSize: '0.95rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a' }}
                  required={!editingUserId}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setShowUserModal(false)} style={{ padding: '10px 22px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', cursor: 'pointer', fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 28px', borderRadius: '8px', fontWeight: 700, fontSize: '0.92rem', background: '#0f2b5c', color: 'white' }}>
                  Save Employee Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Office Links Modal */}
      {showLinksModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="animate-slide" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)', width: '100%', maxWidth: '750px', padding: '28px', color: '#0f172a', position: 'relative' }}>
            <button
              onClick={() => setShowLinksModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', color: '#64748b', padding: '6px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#0f2b5c', padding: '12px', borderRadius: '12px', color: 'white' }}>
                <Link2 size={24} />
              </div>
              <div>
                <h3 className="font-sora" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {user.name || user.username || 'Branch'} - Dynamic Office Links
                </h3>
                <p style={{ color: '#475569', fontSize: '0.85rem', marginTop: '4px', margin: '4px 0 0 0' }}>
                  Use these dedicated URLs for your branch's QR Self-Register Portal & TV Display Screen.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#1d4ed8', fontWeight: 800, display: 'block', marginBottom: '6px' }}>
                  Branch Registration URL (QR Code Target)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/register-qr?adminId=${user.id || user.adminId || ''}`}
                    style={{ width: '100%', background: 'transparent', border: 'none', color: '#0f172a', fontWeight: 700, fontSize: '0.88rem', fontFamily: 'monospace', outline: 'none' }}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/register-qr?adminId=${user.id || user.adminId || ''}`);
                      setToast({ message: "Registration Link copied to clipboard!", type: 'success' });
                    }}
                    style={{ background: '#0f2b5c', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, flexShrink: 0 }}
                  >
                    Copy Link
                  </button>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#1d4ed8', fontWeight: 800, display: 'block', marginBottom: '6px' }}>
                  Branch Live LED Display URL (TV Screen Target)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/display?adminId=${user.id || user.adminId || ''}`}
                    style={{ width: '100%', background: 'transparent', border: 'none', color: '#0f172a', fontWeight: 700, fontSize: '0.88rem', fontFamily: 'monospace', outline: 'none' }}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/display?adminId=${user.id || user.adminId || ''}`);
                      setToast({ message: "LED Display Link copied to clipboard!", type: 'success' });
                    }}
                    style={{ background: '#0f2b5c', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, flexShrink: 0 }}
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setShowLinksModal(false)}
                style={{ padding: '10px 24px', borderRadius: '8px', background: '#0f2b5c', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

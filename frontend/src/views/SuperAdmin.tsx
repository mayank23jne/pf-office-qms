import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Edit2, Trash2, RefreshCw, ShieldAlert, X, MapPin, Eye, EyeOff } from 'lucide-react';
import { fetchApi } from '../api';
import { Toast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';

export const SuperAdmin = () => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [admins, setAdmins] = useState<any[]>([]);
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

  // Admin Modal State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [editingAdminId, setEditingAdminId] = useState<number | null>(null);
  const [adminForm, setAdminForm] = useState({
    username: '',
    password: '',
    name: '',
    city: ''
  });

  useEffect(() => {
    if (currentUser.role !== 'SUPER_ADMIN') {
      navigate('/login');
      return;
    }
    loadData();
  }, []);

  useEffect(() => {
    if (showAdminModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showAdminModal]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchApi('/superadmin/admins');
      setAdmins(res.admins || []);
    } catch (err: any) {
      console.error("SuperAdmin load error:", err);
      const msg = err.message || "Failed to load System Admins data";
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

  const handleOpenCreateAdmin = () => {
    setEditingAdminId(null);
    setAdminForm({
      username: '',
      password: '',
      name: '',
      city: ''
    });
    setShowAdminModal(true);
  };

  const handleOpenEditAdmin = (a: any) => {
    setEditingAdminId(a.id);
    setAdminForm({
      username: a.username,
      password: '',
      name: a.name,
      city: a.city || ''
    });
    setShowAdminModal(true);
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      if (editingAdminId) {
        await fetchApi(`/superadmin/admins/${editingAdminId}`, {
          method: 'PUT',
          body: JSON.stringify(adminForm)
        });
        const msg = "System Admin updated successfully";
        setMessage(msg);
        setToast({ message: msg, type: 'success' });
      } else {
        await fetchApi('/superadmin/admins', {
          method: 'POST',
          body: JSON.stringify(adminForm)
        });
        const msg = "System Admin created successfully";
        setMessage(msg);
        setToast({ message: msg, type: 'success' });
      }
      setShowAdminModal(false);
      loadData();
    } catch (err: any) {
      const errMsg = err.message || "Failed to save system admin";
      setError(errMsg);
      setToast({ message: errMsg, type: 'error' });
    }
  };

  const handleDeleteAdmin = (a: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete System Admin',
      message: `Are you sure you want to delete System Admin "${a.name}" (${a.username})? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await fetchApi(`/superadmin/admins/${a.id}`, { method: 'DELETE' });
          const msg = "System Admin deleted successfully";
          setMessage(msg);
          setToast({ message: msg, type: 'success' });
          loadData();
        } catch (err: any) {
          const errMsg = err.message || "Failed to delete admin";
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
      {/* Main Admins Table Section */}
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 800 }}>
              <ShieldAlert size={22} style={{ color: '#0f2b5c' }} /> System Administrators Master
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>SuperAdmin platform: Create and manage System Admins with city attributes.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={loadData} disabled={loading} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '8px 16px', fontSize: '0.85rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button className="btn-primary" onClick={handleOpenCreateAdmin} style={{ background: '#0f2b5c', color: 'white', borderRadius: '8px' }}>
              <Plus size={18} /> Add System Admin
            </button>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#1e293b', background: '#f1f5f9', textAlign: 'left', fontSize: '0.85rem' }}>
              <th style={{ padding: '12px' }}>Full Name</th>
              <th style={{ padding: '12px' }}>Username</th>
              <th style={{ padding: '12px' }}>City / Location</th>
              <th style={{ padding: '12px' }}>Role</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>Loading System Admins...</td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No System Admins found.</td>
              </tr>
            ) : (
              admins.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>{a.name}</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: '#1d4ed8' }}>{a.username}</td>
                  <td style={{ padding: '12px', color: '#334155', fontWeight: 600 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f8fafc', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <MapPin size={14} style={{ color: '#0f2b5c' }} /> {a.city || 'Not Specified'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 9px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: '#eff6ff', border: '1px solid #93c5fd', color: '#1d4ed8' }}>
                      {a.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleOpenEditAdmin(a)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                        <Edit2 size={15} /> Edit
                      </button>
                      <button onClick={() => handleDeleteAdmin(a)} style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                        <Trash2 size={15} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Admin Modal */}
      {showAdminModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div className="animate-slide" style={{ width: '100%', maxWidth: '640px', maxHeight: '88vh', overflowY: 'auto', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)', padding: '30px 36px', position: 'relative', margin: 'auto' }}>
            <button onClick={() => setShowAdminModal(false)} style={{ position: 'absolute', top: '22px', right: '22px', background: '#f1f5f9', border: 'none', color: '#64748b', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <div style={{ marginBottom: '20px' }}>
              <h3 className="font-sora" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={24} style={{ color: '#0f2b5c' }} /> {editingAdminId ? "Edit System Admin Account" : "Add New System Admin Account"}
              </h3>
              <p style={{ color: '#475569', fontSize: '0.88rem', marginTop: '4px' }}>Create system admin credentials with administrative privileges and city location.</p>
            </div>
            <form onSubmit={handleSaveAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px', color: '#334155', fontWeight: 600 }}>Full Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Full Name"
                    value={adminForm.name}
                    onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
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
                    value={adminForm.username}
                    onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                    disabled={!!editingAdminId}
                    style={{ width: '100%', padding: '12px 16px', fontSize: '0.95rem', fontWeight: 600, fontFamily: 'monospace', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#1d4ed8' }}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px', color: '#334155', fontWeight: 600 }}>City / Office Location *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Delhi, Mumbai, Jaipur"
                    value={adminForm.city}
                    onChange={(e) => setAdminForm({ ...adminForm, city: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', fontSize: '0.95rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '6px', color: '#334155', fontWeight: 600 }}>
                    Password {editingAdminId ? "(Leave blank to keep current)" : "*"}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      className="input-field"
                      placeholder="Enter password"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      style={{ width: '100%', padding: '12px 40px 12px 16px', fontSize: '0.95rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a' }}
                      required={!editingAdminId}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0
                      }}
                      tabIndex={-1}
                    >
                      {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setShowAdminModal(false)} style={{ padding: '10px 22px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', cursor: 'pointer', fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 28px', borderRadius: '8px', fontWeight: 700, fontSize: '0.92rem', background: '#0f2b5c', color: 'white' }}>
                  Save Admin Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

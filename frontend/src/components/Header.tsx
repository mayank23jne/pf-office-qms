import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, QrCode, Monitor, LogIn, LogOut, Home, UserCheck } from 'lucide-react';

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const userJson = localStorage.getItem('user');
  const currentUser = userJson ? JSON.parse(userJson) : null;

  // Hide default header only on Visitor Token Pass Pages
  const isVisitorTokenPage = location.pathname.startsWith('/token-pass');
  const isDisplayPage = location.pathname === '/display';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  if (isVisitorTokenPage) return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const getDashboardRoute = (role: string) => {
    if (role === 'SUPER_ADMIN') return '/super-admin';
    if (role === 'CITY_ADMIN' || role === 'ADMIN') return '/admin';
    if (role === 'RECEPTION') return '/reception';
    if (role === 'COUNTER') return '/counter';
    return '/';
  };

  return (
    <>
      {/* Top Red Government Strip */}
      <div className="govt-top-bar">
        <span>Toll-Free Help Desk: <strong>14470</strong> | Provident Fund Portal</span>
        <span>Ministry of Labour & Employment, Govt. of India</span>
      </div>

      <header className="site-header">
        {/* Brand Row */}
        <div className="header-brand-row">
          <Link to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
            <img
              src="/EPFO_Logo.png"
              alt="EPFO Emblem Logo"
              style={{ height: "48px", width: "auto", objectFit: "contain", flexShrink: 0 }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="brand-title">
                Employees' Provident Fund Organisation, India
              </span>
              <span className="brand-subtitle">
                Ministry of Labour & Employment, Government of India | Queue Management Portal
              </span>
            </div>
          </Link>

          {/* Mobile Menu Toggle (hidden on Live Display page) */}
          {!isDisplayPage && (
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>

        {/* Navy Navigation Bar */}
        <div className="header-nav-row">
          <div className="header-inner">
            <nav className="desktop-nav">
              <Link
                to="/"
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                style={{ color: '#ffffff' }}
              >
                <Home size={15} /> Home
              </Link>

              <Link
                to="/register-qr"
                className={`nav-link ${location.pathname === '/register-qr' ? 'active' : ''}`}
                style={{ color: '#ffffff' }}
              >
                <QrCode size={15} /> QR Self-Register
              </Link>

              <Link
                to="/display"
                className={`nav-link ${location.pathname === '/display' ? 'active' : ''}`}
                style={{ color: '#ffffff' }}
              >
                <Monitor size={15} /> Live LED Display
              </Link>

              {currentUser && (
                <Link
                  to={getDashboardRoute(currentUser.role)}
                  className={`nav-link ${location.pathname === getDashboardRoute(currentUser.role) ? 'active' : ''}`}
                  style={{ color: '#ffffff' }}
                >
                  <UserCheck size={15} /> Dashboard ({currentUser.role})
                </Link>
              )}
            </nav>

            <div className="desktop-nav" style={{ gap: '10px' }}>
              {currentUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}>
                    Logged in: <strong style={{ color: 'white' }}>{currentUser.name || currentUser.username}</strong>
                  </span>
                  <button
                    onClick={handleLogout}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      background: "rgba(220, 38, 38, 0.25)",
                      border: "1px solid #ef4444",
                      color: "#fca5a5",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <LogOut size={13} /> Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  style={{
                    padding: "6px 16px",
                    borderRadius: "6px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    background: "#1d4ed8",
                    color: "white",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <LogIn size={14} /> Staff Login
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-menu-drawer animate-fade">
            <nav className="mobile-nav-list">
              <Link
                to="/"
                className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home size={18} /> Home
              </Link>
              <Link
                to="/register-qr"
                className={`mobile-nav-item ${location.pathname === '/register-qr' ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <QrCode size={18} /> QR Self-Register
              </Link>
              <Link
                to="/display"
                className={`mobile-nav-item ${location.pathname === '/display' ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Monitor size={18} /> Live LED Display
              </Link>
              <div style={{ paddingTop: "10px" }}>
                {currentUser ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Link
                      to={getDashboardRoute(currentUser.role)}
                      className={`mobile-nav-item ${location.pathname === getDashboardRoute(currentUser.role) ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <UserCheck size={18} /> Dashboard ({currentUser.role})
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="btn-primary"
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        padding: "12px",
                        borderRadius: "30px",
                        fontSize: "0.95rem",
                        background: "rgba(239, 68, 68, 0.2)",
                        border: "1px solid var(--danger)",
                        color: "#dc2626"
                      }}
                    >
                      <LogOut size={18} /> Logout ({currentUser.username})
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="btn-primary"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      padding: "12px",
                      borderRadius: "30px",
                      fontSize: "0.95rem"
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LogIn size={18} /> Staff Login
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Blurred Background Backdrop when mobile menu is open */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-backdrop animate-fade"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

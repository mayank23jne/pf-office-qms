import React from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, Monitor, LogIn, UserCheck } from "lucide-react";

export const LandingPage = () => {
  const navigate = useNavigate();

  const userJson = localStorage.getItem("user");
  const currentUser = userJson ? JSON.parse(userJson) : null;
  const adminId = currentUser ? (currentUser.id || currentUser.adminId || "") : "";

  const getDashboardRoute = (role: string) => {
    if (role === "SUPER_ADMIN") return "/super-admin";
    if (role === "CITY_ADMIN" || role === "ADMIN") return "/admin";
    if (role === "RECEPTION") return "/reception";
    if (role === "COUNTER") return "/counter";
    return "/";
  };

  return (
    <div
      className="animate-fade"
      style={{
        backgroundColor: "#f8fafc",
        color: "#0f172a",
        fontFamily: "var(--font-manrope)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        padding: "12px 0"
      }}
    >
      <div style={{ maxWidth: "880px", width: "100%" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px"
          }}
        >
          <ActionCard
            variant="primary"
            icon={<QrCode size={20} style={{ color: "white" }} />}
            title="Self-Register"
            subtitle="Scan QR to get token"
            onClick={() =>
              navigate(`/register-qr${adminId ? `?adminId=${adminId}` : ""}`)
            }
          />
          <ActionCard
            icon={<Monitor size={20} style={{ color: "#0f2b5c" }} />}
            title="Live Display"
            subtitle="View real-time counter status"
            onClick={() =>
              navigate(`/display${adminId ? `?adminId=${adminId}` : ""}`)
            }
          />
          {currentUser ? (
            <ActionCard
              icon={<UserCheck size={20} style={{ color: "#0f2b5c" }} />}
              title={`Dashboard (${currentUser.role})`}
              subtitle={`Welcome, ${currentUser.name || currentUser.username}`}
              onClick={() => navigate(getDashboardRoute(currentUser.role))}
            />
          ) : (
            <ActionCard
              icon={<LogIn size={20} style={{ color: "#0f2b5c" }} />}
              title="Staff Portal"
              subtitle="Officer login & admin"
              onClick={() => navigate("/login")}
            />
          )}
        </div>
      </div>
    </div>
  );
};

function ActionCard({
  icon,
  title,
  subtitle,
  variant,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  variant?: "primary";
  onClick: () => void;
}) {
  const isPrimary = variant === "primary";
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        borderRadius: "12px",
        padding: "20px",
        textAlign: "left",
        border: isPrimary ? "none" : "1px solid #cbd5e1",
        backgroundColor: isPrimary ? "#0f2b5c" : "#ffffff",
        color: isPrimary ? "white" : "#0f172a",
        cursor: "pointer",
        transition: "all 0.25s ease",
        boxShadow: isPrimary
          ? "0 4px 14px rgba(15, 43, 92, 0.25)"
          : "0 2px 8px rgba(15, 23, 42, 0.04)"
      }}
    >
      <div
        style={{
          marginBottom: "14px",
          display: "grid",
          width: "38px",
          height: "38px",
          placeItems: "center",
          borderRadius: "8px",
          backgroundColor: isPrimary ? "rgba(255, 255, 255, 0.2)" : "#eff6ff"
        }}
      >
        {icon}
      </div>
      <span
        className="font-sora"
        style={{
          fontSize: "1.1rem",
          fontWeight: 700,
          marginBottom: "4px",
          color: isPrimary ? "white" : "#0f172a"
        }}
      >
        {title}
      </span>
      <span style={{ fontSize: "0.8rem", color: isPrimary ? "#e2e8f0" : "#475569" }}>
        {subtitle}
      </span>
    </button>
  );
}


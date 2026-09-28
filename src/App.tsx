import { useState, useEffect, useMemo } from "react";
import logoImg from "./assets/logo.png";

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [tab, setTab] = useState<string>("calendario");
  const [viewDate, setViewDate] = useState<Date>(() => new Date(2026, 8, 1));
  const [today] = useState<Date>(() => new Date());
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [reminders, setReminders] = useState({ agua: true, pastilla: false, sueno: true });

  // theme init
  useEffect(() => {
    const saved = localStorage.getItem("mym-theme");
    if (saved) {
      setIsDark(saved === "dark");
    } else {
      // default claro as spec, but respect prefers
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      // keep false unless saved, to match spec light default; comment if want auto
      if (prefersDark && saved === null) {
        // keep light by default per spec, uncomment to auto dark
        // setIsDark(true)
      }
    }
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const theme = useMemo(() => {
    if (!isDark) {
      return {
        bg: "#F7FBFA",
        text: "#243638",
        card: "#FFFFFF",
        border: "#E8F2F0",
        gridBg: "rgba(255,255,255,0.10)",
        cell: "rgba(255,255,255,0.08)",
        overlay: "rgba(247,251,250,0.20)",
        logoOpacity: 0.18,
        tabActiveBg: "#243638",
        tabActiveText: "#FFFFFF",
        tabInactiveBg: "transparent",
        tabInactiveText: "#243638",
        todayBg: "#243638",
        todayText: "#FFFFFF",
        periodBg: "rgba(255,217,217,0.55)",
        fertileBg: "rgba(221,243,244,0.40)",
        ovulationBg: "rgba(255,255,255,0.60)",
      };
    } else {
      return {
        bg: "#0F1A1B",
        text: "#E8F2F0",
        card: "#1A2E30",
        border: "#2A4446",
        gridBg: "rgba(36,54,56,0.40)",
        cell: "rgba(255,255,255,0.06)",
        overlay: "rgba(15,26,27,0.40)",
        logoOpacity: 0.12,
        tabActiveBg: "#72C8D0",
        tabActiveText: "#0F1A1B",
        tabInactiveBg: "transparent",
        tabInactiveText: "#E8F2F0",
        todayBg: "#72C8D0",
        todayText: "#0F1A1B",
        periodBg: "rgba(255,120,120,0.25)",
        fertileBg: "rgba(114,200,208,0.15)",
        ovulationBg: "rgba(255,255,255,0.12)",
      };
    }
  }, [isDark]);

  const isSameDay = (a: Date, b: Date) => {
    return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  };

  // period reference for demo: 15 Aug 2026
  const basePeriodStart = useMemo(() => new Date(2026, 7, 15), []);

  const getDayType = (date: Date) => {
    const diffTime = date.getTime() - basePeriodStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    // handle negative modulo
    const cyclePos = ((diffDays % 28) + 28) % 28;
    const isFuture = date > today;
    const isPeriod = cyclePos < 5;
    const isPredicted = isPeriod && isFuture && diffDays > 5;
    const isOvulation = cyclePos === 14;
    const isFertile = (cyclePos >= 12 && cyclePos <= 16) && !isOvulation;
    if (isOvulation) return "ovulation";
    if (isPeriod) return isPredicted ? "predicted" : "period";
    if (isFertile) return "fertile";
    return "normal";
  };

  const changeMonth = (delta: number) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const switchTab = (newTab: string) => {
    setTab(newTab);
  };

  const monthLabel = useMemo(() => {
    return viewDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  }, [viewDate]);

  const daysInMonth = useMemo(() => {
    return new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  }, [viewDate]);

  const startWeekDay = useMemo(() => {
    // Monday = 0
    const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay(); // 0 Sun
    return (first + 6) % 7;
  }, [viewDate]);

  const cycleDayForToday = useMemo(() => {
    const diff = Math.floor((today.getTime() - basePeriodStart.getTime()) / (1000 * 60 * 60 * 24));
    const pos = ((diff % 28) + 28) % 28;
    return pos + 1;
  }, [today, basePeriodStart]);

  const renderDays = useMemo(() => {
    const cells: { key: string; date: Date | null; isEmpty?: boolean }[] = [];
    for (let i = 0; i < startWeekDay; i++) {
      cells.push({ key: `empty-${i}`, date: null, isEmpty: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
      cells.push({ key: `day-${d}`, date });
    }
    return cells;
  }, [startWeekDay, daysInMonth, viewDate]);

  const handleToggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("mym-theme", next ? "dark" : "light");
  };

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        minHeight: "100vh",
        transition: "background-color 0.35s ease, color 0.35s ease",
      }}
      className="w-full antialiased"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@400;500;600&display=swap');
        * { font-family: 'Inter', system-ui, sans-serif; }
        .fraunces { font-family: 'Fraunces', serif; }
      `}</style>

      <div className="max-w-[980px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-2">
        {/* Header */}
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="MyM logo"
              style={{ width: 42, height: 42, objectFit: "contain" }}
              className="select-none"
            />
            <div className="flex flex-col leading-none">
              <span className="fraunces" style={{ fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1 }}>
                MyM
              </span>
              <span
                style={{
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  opacity: 0.65,
                  marginTop: 2,
                  fontWeight: 600,
                }}
              >
                Tu ciclo, claro
              </span>
            </div>
          </div>

          <button
            onClick={handleToggleTheme}
            aria-label="Toggle tema oscuro"
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              backgroundColor: theme.card,
              border: `1px solid ${theme.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.25)" : "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <span style={{ fontSize: 16 }}>{isDark ? "☀️" : "🌙"}</span>
          </button>
        </header>

        {/* Tabs */}
        <div className="mt-6 flex gap-2">
          {[
            { id: "hoy", label: "Hoy" },
            { id: "calendario", label: "Calendario" },
            { id: "historial", label: "Historial" },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  border: `1px solid ${active ? theme.tabActiveBg : theme.border}`,
                  backgroundColor: active ? theme.tabActiveBg : theme.tabInactiveBg,
                  color: active ? theme.tabActiveText : theme.tabInactiveText,
                  transition: "all 0.25s ease",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <div className="mt-5">
          {tab === "calendario" && (
            <div
              style={{
                position: "relative",
                borderRadius: 24,
                overflow: "hidden",
                minHeight: isMobile ? 480 : 520,
                maxHeight: isMobile ? "70vh" : "none",
                backgroundColor: theme.card,
                border: `1px solid ${theme.border}`,
                boxShadow: isDark
                  ? "0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)"
                  : "0 12px 32px rgba(36,54,56,0.08), 0 2px 8px rgba(36,54,56,0.04)",
                transition: "all 0.35s ease",
              }}
            >
              {/* Fondo logo */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url(${logoImg})`,
                  backgroundSize: isMobile ? "240px" : "380px",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: isMobile ? "center 10%" : "center 20%",
                  opacity: theme.logoOpacity,
                  pointerEvents: "none",
                  filter: isDark ? "brightness(1.8)" : "none",
                  transition: "opacity 0.35s ease, filter 0.35s ease",
                }}
              />
              {/* Overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: theme.overlay,
                  pointerEvents: "none",
                  transition: "background-color 0.35s ease",
                }}
              />
              {/* Content */}
              <div style={{ position: "relative", zIndex: 2, padding: 20 }}>
                {/* Month nav */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => changeMonth(-1)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      backgroundColor: theme.card,
                      border: `1px solid ${theme.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                    }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1 }}>‹</span>
                  </button>
                  <h2 className="fraunces capitalize" style={{ fontSize: isMobile ? 18 : 20, fontWeight: 600 }}>
                    {monthLabel}
                  </h2>
                  <button
                    onClick={() => changeMonth(1)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      backgroundColor: theme.card,
                      border: `1px solid ${theme.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                    }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1 }}>›</span>
                  </button>
                </div>

                {/* Grid box */}
                <div
                  style={{
                    backgroundColor: theme.gridBg,
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    borderRadius: 16,
                    padding: 12,
                    border: `1px solid ${theme.border}`,
                    transition: "all 0.35s ease",
                  }}
                >
                  {/* Weekdays */}
                  <div className="grid grid-cols-7 mb-2">
                    {["L", "M", "X", "J", "V", "S", "D"].map((w, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          opacity: 0.5,
                          textAlign: "center",
                          padding: "6px 0",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {w}
                      </div>
                    ))}
                  </div>

                  {/* Days */}
                  <div className="grid grid-cols-7 gap-[4px]">
                    {renderDays.map((cell) => {
                      if (cell.isEmpty || !cell.date) {
                        return <div key={cell.key} style={{ aspectRatio: "1/1" }} />;
                      }
                      const dayType = getDayType(cell.date);
                      const isToday = isSameDay(cell.date, today);
                      const isSelected = isSameDay(cell.date, viewDate) && tab === "calendario" ? false : false;

                      let bg = theme.cell;
                      let borderStyle = `1px solid ${theme.border}`;
                      let extraStyle: React.CSSProperties = {};

                      if (dayType === "period") {
                        bg = theme.periodBg;
                      } else if (dayType === "predicted") {
                        bg = theme.periodBg;
                        borderStyle = `1px dashed ${isDark ? "rgba(255,120,120,0.6)" : "rgba(180,80,80,0.45)"}`;
                      } else if (dayType === "fertile") {
                        bg = theme.fertileBg;
                      } else if (dayType === "ovulation") {
                        bg = theme.ovulationBg;
                        borderStyle = `2px solid #72C8D0`;
                      }

                      if (isToday) {
                        bg = theme.todayBg;
                        extraStyle.color = theme.todayText;
                        extraStyle.fontWeight = 700;
                      }

                      return (
                        <div
                          key={cell.key}
                          style={{
                            aspectRatio: "1 / 1",
                            borderRadius: 12,
                            backgroundColor: bg,
                            border: isToday ? `1px solid ${theme.todayBg}` : borderStyle,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: isToday ? 700 : 500,
                            cursor: "pointer",
                            transition: "all 0.25s ease",
                            position: "relative",
                            ...extraStyle,
                          }}
                          className="hover:scale-[1.04]"
                          title={`${cell.date.toLocaleDateString("es-ES")} - ${dayType}`}
                          onClick={() => {
                            // quick select day for demo
                            // setViewDate(cell.date!) // not change month view, keep today logic separate
                          }}
                        >
                          {cell.date.getDate()}
                          {dayType === "ovulation" && !isToday && (
                            <span
                              style={{
                                position: "absolute",
                                width: 4,
                                height: 4,
                                borderRadius: 999,
                                backgroundColor: "#72C8D0",
                                bottom: 4,
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap gap-3">
                    {[
                      { label: "Periodo", color: theme.periodBg, border: theme.border },
                      { label: "Predicción", color: theme.periodBg, dashed: true },
                      { label: "Fértil", color: theme.fertileBg },
                      { label: "Ovulación", color: theme.ovulationBg, border: "#72C8D0" },
                    ].map((l) => (
                      <div key={l.label} className="flex items-center gap-2">
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 4,
                            backgroundColor: l.color,
                            border: `1px ${l.dashed ? "dashed" : "solid"} ${l.border || theme.border}`,
                          }}
                        />
                        <span style={{ fontSize: 10, opacity: 0.7, letterSpacing: "0.04em" }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "hoy" && (
            <div
              style={{
                position: "relative",
                borderRadius: 24,
                overflow: "hidden",
                backgroundColor: theme.card,
                border: `1px solid ${theme.border}`,
                boxShadow: isDark
                  ? "0 12px 40px rgba(0,0,0,0.35)"
                  : "0 12px 32px rgba(36,54,56,0.08)",
                transition: "all 0.35s ease",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url(${logoImg})`,
                  backgroundSize: isMobile ? "240px" : "380px",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: isMobile ? "center 10%" : "center 20%",
                  opacity: theme.logoOpacity * 0.8,
                  pointerEvents: "none",
                  filter: isDark ? "brightness(1.8)" : "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: theme.overlay,
                  pointerEvents: "none",
                }}
              />
              <div style={{ position: "relative", zIndex: 2, padding: 20 }}>
                <div className="flex gap-4 items-center">
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 20,
                      backgroundColor: theme.bg,
                      border: `1px solid ${theme.border}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
                    <span style={{ fontSize: 22, fontWeight: 700 }} className="fraunces">
                      {today.getDate()}
                    </span>
                    <span style={{ fontSize: 9, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                      {today.toLocaleDateString("es-ES", { month: "short" })}
                    </span>
                  </div>
                  <div>
                    <h3 className="fraunces" style={{ fontSize: 18, lineHeight: 1.1 }}>
                      Día {cycleDayForToday} del ciclo
                    </h3>
                    <p style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
                      {getDayType(today) === "period"
                        ? "Hoy es día de periodo. Descansa e hidrátate."
                        : getDayType(today) === "fertile"
                        ? "Ventana fértil. Alta probabilidad."
                        : getDayType(today) === "ovulation"
                        ? "Día de ovulación."
                        : "Día regular del ciclo."}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  <h4 style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.5, fontWeight: 600 }}>
                    Recordatorios
                  </h4>
                  {[
                    { id: "agua", label: "Beber agua", desc: "2.2L hoy", icon: "💧" },
                    { id: "pastilla", label: "Pastilla / suplemento", desc: "20:00", icon: "💊" },
                    { id: "sueno", label: "Sueño", desc: "7.5h objetivo", icon: "🌙" },
                  ].map((r) => {
                    const active = (reminders as any)[r.id];
                    return (
                      <div
                        key={r.id}
                        style={{
                          backgroundColor: theme.gridBg,
                          border: `1px solid ${theme.border}`,
                          borderRadius: 16,
                          padding: "14px 16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          backdropFilter: "blur(12px)",
                          transition: "all 0.25s ease",
                        }}
                      >
                        <div className="flex gap-3 items-center">
                          <span style={{ fontSize: 18 }}>{r.icon}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{r.label}</div>
                            <div style={{ fontSize: 11, opacity: 0.6 }}>{r.desc}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setReminders((p) => ({ ...p, [r.id]: !active }))}
                          style={{
                            width: 44,
                            height: 26,
                            borderRadius: 999,
                            backgroundColor: active ? "#72C8D0" : theme.border,
                            position: "relative",
                            transition: "all 0.25s ease",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 999,
                              backgroundColor: "#fff",
                              position: "absolute",
                              top: 3,
                              left: active ? 21 : 3,
                              transition: "all 0.25s ease",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                            }}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === "historial" && (
            <div
              style={{
                borderRadius: 24,
                backgroundColor: theme.card,
                border: `1px solid ${theme.border}`,
                padding: 24,
                minHeight: 320,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                transition: "all 0.35s ease",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 24,
                  backgroundColor: theme.bg,
                  border: `1px solid ${theme.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 28, opacity: 0.7 }}>📊</span>
              </div>
              <h3 className="fraunces" style={{ fontSize: 18 }}>
                Historial en construcción
              </h3>
              <p style={{ fontSize: 13, opacity: 0.6, marginTop: 8, maxWidth: 260, lineHeight: 1.5 }}>
                Aquí verás tus ciclos pasados, duración promedio y patrones. Versión final estable v1.0
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-[320px]">
                {[
                  { k: "28 días", v: "Promedio" },
                  { k: "5 días", v: "Periodo" },
                  { k: "3", v: "Ciclos" },
                ].map((s) => (
                  <div
                    key={s.v}
                    style={{
                      backgroundColor: theme.gridBg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 14,
                      padding: "10px 8px",
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700 }} className="fraunces">
                      {s.k}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.12em",
            opacity: 0.35,
            textAlign: "center",
            padding: "24px 0 8px",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          MyM for LilibetSP. courtesy of geeskit.com 2026
        </div>
      </div>
    </div>
  );
}

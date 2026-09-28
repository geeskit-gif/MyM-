import { useEffect, useMemo, useState } from "react";
import logoImg from "./assets/logo.png";

type Profile = {
  name: string;
  periodStart: string;
  cycleLength: number;
  periodLength: number;
};

type DayType = "normal" | "period" | "predicted" | "fertile" | "ovulation";

const PROFILE_KEY = "mym-profile";
const REMINDERS_KEY = "mym-reminders";
const THEME_KEY = "mym-theme";

const todayDate = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const dateToInput = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const inputToDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const daysBetween = (a: Date, b: Date) =>
  Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export default function App() {
  const today = useMemo(() => todayDate(), []);

  const [profile, setProfile] = useState<Profile | null>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === "dark";
    } catch {
      return false;
    }
  });

  const [tab, setTab] = useState<"hoy" | "calendario" | "historial">("hoy");

  const [viewDate, setViewDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [isMobile, setIsMobile] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const [reminders, setReminders] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(REMINDERS_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      return {
        periodo: Boolean(parsed.periodo),
        pastilla: Boolean(parsed.pastilla),
      };
    } catch {
      return { periodo: false, pastilla: false };
    }
  });

  const [notificationMessage, setNotificationMessage] = useState("");

  const [name, setName] = useState("");
  const [lastPeriod, setLastPeriod] = useState(dateToInput(today));
  const [cycleLength, setCycleLength] = useState("28");
  const [periodLength, setPeriodLength] = useState("5");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);

    check();
    window.addEventListener("resize", check);

    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as any);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  const theme = useMemo(() => {
    if (!isDark) {
      return {
        bg: "#F7FBFA",
        text: "#243638",
        muted: "#657778",
        card: "#FFFFFF",
        border: "#DDECEA",
        soft: "#EDF7F6",
        aqua: "#72C8D0",
        aquaDark: "#2F858D",
        todayBg: "#243638",
        todayText: "#FFFFFF",
        periodBg: "rgba(255, 198, 201, 0.55)",
        fertileBg: "rgba(180, 231, 232, 0.42)",
        ovulationBg: "rgba(255,255,255,0.8)",
      };
    }

    return {
      bg: "#0F1A1B",
      text: "#E8F2F0",
      muted: "#A8B9BA",
      card: "#1A2E30",
      border: "#2A4446",
      soft: "#20383A",
      aqua: "#72C8D0",
      aquaDark: "#9BE0E5",
      todayBg: "#72C8D0",
      todayText: "#0F1A1B",
      periodBg: "rgba(255, 120, 120, 0.25)",
      fertileBg: "rgba(114, 200, 208, 0.15)",
      ovulationBg: "rgba(255,255,255,0.12)",
    };
  }, [isDark]);

  const periodStart = profile ? inputToDate(profile.periodStart) : null;

  const cycleDayForToday = useMemo(() => {
    if (!profile || !periodStart) return 0;

    const diff = daysBetween(today, periodStart);
    return ((diff % profile.cycleLength) + profile.cycleLength) % profile.cycleLength + 1;
  }, [profile, periodStart, today]);

  const getDayType = (date: Date): DayType => {
    if (!profile || !periodStart) return "normal";

    const diffDays = daysBetween(date, periodStart);

    if (diffDays < 0) return "normal";

    const cyclePosition =
      ((diffDays % profile.cycleLength) + profile.cycleLength) %
      profile.cycleLength;

    const isFuture = date.getTime() > today.getTime();

    if (cyclePosition < profile.periodLength) {
      return isFuture ? "predicted" : "period";
    }

    const ovulationDay = Math.max(profile.cycleLength - 14, 1);

    if (cyclePosition === ovulationDay) {
      return "ovulation";
    }

    if (
      cyclePosition >= ovulationDay - 5 &&
      cyclePosition <= ovulationDay + 1
    ) {
      return "fertile";
    }

    return "normal";
  };

  const handleStart = () => {
    const cleanName = name.trim();

    if (!cleanName || !lastPeriod) return;

    const selectedDate = inputToDate(lastPeriod);

    if (selectedDate.getTime() > today.getTime()) {
      return;
    }

    const newProfile: Profile = {
      name: cleanName,
      periodStart: lastPeriod,
      cycleLength: Number(cycleLength),
      periodLength: Number(periodLength),
    };

    localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
    setProfile(newProfile);
    setTab("hoy");
    setViewDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    );
  };

  const registerNewPeriod = () => {
    if (!profile) return;

    const updatedProfile = {
      ...profile,
      periodStart: dateToInput(today),
    };

    localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));
    setProfile(updatedProfile);
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const changeMonth = (delta: number) => {
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1)
    );
  };

  const monthLabel = viewDate.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0
  ).getDate();

  const startWeekDay =
    (new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() + 6) %
    7;

  const calendarDays = useMemo(() => {
    const cells: Array<Date | null> = [];

    for (let i = 0; i < startWeekDay; i++) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(
        new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
      );
    }

    return cells;
  }, [daysInMonth, startWeekDay, viewDate]);

  const nextPeriodDate = useMemo(() => {
    if (!profile || !periodStart) return null;

    const next = new Date(periodStart);
    next.setDate(next.getDate() + profile.cycleLength);

    while (next.getTime() <= today.getTime()) {
      next.setDate(next.getDate() + profile.cycleLength);
    }

    return next;
  }, [profile, periodStart, today]);

  const daysUntilNextPeriod = nextPeriodDate
    ? daysBetween(nextPeriodDate, today)
    : 0;

  const showPeriodNotification = async () => {
    if (!("Notification" in window)) {
      setNotificationMessage("Este dispositivo no admite notificaciones web.");
      return false;
    }

    if (Notification.permission !== "granted") {
      setNotificationMessage("Activa las notificaciones del navegador para recibir el aviso.");
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification("🩸 MyM", {
        body: "Tu periodo podría comenzar mañana.",
        icon: "./icons/icon-192.png",
        badge: "./icons/icon-192.png",
        tag: "mym-period-reminder",
      });
      return true;
    } catch {
      setNotificationMessage("No pudimos mostrar el aviso en este momento.");
      return false;
    }
  };

  const toggleReminder = async (id: string) => {
    if (id === "periodo") {
      const willEnable = !reminders.periodo;

      if (willEnable) {
        if (!("Notification" in window)) {
          setNotificationMessage("Este dispositivo no admite notificaciones web.");
          return;
        }

        if (Notification.permission !== "granted") {
          const permission = await Notification.requestPermission();

          if (permission !== "granted") {
            setNotificationMessage("Sin permiso, MyM no podrá avisarte.");
            return;
          }
        }

        setNotificationMessage("Aviso de periodo activado.");
      } else {
        setNotificationMessage("Aviso de periodo desactivado.");
      }
    }

    const next = {
      ...reminders,
      [id]: !reminders[id],
    };

    setReminders(next);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(next));
  };

  const handleInstall = async () => {
    if (!installPrompt) return;

    const promptEvent = installPrompt;
    setInstallPrompt(null);

    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
    } catch {
      // The browser controls the installation UI.
    }
  };

  useEffect(() => {
    if (
      !profile ||
      !reminders.periodo ||
      !nextPeriodDate ||
      !("Notification" in window) ||
      Notification.permission !== "granted" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    const reminderDate = new Date(nextPeriodDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(9, 0, 0, 0);

    const notificationKey = `mym-period-notified-${dateToInput(nextPeriodDate)}`;
    const alreadyNotified = localStorage.getItem(notificationKey) === "1";

    if (alreadyNotified) return;

    const notify = async () => {
      const shown = await showPeriodNotification();

      if (shown) {
        localStorage.setItem(notificationKey, "1");
      }
    };

    const delay = reminderDate.getTime() - Date.now();

    if (delay <= 0 && isSameDay(today, reminderDate)) {
      void notify();
      return;
    }

    if (delay <= 0) return;

    const MAX_TIMER = 2147483647;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = (remaining: number) => {
      timer = setTimeout(() => {
        if (remaining > MAX_TIMER) {
          schedule(remaining - MAX_TIMER);
        } else {
          void notify();
        }
      }, Math.min(remaining, MAX_TIMER));
    };

    schedule(delay);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [profile, reminders.periodo, nextPeriodDate, today]);


  const handleToggleTheme = () => {
    setIsDark((value) => !value);
  };

  /*
   * FIRST VISIT
   * This is intentionally outside the normal app shell.
   * A new user should never land directly inside Calendar.
   */
  if (!profile) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: theme.bg,
          color: theme.text,
          display: "flex",
          justifyContent: "center",
          padding: "24px 16px",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@400;500;600;700&display=swap');

          * {
            box-sizing: border-box;
            font-family: 'Inter', system-ui, sans-serif;
          }

          .fraunces {
            font-family: 'Fraunces', Georgia, serif;
          }

          input, select, button {
            font: inherit;
          }

          button {
            -webkit-tap-highlight-color: transparent;
          }
        `}</style>

        <main
          style={{
            width: "100%",
            maxWidth: 520,
            paddingTop: 20,
            paddingBottom: 40,
          }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 34,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <img
                src={logoImg}
                alt="MyM"
                style={{
                  width: 46,
                  height: 46,
                  objectFit: "contain",
                }}
              />

              <div>
                <div
                  className="fraunces"
                  style={{
                    fontSize: 26,
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                  }}
                >
                  MyM
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.13em",
                    textTransform: "uppercase",
                    color: theme.muted,
                  }}
                >
                  Mi Ciclo, Mi Ritmo
                </div>
              </div>
            </div>

            <button
              onClick={handleToggleTheme}
              aria-label="Cambiar tema"
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                border: `1px solid ${theme.border}`,
                background: theme.card,
                color: theme.text,
                cursor: "pointer",
              }}
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </header>

          <section
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: 28,
              padding: isMobile ? 24 : 34,
              boxShadow: isDark
                ? "0 18px 50px rgba(0,0,0,0.25)"
                : "0 18px 50px rgba(36,54,56,0.08)",
            }}
          >
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 20,
                background: theme.soft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 22,
                fontSize: 30,
              }}
            >
              🌊
            </div>

            <h1
              className="fraunces"
              style={{
                fontSize: isMobile ? 30 : 36,
                lineHeight: 1.05,
                margin: 0,
                letterSpacing: "-0.03em",
              }}
            >
              Hola, bienvenida a MyM
            </h1>

            <p
              style={{
                color: theme.muted,
                fontSize: 15,
                lineHeight: 1.65,
                marginTop: 12,
                marginBottom: 30,
              }}
            >
              Vamos a conocer tu ciclo. Solo necesitamos unos datos para
              comenzar.
            </p>

            <div style={{ display: "grid", gap: 22 }}>
              <label style={{ display: "grid", gap: 8 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                  }}
                >
                  ¿Cómo te llamas?
                </span>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  autoComplete="name"
                  style={{
                    width: "100%",
                    height: 50,
                    borderRadius: 14,
                    border: `1px solid ${theme.border}`,
                    background: theme.bg,
                    color: theme.text,
                    padding: "0 15px",
                    outline: "none",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                  }}
                >
                  ¿Cuándo comenzó tu último periodo?
                </span>

                <input
                  type="date"
                  value={lastPeriod}
                  max={dateToInput(today)}
                  onChange={(e) => setLastPeriod(e.target.value)}
                  style={{
                    width: "100%",
                    height: 50,
                    borderRadius: 14,
                    border: `1px solid ${theme.border}`,
                    background: theme.bg,
                    color: theme.text,
                    padding: "0 15px",
                    outline: "none",
                  }}
                />
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <label style={{ display: "grid", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Duración del ciclo
                  </span>

                  <select
                    value={cycleLength}
                    onChange={(e) => setCycleLength(e.target.value)}
                    style={{
                      width: "100%",
                      height: 50,
                      borderRadius: 14,
                      border: `1px solid ${theme.border}`,
                      background: theme.bg,
                      color: theme.text,
                      padding: "0 12px",
                      outline: "none",
                    }}
                  >
                    {[21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35].map(
                      (days) => (
                        <option key={days} value={days}>
                          {days} días
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label style={{ display: "grid", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Duración del periodo
                  </span>

                  <select
                    value={periodLength}
                    onChange={(e) => setPeriodLength(e.target.value)}
                    style={{
                      width: "100%",
                      height: 50,
                      borderRadius: 14,
                      border: `1px solid ${theme.border}`,
                      background: theme.bg,
                      color: theme.text,
                      padding: "0 12px",
                      outline: "none",
                    }}
                  >
                    {[2, 3, 4, 5, 6, 7, 8].map((days) => (
                      <option key={days} value={days}>
                        {days} días
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                onClick={handleStart}
                disabled={
                  !name.trim() ||
                  !lastPeriod ||
                  inputToDate(lastPeriod).getTime() > today.getTime()
                }
                style={{
                  marginTop: 4,
                  width: "100%",
                  height: 54,
                  borderRadius: 16,
                  border: "none",
                  background:
                    !name.trim() || !lastPeriod
                      ? theme.border
                      : theme.aqua,
                  color:
                    !name.trim() || !lastPeriod
                      ? theme.muted
                      : "#173437",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor:
                    !name.trim() || !lastPeriod
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Comenzar
              </button>
            </div>

            <p
              style={{
                textAlign: "center",
                color: theme.muted,
                fontSize: 11,
                lineHeight: 1.5,
                marginTop: 18,
              }}
            >
              Tus datos se guardan solo en este dispositivo.
            </p>
          </section>

          <footer
            style={{
              textAlign: "center",
              color: theme.muted,
              opacity: 0.7,
              fontSize: 9,
              letterSpacing: "0.1em",
              marginTop: 22,
              textTransform: "uppercase",
            }}
          >
            MyM for LilibetSP. courtesy of geeskit.com 2026
          </footer>
        </main>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
        color: theme.text,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@400;500;600;700&display=swap');

        * {
          box-sizing: border-box;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .fraunces {
          font-family: 'Fraunces', Georgia, serif;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>

      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "24px 16px 12px",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
            }}
          >
            <img
              src={logoImg}
              alt="MyM"
              style={{
                width: 42,
                height: 42,
                objectFit: "contain",
              }}
            />

            <div>
              <div
                className="fraunces"
                style={{
                  fontSize: 23,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                }}
              >
                MyM
              </div>

              <div
                style={{
                  fontSize: 9,
                  marginTop: 5,
                  fontWeight: 700,
                  letterSpacing: "0.13em",
                  textTransform: "uppercase",
                  color: theme.muted,
                }}
              >
                Mi Ciclo, Mi Ritmo
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {installPrompt && (
              <button
                onClick={handleInstall}
                style={{
                  height: 38,
                  padding: "0 12px",
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                  background: theme.card,
                  color: theme.text,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Instalar
              </button>
            )}

            <button
              onClick={handleToggleTheme}
              aria-label="Cambiar tema"
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                border: `1px solid ${theme.border}`,
                background: theme.card,
                color: theme.text,
                cursor: "pointer",
              }}
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        <nav
          style={{
            display: "flex",
            gap: 8,
            marginTop: 24,
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          {[
            { id: "hoy" as const, label: "Hoy" },
            { id: "calendario" as const, label: "Calendario" },
            { id: "historial" as const, label: "Historial" },
          ].map((item) => {
            const active = tab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                style={{
                  padding: "9px 16px",
                  borderRadius: 12,
                  border: `1px solid ${
                    active ? theme.text : theme.border
                  }`,
                  background: active ? theme.text : "transparent",
                  color: active ? theme.bg : theme.text,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <main style={{ marginTop: 18 }}>
          {tab === "hoy" && (
            <section
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 26,
                padding: isMobile ? 22 : 30,
                boxShadow: isDark
                  ? "0 18px 50px rgba(0,0,0,0.22)"
                  : "0 18px 50px rgba(36,54,56,0.07)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 66,
                    height: 66,
                    borderRadius: 18,
                    background: theme.soft,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <span
                    className="fraunces"
                    style={{
                      fontSize: 23,
                      lineHeight: 1,
                    }}
                  >
                    {today.getDate()}
                  </span>

                  <span
                    style={{
                      fontSize: 9,
                      color: theme.muted,
                      textTransform: "uppercase",
                      marginTop: 4,
                      fontWeight: 700,
                    }}
                  >
                    {today.toLocaleDateString("es-ES", {
                      month: "short",
                    })}
                  </span>
                </div>

                <div>
                  <p
                    style={{
                      color: theme.muted,
                      fontSize: 12,
                      margin: 0,
                    }}
                  >
                    Hola, {profile.name}
                  </p>

                  <h1
                    className="fraunces"
                    style={{
                      margin: "4px 0 0",
                      fontSize: isMobile ? 25 : 30,
                      lineHeight: 1.05,
                    }}
                  >
                    Día {cycleDayForToday} de tu ciclo
                  </h1>
                </div>
              </div>

              <div
                style={{
                  marginTop: 26,
                  padding: 18,
                  borderRadius: 18,
                  background: theme.soft,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: theme.muted,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Hoy
                </div>

                <div
                  className="fraunces"
                  style={{
                    fontSize: 22,
                    marginTop: 6,
                  }}
                >
                  {getDayType(today) === "period"
                    ? "Estás en tu periodo"
                    : getDayType(today) === "ovulation"
                    ? "Día estimado de ovulación"
                    : getDayType(today) === "fertile"
                    ? "Ventana fértil estimada"
                    : "Día regular de tu ciclo"}
                </div>

                <p
                  style={{
                    color: theme.muted,
                    fontSize: 13,
                    lineHeight: 1.55,
                    margin: "7px 0 0",
                  }}
                >
                  MyM usa tus registros para ayudarte a entender el ritmo de
                  tu ciclo.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 12,
                  marginTop: 14,
                }}
              >
                <div
                  style={{
                    border: `1px solid ${theme.border}`,
                    borderRadius: 18,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: theme.muted,
                      fontWeight: 700,
                    }}
                  >
                    PRÓXIMO PERIODO
                  </div>

                  <div
                    className="fraunces"
                    style={{
                      fontSize: 20,
                      marginTop: 7,
                    }}
                  >
                    {nextPeriodDate
                      ? nextPeriodDate.toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                        })
                      : "—"}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: theme.muted,
                      marginTop: 4,
                    }}
                  >
                    Aproximadamente en {daysUntilNextPeriod} días
                  </div>
                </div>

                <div
                  style={{
                    border: `1px solid ${theme.border}`,
                    borderRadius: 18,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: theme.muted,
                      fontWeight: 700,
                    }}
                  >
                    TU CICLO
                  </div>

                  <div
                    className="fraunces"
                    style={{
                      fontSize: 20,
                      marginTop: 7,
                    }}
                  >
                    {profile.cycleLength} días
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: theme.muted,
                      marginTop: 4,
                    }}
                  >
                    Periodo habitual: {profile.periodLength} días
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 28 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <h2
                    className="fraunces"
                    style={{
                      fontSize: 19,
                      margin: 0,
                    }}
                  >
                    Recordatorios
                  </h2>

                  <span
                    style={{
                      fontSize: 10,
                      color: theme.muted,
                    }}
                  >
                    Opcionales
                  </span>
                </div>

                <div style={{ display: "grid", gap: 9 }}>
                  {[
                    {
                      id: "periodo",
                      label: "Avisarme 1 día antes de mi periodo",
                      desc: nextPeriodDate
                        ? `Próximo aviso: ${nextPeriodDate.toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "long",
                          })} menos 1 día`
                        : "Aviso de tu próximo periodo",
                      icon: "🩸",
                    },
                    {
                      id: "pastilla",
                      label: "Pastilla / suplemento",
                      desc: "Tu recordatorio",
                      icon: "💊",
                    },
                  ].map((item) => {
                    const active = reminders[item.id];

                    return (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "13px 14px",
                          borderRadius: 16,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 11,
                          }}
                        >
                          <span style={{ fontSize: 18 }}>{item.icon}</span>

                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              {item.label}
                            </div>

                            <div
                              style={{
                                fontSize: 10,
                                color: theme.muted,
                                marginTop: 2,
                              }}
                            >
                              {item.desc}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleReminder(item.id)}
                          aria-label={`Activar ${item.label}`}
                          style={{
                            width: 44,
                            height: 26,
                            border: "none",
                            borderRadius: 20,
                            background: active ? theme.aqua : theme.border,
                            padding: 3,
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: active
                              ? "flex-end"
                              : "flex-start",
                          }}
                        >
                          <span
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              background: "#fff",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                            }}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {notificationMessage && (
                  <p
                    style={{
                      margin: "10px 4px 0",
                      fontSize: 10,
                      lineHeight: 1.5,
                      color: theme.muted,
                    }}
                  >
                    {notificationMessage}
                  </p>
                )}
              </div>

              <button
                onClick={registerNewPeriod}
                style={{
                  width: "100%",
                  marginTop: 20,
                  height: 46,
                  borderRadius: 14,
                  border: `1px solid ${theme.border}`,
                  background: "transparent",
                  color: theme.text,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Registrar que comenzó mi periodo hoy
              </button>
            </section>
          )}

          {tab === "calendario" && (
            <section
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 26,
                padding: isMobile ? 16 : 24,
                boxShadow: isDark
                  ? "0 18px 50px rgba(0,0,0,0.22)"
                  : "0 18px 50px rgba(36,54,56,0.07)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 18,
                }}
              >
                <button
                  onClick={() => changeMonth(-1)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    border: `1px solid ${theme.border}`,
                    background: theme.bg,
                    color: theme.text,
                    fontSize: 20,
                    cursor: "pointer",
                  }}
                >
                  ‹
                </button>

                <h2
                  className="fraunces"
                  style={{
                    fontSize: 21,
                    margin: 0,
                    textTransform: "capitalize",
                  }}
                >
                  {monthLabel}
                </h2>

                <button
                  onClick={() => changeMonth(1)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    border: `1px solid ${theme.border}`,
                    background: theme.bg,
                    color: theme.text,
                    fontSize: 20,
                    cursor: "pointer",
                  }}
                >
                  ›
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 5,
                  marginBottom: 7,
                }}
              >
                {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
                  <div
                    key={day}
                    style={{
                      textAlign: "center",
                      fontSize: 10,
                      color: theme.muted,
                      fontWeight: 700,
                      padding: "5px 0",
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 5,
                }}
              >
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} />;
                  }

                  const type = getDayType(date);
                  const todayCell = isSameDay(date, today);

                  let background = theme.bg;
                  let border = theme.border;
                  let color = theme.text;

                  if (type === "period") {
                    background = theme.periodBg;
                  }

                  if (type === "predicted") {
                    background = theme.periodBg;
                    border = theme.aquaDark;
                  }

                  if (type === "fertile") {
                    background = theme.fertileBg;
                  }

                  if (type === "ovulation") {
                    background = theme.ovulationBg;
                    border = theme.aqua;
                  }

                  if (todayCell) {
                    background = theme.todayBg;
                    color = theme.todayText;
                    border = theme.todayBg;
                  }

                  return (
                    <div
                      key={date.toISOString()}
                      style={{
                        aspectRatio: "1",
                        minWidth: 0,
                        borderRadius: 12,
                        background,
                        border: `1px ${
                          type === "predicted" ? "dashed" : "solid"
                        } ${border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color,
                        fontSize: 12,
                        fontWeight: todayCell ? 800 : 500,
                      }}
                      title={`${date.toLocaleDateString("es-ES")}`}
                    >
                      {date.getDate()}
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: `1px solid ${theme.border}`,
                }}
              >
                {[
                  { label: "Periodo", bg: theme.periodBg },
                  { label: "Predicción", bg: theme.periodBg },
                  { label: "Fértil", bg: theme.fertileBg },
                  { label: "Ovulación", bg: theme.ovulationBg },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 11,
                        height: 11,
                        borderRadius: 4,
                        background: item.bg,
                        border: `1px solid ${theme.border}`,
                      }}
                    />

                    <span
                      style={{
                        fontSize: 10,
                        color: theme.muted,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === "historial" && (
            <section
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 26,
                padding: isMobile ? 24 : 32,
              }}
            >
              <h2
                className="fraunces"
                style={{
                  fontSize: 26,
                  margin: 0,
                }}
              >
                Historial
              </h2>

              <p
                style={{
                  color: theme.muted,
                  fontSize: 13,
                  lineHeight: 1.6,
                  marginTop: 8,
                }}
              >
                Aquí irán apareciendo tus registros a medida que uses MyM.
              </p>

              <div
                style={{
                  marginTop: 22,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 18,
                  padding: 18,
                  background: theme.soft,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: theme.muted,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Primer registro
                </div>

                <div
                  className="fraunces"
                  style={{
                    fontSize: 20,
                    marginTop: 7,
                  }}
                >
                  {periodStart.toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: theme.muted,
                    marginTop: 5,
                  }}
                >
                  Periodo registrado · {profile.periodLength} días habituales
                </div>
              </div>

              <p
                style={{
                  fontSize: 11,
                  color: theme.muted,
                  lineHeight: 1.5,
                  marginTop: 18,
                }}
              >
                MyM irá construyendo tu historial con tus próximos registros.
              </p>
            </section>
          )}
        </main>

        <footer
          style={{
            textAlign: "center",
            color: theme.muted,
            opacity: 0.7,
            fontSize: 9,
            letterSpacing: "0.1em",
            marginTop: 24,
            paddingBottom: 8,
            textTransform: "uppercase",
          }}
        >
          MyM for LilibetSP. courtesy of geeskit.com 2026
        </footer>
      </div>
    </div>
  );
  }

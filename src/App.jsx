import React, { useEffect, useMemo, useState } from "react";

const customersByArea = {
  Brekkan: [
    { id: 1, name: "Haukur", price: 10000, pricing: "fixed" },
    { id: 2, name: "Örn", price: 10000, pricing: "fixed" },
    { id: 3, name: "Ottó", price: 12000, pricing: "fixed" },
    { id: 4, name: "Jonni", price: 14000, pricing: "fixed" },
    { id: 5, name: "Stekkjartún", price: 28000, pricing: "fixed" },
  ],
  Giljahverfi: [
    { id: 6, name: "Halla", price: 5000, pricing: "fixed" },
    { id: 7, name: "Frikki", price: 5000, pricing: "fixed" },
    { id: 8, name: "Stebbi", price: 5000, pricing: "fixed" },
    { id: 9, name: "Mamma", price: 5000, pricing: "fixed" },
    { id: 10, name: "Júlia", price: 20000, pricing: "fixed" },
    { id: 11, name: "Dóri", price: 20000, pricing: "fixed" },
  ],
  Miðbær: [
    { id: 12, name: "Sólveig", price: 10000, pricing: "fixed" },
    { id: 13, name: "Harpa", price: 8000, pricing: "fixed" },
    { id: 14, name: "Kaldbakur", price: 40000, pricing: "fixed" },
  ],
  Glerárhverfi: [
    { id: 15, name: "Óli", price: 10000, pricing: "fixed" },
    { id: 16, name: "Lyngholt 19", price: 10000, pricing: "fixed" },
    { id: 17, name: "Símon", price: 6000, pricing: "fixed" },
  ],
  Baldursnes: [{ id: 18, name: "Þórður", price: 12000, pricing: "fixed" }],
  Toyota: [{ id: 19, name: "Toyota", price: 2000, pricing: "hourly" }],
};

const STORAGE_KEY = "gardslattur-bjarka-calendar-v1";
const MONTHS = [
  "Janúar",
  "Febrúar",
  "Mars",
  "Apríl",
  "Maí",
  "Júní",
  "Júlí",
  "Ágúst",
  "September",
  "Október",
  "Nóvember",
  "Desember",
];
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const NAV_ITEMS = ["Dagatal", "Í dag", "Skrá", "Viðskiptavinir", "Tölur", "Meira"];

const starterLogs = [
  {
    id: 1,
    date: "2026-05-06",
    customer: "Þórður",
    area: "Baldursnes",
    pricing: "fixed",
    hourlyRate: null,
    startTime: "12:00",
    endTime: "12:35",
    minutes: 35,
    earned: 12000,
    paid: false,
  },
  {
    id: 2,
    date: "2026-05-06",
    customer: "Kaldbakur",
    area: "Miðbær",
    pricing: "fixed",
    hourlyRate: null,
    startTime: "13:00",
    endTime: "15:20",
    minutes: 140,
    earned: 40000,
    paid: false,
  },
  {
    id: 3,
    date: "2026-05-07",
    customer: "Haukur",
    area: "Brekkan",
    pricing: "fixed",
    hourlyRate: null,
    startTime: "10:00",
    endTime: "10:35",
    minutes: 35,
    earned: 10000,
    paid: true,
  },
  {
    id: 4,
    date: "2026-04-12",
    customer: "Halla",
    area: "Giljahverfi",
    pricing: "fixed",
    hourlyRate: null,
    startTime: "12:00",
    endTime: "14:34",
    minutes: 154,
    earned: 5000,
    paid: true,
  },
  {
    id: 5,
    date: "2026-05-12",
    customer: "Toyota",
    area: "Toyota",
    pricing: "hourly",
    hourlyRate: 2000,
    startTime: "09:00",
    endTime: "11:00",
    minutes: 120,
    earned: 4000,
    paid: true,
  },
];

function kr(n) {
  return `${Number(n || 0).toLocaleString("is-IS")} kr.`;
}

function minutesBetween(start, end) {
  if (!start || !end || !start.includes(":") || !end.includes(":")) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  return Math.max(0, e - s);
}

function minsToText(mins) {
  const h = Math.floor((mins || 0) / 60);
  const m = (mins || 0) % 60;
  if (h && m) return `${h} klst ${m} mín`;
  if (h) return `${h} klst`;
  return `${m} mín`;
}

function formatLongDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildCalendar(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  const startDay = first.getDay();
  const totalDays = last.getDate();
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, monthIndex, day);
    cells.push({
      day,
      dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function cardStyle(extra = {}) {
  return {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(255,255,255,0.85)",
    borderRadius: 28,
    padding: 16,
    boxShadow: "0 16px 36px rgba(15,23,42,0.08)",
    backdropFilter: "blur(10px)",
    ...extra,
  };
}

function inputStyle() {
  return {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 18,
    border: "1px solid #dbe2ea",
    fontSize: 16,
    boxSizing: "border-box",
    background: "#fff",
    color: "#0f172a",
    outline: "none",
  };
}

function buttonStyle(primary = false) {
  return {
    borderRadius: 18,
    padding: "12px 16px",
    border: primary ? "none" : "1px solid #dbe2ea",
    background: primary
      ? "linear-gradient(135deg,#0f172a 0%, #1d4ed8 100%)"
      : "#fff",
    color: primary ? "#fff" : "#0f172a",
    cursor: "pointer",
    fontWeight: 700,
  };
}

function iconForNav(name) {
  switch (name) {
    case "Dagatal":
      return "📅";
    case "Í dag":
      return "⏰";
    case "Skrá":
      return "➕";
    case "Viðskiptavinir":
      return "👤";
    case "Tölur":
      return "📊";
    default:
      return "⋯";
  }
}

export default function App() {
  const [screen, setScreen] = useState("Í dag");
  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : starterLogs;
    } catch {
      return starterLogs;
    }
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [expandedArea, setExpandedArea] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey(new Date(2026, 3, 1)));
  const [editingLogId, setEditingLogId] = useState(null);
  const [dayTimerStart, setDayTimerStart] = useState(null);
  const [dayTimerRunning, setDayTimerRunning] = useState(false);
  const [timerNow, setTimerNow] = useState(Date.now());

  const [entry, setEntry] = useState({
    area: "Brekkan",
    customer: "Haukur",
    date: "2026-04-12",
    startTime: "12:00",
    endTime: "13:00",
    earned: "10000",
    paid: false,
  });

  const [editForm, setEditForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    earned: "",
    paid: false,
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch {}
  }, [logs]);

  useEffect(() => {
    if (!dayTimerRunning) return;
    const interval = setInterval(() => {
      setTimerNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [dayTimerRunning]);

  const availableCustomers = customersByArea[entry.area] || [];
  const selectedCustomer = availableCustomers.find((c) => c.name === entry.customer);
  const currentMinutes = minutesBetween(entry.startTime, entry.endTime);

  useEffect(() => {
    if (selectedCustomer?.pricing === "hourly") {
      setEntry((prev) => ({
        ...prev,
        earned: String(Math.round((currentMinutes / 60) * selectedCustomer.price)),
      }));
    }
  }, [entry.startTime, entry.endTime, entry.customer, entry.area]);

  const setAreaAndDefaultCustomer = (area) => {
    const firstCustomer = (customersByArea[area] || [])[0];
    const mins = minutesBetween(entry.startTime, entry.endTime);
    setEntry((prev) => ({
      ...prev,
      area,
      customer: firstCustomer?.name || "",
      earned:
        firstCustomer?.pricing === "hourly"
          ? String(Math.round((mins / 60) * (firstCustomer?.price || 0)))
          : String(firstCustomer?.price || ""),
    }));
  };

  const setCustomerAndAutoPrice = (customerName) => {
    const picked = (customersByArea[entry.area] || []).find((c) => c.name === customerName);
    const mins = minutesBetween(entry.startTime, entry.endTime);
    setEntry((prev) => ({
      ...prev,
      customer: customerName,
      earned:
        picked?.pricing === "hourly"
          ? String(Math.round((mins / 60) * (picked?.price || 0)))
          : String(picked?.price || ""),
    }));
  };

  const addLog = () => {
    if (!entry.customer || !entry.date || !entry.startTime || !entry.endTime || !entry.earned) {
      return;
    }
    const mins = minutesBetween(entry.startTime, entry.endTime);
    const picked = (customersByArea[entry.area] || []).find((c) => c.name === entry.customer);
    setLogs((prev) => [
      {
        id: Date.now(),
        date: entry.date,
        customer: entry.customer,
        area: entry.area,
        pricing: picked?.pricing || "fixed",
        hourlyRate: picked?.pricing === "hourly" ? picked.price : null,
        startTime: entry.startTime,
        endTime: entry.endTime,
        minutes: mins,
        earned: Number(entry.earned),
        paid: entry.paid,
      },
      ...prev,
    ]);
    setEntry((prev) => ({
      ...prev,
      startTime: "12:00",
      endTime: "13:00",
      earned: picked?.pricing === "hourly" ? String(picked.price) : String(picked?.price || ""),
      paid: false,
    }));
  };

  const togglePaid = (id) => {
    setLogs((prev) => prev.map((log) => (log.id === id ? { ...log, paid: !log.paid } : log)));
  };

  const deleteLog = (id) => {
    setLogs((prev) => prev.filter((log) => log.id !== id));
    if (editingLogId === id) setEditingLogId(null);
  };

  const startEditLog = (log) => {
    setEditingLogId(log.id);
    setEditForm({
      date: log.date,
      startTime: log.startTime,
      endTime: log.endTime,
      earned: String(log.earned),
      paid: log.paid,
    });
  };

  const saveEditLog = () => {
    if (!editingLogId) return;
    setLogs((prev) =>
      prev.map((log) =>
        log.id === editingLogId
          ? {
              ...log,
              date: editForm.date,
              startTime: editForm.startTime,
              endTime: editForm.endTime,
              minutes: minutesBetween(editForm.startTime, editForm.endTime),
              earned: Number(editForm.earned),
              paid: editForm.paid,
            }
          : log
      )
    );
    setEditingLogId(null);
  };

  const cancelEdit = () => setEditingLogId(null);

  const allTotal = logs.reduce((sum, log) => sum + log.earned, 0);
  const unpaidTotal = logs.filter((log) => !log.paid).reduce((sum, log) => sum + log.earned, 0);
  const paidTotal = logs.filter((log) => log.paid).reduce((sum, log) => sum + log.earned, 0);
  const allMinutes = logs.reduce((sum, log) => sum + log.minutes, 0);

  const clientCards = useMemo(() => {
    return Object.entries(customersByArea).flatMap(([area, list]) =>
      list.map((customer) => {
        const customerLogs = logs.filter((log) => log.customer === customer.name);
        const totalEarned = customerLogs.reduce((sum, log) => sum + log.earned, 0);
        const totalMinutes = customerLogs.reduce((sum, log) => sum + log.minutes, 0);
        const calculatedHourly = totalMinutes > 0 ? Math.round(totalEarned / (totalMinutes / 60)) : 0;
        return {
          ...customer,
          area,
          count: customerLogs.length,
          totalEarned,
          totalMinutes,
          calculatedHourly,
          logs: customerLogs.sort((a, b) => b.date.localeCompare(a.date)),
        };
      })
    );
  }, [logs]);

  const clientsByArea = useMemo(() => {
    return Object.keys(customersByArea).map((area) => {
      const clients = clientCards.filter((client) => client.area === area);
      return {
        area,
        clients,
        totalEarned: clients.reduce((sum, client) => sum + client.totalEarned, 0),
        totalMinutes: clients.reduce((sum, client) => sum + client.totalMinutes, 0),
      };
    });
  }, [clientCards]);

  const selectedClientCard = clientCards.find((c) => c.name === selectedClient);

  const todayDate = useMemo(() => {
    return logs.length ? [...logs].sort((a, b) => b.date.localeCompare(a.date))[0].date : "2026-04-12";
  }, [logs]);
  const myDayLogs = logs.filter((log) => log.date === todayDate).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const dayTimerMinutes = dayTimerStart ? Math.max(0, Math.floor((timerNow - dayTimerStart) / 60000)) : 0;

  const startDayTimer = () => {
    setDayTimerStart(Date.now());
    setTimerNow(Date.now());
    setDayTimerRunning(true);
  };

  const stopDayTimer = () => {
    setDayTimerRunning(false);
  };

  const resetDayTimer = () => {
    setDayTimerRunning(false);
    setDayTimerStart(null);
    setTimerNow(Date.now());
  };

  const logsByDate = useMemo(() => {
    const map = {};
    for (const log of logs) {
      if (!map[log.date]) map[log.date] = [];
      map[log.date].push(log);
    }
    return map;
  }, [logs]);

  const monthDate = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }, [selectedMonth]);
  const monthCells = useMemo(() => buildCalendar(monthDate.getFullYear(), monthDate.getMonth()), [monthDate]);
  const selectedDayLogs = selectedDay ? logsByDate[selectedDay] || [] : [];

  const monthOptions = [];
  for (let m = 0; m < 12; m++) {
    const d = new Date(2026, m, 1);
    monthOptions.push({ value: getMonthKey(d), label: `${MONTHS[m]} 2026` });
  }

  const areaSummary = Object.entries(customersByArea).map(([area, customers]) => ({
    area,
    planned: customers.filter((c) => c.pricing !== "hourly").reduce((sum, c) => sum + c.price, 0),
    earned: logs.filter((l) => l.area === area).reduce((sum, l) => sum + l.earned, 0),
  }));

  const moreTiles = [
    { title: "Bæta við kúnna", icon: "➕" },
    { title: "Toyota", icon: "🚗" },
    { title: "Settings", icon: "⚙️" },
    { title: "Um appið", icon: "ℹ️" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f8fafc 0%, #eef2ff 100%)", padding: 16, paddingBottom: 110, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", color: "#111827" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1 }}>Garðsláttur Bjarka</div>
            <div style={{ color: "#64748b", marginTop: 6 }}>Snirtilegt mobile app fyrir slætti</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1d4ed8" }}>2026</div>
        </div>

        {screen === "Dagatal" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={cardStyle()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                <select style={{ ...inputStyle(), maxWidth: 220 }} value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setSelectedDay(null); }}>
                  {monthOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <div style={{ color: "#64748b", fontWeight: 700 }}>Ýttu á dag til að sjá detail</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
                {WEEK_DAYS.map((d) => <div key={d} style={{ textAlign: "center", fontWeight: 800, color: "#64748b", padding: "6px 0" }}>{d}</div>)}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                {monthCells.map((cell, i) => {
                  if (!cell) return <div key={i} style={{ minHeight: 104, borderRadius: 20, background: "rgba(226,232,240,0.45)" }} />;
                  const dayLogs = logsByDate[cell.dateStr] || [];
                  const total = dayLogs.reduce((sum, log) => sum + log.earned, 0);
                  const bg = dayLogs.length === 0 ? "#fff" : dayLogs.every((log) => log.paid) ? "#dcfce7" : "#dbeafe";
                  return (
                    <button key={cell.dateStr} onClick={() => setSelectedDay(cell.dateStr)} style={{ minHeight: 104, borderRadius: 20, border: selectedDay === cell.dateStr ? "2px solid #1d4ed8" : "1px solid #dbe2ea", background: bg, textAlign: "left", padding: 10, cursor: "pointer" }}>
                      <div style={{ fontWeight: 900, fontSize: 24 }}>{cell.day}</div>
                      {dayLogs.slice(0, 2).map((log) => <div key={log.id} style={{ fontSize: 12, color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{log.customer}</div>)}
                      {dayLogs.length > 0 && <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800 }}>{kr(total)}</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDay && (
              <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
                <div style={{ background: "linear-gradient(135deg,#0f172a 0%, #1d4ed8 100%)", color: "#fff", padding: 18 }}>
                  <div style={{ fontSize: 32, fontWeight: 900 }}>{formatLongDate(selectedDay)}</div>
                  <div style={{ opacity: 0.9, marginTop: 6 }}>{selectedDayLogs.length} færslur • {minsToText(selectedDayLogs.reduce((s, l) => s + l.minutes, 0))} • {kr(selectedDayLogs.reduce((s, l) => s + l.earned, 0))}</div>
                </div>
                <div style={{ padding: 14, display: "grid", gap: 10 }}>
                  {selectedDayLogs.length === 0 && <div style={{ color: "#64748b" }}>Engar færslur þennan dag.</div>}
                  {selectedDayLogs.map((log) => (
                    <div key={log.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 22, padding: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 900 }}>{log.customer}</div>
                          <div style={{ color: "#64748b", marginTop: 4 }}>{log.area}</div>
                        </div>
                        <div style={{ padding: "8px 12px", borderRadius: 999, background: log.paid ? "#dcfce7" : "#fee2e2", color: log.paid ? "#166534" : "#991b1b", fontWeight: 800 }}>{log.paid ? "Greitt" : "Ógreitt"}</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10 }}>
                        <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}><div style={{ color: "#64748b", fontSize: 13 }}>Frá</div><div style={{ fontWeight: 900, fontSize: 20 }}>{log.startTime}</div></div>
                        <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}><div style={{ color: "#64748b", fontSize: 13 }}>Til</div><div style={{ fontWeight: 900, fontSize: 20 }}>{log.endTime}</div></div>
                        <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}><div style={{ color: "#64748b", fontSize: 13 }}>Tími</div><div style={{ fontWeight: 900, fontSize: 20 }}>{minsToText(log.minutes)}</div></div>
                        <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}><div style={{ color: "#64748b", fontSize: 13 }}>Græddi</div><div style={{ fontWeight: 900, fontSize: 20 }}>{kr(log.earned)}</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {screen === "Í dag" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={cardStyle({ background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(219,234,254,0.95))" })}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 900 }}>Í dag</div>
                  <div style={{ color: "#64748b", marginTop: 4 }}>{formatLongDate(todayDate)}</div>
                </div>
                <div style={{ fontWeight: 900, fontSize: 18, color: "#1d4ed8" }}>
                  {dayTimerRunning ? "Dagur í gangi" : dayTimerStart ? "Pása" : "Ekki byrjað"}
                </div>
              </div>

              <div style={{ background: "#0f172a", color: "#fff", borderRadius: 24, padding: 18, marginTop: 14 }}>
                <div style={{ fontSize: 14, opacity: 0.8 }}>Dagstimer</div>
                <div style={{ fontSize: 34, fontWeight: 900, marginTop: 6 }}>{minsToText(dayTimerMinutes)}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                  {!dayTimerStart ? (
                    <button style={buttonStyle(true)} onClick={startDayTimer}>Byrja dag</button>
                  ) : dayTimerRunning ? (
                    <button style={buttonStyle(true)} onClick={stopDayTimer}>Stoppa dag</button>
                  ) : (
                    <button style={buttonStyle(true)} onClick={() => setDayTimerRunning(true)}>Halda áfram</button>
                  )}
                  {dayTimerStart && <button style={buttonStyle(false)} onClick={resetDayTimer}>Endurstilla</button>}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginTop: 16 }}>
                <div style={{ background: "#dbeafe", borderRadius: 22, padding: 14 }}><div style={{ color: "#475569", fontSize: 13 }}>Tekjur í dag</div><div style={{ fontWeight: 900, fontSize: 24 }}>{kr(myDayLogs.reduce((s, l) => s + l.earned, 0))}</div></div>
                <div style={{ background: "#ede9fe", borderRadius: 22, padding: 14 }}><div style={{ color: "#475569", fontSize: 13 }}>Sláttutími</div><div style={{ fontWeight: 900, fontSize: 24 }}>{minsToText(myDayLogs.reduce((s, l) => s + l.minutes, 0))}</div></div>
                <div style={{ background: "#dcfce7", borderRadius: 22, padding: 14 }}><div style={{ color: "#475569", fontSize: 13 }}>Slættir í dag</div><div style={{ fontWeight: 900, fontSize: 24 }}>{myDayLogs.length}</div></div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {myDayLogs.map((log) => (
                <div key={log.id} style={cardStyle()}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 900 }}>{log.customer}</div>
                      <div style={{ color: "#64748b", marginTop: 4 }}>{log.area}</div>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 22 }}>{kr(log.earned)}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginTop: 12 }}>
                    <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}><div style={{ color: "#64748b", fontSize: 13 }}>Frá</div><div style={{ fontWeight: 900 }}>{log.startTime}</div></div>
                    <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}><div style={{ color: "#64748b", fontSize: 13 }}>Til</div><div style={{ fontWeight: 900 }}>{log.endTime}</div></div>
                    <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}><div style={{ color: "#64748b", fontSize: 13 }}>Tími</div><div style={{ fontWeight: 900 }}>{minsToText(log.minutes)}</div></div>
                  </div>
                </div>
              ))}
              {myDayLogs.length === 0 && (
                <div style={cardStyle()}>
                  <div style={{ fontWeight: 800 }}>Engar færslur í dag enn.</div>
                  <div style={{ color: "#64748b", marginTop: 6 }}>Farðu í Skrá og bættu við slætti til að sjá timeline hér.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {screen === "Skrá" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div
              style={cardStyle({
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(239,246,255,0.95))",
                boxShadow: "0 18px 40px rgba(29,78,216,0.10)",
              })}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 14,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 30,
                      fontWeight: 900,
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                    }}
                  >
                    Skrá færslu
                  </div>
                  <div style={{ color: "#64748b", marginTop: 6 }}>
                    Settu inn dag, frá og til tíma og upphæð á snyrtilegan hátt.
                  </div>
                </div>
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "rgba(29,78,216,0.08)",
                    color: "#1d4ed8",
                    fontWeight: 800,
                  }}
                >
                  Quick add
                </div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
                  <select
                    style={inputStyle()}
                    value={entry.area}
                    onChange={(e) => setAreaAndDefaultCustomer(e.target.value)}
                  >
                    {Object.keys(customersByArea).map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                  <select
                    style={inputStyle()}
                    value={entry.customer}
                    onChange={(e) => setCustomerAndAutoPrice(e.target.value)}
                  >
                    {availableCustomers.map((customer) => (
                      <option key={customer.id} value={customer.name}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, marginLeft: 4 }}>Dagsetning</div>
                    <input
                      style={inputStyle()}
                      type="date"
                      value={entry.date}
                      onChange={(e) => setEntry({ ...entry, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, marginLeft: 4 }}>Frá</div>
                    <input
                      style={inputStyle()}
                      type="time"
                      value={entry.startTime}
                      onChange={(e) => setEntry({ ...entry, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, marginLeft: 4 }}>Til</div>
                    <input
                      style={inputStyle()}
                      type="time"
                      value={entry.endTime}
                      onChange={(e) => setEntry({ ...entry, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, marginLeft: 4 }}>Upphæð</div>
                    <input
                      style={inputStyle()}
                      type="number"
                      value={entry.earned}
                      onChange={(e) => setEntry({ ...entry, earned: e.target.value })}
                      placeholder="Upphæð"
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, marginLeft: 4 }}>Heildartími</div>
                    <div
                      style={{
                        ...inputStyle(),
                        display: "flex",
                        alignItems: "center",
                        fontWeight: 900,
                        fontSize: 24,
                        background: "#f8fafc",
                      }}
                    >
                      {minsToText(currentMinutes)}
                    </div>
                  </div>
                </div>

                <label
                  style={{
                    ...inputStyle(),
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontWeight: 700,
                    minHeight: 62,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={entry.paid}
                    onChange={(e) => setEntry({ ...entry, paid: e.target.checked })}
                  />
                  Greitt
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 14,
                }}
              >
                <div style={{ color: "#64748b", maxWidth: 520 }}>
                  Toyota tímakaup fær auto verð. Þú getur samt alltaf yfirskrifað upphæðina.
                </div>
                <button style={buttonStyle(true)} onClick={addLog}>
                  Bæta við færslu
                </button>
              </div>
            </div>
          </div>
        )}

        {screen === "Viðskiptavinir" && (
          <div style={{ display: "grid", gap: 16 }}>
            {!selectedClient && clientsByArea.map((group) => {
              const isOpen = expandedArea === group.area;
              return (
                <div key={group.area} style={cardStyle({ padding: 0, overflow: "hidden" })}>
                  <button
                    onClick={() => setExpandedArea(isOpen ? null : group.area)}
                    style={{
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      padding: 18,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 28, fontWeight: 900 }}>{group.area}</div>
                        <div style={{ color: "#64748b", marginTop: 6 }}>
                          {group.clients.length} kúnnar • {kr(group.totalEarned)} • {minsToText(group.totalMinutes)}
                        </div>
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: "#1d4ed8" }}>{isOpen ? "−" : "+"}</div>
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{ padding: "0 18px 18px", display: "grid", gap: 10 }}>
                      {group.clients.map((client) => (
                        <button
                          key={client.name}
                          onClick={() => setSelectedClient(client.name)}
                          style={{
                            ...cardStyle({ padding: 14, boxShadow: "none", borderRadius: 22, background: "#fff" }),
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: 22, fontWeight: 900 }}>{client.name}</div>
                              <div style={{ color: "#64748b", marginTop: 4 }}>
                                {client.pricing === "hourly" ? `Tímakaup ${kr(client.price)}/klst` : `Fast verð ${kr(client.price)}`}
                              </div>
                            </div>
                            <div style={{ color: "#1d4ed8", fontWeight: 800 }}>Open</div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginTop: 12 }}>
                            <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}>
                              <div style={{ color: "#64748b", fontSize: 13 }}>Slættir</div>
                              <div style={{ fontWeight: 900 }}>{client.count}</div>
                            </div>
                            <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}>
                              <div style={{ color: "#64748b", fontSize: 13 }}>Heildartími</div>
                              <div style={{ fontWeight: 900 }}>{minsToText(client.totalMinutes)}</div>
                            </div>
                            <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}>
                              <div style={{ color: "#64748b", fontSize: 13 }}>Tekjur</div>
                              <div style={{ fontWeight: 900 }}>{kr(client.totalEarned)}</div>
                            </div>
                            <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}>
                              <div style={{ color: "#64748b", fontSize: 13 }}>Tímakaup</div>
                              <div style={{ fontWeight: 900 }}>{client.totalMinutes > 0 ? `${kr(client.calculatedHourly)}/klst` : "0 kr./klst"}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {selectedClientCard && (
              <div style={{ display: "grid", gap: 16 }}>
                <button style={{ ...buttonStyle(false), width: "fit-content" }} onClick={() => setSelectedClient(null)}>
                  ← Til baka
                </button>
                <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
                  <div style={{ background: "linear-gradient(135deg,#0f172a 0%, #1d4ed8 100%)", color: "#fff", padding: 18 }}>
                    <div style={{ fontSize: 30, fontWeight: 900 }}>{selectedClientCard.name}</div>
                    <div style={{ opacity: 0.9, marginTop: 6 }}>
                      {selectedClientCard.area} • {selectedClientCard.logs.length} slættir
                    </div>
                  </div>
                  <div style={{ padding: 14, display: "grid", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10 }}>
                      <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}>
                        <div style={{ color: "#64748b", fontSize: 13 }}>Tegund</div>
                        <div style={{ fontWeight: 900 }}>{selectedClientCard.pricing === "hourly" ? `Tímakaup ${kr(selectedClientCard.price)}/klst` : `Fast verð ${kr(selectedClientCard.price)}`}</div>
                      </div>
                      <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}>
                        <div style={{ color: "#64748b", fontSize: 13 }}>Heildartími</div>
                        <div style={{ fontWeight: 900 }}>{minsToText(selectedClientCard.totalMinutes)}</div>
                      </div>
                      <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}>
                        <div style={{ color: "#64748b", fontSize: 13 }}>Tekjur</div>
                        <div style={{ fontWeight: 900 }}>{kr(selectedClientCard.totalEarned)}</div>
                      </div>
                      <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}>
                        <div style={{ color: "#64748b", fontSize: 13 }}>Reiknað tímakaup</div>
                        <div style={{ fontWeight: 900 }}>{selectedClientCard.totalMinutes > 0 ? `${kr(selectedClientCard.calculatedHourly)}/klst` : "0 kr./klst"}</div>
                      </div>
                    </div>

                    {selectedClientCard.logs.map((log) => (
                      <div key={log.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 22, padding: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 20, fontWeight: 900 }}>{formatLongDate(log.date)}</div>
                            <div style={{ color: "#64748b", marginTop: 4 }}>{log.startTime} – {log.endTime}</div>
                          </div>
                          <div style={{ padding: "8px 12px", borderRadius: 999, background: log.paid ? "#dcfce7" : "#fee2e2", color: log.paid ? "#166534" : "#991b1b", fontWeight: 800 }}>
                            {log.paid ? "Greitt" : "Ógreitt"}
                          </div>
                        </div>

                        {editingLogId === log.id ? (
                          <div style={{ display: "grid", gap: 10 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
                              <input style={inputStyle()} type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
                              <input style={inputStyle()} type="time" value={editForm.startTime} onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })} />
                              <input style={inputStyle()} type="time" value={editForm.endTime} onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })} />
                              <input style={inputStyle()} type="number" value={editForm.earned} onChange={(e) => setEditForm({ ...editForm, earned: e.target.value })} />
                              <label style={{ ...inputStyle(), display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }}><input type="checkbox" checked={editForm.paid} onChange={(e) => setEditForm({ ...editForm, paid: e.target.checked })} /> Greitt</label>
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button style={buttonStyle(true)} onClick={saveEditLog}>Vista breytingar</button>
                              <button style={buttonStyle(false)} onClick={cancelEdit}>Hætta við</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 12 }}>
                              <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}><div style={{ color: "#64748b", fontSize: 13 }}>Tími</div><div style={{ fontWeight: 900 }}>{minsToText(log.minutes)}</div></div>
                              <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}><div style={{ color: "#64748b", fontSize: 13 }}>Græddi</div><div style={{ fontWeight: 900 }}>{kr(log.earned)}</div></div>
                              <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}><div style={{ color: "#64748b", fontSize: 13 }}>Tegund</div><div style={{ fontWeight: 900 }}>{log.pricing === "hourly" ? `Tímakaup ${log.hourlyRate ? `(${kr(log.hourlyRate)}/klst)` : ""}` : "Fast verð"}</div></div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                              <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, color: "#334155" }}><input type="checkbox" checked={log.paid} onChange={() => togglePaid(log.id)} /> Breyta í greitt</label>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <button style={buttonStyle(false)} onClick={() => startEditLog(log)}>Edit</button>
                                <button style={buttonStyle(false)} onClick={() => deleteLog(log.id)}>Eyða</button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {screen === "Tölur" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
              <div style={cardStyle({ background: "linear-gradient(135deg,#dbeafe 0%, #bfdbfe 100%)" })}><div style={{ color: "#475569", fontSize: 13 }}>Heildartekjur</div><div style={{ fontSize: 28, fontWeight: 900 }}>{kr(allTotal)}</div></div>
              <div style={cardStyle({ background: "linear-gradient(135deg,#fee2e2 0%, #fecaca 100%)" })}><div style={{ color: "#475569", fontSize: 13 }}>Ógreitt</div><div style={{ fontSize: 28, fontWeight: 900 }}>{kr(unpaidTotal)}</div></div>
              <div style={cardStyle({ background: "linear-gradient(135deg,#dcfce7 0%, #bbf7d0 100%)" })}><div style={{ color: "#475569", fontSize: 13 }}>Greitt</div><div style={{ fontSize: 28, fontWeight: 900 }}>{kr(paidTotal)}</div></div>
              <div style={cardStyle({ background: "linear-gradient(135deg,#ede9fe 0%, #ddd6fe 100%)" })}><div style={{ color: "#475569", fontSize: 13 }}>Heildartími</div><div style={{ fontSize: 28, fontWeight: 900 }}>{minsToText(allMinutes)}</div></div>
            </div>

            <div style={cardStyle()}>
              <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>Áætlað fyrir sumarið</div>
              <div style={{ display: "grid", gap: 10 }}>
                {Object.values(customersByArea).flat().filter((c) => c.pricing !== "hourly").map((c) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 12 }}>
                    <span>{c.name}</span>
                    <strong>{kr(c.price)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div style={cardStyle()}>
              <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>Yfirlit eftir hverfum</div>
              <div style={{ display: "grid", gap: 10 }}>
                {areaSummary.map((row) => (
                  <div key={row.area} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 10, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 12 }}>
                    <div style={{ fontWeight: 800 }}>{row.area}</div>
                    <div>Áætlað: {kr(row.planned)}</div>
                    <div>Komið inn: {kr(row.earned)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {screen === "Meira" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
              {moreTiles.map((tile) => (
                <div key={tile.title} style={cardStyle({ minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 10 })}>
                  <div style={{ fontSize: 30 }}>{tile.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, textAlign: "center" }}>{tile.title}</div>
                </div>
              ))}
            </div>

            <div style={cardStyle({ background: "linear-gradient(180deg,#eef2ff,#e0e7ff)" })}>
              <div style={{ display: "grid", gap: 18 }}>
                <div style={{ fontSize: 24, fontWeight: 900 }}>My account</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>Company</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>Settings</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>Subscriptions</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ position: "fixed", left: 16, right: 16, bottom: 16, maxWidth: 900, margin: "0 auto", background: "rgba(255,255,255,0.95)", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 32, padding: 8, boxShadow: "0 18px 40px rgba(15,23,42,0.16)", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6 }}>
          {NAV_ITEMS.map((item) => {
            const active = screen === item;
            return (
              <button key={item} onClick={() => setScreen(item)} style={{ border: "none", background: active ? "rgba(99,102,241,0.12)" : "transparent", borderRadius: 24, padding: "10px 6px", cursor: "pointer", color: active ? "#ef4444" : "#111827" }}>
                <div style={{ fontSize: 24, lineHeight: 1 }}>{iconForNav(item)}</div>
                <div style={{ fontSize: 13, fontWeight: active ? 800 : 600, marginTop: 6 }}>{item}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


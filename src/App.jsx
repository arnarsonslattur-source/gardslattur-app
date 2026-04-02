import React, { useEffect, useMemo, useState } from "react";

const baseCustomersByArea = {
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

const AREA_ORDER = ["Brekkan", "Giljahverfi", "Miðbær", "Glerárhverfi", "Baldursnes", "Toyota"];
const STORAGE_KEY = "gardslattur-bjarka-calendar-v2";
const CUSTOMER_STORAGE_KEY = "gardslattur-bjarka-customers-v1";
const PLAN_STORAGE_KEY = "gardslattur-bjarka-plan-v1";
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
  const [customCustomers, setCustomCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem(CUSTOMER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [expandedArea, setExpandedArea] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey(new Date(2026, 3, 1)));
  const [editingLogId, setEditingLogId] = useState(null);
  const [selectedPlanDay, setSelectedPlanDay] = useState(null);
  const [planEntries, setPlanEntries] = useState(() => {
    try {
      const saved = localStorage.getItem(PLAN_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [dayTimerStart, setDayTimerStart] = useState(null);
  const [dayTimerRunning, setDayTimerRunning] = useState(false);
  const [timerNow, setTimerNow] = useState(Date.now());

  const customersByArea = useMemo(() => {
    const result = AREA_ORDER.reduce((acc, area) => {
      acc[area] = [...(baseCustomersByArea[area] || [])];
      return acc;
    }, {});
    for (const customer of customCustomers) {
      if (!result[customer.area]) result[customer.area] = [];
      result[customer.area].push(customer);
    }
    return result;
  }, [customCustomers]);

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

  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    area: "Brekkan",
    pricing: "fixed",
    price: "",
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch {}
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customCustomers));
    } catch {}
  }, [customCustomers]);

  useEffect(() => {
    try {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(planEntries));
    } catch {}
  }, [planEntries]);

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
      earned:
        picked?.pricing === "hourly"
          ? String(Math.round((60 / 60) * (picked?.price || 0)))
          : String(picked?.price || ""),
      paid: false,
    }));
  };

  const addCustomer = () => {
    if (!newCustomerForm.name || !newCustomerForm.price) return;
    const newCustomer = {
      id: Date.now(),
      name: newCustomerForm.name,
      area: newCustomerForm.area,
      pricing: newCustomerForm.pricing,
      price: Number(newCustomerForm.price),
    };
    setCustomCustomers((prev) => [...prev, newCustomer]);
    setNewCustomerForm({ name: "", area: "Brekkan", pricing: "fixed", price: "" });
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
  }, [logs, customersByArea]);

  const clientsByArea = useMemo(() => {
    return AREA_ORDER.map((area) => {
      const clients = clientCards
        .filter((client) => client.area === area)
        .sort((a, b) => a.price - b.price);
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
  const stopDayTimer = () => setDayTimerRunning(false);
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
  const selectedPlanText = selectedPlanDay ? planEntries[selectedPlanDay] || "" : "";

  const monthOptions = [];
  for (let m = 0; m < 12; m++) {
    const d = new Date(2026, m, 1);
    monthOptions.push({ value: getMonthKey(d), label: `${MONTHS[m]} 2026` });
  }

  const areaSummary = AREA_ORDER.map((area) => {
    const customers = customersByArea[area] || [];
    return {
      area,
      planned: customers.filter((c) => c.pricing !== "hourly").reduce((sum, c) => sum + c.price, 0),
      earned: logs.filter((l) => l.area === area).reduce((sum, l) => sum + l.earned, 0),
    };
  });

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
                  if (!cell) return <div key={i} style={{ minHeight: 86, borderRadius: 18, background: "rgba(226,232,240,0.45)" }} />;
                  const hasPlan = !!planEntries[cell.dateStr];
                  const previewLines = hasPlan
                    ? String(planEntries[cell.dateStr])
                        .split("
")
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .slice(0, 3)
                    : [];
                  return (
                    <button
                      key={cell.dateStr}
                      onClick={() => setSelectedPlanDay(cell.dateStr)}
                      style={{
                        minHeight: 86,
                        borderRadius: 18,
                        border: selectedPlanDay === cell.dateStr ? "2px solid #1d4ed8" : "1px solid #dbe2ea",
                        background: hasPlan ? "#dbeafe" : "#fff",
                        textAlign: "left",
                        padding: 10,
                        cursor: "pointer",
                        boxShadow: selectedPlanDay === cell.dateStr ? "0 10px 18px rgba(29,78,216,0.12)" : "none",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ fontWeight: 900, fontSize: 22, color: "#1d4ed8" }}>{cell.day}</div>
                      {hasPlan ? (
                        <div style={{ marginTop: 6, display: "grid", gap: 2 }}>
                          {previewLines.map((line, idx) => (
                            <div
                              key={idx}
                              style={{
                                fontSize: 11,
                                lineHeight: 1.15,
                                color: "#1e3a8a",
                                fontWeight: 700,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {line}
                            </div>
                          ))}
                          {String(planEntries[cell.dateStr]).split("
").filter((line) => line.trim()).length > 3 && (
                            <div style={{ fontSize: 10, color: "#1d4ed8", fontWeight: 800 }}>...</div>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}> </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
                  {selectedPlanDay ? `Plan fyrir ${formatLongDate(selectedPlanDay)}` : "Veldu dag í dagatalinu"}
                </div>
                <textarea
                  style={{ ...inputStyle(), minHeight: 120, resize: "vertical" }}
                  placeholder="T.d. Brekkan um morguninn, Giljahverfi eftir hádegi..."
                  value={selectedPlanText}
                  onChange={(e) => {
                    if (!selectedPlanDay) return;
                    setPlanEntries((prev) => ({ ...prev, [selectedPlanDay]: e.target.value }));
                  }}
                  disabled={!selectedPlanDay}
                />
              </div>
            </div>

            <div style={cardStyle()}>
              <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>Stjórna kúnnum</div>
              <div style={{ color: "#64748b", marginBottom: 12 }}>Hér sérðu alla custom kúnna sem þú hefur sjálfur bætt við.</div>
              <div style={{ display: "grid", gap: 10 }}>
                {customCustomers.length === 0 && (
                  <div style={{ color: "#64748b" }}>Þú ert ekki búinn að bæta við custom kúnna enn.</div>
                )}
                {customCustomers.map((c) => (
                  <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "center", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 12 }}>
                    <div>
                      <div style={{ fontWeight: 900 }}>{c.name}</div>
                      <div style={{ color: "#64748b", fontSize: 13 }}>{c.area} • {c.pricing === "hourly" ? `Tímakaup ${kr(c.price)}/klst` : `Fast verð ${kr(c.price)}`}</div>
                    </div>
                    <button style={buttonStyle(false)} onClick={() => {
                      const newName = prompt("Nýtt nafn", c.name);
                      const newPrice = prompt("Nýtt verð", c.price);
                      if (!newName || !newPrice) return;
                      setCustomCustomers(prev => prev.map(x => x.id === c.id ? { ...x, name: newName, price: Number(newPrice) } : x));
                    }}>Edit</button>
                    <button style={buttonStyle(false)} onClick={() => {
                      if (confirm("Ertu viss að þú viljir eyða þessum kúnna?")) {
                        setCustomCustomers(prev => prev.filter(x => x.id !== c.id));
                      }
                    }}>Eyða</button>
                  </div>
                ))}
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


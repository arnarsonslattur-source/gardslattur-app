import React, { useMemo, useState } from "react";

const customersByArea = {
  Brekkan: [
    { id: 1, name: "Haukur", price: 10000 },
    { id: 2, name: "Örn", price: 10000 },
    { id: 3, name: "Ottó", price: 12000 },
    { id: 4, name: "Jonni", price: 14000 },
    { id: 5, name: "Stekkjartún", price: 28000 },
  ],
  Giljahverfi: [
    { id: 6, name: "Halla", price: 5000 },
    { id: 7, name: "Frikki", price: 5000 },
    { id: 8, name: "Stebbi", price: 5000 },
    { id: 9, name: "Mamma", price: 5000 },
    { id: 10, name: "Júlia", price: 20000 },
    { id: 11, name: "Dóri", price: 20000 },
  ],
  Miðbær: [
    { id: 12, name: "Sólveig", price: 10000 },
    { id: 13, name: "Harpa", price: 8000 },
    { id: 14, name: "Kaldbakur", price: 40000 },
  ],
  Glerárhverfi: [
    { id: 15, name: "Óli", price: 10000 },
    { id: 16, name: "Lyngholt 19", price: 10000 },
    { id: 17, name: "Símon", price: 6000 },
  ],
  Baldursnes: [{ id: 18, name: "Þórður", price: 12000 }],
  Toyota: [{ id: 19, name: "Toyota", price: 2000, hourly: true }],
};

const topTabs = [
  "Brekkan",
  "Giljahverfi",
  "Miðbær",
  "Glerárhverfi",
  "Baldursnes",
  "Toyota",
  "Dagskrá",
  "Heildartölur",
];

const monthNames = [
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

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const areaColors = {
  Brekkan: { bg: "#dbeafe", text: "#1d4ed8" },
  Giljahverfi: { bg: "#dcfce7", text: "#166534" },
  Miðbær: { bg: "#fef3c7", text: "#b45309" },
  Glerárhverfi: { bg: "#ede9fe", text: "#6d28d9" },
  Baldursnes: { bg: "#fee2e2", text: "#b91c1c" },
  Toyota: { bg: "#cffafe", text: "#0f766e" },
  Dagskrá: { bg: "#e0e7ff", text: "#4338ca" },
  Heildartölur: { bg: "#f1f5f9", text: "#334155" },
};

const starterLogs = [
  {
    id: 1,
    date: "2026-05-06",
    customer: "Þórður",
    area: "Baldursnes",
    minutes: 35,
    earned: 12000,
    paid: false,
  },
  {
    id: 2,
    date: "2026-05-06",
    customer: "Kaldbakur",
    area: "Miðbær",
    minutes: 140,
    earned: 40000,
    paid: false,
  },
  {
    id: 3,
    date: "2026-05-07",
    customer: "Haukur",
    area: "Brekkan",
    minutes: 35,
    earned: 10000,
    paid: true,
  },
  {
    id: 4,
    date: "2026-04-12",
    customer: "Halla",
    area: "Giljahverfi",
    minutes: 154,
    earned: 5000,
    paid: true,
  },
];

function kr(n) {
  return `${Number(n || 0).toLocaleString("is-IS")} kr.`;
}

function minsToText(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h} klst ${m} mín`;
  if (h) return `${h} klst`;
  return `${m} mín`;
}

function formatLongDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
}

function cardStyle(extra = {}) {
  return {
    background: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(255,255,255,0.85)",
    borderRadius: 28,
    padding: 16,
    boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
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
    boxShadow: primary ? "0 10px 20px rgba(29,78,216,0.22)" : "none",
  };
}

function tabStyle(active, tab) {
  const palette = areaColors[tab] || { bg: "#f8fafc", text: "#334155" };
  return {
    borderRadius: 999,
    padding: "12px 16px",
    border: active ? "none" : "1px solid rgba(255,255,255,0.8)",
    background: active
      ? "linear-gradient(135deg,#0f172a 0%, #1d4ed8 100%)"
      : palette.bg,
    color: active ? "#fff" : palette.text,
    fontWeight: 800,
    whiteSpace: "nowrap",
    cursor: "pointer",
    boxShadow: active ? "0 12px 24px rgba(29,78,216,0.18)" : "none",
  };
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

export default function App() {
  const [activeTab, setActiveTab] = useState("Dagskrá");
  const [logs, setLogs] = useState(starterLogs);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(
    getMonthKey(new Date(2026, 4, 1))
  );

  const [entry, setEntry] = useState({
    area: "Brekkan",
    customer: "Haukur",
    date: "2026-05-12",
    minutes: "",
    earned: "10000",
    paid: false,
  });

  const availableCustomers = customersByArea[entry.area] || [];
  const selectedCustomer = availableCustomers.find(
    (c) => c.name === entry.customer
  );

  const setAreaAndDefaultCustomer = (area) => {
    const firstCustomer = (customersByArea[area] || [])[0];
    setEntry((prev) => ({
      ...prev,
      area,
      customer: firstCustomer?.name || "",
      earned: firstCustomer?.hourly
        ? prev.earned
        : String(firstCustomer?.price || ""),
    }));
  };

  const setCustomerAndAutoPrice = (customerName) => {
    const picked = (customersByArea[entry.area] || []).find(
      (c) => c.name === customerName
    );
    setEntry((prev) => ({
      ...prev,
      customer: customerName,
      earned: picked?.hourly ? prev.earned : String(picked?.price || ""),
    }));
  };

  const addLog = () => {
    if (!entry.customer || !entry.date || !entry.minutes || !entry.earned) {
      return;
    }

    setLogs((prev) => [
      {
        id: Date.now(),
        date: entry.date,
        customer: entry.customer,
        area: entry.area,
        minutes: Number(entry.minutes),
        earned: Number(entry.earned),
        paid: entry.paid,
      },
      ...prev,
    ]);

    const picked = (customersByArea[entry.area] || []).find(
      (c) => c.name === entry.customer
    );

    setEntry((prev) => ({
      ...prev,
      minutes: "",
      earned: picked?.hourly ? "" : String(picked?.price || ""),
      paid: false,
    }));
  };

  const togglePaid = (id) => {
    setLogs((prev) =>
      prev.map((log) => (log.id === id ? { ...log, paid: !log.paid } : log))
    );
  };

  const deleteLog = (id) => {
    setLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const allTotal = logs.reduce((sum, log) => sum + log.earned, 0);
  const unpaidTotal = logs
    .filter((log) => !log.paid)
    .reduce((sum, log) => sum + log.earned, 0);
  const paidTotal = logs
    .filter((log) => log.paid)
    .reduce((sum, log) => sum + log.earned, 0);
  const allMinutes = logs.reduce((sum, log) => sum + log.minutes, 0);

  const areaSummary = useMemo(() => {
    return Object.entries(customersByArea).map(([area, customers]) => ({
      area,
      count: customers.length,
      planned: customers
        .filter((c) => !c.hourly)
        .reduce((sum, c) => sum + c.price, 0),
      done: logs
        .filter((l) => l.area === area)
        .reduce((sum, l) => sum + l.earned, 0),
    }));
  }, [logs]);

  const currentAreaCustomers =
    activeTab in customersByArea ? customersByArea[activeTab] : [];

  const selectedCustomerLogs = selectedCustomerName
    ? logs
        .filter((log) => log.customer === selectedCustomerName)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const monthDate = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }, [selectedMonth]);

  const monthCells = useMemo(
    () => buildCalendar(monthDate.getFullYear(), monthDate.getMonth()),
    [monthDate]
  );

  const logsByDate = useMemo(() => {
    const map = {};
    for (const log of logs) {
      if (!map[log.date]) map[log.date] = [];
      map[log.date].push(log);
    }
    return map;
  }, [logs]);

  const selectedDayLogs = selectedDay ? logsByDate[selectedDay] || [] : [];

  const monthOptions = [];
  for (let m = 0; m < 12; m++) {
    const d = new Date(2026, m, 1);
    monthOptions.push({
      value: getMonthKey(d),
      label: `${monthNames[m]} 2026`,
    });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, #c7d2fe 0%, #dbeafe 24%, #eef2ff 48%, #f8fafc 72%, #eff6ff 100%)",
        padding: 12,
        paddingBottom: 90,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        color: "#111827",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 16, paddingTop: 6 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  letterSpacing: "-0.05em",
                  color: "#0f172a",
                  lineHeight: 1,
                }}
              >
                Garðsláttur Bjarka
              </div>
              <div style={{ marginTop: 8, color: "#475569", fontSize: 16 }}>
                Flottara mobile app fyrir slætti, kúnna og dagskrá
              </div>
            </div>
            <div
              style={{
                borderRadius: 22,
                padding: "10px 12px",
                background: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.85)",
                fontWeight: 800,
                color: "#1d4ed8",
              }}
            >
              2026
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {[
            ["Heildartekjur", kr(allTotal), "linear-gradient(135deg,#dbeafe 0%, #bfdbfe 100%)"],
            ["Ógreitt", kr(unpaidTotal), "linear-gradient(135deg,#fee2e2 0%, #fecaca 100%)"],
            ["Greitt", kr(paidTotal), "linear-gradient(135deg,#dcfce7 0%, #bbf7d0 100%)"],
            ["Heildartími", minsToText(allMinutes), "linear-gradient(135deg,#ede9fe 0%, #ddd6fe 100%)"],
          ].map(([label, value, bg]) => (
            <div key={label} style={cardStyle({ background: bg })}>
              <div style={{ color: "#475569", fontSize: 13, marginBottom: 6 }}>
                {label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div
          style={cardStyle({
            marginBottom: 16,
            overflowX: "auto",
            background: "rgba(255,255,255,0.78)",
            padding: 12,
          })}
        >
          <div style={{ display: "flex", gap: 8, minWidth: "max-content" }}>
            {topTabs.map((tab) => (
              <button
                key={tab}
                style={tabStyle(activeTab === tab, tab)}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedCustomerName(null);
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div
          style={cardStyle({
            marginBottom: 18,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(239,246,255,0.92))",
            boxShadow: "0 18px 40px rgba(29,78,216,0.12)",
          })}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  letterSpacing: "-0.05em",
                  lineHeight: 1,
                }}
              >
                Skrá nýja færslu
              </div>
              <div style={{ color: "#64748b", marginTop: 4 }}>
                Verð fyllist sjálfkrafa en þú getur alltaf breytt því
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
              gap: 10,
            }}
          >
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

            <input
              style={inputStyle()}
              type="date"
              value={entry.date}
              onChange={(e) => setEntry({ ...entry, date: e.target.value })}
            />

            <input
              style={inputStyle()}
              type="number"
              placeholder={selectedCustomer?.hourly ? "Mínútur / vinna" : "Mínútur"}
              value={entry.minutes}
              onChange={(e) => setEntry({ ...entry, minutes: e.target.value })}
            />

            <input
              style={inputStyle()}
              type="number"
              placeholder="Hvað græddir þú"
              value={entry.earned}
              onChange={(e) => setEntry({ ...entry, earned: e.target.value })}
            />

            <label
              style={{
                ...inputStyle(),
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 700,
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
              marginTop: 12,
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={{ color: "#64748b", fontSize: 14 }}>
              Þetta fer beint í dagskrá og heildartölur
            </div>
            <button style={buttonStyle(true)} onClick={addLog}>
              Bæta við færslu
            </button>
          </div>
        </div>

        {activeTab in customersByArea && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={cardStyle()}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                <h2 style={{ margin: 0, fontSize: 28 }}>{activeTab}</h2>
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "rgba(15,23,42,0.06)",
                    color: "#334155",
                    fontWeight: 700,
                  }}
                >
                  {currentAreaCustomers.length} kúnnar
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {currentAreaCustomers.map((customer) => {
                  const customerLogs = logs.filter(
                    (log) => log.customer === customer.name
                  );
                  const totalEarned = customerLogs.reduce(
                    (sum, log) => sum + log.earned,
                    0
                  );
                  const totalMinutes = customerLogs.reduce(
                    (sum, log) => sum + log.minutes,
                    0
                  );
                  const isSelected = selectedCustomerName === customer.name;

                  return (
                    <button
                      key={customer.id}
                      onClick={() => setSelectedCustomerName(customer.name)}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.35fr .9fr .7fr .9fr .9fr",
                        gap: 10,
                        alignItems: "center",
                        background: isSelected
                          ? "linear-gradient(135deg,#dbeafe 0%, #eff6ff 100%)"
                          : "linear-gradient(180deg,#ffffff,#f8fafc)",
                        border: isSelected
                          ? "2px solid #1d4ed8"
                          : "1px solid #e2e8f0",
                        borderRadius: 22,
                        padding: 14,
                        cursor: "pointer",
                        textAlign: "left",
                        boxShadow: isSelected
                          ? "0 14px 28px rgba(29,78,216,0.12)"
                          : "none",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 18 }}>
                          {customer.name}
                        </div>
                        <div
                          style={{
                            color: "#64748b",
                            fontSize: 13,
                            marginTop: 4,
                          }}
                        >
                          Ýttu til að sjá alla slætti
                        </div>
                      </div>
                      <div>
                        {customer.hourly
                          ? `${kr(customer.price)}/klst`
                          : kr(customer.price)}
                      </div>
                      <div>{customerLogs.length}</div>
                      <div>{kr(totalEarned)}</div>
                      <div>{minsToText(totalMinutes)}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedCustomerName &&
              currentAreaCustomers.some((c) => c.name === selectedCustomerName) && (
                <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg,#0f172a 0%, #1d4ed8 100%)",
                      color: "#fff",
                      padding: 18,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 30,
                          fontWeight: 900,
                          lineHeight: 1,
                        }}
                      >
                        {selectedCustomerName}
                      </div>
                      <div style={{ opacity: 0.9, marginTop: 6 }}>
                        Allir slættir og allar færslur hjá þessum kúnna
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, opacity: 0.85 }}>Samtals</div>
                      <div style={{ fontSize: 28, fontWeight: 900 }}>
                        {kr(
                          selectedCustomerLogs.reduce((s, l) => s + l.earned, 0)
                        )}
                      </div>
                      <div style={{ marginTop: 4, opacity: 0.9 }}>
                        {minsToText(
                          selectedCustomerLogs.reduce((s, l) => s + l.minutes, 0)
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: 14, display: "grid", gap: 10 }}>
                    {selectedCustomerLogs.length === 0 ? (
                      <div style={{ color: "#64748b" }}>
                        Engar skráðar færslur hjá {selectedCustomerName} enn.
                      </div>
                    ) : (
                      selectedCustomerLogs.map((log) => (
                        <div
                          key={log.id}
                          style={{
                            background:
                              "linear-gradient(180deg,#ffffff,#f8fafc)",
                            border: "1px solid #e2e8f0",
                            borderRadius: 22,
                            padding: 14,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 10,
                              flexWrap: "wrap",
                              alignItems: "center",
                              marginBottom: 10,
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 20, fontWeight: 900 }}>
                                {formatLongDate(log.date)}
                              </div>
                              <div style={{ color: "#64748b", marginTop: 4 }}>
                                {log.area}
                              </div>
                            </div>

                            <div
                              style={{
                                padding: "8px 12px",
                                borderRadius: 999,
                                background: log.paid ? "#dcfce7" : "#fee2e2",
                                color: log.paid ? "#166534" : "#991b1b",
                                fontWeight: 800,
                              }}
                            >
                              {log.paid ? "Greitt" : "Ógreitt"}
                            </div>
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fit,minmax(120px,1fr))",
                              gap: 10,
                              marginBottom: 12,
                            }}
                          >
                            <div
                              style={{
                                background: "#fff",
                                border: "1px solid #e2e8f0",
                                borderRadius: 18,
                                padding: 12,
                              }}
                            >
                              <div style={{ color: "#64748b", fontSize: 13 }}>
                                Hversu lengi
                              </div>
                              <div
                                style={{
                                  marginTop: 4,
                                  fontWeight: 900,
                                  fontSize: 20,
                                }}
                              >
                                {minsToText(log.minutes)}
                              </div>
                            </div>

                            <div
                              style={{
                                background: "#fff",
                                border: "1px solid #e2e8f0",
                                borderRadius: 18,
                                padding: 12,
                              }}
                            >
                              <div style={{ color: "#64748b", fontSize: 13 }}>
                                Græddi
                              </div>
                              <div
                                style={{
                                  marginTop: 4,
                                  fontWeight: 900,
                                  fontSize: 20,
                                }}
                              >
                                {kr(log.earned)}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 10,
                              flexWrap: "wrap",
                              alignItems: "center",
                            }}
                          >
                            <label
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                fontWeight: 700,
                                color: "#334155",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={log.paid}
                                onChange={() => togglePaid(log.id)}
                              />
                              Breyta í greitt
                            </label>
                            <button
                              style={buttonStyle(false)}
                              onClick={() => deleteLog(log.id)}
                            >
                              Eyða
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
          </div>
        )}

        {activeTab === "Dagskrá" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={cardStyle()}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 14,
                }}
              >
                <h2 style={{ margin: 0, fontSize: 28 }}>Mánuðardagatal</h2>
                <select
                  style={{ ...inputStyle(), maxWidth: 220 }}
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setSelectedDay(null);
                  }}
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                {dayNames.map((d) => (
                  <div
                    key={d}
                    style={{
                      textAlign: "center",
                      fontWeight: 800,
                      color: "#475569",
                      padding: "8px 4px",
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 6,
                }}
              >
                {monthCells.map((cell, i) => {
                  if (!cell) {
                    return (
                      <div
                        key={i}
                        style={{
                          minHeight: 112,
                          borderRadius: 20,
                          background: "rgba(255,255,255,0.45)",
                        }}
                      />
                    );
                  }

                  const dayLogs = logsByDate[cell.dateStr] || [];
                  const total = dayLogs.reduce((sum, log) => sum + log.earned, 0);
                  const allPaid =
                    dayLogs.length > 0 && dayLogs.every((log) => log.paid);
                  const bg =
                    dayLogs.length === 0
                      ? "#ffffff"
                      : allPaid
                      ? "#dcfce7"
                      : "#dbeafe";

                  return (
                    <button
                      key={cell.dateStr}
                      onClick={() => setSelectedDay(cell.dateStr)}
                      style={{
                        minHeight: 112,
                        borderRadius: 20,
                        border:
                          selectedDay === cell.dateStr
                            ? "2px solid #1d4ed8"
                            : "1px solid #dbe2ea",
                        background: bg,
                        textAlign: "left",
                        padding: 10,
                        cursor: "pointer",
                        boxShadow:
                          selectedDay === cell.dateStr
                            ? "0 12px 22px rgba(29,78,216,0.14)"
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 900,
                          fontSize: 24,
                          marginBottom: 6,
                        }}
                      >
                        {cell.day}
                      </div>

                      {dayLogs.slice(0, 2).map((log) => (
                        <div
                          key={log.id}
                          style={{
                            fontSize: 12,
                            color: "#334155",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {log.customer}
                        </div>
                      ))}

                      {dayLogs.length > 0 && (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {kr(total)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDay && (
              <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
                <div
                  style={{
                    background:
                      "linear-gradient(135deg,#0f172a 0%, #1d4ed8 100%)",
                    color: "#fff",
                    padding: 18,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>
                      {formatLongDate(selectedDay)}
                    </div>
                    <div style={{ opacity: 0.9, marginTop: 6 }}>
                      {selectedDayLogs.length} færslur •{" "}
                      {minsToText(
                        selectedDayLogs.reduce((s, l) => s + l.minutes, 0)
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>
                      Tekjur í dag
                    </div>
                    <div style={{ fontSize: 30, fontWeight: 900 }}>
                      {kr(selectedDayLogs.reduce((s, l) => s + l.earned, 0))}
                    </div>
                  </div>
                </div>

                <div style={{ padding: 14, display: "grid", gap: 10 }}>
                  {selectedDayLogs.length === 0 && (
                    <div style={{ color: "#64748b" }}>
                      Engar færslur þennan dag.
                    </div>
                  )}

                  {selectedDayLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        background: "linear-gradient(180deg,#ffffff,#f8fafc)",
                        border: "1px solid #e2e8f0",
                        borderRadius: 22,
                        padding: 14,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          flexWrap: "wrap",
                          alignItems: "center",
                          marginBottom: 10,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 22, fontWeight: 900 }}>
                            {log.customer}
                          </div>
                          <div style={{ color: "#64748b", marginTop: 4 }}>
                            {log.area}
                          </div>
                        </div>

                        <div
                          style={{
                            padding: "8px 12px",
                            borderRadius: 999,
                            background: log.paid ? "#dcfce7" : "#fee2e2",
                            color: log.paid ? "#166534" : "#991b1b",
                            fontWeight: 800,
                          }}
                        >
                          {log.paid ? "Greitt" : "Ógreitt"}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit,minmax(120px,1fr))",
                          gap: 10,
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 18,
                            padding: 12,
                          }}
                        >
                          <div style={{ color: "#64748b", fontSize: 13 }}>
                            Hversu lengi
                          </div>
                          <div
                            style={{
                              marginTop: 4,
                              fontWeight: 900,
                              fontSize: 20,
                            }}
                          >
                            {minsToText(log.minutes)}
                          </div>
                        </div>

                        <div
                          style={{
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 18,
                            padding: 12,
                          }}
                        >
                          <div style={{ color: "#64748b", fontSize: 13 }}>
                            Græddi
                          </div>
                          <div
                            style={{
                              marginTop: 4,
                              fontWeight: 900,
                              fontSize: 20,
                            }}
                          >
                            {kr(log.earned)}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            fontWeight: 700,
                            color: "#334155",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={log.paid}
                            onChange={() => togglePaid(log.id)}
                          />
                          Breyta í greitt
                        </label>
                        <button
                          style={buttonStyle(false)}
                          onClick={() => deleteLog(log.id)}
                        >
                          Eyða
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Heildartölur" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ ...cardStyle(), overflowX: "auto" }}>
              <h2 style={{ marginTop: 0, fontSize: 28 }}>Áætlað fyrir sumarið</h2>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}
                  >
                    <th style={{ padding: "10px 8px" }}>Nafn</th>
                    <th style={{ padding: "10px 8px" }}>
                      Útborgað fyrir hvern slátt
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(customersByArea)
                    .flat()
                    .filter((c) => !c.hourly)
                    .map((c) => (
                      <tr
                        key={c.id}
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                      >
                        <td style={{ padding: "10px 8px" }}>{c.name}</td>
                        <td style={{ padding: "10px 8px" }}>{kr(c.price)}</td>
                      </tr>
                    ))}
                  <tr>
                    <td style={{ padding: "10px 8px", fontWeight: 700 }}>
                      Samtals
                    </td>
                    <td style={{ padding: "10px 8px", fontWeight: 700 }}>
                      {kr(
                        Object.values(customersByArea)
                          .flat()
                          .filter((c) => !c.hourly)
                          .reduce((sum, c) => sum + c.price, 0)
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
                gap: 16,
              }}
            >
              <div
                style={cardStyle({
                  background: "linear-gradient(180deg,#ffffff,#dbeafe)",
                })}
              >
                <h2 style={{ marginTop: 0 }}>Um sumarið</h2>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span>Heildartekjur</span>
                  <strong>{kr(allTotal)}</strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span>Heildartími</span>
                  <strong>{minsToText(allMinutes)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Ógreitt</span>
                  <strong>{kr(unpaidTotal)}</strong>
                </div>
              </div>

              <div
                style={cardStyle({
                  background: "linear-gradient(180deg,#ffffff,#dcfce7)",
                })}
              >
                <h2 style={{ marginTop: 0 }}>Enda sumarsins</h2>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span>Greitt núna</span>
                  <strong>{kr(paidTotal)}</strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span>Eftir að fá</span>
                  <strong>{kr(unpaidTotal)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Möguleg lokastaða</span>
                  <strong>{kr(paidTotal + unpaidTotal)}</strong>
                </div>
              </div>
            </div>

            <div style={cardStyle()}>
              <h2 style={{ marginTop: 0 }}>Yfirlit eftir hverfum</h2>
              <div style={{ display: "grid", gap: 10 }}>
                {areaSummary.map((row) => (
                  <div
                    key={row.area}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.5fr 1fr 1fr",
                      gap: 10,
                      background: "linear-gradient(180deg,#ffffff,#f8fafc)",
                      border: "1px solid #e2e8f0",
                      borderRadius: 18,
                      padding: 12,
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>{row.area}</div>
                    <div>Áætlað: {kr(row.planned)}</div>
                    <div>Komið inn: {kr(row.done)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

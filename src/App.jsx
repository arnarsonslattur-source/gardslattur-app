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
  Toyota: [{ id: 19, name: "Toyota", price: 2000, isHourly: true }],
};

const areaTabs = ["Brekkan", "Giljahverfi", "Miðbær", "Glerárhverfi", "Baldursnes", "Toyota", "Dagaskrá", "Heildartölur"];
const monthNames = ["Maí", "Júní", "Júlí", "Ágúst", "September", "Október"];

const starterLogs = [
  { id: 1, date: "2026-05-06", customer: "Þórður", area: "Baldursnes", minutes: 35, earned: 12000, paid: false },
  { id: 2, date: "2026-05-06", customer: "Kaldbakur", area: "Miðbær", minutes: 140, earned: 40000, paid: false },
  { id: 3, date: "2026-05-07", customer: "Haukur", area: "Brekkan", minutes: 35, earned: 10000, paid: true },
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

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("is-IS", { day: "numeric", month: "numeric" });
}

function cardStyle() {
  return {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  };
}

function inputStyle() {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    fontSize: 14,
    boxSizing: "border-box",
    background: "white",
  };
}

function buttonStyle(primary = false) {
  return {
    borderRadius: 12,
    padding: "10px 14px",
    border: primary ? "none" : "1px solid #d1d5db",
    background: primary ? "#0f172a" : "#fff",
    color: primary ? "#fff" : "#111827",
    cursor: "pointer",
    fontWeight: 600,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState("Dagaskrá");
  const [logs, setLogs] = useState(starterLogs);
  const [entry, setEntry] = useState({ area: "Brekkan", customer: "Haukur", date: "", minutes: "", earned: "", paid: false });
  const [selectedMonth, setSelectedMonth] = useState("Maí");

  const availableCustomers = customersByArea[entry.area] || [];

  const addLog = () => {
    if (!entry.customer || !entry.date || !entry.minutes || !entry.earned) return;
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
    const firstCustomer = (customersByArea[entry.area] || [])[0]?.name || "";
    setEntry({ area: entry.area, customer: firstCustomer, date: "", minutes: "", earned: "", paid: false });
    setActiveTab("Dagaskrá");
  };

  const togglePaid = (id) => {
    setLogs((prev) => prev.map((log) => (log.id === id ? { ...log, paid: !log.paid } : log)));
  };

  const deleteLog = (id) => {
    setLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const todaySummary = useMemo(() => {
    const byDate = {};
    for (const log of logs) {
      if (!byDate[log.date]) byDate[log.date] = { date: log.date, total: 0, minutes: 0, items: [] };
      byDate[log.date].total += log.earned;
      byDate[log.date].minutes += log.minutes;
      byDate[log.date].items.push(log);
    }
    return Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));
  }, [logs]);

  const unpaidTotal = logs.filter((log) => !log.paid).reduce((sum, log) => sum + log.earned, 0);
  const paidTotal = logs.filter((log) => log.paid).reduce((sum, log) => sum + log.earned, 0);
  const allTotal = logs.reduce((sum, log) => sum + log.earned, 0);
  const allMinutes = logs.reduce((sum, log) => sum + log.minutes, 0);

  const areaSummary = useMemo(() => {
    return Object.entries(customersByArea).map(([area, customers]) => ({
      area,
      customers,
      totalPlanned: customers.filter((c) => !c.isHourly).reduce((sum, c) => sum + c.price, 0),
      totalDone: logs.filter((l) => l.area === area).reduce((sum, l) => sum + l.earned, 0),
    }));
  }, [logs]);

  const monthlySummary = useMemo(() => {
    const monthMap = {
      "05": "Maí",
      "06": "Júní",
      "07": "Júlí",
      "08": "Ágúst",
      "09": "September",
      "10": "Október",
    };
    const base = monthNames.map((m) => ({ month: m, total: 0, minutes: 0, unpaid: 0 }));
    logs.forEach((log) => {
      const monthKey = log.date.slice(5, 7);
      const monthName = monthMap[monthKey];
      const row = base.find((r) => r.month === monthName);
      if (row) {
        row.total += log.earned;
        row.minutes += log.minutes;
        if (!log.paid) row.unpaid += log.earned;
      }
    });
    return base;
  }, [logs]);

  const filteredMonth = monthlySummary.find((m) => m.month === selectedMonth);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 12, paddingBottom: 40, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", color: "#111827" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, margin: 0 }}>Garðsláttur Bjarka</h1>
            <p style={{ margin: "6px 0 0", color: "#475569" }}>Full redesign — hverfi, dagaskrá og heildartölur</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 16 }}>
          <div style={cardStyle()}><div style={{ color: "#64748b", fontSize: 14 }}>Heildartekjur</div><div style={{ fontSize: 28, fontWeight: 700 }}>{kr(allTotal)}</div></div>
          <div style={cardStyle()}><div style={{ color: "#64748b", fontSize: 14 }}>Ógreitt</div><div style={{ fontSize: 28, fontWeight: 700 }}>{kr(unpaidTotal)}</div></div>
          <div style={cardStyle()}><div style={{ color: "#64748b", fontSize: 14 }}>Greitt</div><div style={{ fontSize: 28, fontWeight: 700 }}>{kr(paidTotal)}</div></div>
          <div style={cardStyle()}><div style={{ color: "#64748b", fontSize: 14 }}>Heildartími</div><div style={{ fontSize: 28, fontWeight: 700 }}>{minsToText(allMinutes)}</div></div>
        </div>

        <div style={{ ...cardStyle(), marginBottom: 16, overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 8, minWidth: "max-content" }}>
            {areaTabs.map((tab) => (
              <button key={tab} style={buttonStyle(activeTab === tab)} onClick={() => setActiveTab(tab)}>{tab}</button>
            ))}
          </div>
        </div>

        <div style={{ ...cardStyle(), marginBottom: 16 }}>
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>Skrá nýja færslu</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
            <select style={inputStyle()} value={entry.area} onChange={(e) => {
              const newArea = e.target.value;
              const firstCustomer = (customersByArea[newArea] || [])[0];
              setEntry({ ...entry, area: newArea, customer: firstCustomer?.name || "", earned: firstCustomer?.isHourly ? "" : firstCustomer?.price || "" });
            }}>
              {Object.keys(customersByArea).map((area) => <option key={area} value={area}>{area}</option>)}
            </select>
            <select style={inputStyle()} value={entry.customer} onChange={(e) => {
              const customerName = e.target.value;
              const picked = (customersByArea[entry.area] || []).find((c) => c.name === customerName);
              setEntry({ ...entry, customer: customerName, earned: picked?.isHourly ? entry.earned : picked?.price || "" });
            }}>
              {availableCustomers.map((customer) => <option key={customer.id} value={customer.name}>{customer.name}</option>)}
            </select>
            <input style={inputStyle()} type="date" value={entry.date} onChange={(e) => setEntry({ ...entry, date: e.target.value })} />
            <input style={inputStyle()} type="number" placeholder="Mínútur" value={entry.minutes} onChange={(e) => setEntry({ ...entry, minutes: e.target.value })} />
            <input style={inputStyle()} type="number" placeholder="Hvað græddir þú" value={entry.earned} onChange={(e) => setEntry({ ...entry, earned: e.target.value })} />
            <label style={{ ...inputStyle(), display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={entry.paid} onChange={(e) => setEntry({ ...entry, paid: e.target.checked })} /> Greitt</label>
          </div>
          <div style={{ marginTop: 12 }}><button style={buttonStyle(true)} onClick={addLog}>Bæta við færslu</button></div>
        </div>

        {Object.keys(customersByArea).includes(activeTab) && (
          <div style={cardStyle()}>
            <h2 style={{ marginTop: 0 }}>{activeTab}</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ padding: "10px 8px" }}>Nafn</th>
                    <th style={{ padding: "10px 8px" }}>Verð</th>
                    <th style={{ padding: "10px 8px" }}>Slættir skráðir</th>
                    <th style={{ padding: "10px 8px" }}>Heildartekjur</th>
                    <th style={{ padding: "10px 8px" }}>Heildartími</th>
                  </tr>
                </thead>
                <tbody>
                  {customersByArea[activeTab].map((customer) => {
                    const customerLogs = logs.filter((log) => log.customer === customer.name);
                    const totalEarned = customerLogs.reduce((sum, log) => sum + log.earned, 0);
                    const totalMinutes = customerLogs.reduce((sum, log) => sum + log.minutes, 0);
                    return (
                      <tr key={customer.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 8px", fontWeight: 600 }}>{customer.name}</td>
                        <td style={{ padding: "10px 8px" }}>{customer.isHourly ? `${kr(customer.price)}/klst` : kr(customer.price)}</td>
                        <td style={{ padding: "10px 8px" }}>{customerLogs.length}</td>
                        <td style={{ padding: "10px 8px" }}>{kr(totalEarned)}</td>
                        <td style={{ padding: "10px 8px" }}>{minsToText(totalMinutes)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Dagaskrá" && (
          <div style={{ display: "grid", gap: 16 }}>
            {todaySummary.map((day) => (
              <div key={day.date} style={cardStyle()}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                  <div>
                    <h2 style={{ margin: 0 }}>{formatDate(day.date)}</h2>
                    <div style={{ color: "#64748b", marginTop: 4 }}>{day.items.length} færslur • {minsToText(day.minutes)}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 22 }}>{kr(day.total)}</div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                      <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                        <th style={{ padding: "10px 8px" }}>Nafn</th>
                        <th style={{ padding: "10px 8px" }}>Hverfi</th>
                        <th style={{ padding: "10px 8px" }}>Hversu lengi</th>
                        <th style={{ padding: "10px 8px" }}>Græddi</th>
                        <th style={{ padding: "10px 8px" }}>Greitt</th>
                        <th style={{ padding: "10px 8px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {day.items.map((log) => (
                        <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 8px", fontWeight: 600 }}>{log.customer}</td>
                          <td style={{ padding: "10px 8px" }}>{log.area}</td>
                          <td style={{ padding: "10px 8px" }}>{minsToText(log.minutes)}</td>
                          <td style={{ padding: "10px 8px" }}>{kr(log.earned)}</td>
                          <td style={{ padding: "10px 8px" }}><label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={log.paid} onChange={() => togglePaid(log.id)} /> {log.paid ? "Já" : "Nei"}</label></td>
                          <td style={{ padding: "10px 8px" }}><button style={buttonStyle(false)} onClick={() => deleteLog(log.id)}>Eyða</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {todaySummary.length === 0 && <div style={cardStyle()}>Engar færslur komnar enn.</div>}
          </div>
        )}

        {activeTab === "Heildartölur" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ ...cardStyle(), overflowX: "auto" }}>
              <h2 style={{ marginTop: 0 }}>Áætlað fyrir sumarið</h2>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}><th style={{ padding: "10px 8px" }}>Nafn</th><th style={{ padding: "10px 8px" }}>Útborgað fyrir hvern slátt</th></tr></thead>
                <tbody>
                  {Object.values(customersByArea).flat().filter((c) => !c.isHourly).map((c) => <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}><td style={{ padding: "10px 8px" }}>{c.name}</td><td style={{ padding: "10px 8px" }}>{kr(c.price)}</td></tr>)}
                  <tr><td style={{ padding: "10px 8px", fontWeight: 700 }}>Samtals</td><td style={{ padding: "10px 8px", fontWeight: 700 }}>{kr(Object.values(customersByArea).flat().filter((c) => !c.isHourly).reduce((sum, c) => sum + c.price, 0))}</td></tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
              <div style={cardStyle()}>
                <h2 style={{ marginTop: 0 }}>Um sumarið</h2>
                <div style={{ color: "#475569", marginBottom: 8 }}>Það sem þú hefur skráð hingað til</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span>Heildartekjur</span><strong>{kr(allTotal)}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span>Heildartími</span><strong>{minsToText(allMinutes)}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Ógreitt</span><strong>{kr(unpaidTotal)}</strong></div>
              </div>
              <div style={cardStyle()}>
                <h2 style={{ marginTop: 0 }}>Enda sumarsins</h2>
                <div style={{ color: "#475569", marginBottom: 8 }}>Lokastaða þegar allt er greitt</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span>Greitt núna</span><strong>{kr(paidTotal)}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span>Eftir að fá</span><strong>{kr(unpaidTotal)}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Möguleg lokastaða</span><strong>{kr(paidTotal + unpaidTotal)}</strong></div>
              </div>
            </div>

            <div style={cardStyle()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h2 style={{ marginTop: 0, marginBottom: 12 }}>Mánuðayfirlit</h2>
                <select style={{ ...inputStyle(), maxWidth: 220 }} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  {monthNames.map((month) => <option key={month} value={month}>{month}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
                <div style={{ ...cardStyle(), padding: 12 }}><div style={{ color: "#64748b", fontSize: 14 }}>Mánuður</div><div style={{ fontSize: 24, fontWeight: 700 }}>{filteredMonth?.month}</div></div>
                <div style={{ ...cardStyle(), padding: 12 }}><div style={{ color: "#64748b", fontSize: 14 }}>Tekjur</div><div style={{ fontSize: 24, fontWeight: 700 }}>{kr(filteredMonth?.total || 0)}</div></div>
                <div style={{ ...cardStyle(), padding: 12 }}><div style={{ color: "#64748b", fontSize: 14 }}>Ógreitt</div><div style={{ fontSize: 24, fontWeight: 700 }}>{kr(filteredMonth?.unpaid || 0)}</div></div>
                <div style={{ ...cardStyle(), padding: 12 }}><div style={{ color: "#64748b", fontSize: 14 }}>Tími</div><div style={{ fontSize: 24, fontWeight: 700 }}>{minsToText(filteredMonth?.minutes || 0)}</div></div>
              </div>
            </div>

            <div style={cardStyle()}>
              <h2 style={{ marginTop: 0 }}>Yfirlit eftir hverfum</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}><th style={{ padding: "10px 8px" }}>Hverfi</th><th style={{ padding: "10px 8px" }}>Áætlað</th><th style={{ padding: "10px 8px" }}>Komið inn</th></tr></thead>
                  <tbody>
                    {areaSummary.map((row) => <tr key={row.area} style={{ borderBottom: "1px solid #f1f5f9" }}><td style={{ padding: "10px 8px" }}>{row.area}</td><td style={{ padding: "10px 8px" }}>{kr(row.totalPlanned)}</td><td style={{ padding: "10px 8px" }}>{kr(row.totalDone)}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

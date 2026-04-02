import React, { useMemo, useState } from "react";

const initialCustomers = [
  { id: 1, name: "Halla", area: "Giljahverfi", price: 5000, frequency: "Áskrift", paid: false, visits: 0 },
  { id: 2, name: "Frikki", area: "Giljahverfi", price: 5000, frequency: "Áskrift", paid: false, visits: 0 },
  { id: 3, name: "Stebbi", area: "Giljahverfi", price: 5000, frequency: "Áskrift", paid: false, visits: 0 },
  { id: 4, name: "Mamma", area: "Giljahverfi", price: 5000, frequency: "Áskrift", paid: true, visits: 0 },
  { id: 5, name: "Símon", area: "Glerárhverfi", price: 6000, frequency: "Áskrift", paid: false, visits: 0 },
  { id: 6, name: "Harpa", area: "Miðbær", price: 8000, frequency: "Áskrift", paid: false, visits: 0 },
  { id: 7, name: "Sólveig", area: "Miðbær", price: 10000, frequency: "Áskrift", paid: false, visits: 0 },
  { id: 8, name: "Óli", area: "Glerárhverfi", price: 10000, frequency: "Áskrift", paid: false, visits: 0 },
  { id: 9, name: "Haukur", area: "Brekkan", price: 10000, frequency: "Áskrift", paid: false, visits: 0 },
  { id: 10, name: "Örn", area: "Brekkan", price: 10000, frequency: "Áskrift", paid: false, visits: 0 },
  { id: 11, name: "Lyngholt 19", area: "Glerárhverfi", price: 10000, frequency: "Áskrift", paid: false, visits: 0 },
  { id: 12, name: "Ottó", area: "Brekkan", price: 12000, frequency: "Áskrift", paid: false, visits: 0 },
  { id: 13, name: "Þórður", area: "Baldursnes", price: 12000, frequency: "Áskrift", paid: false, visits: 0 },
  { id: 14, name: "Jonni", area: "Brekkan", price: 14000, frequency: "Áskrift", paid: false, visits: 0 },
  { id: 15, name: "Júlia", area: "Giljahverfi", price: 20000, frequency: "Áskrift", paid: false, visits: 0 },
  { id: 16, name: "Dóri", area: "Giljahverfi", price: 20000, frequency: "Áskrift", paid: false, visits: 0 },
  { id: 17, name: "Stekkjartún", area: "Brekkan", price: 28000, frequency: "Áskrift", paid: false, visits: 0 },
  { id: 18, name: "Kaldbakur", area: "Miðbær", price: 40000, frequency: "Áskrift", paid: false, visits: 0 },
  { id: 19, name: "Toyota", area: "Toyota", price: 2000, frequency: "Tímavinna", paid: false, visits: 0 },
];

const areaOptions = [
  "Öll hverfi",
  "Brekkan",
  "Giljahverfi",
  "Miðbær",
  "Glerárhverfi",
  "Baldursnes",
  "Toyota",
  "Áskriftir",
];

const monthOptions = ["Maí", "Júní", "Júlí", "Ágúst", "Sep og okt"];

function kr(value) {
  return `${Number(value).toLocaleString("is-IS")} kr.`;
}

function cardStyle() {
  return {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
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

function inputStyle() {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    fontSize: 14,
    boxSizing: "border-box",
  };
}

function selectStyle() {
  return inputStyle();
}

export default function App() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [selectedArea, setSelectedArea] = useState("Öll hverfi");
  const [selectedMonth, setSelectedMonth] = useState("Maí");
  const [activeTab, setActiveTab] = useState("customers");

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    area: "Brekkan",
    price: "",
    frequency: "Áskrift",
  });

  const [toyotaEntries, setToyotaEntries] = useState([]);
  const [toyotaForm, setToyotaForm] = useState({
    date: "",
    hours: "",
    note: "",
  });

  const toyotaCustomer = customers.find((c) => c.name === "Toyota");
  const toyotaRate = toyotaCustomer?.price || 0;

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesArea =
        selectedArea === "Öll hverfi" ||
        customer.area === selectedArea ||
        (selectedArea === "Áskriftir" && customer.frequency === "Áskrift");

      const matchesSearch = customer.name
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesArea && matchesSearch;
    });
  }, [customers, search, selectedArea]);

  const toyotaHours = toyotaEntries.reduce(
    (sum, entry) => sum + Number(entry.hours),
    0
  );

  const toyotaRevenue = toyotaEntries.reduce(
    (sum, entry) => sum + Number(entry.hours) * toyotaRate,
    0
  );

  const subscriptionRevenue = customers
    .filter((customer) => customer.frequency !== "Tímavinna")
    .reduce((sum, customer) => sum + customer.price * customer.visits, 0);

  const totalRevenue = subscriptionRevenue + toyotaRevenue;
  const totalUnpaid = customers
    .filter((customer) => !customer.paid)
    .reduce((sum, customer) => sum + customer.price, 0);
  const totalPaid = customers
    .filter((customer) => customer.paid)
    .reduce((sum, customer) => sum + customer.price, 0);

  const byArea = useMemo(() => {
    return areaOptions
      .filter((area) => area !== "Öll hverfi" && area !== "Áskriftir")
      .map((area) => ({
        area,
        count: customers.filter((customer) => customer.area === area).length,
        revenue:
          area === "Toyota"
            ? toyotaRevenue
            : customers
                .filter((customer) => customer.area === area)
                .reduce((sum, customer) => sum + customer.price, 0),
      }))
      .filter((item) => item.count > 0 || item.area === "Toyota");
  }, [customers, toyotaRevenue]);

  const addCustomer = () => {
    if (!newCustomer.name || !newCustomer.price) return;

    setCustomers((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newCustomer.name,
        area: newCustomer.area,
        price: Number(newCustomer.price),
        frequency: newCustomer.frequency,
        paid: false,
        visits: 0,
      },
    ]);

    setNewCustomer({
      name: "",
      area: "Brekkan",
      price: "",
      frequency: "Áskrift",
    });
  };

  const addVisit = (id) => {
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === id
          ? { ...customer, visits: customer.visits + 1 }
          : customer
      )
    );
  };

  const togglePaid = (id) => {
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === id ? { ...customer, paid: !customer.paid } : customer
      )
    );
  };

  const addToyotaEntry = () => {
    if (!toyotaForm.date || !toyotaForm.hours) return;

    setToyotaEntries((prev) => [
      {
        id: Date.now(),
        date: toyotaForm.date,
        hours: Number(toyotaForm.hours),
        note: toyotaForm.note || "Toyota vinna",
      },
      ...prev,
    ]);

    setToyotaForm({
      date: "",
      hours: "",
      note: "",
    });
  };

  const deleteToyotaEntry = (id) => {
    setToyotaEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const priceLabel = (customer) => {
    if (customer.frequency === "Tímavinna") {
      return `${kr(customer.price)}/klst`;
    }
    return kr(customer.price);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: 12,
        paddingBottom: 40,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        color: "#111827",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div>
            <h1 style={{ fontSize: 28, margin: 0 }}>Garðsláttur Bjarka</h1>
            <p style={{ margin: "6px 0 0", color: "#475569" }}>
              Bókhald, kúnnar og hverfi á einum stað
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={cardStyle()}>
            <div style={{ color: "#64748b", fontSize: 14 }}>Kúnnar</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{customers.length}</div>
          </div>
          <div style={cardStyle()}>
            <div style={{ color: "#64748b", fontSize: 14 }}>Tekjur</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{kr(totalRevenue)}</div>
          </div>
          <div style={cardStyle()}>
            <div style={{ color: "#64748b", fontSize: 14 }}>Ógreitt</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{kr(totalUnpaid)}</div>
          </div>
          <div style={cardStyle()}>
            <div style={{ color: "#64748b", fontSize: 14 }}>Toyota klst</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{toyotaHours}</div>
          </div>
        </div>

        <div style={{ ...cardStyle(), marginBottom: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
            }}
          >
            <button style={buttonStyle(activeTab === "customers")} onClick={() => setActiveTab("customers")}>
              Kúnnar
            </button>
            <button style={buttonStyle(activeTab === "areas")} onClick={() => setActiveTab("areas")}>
              Hverfi
            </button>
            <button style={buttonStyle(activeTab === "months")} onClick={() => setActiveTab("months")}>
              Mánuðir
            </button>
            <button style={buttonStyle(activeTab === "toyota")} onClick={() => setActiveTab("toyota")}>
              Toyota
            </button>
          </div>
        </div>

        {activeTab === "customers" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={cardStyle()}>
              <h2 style={{ marginTop: 0 }}>Bæta við viðskiptavini</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                  gap: 10,
                }}
              >
                <input
                  style={inputStyle()}
                  placeholder="Nafn"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                />
                <select
                  style={selectStyle()}
                  value={newCustomer.area}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, area: e.target.value })
                  }
                >
                  {areaOptions
                    .filter((a) => a !== "Öll hverfi")
                    .map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                </select>
                <input
                  style={inputStyle()}
                  placeholder="Verð"
                  type="number"
                  value={newCustomer.price}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, price: e.target.value })
                  }
                />
                <select
                  style={selectStyle()}
                  value={newCustomer.frequency}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      frequency: e.target.value,
                    })
                  }
                >
                  <option value="Áskrift">Áskrift</option>
                  <option value="Tímavinna">Tímavinna</option>
                  <option value="Eftir þörfum">Eftir þörfum</option>
                </select>
              </div>
              <div style={{ marginTop: 10 }}>
                <button style={buttonStyle(true)} onClick={addCustomer}>
                  Vista
                </button>
              </div>
            </div>

            <div style={cardStyle()}>
              <h2 style={{ marginTop: 0 }}>Viðskiptavinaskrá</h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <input
                  style={inputStyle()}
                  placeholder="Leita að nafni..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  style={selectStyle()}
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                >
                  {areaOptions.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 14,
                  }}
                >
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                      <th style={{ padding: "10px 8px" }}>Nafn</th>
                      <th style={{ padding: "10px 8px" }}>Hverfi</th>
                      <th style={{ padding: "10px 8px" }}>Verð</th>
                      <th style={{ padding: "10px 8px" }}>Slættir</th>
                      <th style={{ padding: "10px 8px" }}>Greitt</th>
                      <th style={{ padding: "10px 8px" }}>Aðgerð</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                      >
                        <td style={{ padding: "10px 8px", fontWeight: 600 }}>
                          {customer.name}
                        </td>
                        <td style={{ padding: "10px 8px" }}>{customer.area}</td>
                        <td style={{ padding: "10px 8px" }}>
                          {priceLabel(customer)}
                        </td>
                        <td style={{ padding: "10px 8px" }}>
                          {customer.frequency === "Tímavinna" ? "—" : customer.visits}
                        </td>
                        <td style={{ padding: "10px 8px" }}>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={customer.paid}
                              onChange={() => togglePaid(customer.id)}
                            />
                            {customer.paid ? "Já" : "Nei"}
                          </label>
                        </td>
                        <td style={{ padding: "10px 8px" }}>
                          {customer.frequency === "Tímavinna" ? (
                            <span style={{ color: "#64748b" }}>Toyota flipi</span>
                          ) : (
                            <button
                              style={buttonStyle(false)}
                              onClick={() => addVisit(customer.id)}
                            >
                              Skrá slátt
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "areas" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 12,
            }}
          >
            {byArea.map((item) => (
              <div key={item.area} style={cardStyle()}>
                <h3 style={{ marginTop: 0 }}>{item.area}</h3>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span>Kúnnar</span>
                  <strong>{item.count}</strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Virði</span>
                  <strong>{kr(item.revenue)}</strong>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "months" && (
          <div style={cardStyle()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              <h2 style={{ margin: 0 }}>Mánuðayfirlit</h2>
              <select
                style={{ ...selectStyle(), maxWidth: 220 }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                gap: 12,
              }}
            >
              {areaOptions
                .filter(
                  (area) =>
                    area !== "Öll hverfi" &&
                    area !== "Áskriftir" &&
                    area !== "Toyota"
                )
                .map((area) => {
                  const areaCustomers = customers.filter(
                    (customer) => customer.area === area
                  );

                  return (
                    <div key={area} style={cardStyle()}>
                      <h3 style={{ marginTop: 0 }}>{area}</h3>
                      <p style={{ color: "#64748b", marginTop: 0 }}>{selectedMonth}</p>

                      {areaCustomers.length === 0 ? (
                        <p style={{ color: "#64748b" }}>Engir kúnnar hér enn.</p>
                      ) : (
                        areaCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "10px 0",
                              borderBottom: "1px solid #f1f5f9",
                            }}
                          >
                            <span>{customer.name}</span>
                            <strong>{kr(customer.price)}</strong>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {activeTab === "toyota" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={cardStyle()}>
              <h2 style={{ marginTop: 0 }}>Toyota tímaskráning</h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                  gap: 10,
                }}
              >
                <input
                  style={inputStyle()}
                  type="date"
                  value={toyotaForm.date}
                  onChange={(e) =>
                    setToyotaForm({ ...toyotaForm, date: e.target.value })
                  }
                />
                <input
                  style={inputStyle()}
                  type="number"
                  step="0.5"
                  placeholder="Klukkustundir"
                  value={toyotaForm.hours}
                  onChange={(e) =>
                    setToyotaForm({ ...toyotaForm, hours: e.target.value })
                  }
                />
                <input
                  style={inputStyle()}
                  placeholder="Athugasemd"
                  value={toyotaForm.note}
                  onChange={(e) =>
                    setToyotaForm({ ...toyotaForm, note: e.target.value })
                  }
                />
              </div>

              <div style={{ marginTop: 10 }}>
                <button style={buttonStyle(true)} onClick={addToyotaEntry}>
                  Bæta við Toyota færslu
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                gap: 12,
              }}
            >
              <div style={cardStyle()}>
                <div style={{ color: "#64748b", fontSize: 14 }}>Toyota klst</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{toyotaHours}</div>
              </div>
              <div style={cardStyle()}>
                <div style={{ color: "#64748b", fontSize: 14 }}>Toyota tekjur</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>
                  {kr(toyotaRevenue)}
                </div>
              </div>
              <div style={cardStyle()}>
                <div style={{ color: "#64748b", fontSize: 14 }}>Tímakaup</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>
                  {kr(toyotaRate)}
                </div>
              </div>
            </div>

            <div style={cardStyle()}>
              <h2 style={{ marginTop: 0 }}>Toyota færslur</h2>

              {toyotaEntries.length === 0 ? (
                <p style={{ color: "#64748b" }}>Engar Toyota færslur komnar enn.</p>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {toyotaEntries.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 14,
                        padding: 14,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>{entry.date}</div>
                        <div style={{ color: "#334155", marginTop: 4 }}>
                          {entry.hours} klst • {kr(entry.hours * toyotaRate)}
                        </div>
                        <div style={{ color: "#64748b", marginTop: 4 }}>
                          {entry.note}
                        </div>
                      </div>
                      <button
                        style={{
                          ...buttonStyle(false),
                          color: "#b91c1c",
                        }}
                        onClick={() => deleteToyotaEntry(entry.id)}
                      >
                        Eyða
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ height: 12 }} />
      </div>
    </div>
  );
}

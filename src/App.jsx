import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { Html5Qrcode } from "html5-qrcode";
import { createWorker } from "tesseract.js";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const AREA_ORDER = [
  "Brekkan",
  "Giljahverfi",
  "Miðbær",
  "Glerárhverfi",
  "Baldursnes",
  "Toyota",
];

const STORAGE_KEY = "gardslattur-bjarka-logs-v4";
const CUSTOMER_STORAGE_KEY = "gardslattur-bjarka-customers-v3";
const PLAN_STORAGE_KEY = "gardslattur-bjarka-plan-v3";
const LOCATION_STORAGE_KEY = "gardslattur-bjarka-locations-v1";
const DAY_TIMER_STORAGE_KEY = "gardslattur-bjarka-day-timer-v1";
const EXPENSE_STORAGE_KEY = "gardslattur-bjarka-expenses-v2";

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

const AKUREYRI_CENTER = [65.6826, -18.0906];

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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

function formatClockTime(timestamp) {
  if (!timestamp) return "--:--";

  return new Date(timestamp).toLocaleTimeString("is-IS", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timestampToTimeInput(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function setTimestampTime(baseTimestamp, timeValue) {
  if (!baseTimestamp || !timeValue) return baseTimestamp;
  const [hours, minutes] = timeValue.split(":").map(Number);
  const d = new Date(baseTimestamp);
  d.setHours(hours, minutes, 0, 0);
  return d.getTime();
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
  return d.toLocaleDateString("is-IS", { day: "numeric", month: "long" });
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

function makeCustomerKey(customer) {
  return `${customer.area}__${customer.name}`;
}

function expenseCategoryLabel(category) {
  switch (category) {
    case "fuel":
      return "Eldsneyti";
    case "clothes":
      return "Vinnufatnaður";
    case "tools":
      return "Vinnuvörur";
    case "maintenance":
      return "Viðhald";
    default:
      return "Annað";
  }
}

function fuelTypeLabel(type) {
  switch (type) {
    case "diesel":
      return "Dísel";
    case "95":
      return "95";
    case "98":
      return "98";
    default:
      return "";
  }
}

function parseIcelandicReceiptQr(raw) {
  if (!raw || typeof raw !== "string") {
    return { raw: "", amount: null, date: null, fuelType: null };
  }

  const text = raw.trim();
  const compact = text.replace(/\s+/g, " ");

  let amount = null;
  const amountPatterns = [
    /(?:upph[æa]ð|amount|total|samtals)[:\s]*([0-9]{1,3}(?:[ .][0-9]{3})*(?:[,\.][0-9]{2})?|[0-9]+)/i,
    /([0-9]{1,3}(?:[ .][0-9]{3})*(?:[,\.][0-9]{2}))\s*(?:kr|isk)/i,
  ];
  for (const pattern of amountPatterns) {
    const match = compact.match(pattern);
    if (match?.[1]) {
      const normalized = match[1].replace(/\./g, "").replace(/\s/g, "").replace(/,/g, ".");
      const parsed = Number(normalized);
      if (!Number.isNaN(parsed)) {
        amount = Math.round(parsed);
        break;
      }
    }
  }

  let date = null;
  const datePatterns = [/(20\d{2})[-/.](\d{2})[-/.](\d{2})/, /(\d{2})[-/.](\d{2})[-/.](20\d{2})/];
  for (let i = 0; i < datePatterns.length; i++) {
    const match = compact.match(datePatterns[i]);
    if (match) {
      if (i === 0) date = `${match[1]}-${match[2]}-${match[3]}`;
      else date = `${match[3]}-${match[2]}-${match[1]}`;
      break;
    }
  }

  let fuelType = null;
  if (/diesel|d[ií]sel/i.test(compact)) fuelType = "diesel";
  else if (/(^|\s)95(\s|$)|95 oktan|95b/i.test(compact)) fuelType = "95";
  else if (/(^|\s)98(\s|$)|98 oktan|98b/i.test(compact)) fuelType = "98";

  return { raw: text, amount, date, fuelType };
}

function MapClickSetter({ selectedCustomerKey, onPickLocation }) {
  useMapEvents({
    click(e) {
      if (!selectedCustomerKey) return;
      onPickLocation(e.latlng);
    },
  });

  return null;
}

function QrScannerCard({ onDetected, scanError, setScanError }) {
  const regionIdRef = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);
  const scannerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(regionIdRef.current);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
          (decodedText) => {
            if (cancelled) return;
            onDetected(decodedText);
          },
          () => {}
        );
      } catch (error) {
        setScanError(error?.message || "Gat ekki ræst myndavél fyrir QR skönnun.");
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(() => {}).finally(() => {
          scanner.clear().catch(() => {});
        });
      } else if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [onDetected, setScanError]);

  return (
    <div>
      <div
        id={regionIdRef.current}
        style={{ width: "100%", minHeight: 320, overflow: "hidden", borderRadius: 22, background: "#0f172a" }}
      />
      {scanError && <div style={{ color: "#b91c1c", marginTop: 10, fontWeight: 700 }}>{scanError}</div>}
    </div>
  );
}

function parseReceiptText(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();

  const amountMatch =
    clean.match(/UKUPNO\s*[:=]?\s*([0-9]+[.,][0-9]{2})/i) ||
    clean.match(/TOTAL\s*[:=]?\s*([0-9]+[.,][0-9]{2})/i) ||
    clean.match(/Samtals\s*[:=]?\s*([0-9]+[.,][0-9]{2})/i) ||
    clean.match(/([0-9]+[.,][0-9]{2})/);

  const dateMatch =
    clean.match(/(\d{2})\.(\d{2})\.(\d{2,4})/) ||
    clean.match(/(\d{2})-(\d{2})-(\d{2,4})/) ||
    clean.match(/(\d{2})\/(\d{2})\/(\d{2,4})/);

  let amount = "";
  if (amountMatch?.[1]) {
    amount = amountMatch[1].replace(",", ".");
  }

  let date = "";
  if (dateMatch) {
    let year = dateMatch[3];
    if (year.length === 2) year = `20${year}`;
    date = `${year}-${dateMatch[2]}-${dateMatch[1]}`;
  }

  let fuelType = "";
  if (/\b95\b/.test(clean)) fuelType = "95";
  else if (/\b98\b/.test(clean)) fuelType = "98";
  else if (/diesel|dísel/i.test(clean)) fuelType = "diesel";

  let station = "";
  if (/orkan/i.test(clean)) station = "Orkan";
  else if (/n1/i.test(clean)) station = "N1";
  else if (/olis|olís/i.test(clean)) station = "Olís";
  else if (/costco/i.test(clean)) station = "Costco";
  else if (/maslina/i.test(clean)) station = "Maslina";

  return {
    amount,
    date,
    fuelType,
    station,
  };
}

async function preprocessImage(imageSrc) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const scale = 2.5;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
        const boosted = gray > 140 ? 255 : 0;
        data[i] = boosted;
        data[i + 1] = boosted;
        data[i + 2] = boosted;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
  });
}

function getClientStatus(hourly) {
  if (hourly >= 12000) {
    return { label: "Mjög góður", emoji: "🟢", bg: "#dcfce7", color: "#166534" };
  }
  if (hourly >= 8000) {
    return { label: "Allt í lagi", emoji: "🟡", bg: "#fef9c3", color: "#854d0e" };
  }
  return { label: "Of lágt verð", emoji: "🔴", bg: "#fee2e2", color: "#991b1b" };
}

function getSuggestedPrice(client) {
  if (!client.totalMinutes || client.totalMinutes === 0) return null;

  const hourly = client.calculatedHourly;
  if (hourly >= 12000) return null;

  const currentPrice = client.price || 0;

  let suggested = currentPrice;

  if (hourly < 6000) suggested = currentPrice + 4000;
  else if (hourly < 8000) suggested = currentPrice + 3000;
  else if (hourly < 10000) suggested = currentPrice + 2000;
  else suggested = currentPrice + 1000;

  suggested = Math.ceil(suggested / 1000) * 1000;

  return suggested;
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

  const [customerLocations, setCustomerLocations] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [expandedArea, setExpandedArea] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey(new Date(2026, 3, 1)));
  const [editingLogId, setEditingLogId] = useState(null);
  const [selectedPlanDay, setSelectedPlanDay] = useState(null);
  const [selectedStatsYear, setSelectedStatsYear] = useState("2026");
const [expandedStatsMonth, setExpandedStatsMonth] = useState(null);

  const [planEntries, setPlanEntries] = useState(() => {
    try {
      const saved = localStorage.getItem(PLAN_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem(EXPENSE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [mapCustomerKey, setMapCustomerKey] = useState("");
  const [scanError, setScanError] = useState("");
  const [scanPreview, setScanPreview] = useState(null);
  const [receiptImage, setReceiptImage] = useState(null);
  const [receiptText, setReceiptText] = useState("");
  const [receiptReading, setReceiptReading] = useState(false);

  const [dayTimerState, setDayTimerState] = useState(() => {
    try {
      const saved = localStorage.getItem(DAY_TIMER_STORAGE_KEY);
      return saved
        ? JSON.parse(saved)
        : {
  startTime: null,
  running: false,
  accumulatedMs: 0,
  dayStartedAt: null,
  dayEndedAt: null,
  breakMs: 0,
  lastStoppedAt: null,
};
    } catch {
      return { startTime: null, running: false, accumulatedMs: 0 };
    }
  });

  const [timerNow, setTimerNow] = useState(Date.now());

  const [editingDayTimer, setEditingDayTimer] = useState(false);
const [dayTimerEditForm, setDayTimerEditForm] = useState({
  start: "",
  end: "",
});

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

  const [jobNote, setJobNote] = useState("");
  
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

  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    category: "fuel",
    fuelType: "diesel",
    note: "",
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(logs)); } catch {}
  }, [logs]);

  useEffect(() => {
    try { localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customCustomers)); } catch {}
  }, [customCustomers]);

  useEffect(() => {
    try { localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(planEntries)); } catch {}
  }, [planEntries]);

  useEffect(() => {
    try { localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(customerLocations)); } catch {}
  }, [customerLocations]);

  useEffect(() => {
    try { localStorage.setItem(DAY_TIMER_STORAGE_KEY, JSON.stringify(dayTimerState)); } catch {}
  }, [dayTimerState]);

  useEffect(() => {
    try { localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(expenses)); } catch {}
  }, [expenses]);
  
    useEffect(() => {
    if (!dayTimerState.running) return;
    const interval = setInterval(() => setTimerNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [dayTimerState.running]);

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
  }, [entry.startTime, entry.endTime, selectedCustomer, currentMinutes]);

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
    if (!entry.customer || !entry.date || !entry.startTime || !entry.endTime || !entry.earned) return;

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
        note: jobNote || "Garðsláttur",
      },
      ...prev,
    ]);

    setJobNote("");
    setEntry((prev) => ({
      ...prev,
      startTime: "12:00",
      endTime: "13:00",
      earned:
        picked?.pricing === "hourly"
          ? String(Math.round(picked?.price || 0))
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
    setNewCustomerForm({
      name: "",
      area: "Brekkan",
      pricing: "fixed",
      price: "",
    });
  };

  const readReceipt = async () => {
    if (!receiptImage) return;

    setReceiptReading(true);

    try {
      const worker = await createWorker("eng");
      const betterImage = await preprocessImage(receiptImage);
      const result = await worker.recognize(betterImage);
      const text = result?.data?.text || "";

      setReceiptText(text);

      const amountMatch =
        text.match(/Samtals.*?ISK\s*([0-9]+)/i) ||
        text.match(/ISK\s*([0-9]+)/i);

      const dateMatch =
        text.match(/(\d{2}-\d{2}-\d{4})/) ||
        text.match(/(\d{2}\/\d{2}\/\d{4})/) ||
        text.match(/(\d{2}\.\d{2}\.\d{4})/);

      let parsedDate = "";
      if (dateMatch?.[1]) {
        if (dateMatch[1].includes("-")) parsedDate = dateMatch[1].split("-").reverse().join("-");
        else if (dateMatch[1].includes(".")) parsedDate = dateMatch[1].split(".").reverse().join("-");
      }

      let fuelType = "";
      if (text.includes("95")) fuelType = "95";
      else if (text.includes("98")) fuelType = "98";
      else if (text.toLowerCase().includes("diesel") || text.toLowerCase().includes("dísel")) fuelType = "diesel";

      setExpenseForm((prev) => ({
        ...prev,
        amount: amountMatch ? amountMatch[1] : prev.amount,
        date: parsedDate || prev.date,
        category: "fuel",
        fuelType: fuelType || prev.fuelType,
        note: text.slice(0, 120),
      }));

      await worker.terminate();
    } catch (error) {
      console.error(error);
      setReceiptText("Ekki tókst að lesa kvittun.");
    } finally {
      setReceiptReading(false);
    }
  };

  const addExpense = (source = "manual") => {
    if (!expenseForm.amount || !expenseForm.date) return;

    setExpenses((prev) => [
      {
        id: Date.now(),
        date: expenseForm.date,
        amount: Number(expenseForm.amount),
        category: expenseForm.category,
        fuelType: expenseForm.category === "fuel" ? expenseForm.fuelType : null,
        note: expenseForm.note,
        source,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    setExpenseForm((prev) => ({ ...prev, amount: "", note: "" }));
    setScanPreview(null);
    setReceiptText("");
    setReceiptImage(null);
  };

  const deleteExpense = (id) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  };

  const handleQrDetected = (decodedText) => {
    const parsed = parseIcelandicReceiptQr(decodedText);
    setScanError("");
    setScanPreview(parsed);

    setExpenseForm((prev) => ({
      ...prev,
      date: parsed.date || prev.date,
      amount: parsed.amount ? String(parsed.amount) : prev.amount,
      category: "fuel",
      fuelType: parsed.fuelType || prev.fuelType || "diesel",
      note: parsed.raw,
    }));
  };

  const updateCustomCustomer = (customerId) => {
    const customer = customCustomers.find((c) => c.id === customerId);
    if (!customer) return;

    const newName = prompt("Nýtt nafn", customer.name);
    const newPrice = prompt("Nýtt verð", String(customer.price));
    const newArea = prompt("Nýtt hverfi", customer.area);
    const newPricing = prompt("Ný pricing type (fixed eða hourly)", customer.pricing);

    if (!newName || !newPrice || !newArea || !newPricing) return;

    const oldKey = makeCustomerKey(customer);
    const updatedCustomer = {
      ...customer,
      name: newName,
      price: Number(newPrice),
      area: newArea,
      pricing: newPricing === "hourly" ? "hourly" : "fixed",
    };
    const newKey = makeCustomerKey(updatedCustomer);

    setCustomCustomers((prev) => prev.map((c) => (c.id === customerId ? updatedCustomer : c)));

    setCustomerLocations((prev) => {
      if (!prev[oldKey]) return prev;
      const next = { ...prev };
      next[newKey] = next[oldKey];
      delete next[oldKey];
      return next;
    });

    if (mapCustomerKey === oldKey) setMapCustomerKey(newKey);
  };

  const deleteCustomCustomer = (customerId) => {
    const customer = customCustomers.find((c) => c.id === customerId);
    if (!customer) return;
    if (!window.confirm(`Eyða ${customer.name}?`)) return;

    const key = makeCustomerKey(customer);

    setCustomCustomers((prev) => prev.filter((c) => c.id !== customerId));
    setCustomerLocations((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    if (mapCustomerKey === key) setMapCustomerKey("");
  };

  const togglePaid = (id) => setLogs((prev) => prev.map((log) => (log.id === id ? { ...log, paid: !log.paid } : log)));

  const deleteLog = (id) => {
    setLogs((prev) => prev.filter((log) => log.id !== id));
    if (editingLogId === id) setEditingLogId(null);
  };

  const startEditLog = (log) => {
    setEditingLogId(log.id);
    setEditForm({ date: log.date, startTime: log.startTime, endTime: log.endTime, earned: String(log.earned), paid: log.paid });
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
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const fuelExpenses = expenses.filter((e) => e.category === "fuel").reduce((sum, e) => sum + e.amount, 0);
  const profitAfterExpenses = allTotal - totalExpenses;

  const clientCards = useMemo(() => {
    return Object.entries(customersByArea).flatMap(([area, list]) =>
      list.map((customer) => {
        const customerLogs = logs.filter((log) => log.customer === customer.name && log.area === area);
        const totalEarned = customerLogs.reduce((sum, log) => sum + log.earned, 0);
        const totalMinutes = customerLogs.reduce((sum, log) => sum + log.minutes, 0);
        const calculatedHourly = totalMinutes > 0 ? Math.round(totalEarned / (totalMinutes / 60)) : 0;

        return {
          ...customer,
          area,
          key: makeCustomerKey({ ...customer, area }),
          count: customerLogs.length,
          totalEarned,
          totalMinutes,
          calculatedHourly,
          logs: [...customerLogs].sort((a, b) => b.date.localeCompare(a.date)),
        };
      })
    );
  }, [logs, customersByArea]);

  const clientsByArea = useMemo(() => {
    return AREA_ORDER.map((area) => {
      const clients = clientCards.filter((client) => client.area === area).sort((a, b) => a.price - b.price);
      return {
        area,
        clients,
        totalEarned: clients.reduce((sum, client) => sum + client.totalEarned, 0),
        totalMinutes: clients.reduce((sum, client) => sum + client.totalMinutes, 0),
      };
    });
  }, [clientCards]);

  const selectedClientCard = clientCards.find((c) => c.name === selectedClient);

  function getTodayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 10);
}

const [todayDate, setTodayDate] = useState(getTodayLocal());

useEffect(() => {
  const interval = setInterval(() => {
    setTodayDate(getTodayLocal());
  }, 60000);

  return () => clearInterval(interval);
}, []);

  const myDayLogs = logs.filter((log) => log.date === todayDate).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const todayPlan = planEntries[todayDate] || "";
const todayPlanLines = todayPlan
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);
  
  const dayTimerMinutes = useMemo(() => {
    const runningMs = dayTimerState.running && dayTimerState.startTime ? Math.max(0, timerNow - dayTimerState.startTime) : 0;
    return Math.floor(((dayTimerState.accumulatedMs || 0) + runningMs) / 60000);
  }, [dayTimerState, timerNow]);

  const startDayTimer = () => {
  const now = Date.now();
  setTimerNow(now);
  setDayTimerState({
    startTime: now,
    running: true,
    accumulatedMs: 0,
    dayStartedAt: now,
    dayEndedAt: null,
    breakMs: 0,
    lastStoppedAt: null,
  });
};

  const pauseDayTimer = () => {
  if (!dayTimerState.startTime) return;

  const now = Date.now();
  const elapsed = Math.max(0, now - dayTimerState.startTime);

  setDayTimerState((prev) => ({
    ...prev,
    startTime: null,
    running: false,
    accumulatedMs: (prev.accumulatedMs || 0) + elapsed,
    lastStoppedAt: now,
  }));
};

const finishDayTimer = () => {
  const now = Date.now();

  if (dayTimerState.running && dayTimerState.startTime) {
    const elapsed = Math.max(0, now - dayTimerState.startTime);

    setDayTimerState((prev) => ({
      ...prev,
      startTime: null,
      running: false,
      accumulatedMs: (prev.accumulatedMs || 0) + elapsed,
      dayEndedAt: now,
      lastStoppedAt: null,
    }));
  } else {
    setDayTimerState((prev) => ({
      ...prev,
      dayEndedAt: now,
      lastStoppedAt: null,
    }));
  }
};
  
  const resumeDayTimer = () => {
  const now = Date.now();
  setTimerNow(now);

  setDayTimerState((prev) => ({
    ...prev,
    startTime: now,
    running: true,
    breakMs:
      (prev.breakMs || 0) +
      (prev.lastStoppedAt ? Math.max(0, now - prev.lastStoppedAt) : 0),
    dayEndedAt: null,
    lastStoppedAt: null,
  }));
};

  const resetDayTimer = () => {
  setDayTimerState({
    startTime: null,
    running: false,
    accumulatedMs: 0,
    dayStartedAt: null,
    dayEndedAt: null,
    breakMs: 0,
    lastStoppedAt: null,
  });
  setTimerNow(Date.now());
};

  const startEditDayTimer = () => {
  setDayTimerEditForm({
    start: timestampToTimeInput(dayTimerState.dayStartedAt),
    end: timestampToTimeInput(dayTimerState.dayEndedAt),
  });
  setEditingDayTimer(true);
};

const saveDayTimerEdit = () => {
  if (!dayTimerState.dayStartedAt || !dayTimerEditForm.start) return;

  const newStartedAt = setTimestampTime(dayTimerState.dayStartedAt, dayTimerEditForm.start);
  const baseEnd = dayTimerState.dayEndedAt || dayTimerState.dayStartedAt;
  const newEndedAt = dayTimerEditForm.end
    ? setTimestampTime(baseEnd, dayTimerEditForm.end)
    : null;

  const workedMs = newEndedAt
    ? Math.max(0, newEndedAt - newStartedAt - (dayTimerState.breakMs || 0))
    : dayTimerState.accumulatedMs;

  setDayTimerState((prev) => ({
    ...prev,
    dayStartedAt: newStartedAt,
    dayEndedAt: newEndedAt,
    accumulatedMs: workedMs,
    startTime: prev.running ? newStartedAt : null,
  }));

  setEditingDayTimer(false);
};

const cancelDayTimerEdit = () => {
  setEditingDayTimer(false);
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

  const statsMonths = useMemo(() => {
  const months = Array.from({ length: 12 }, (_, index) => {
    const monthNumber = index + 1;
    const monthKey = `${selectedStatsYear}-${String(monthNumber).padStart(2, "0")}`;

    const monthLogs = logs.filter((log) => log.date.startsWith(monthKey));
    const monthEarned = monthLogs.reduce((sum, log) => sum + log.earned, 0);
    const monthMinutes = monthLogs.reduce((sum, log) => sum + log.minutes, 0);
    const monthCount = monthLogs.length;

    const weeksMap = {};

    monthLogs.forEach((log) => {
      const day = new Date(`${log.date}T00:00:00`);
      const firstDayOfMonth = new Date(day.getFullYear(), day.getMonth(), 1);
      const weekNumber = Math.ceil((day.getDate() + firstDayOfMonth.getDay()) / 7);
      const weekKey = `${monthKey}-vika-${weekNumber}`;

      if (!weeksMap[weekKey]) {
        weeksMap[weekKey] = {
          weekKey,
          weekLabel: `Vika ${weekNumber}`,
          logs: [],
          earned: 0,
          minutes: 0,
          count: 0,
        };
      }

      weeksMap[weekKey].logs.push(log);
      weeksMap[weekKey].earned += log.earned;
      weeksMap[weekKey].minutes += log.minutes;
      weeksMap[weekKey].count += 1;
    });

    return {
      monthKey,
      monthLabel: MONTHS[index],
      logs: monthLogs,
      earned: monthEarned,
      minutes: monthMinutes,
      count: monthCount,
      weeks: Object.values(weeksMap),
    };
  });

  return months;
}, [logs, selectedStatsYear]);
  
  const allCustomers = useMemo(() => {
    return Object.entries(customersByArea).flatMap(([area, list]) =>
      list.map((customer) => ({ ...customer, area, key: makeCustomerKey({ ...customer, area }) }))
    );
  }, [customersByArea]);

  const selectedMapCustomer = allCustomers.find((c) => c.key === mapCustomerKey) || null;

  const setCustomerLocation = (latlng) => {
    if (!selectedMapCustomer) return;
    setCustomerLocations((prev) => ({
      ...prev,
      [selectedMapCustomer.key]: { lat: Number(latlng.lat.toFixed(6)), lng: Number(latlng.lng.toFixed(6)) },
    }));
  };

  const clearCustomerLocation = () => {
    if (!selectedMapCustomer) return;
    setCustomerLocations((prev) => {
      const next = { ...prev };
      delete next[selectedMapCustomer.key];
      return next;
    });
  };

  const expensesSortedNewest = useMemo(() => {
    return [...expenses].sort((a, b) => `${b.date || ""} ${b.createdAt || ""}`.localeCompare(`${a.date || ""} ${a.createdAt || ""}`));
  }, [expenses]);

  const groupedExpenses = useMemo(() => {
    const order = ["fuel", "clothes", "tools", "maintenance", "other"];
    return order
      .map((category) => ({ category, items: expensesSortedNewest.filter((expense) => expense.category === category) }))
      .filter((group) => group.items.length > 0);
  }, [expensesSortedNewest]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#f8fafc 0%, #eef2ff 100%)",
        padding: 16,
        paddingBottom: 110,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        color: "#111827",
      }}
    >
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
                  const allPaid = dayLogs.length > 0 && dayLogs.every((log) => log.paid);
                  const bg = dayLogs.length === 0 ? "#fff" : allPaid ? "#dcfce7" : "#dbeafe";

                  return (
                    <button
                      key={cell.dateStr}
                      onClick={() => setSelectedDay(cell.dateStr)}
                      style={{ minHeight: 104, borderRadius: 20, border: selectedDay === cell.dateStr ? "2px solid #1d4ed8" : "1px solid #dbe2ea", background: bg, textAlign: "left", padding: 10, cursor: "pointer" }}
                    >
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
                  <div style={{ opacity: 0.9, marginTop: 6 }}>
                    {selectedDayLogs.length} færslur • {minsToText(selectedDayLogs.reduce((s, l) => s + l.minutes, 0))} • {kr(selectedDayLogs.reduce((s, l) => s + l.earned, 0))}
                  </div>
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
          {dayTimerState.running
  ? "Dagur í gangi"
  : dayTimerState.dayEndedAt
  ? "Degi lokið"
  : dayTimerState.dayStartedAt
  ? "Í pásu"
  : "Ekki byrjað"}
        </div>
      </div>

      <div style={{ background: "#0f172a", color: "#fff", borderRadius: 24, padding: 18, marginTop: 14 }}>
        <div style={{ fontSize: 14, opacity: 0.8 }}>Dagstimer</div>
        <div style={{ fontSize: 34, fontWeight: 900, marginTop: 6 }}>{minsToText(dayTimerMinutes)}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          {dayTimerState.accumulatedMs === 0 && !dayTimerState.running && !dayTimerState.dayStartedAt ? (
  <button style={buttonStyle(true)} onClick={startDayTimer}>Byrja dag</button>
) : dayTimerState.running ? (
  <>
    <button style={buttonStyle(true)} onClick={pauseDayTimer}>Pása</button>
    <button style={buttonStyle(false)} onClick={finishDayTimer}>Klára dag</button>
  </>
) : (
  <>
    <button style={buttonStyle(true)} onClick={resumeDayTimer}>Halda áfram</button>
    <button style={buttonStyle(false)} onClick={finishDayTimer}>Klára dag</button>
  </>
)}

{(dayTimerState.running || dayTimerState.accumulatedMs > 0 || dayTimerState.dayStartedAt) && (
  <button style={buttonStyle(false)} onClick={resetDayTimer}>Endurstilla</button>
)}
                  </div>
      </div>
          
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        {!editingDayTimer ? (
          <button style={buttonStyle(false)} onClick={startEditDayTimer}>
            Edita dagstimer
          </button>
        ) : null}
      </div>
      
      <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
    gap: 12,
    marginTop: 16,
  }}
>
  <div style={{ background: "#f8fafc", borderRadius: 22, padding: 14 }}>
    <div style={{ color: "#475569", fontSize: 13 }}>Byrjaði</div>
    <div style={{ fontWeight: 900, fontSize: 24 }}>
      {formatClockTime(dayTimerState.dayStartedAt)}
    </div>
  </div>

  <div style={{ background: "#f8fafc", borderRadius: 22, padding: 14 }}>
    <div style={{ color: "#475569", fontSize: 13 }}>Endaði</div>
    <div style={{ fontWeight: 900, fontSize: 24 }}>
      {formatClockTime(dayTimerState.running ? null : dayTimerState.dayEndedAt)}
    </div>
  </div>

  <div style={{ background: "#f8fafc", borderRadius: 22, padding: 14 }}>
    <div style={{ color: "#475569", fontSize: 13 }}>Pásur</div>
    <div style={{ fontWeight: 900, fontSize: 24 }}>
      {minsToText(Math.floor((dayTimerState.breakMs || 0) / 60000))}
    </div>
  </div>
</div>

{editingDayTimer && (
  <div style={cardStyle({ marginTop: 12 })}>
    <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>
      Edita dagstimer
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
      <input
        style={inputStyle()}
        type="time"
        value={dayTimerEditForm.start}
        onChange={(e) =>
          setDayTimerEditForm((prev) => ({ ...prev, start: e.target.value }))
        }
      />

      <input
        style={inputStyle()}
        type="time"
        value={dayTimerEditForm.end}
        onChange={(e) =>
          setDayTimerEditForm((prev) => ({ ...prev, end: e.target.value }))
        }
      />
    </div>

    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <button style={buttonStyle(true)} onClick={saveDayTimerEdit}>
        Vista
      </button>
      <button style={buttonStyle(false)} onClick={cancelDayTimerEdit}>
        Hætta við
      </button>
    </div>
  </div>
)}
      
            <div style={cardStyle({ marginTop: 16 })}>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>
          Plan dagsins
        </div>

        {todayPlanLines.length > 0 ? (
          <div style={{ display: "grid", gap: 8 }}>
            {todayPlanLines.map((item, index) => (
              <div
                key={`${item}-${index}`}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 18,
                  padding: 12,
                  fontWeight: 800,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: "#64748b" }}>
            Ekkert plan skráð í dag.
          </div>
        )}
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginTop: 16 }}>
        <div style={{ background: "#dbeafe", borderRadius: 22, padding: 14 }}>
          <div style={{ color: "#475569", fontSize: 13 }}>Tekjur í dag</div>
          <div style={{ fontWeight: 900, fontSize: 24 }}>{kr(myDayLogs.reduce((s, l) => s + l.earned, 0))}</div>
        </div>

        <div style={{ background: "#ede9fe", borderRadius: 22, padding: 14 }}>
          <div style={{ color: "#475569", fontSize: 13 }}>Sláttutími</div>
          <div style={{ fontWeight: 900, fontSize: 24 }}>{minsToText(myDayLogs.reduce((s, l) => s + l.minutes, 0))}</div>
        </div>

        <div style={{ background: "#dcfce7", borderRadius: 22, padding: 14 }}>
          <div style={{ color: "#475569", fontSize: 13 }}>Slættir í dag</div>
          <div style={{ fontWeight: 900, fontSize: 24 }}>{myDayLogs.length}</div>
        </div>
      </div>
    </div>

    <div style={{ display: "grid", gap: 10 }}>
      {myDayLogs.length === 0 && (
        <div style={cardStyle()}>
          <div style={{ fontWeight: 800 }}>Engar færslur í dag enn.</div>
          <div style={{ color: "#64748b", marginTop: 6 }}>Farðu í Skrá og bættu við slætti til að sjá timeline hér.</div>
        </div>
      )}

      {myDayLogs.map((log) => (
        <div key={log.id} style={cardStyle()}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{log.customer}</div>
              <div style={{ color: "#64748b", marginTop: 4 }}>{log.area}</div>
            </div>
            <div style={{ fontWeight: 900, fontSize: 22 }}>{kr(log.earned)}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10, marginTop: 12 }}>
            <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}>
              <div style={{ color: "#64748b", fontSize: 13 }}>Frá</div>
              <div style={{ fontWeight: 900 }}>{log.startTime}</div>
            </div>

            <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}>
              <div style={{ color: "#64748b", fontSize: 13 }}>Til</div>
              <div style={{ fontWeight: 900 }}>{log.endTime}</div>
            </div>

            <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}>
              <div style={{ color: "#64748b", fontSize: 13 }}>Tími</div>
              <div style={{ fontWeight: 900 }}>{minsToText(log.minutes)}</div>
            </div>

            <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}>
              <div style={{ color: "#64748b", fontSize: 13 }}>Verk</div>
              <div style={{ fontWeight: 900 }}>
                {(log.note || "").toLowerCase().includes("sópa") || (log.note || "").toLowerCase().includes("þrif")
                  ? "🧹"
                  : (log.note || "").toLowerCase().includes("blóm")
                  ? "🌸"
                  : (log.note || "").toLowerCase().includes("slátt") || (log.note || "").toLowerCase().includes("gras")
                  ? "✂️"
                  : "🌿"}{" "}
                {log.note || "Garðsláttur"}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

        {screen === "Skrá" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={cardStyle({ background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(239,246,255,0.95))", boxShadow: "0 18px 40px rgba(29,78,216,0.10)" })}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>Skrá færslu</div>
                  <div style={{ color: "#64748b", marginTop: 6 }}>Settu inn dag, frá og til tíma og upphæð á snyrtilegan hátt.</div>
                </div>
                <div style={{ padding: "8px 12px", borderRadius: 999, background: "rgba(29,78,216,0.08)", color: "#1d4ed8", fontWeight: 800 }}>Quick add</div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
                  <select style={inputStyle()} value={entry.area} onChange={(e) => setAreaAndDefaultCustomer(e.target.value)}>
                    {AREA_ORDER.map((area) => <option key={area} value={area}>{area}</option>)}
                  </select>
                  <select style={inputStyle()} value={entry.customer} onChange={(e) => setCustomerAndAutoPrice(e.target.value)}>
                    {availableCustomers.map((customer) => <option key={`${entry.area}-${customer.id}`} value={customer.name}>{customer.name}</option>)}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12 }}>
                  <div><div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, marginLeft: 4 }}>Dagsetning</div><input style={inputStyle()} type="date" value={entry.date} onChange={(e) => setEntry({ ...entry, date: e.target.value })} /></div>
                  <div><div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, marginLeft: 4 }}>Frá</div><input style={inputStyle()} type="time" value={entry.startTime} onChange={(e) => setEntry({ ...entry, startTime: e.target.value })} /></div>
                  <div><div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, marginLeft: 4 }}>Til</div><input style={inputStyle()} type="time" value={entry.endTime} onChange={(e) => setEntry({ ...entry, endTime: e.target.value })} /></div>
                </div>

                <div>
  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, marginLeft: 4 }}>Verk</div>
  <input
    style={inputStyle()}
    placeholder="t.d. Garðsláttur, blóm, þrif"
    value={jobNote}
    onChange={(e) => setJobNote(e.target.value)}
  />
</div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
                  <div><div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, marginLeft: 4 }}>Upphæð</div><input style={inputStyle()} type="number" value={entry.earned} onChange={(e) => setEntry({ ...entry, earned: e.target.value })} placeholder="Upphæð" /></div>
                  <div><div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, marginLeft: 4 }}>Heildartími</div><div style={{ ...inputStyle(), display: "flex", alignItems: "center", fontWeight: 900, fontSize: 24, background: "#f8fafc" }}>{minsToText(currentMinutes)}</div></div>
                </div>

                <label style={{ ...inputStyle(), display: "flex", alignItems: "center", gap: 10, fontWeight: 700, minHeight: 62 }}>
                  <input type="checkbox" checked={entry.paid} onChange={(e) => setEntry({ ...entry, paid: e.target.checked })} />
                  Greitt
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                <div style={{ color: "#64748b", maxWidth: 520 }}>Toyota tímakaup fær auto verð. Þú getur samt alltaf yfirskrifað upphæðina.</div>
                <button style={buttonStyle(true)} onClick={addLog}>Bæta við færslu</button>
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
            style={{ width: "100%", border: "none", background: "transparent", padding: 18, cursor: "pointer", textAlign: "left" }}
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
              {group.clients.map((client, index) => (
                <div key={client.key} style={{ display: "grid", gap: 10 }}>
                  {index > 0 && (
                    <div
                      style={{
                        height: 1,
                        background: "linear-gradient(90deg, transparent, #cbd5e1, transparent)",
                        margin: "2px 6px",
                      }}
                    />
                  )}

                  <button
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

  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
    <div
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        background: getClientStatus(client.calculatedHourly).bg,
        color: getClientStatus(client.calculatedHourly).color,
        fontWeight: 800,
      }}
    >
      {getClientStatus(client.calculatedHourly).emoji} {getClientStatus(client.calculatedHourly).label}
    </div>

    {getSuggestedPrice(client) && (
      <div style={{ color: "#991b1b", fontWeight: 700 }}>
        💰 Mælt verð: {kr(getSuggestedPrice(client))}
      </div>
    )}
  </div>
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
                        <div style={{ fontWeight: 900 }}>
                          {client.totalMinutes > 0 ? `${kr(client.calculatedHourly)}/klst` : "0 kr./klst"}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
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
                <div style={{ fontWeight: 900 }}>
                  {selectedClientCard.pricing === "hourly"
                    ? `Tímakaup ${kr(selectedClientCard.price)}/klst`
                    : `Fast verð ${kr(selectedClientCard.price)}`}
                </div>
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
                <div style={{ fontWeight: 900 }}>
                  {selectedClientCard.totalMinutes > 0
                    ? `${kr(selectedClientCard.calculatedHourly)}/klst`
                    : "0 kr./klst"}
                </div>
              </div>
            </div>

            {selectedClientCard.logs.map((log) => (
              <div key={log.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 22, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900 }}>{formatLongDate(log.date)}</div>
                    <div style={{ color: "#64748b", marginTop: 4 }}>{log.startTime} – {log.endTime}</div>
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

                {editingLogId === log.id ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
                      <input style={inputStyle()} type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
                      <input style={inputStyle()} type="time" value={editForm.startTime} onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })} />
                      <input style={inputStyle()} type="time" value={editForm.endTime} onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })} />
                      <input style={inputStyle()} type="number" value={editForm.earned} onChange={(e) => setEditForm({ ...editForm, earned: e.target.value })} />
                      <label style={{ ...inputStyle(), display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
                        <input type="checkbox" checked={editForm.paid} onChange={(e) => setEditForm({ ...editForm, paid: e.target.checked })} />
                        Greitt
                      </label>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button style={buttonStyle(true)} onClick={saveEditLog}>Vista breytingar</button>
                      <button style={buttonStyle(false)} onClick={cancelEdit}>Hætta við</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10, marginBottom: 12 }}>
                      <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}>
                        <div style={{ color: "#64748b", fontSize: 13 }}>Tími</div>
                        <div style={{ fontWeight: 900 }}>{minsToText(log.minutes)}</div>
                      </div>

                      <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}>
                        <div style={{ color: "#64748b", fontSize: 13 }}>Græddi</div>
                        <div style={{ fontWeight: 900 }}>{kr(log.earned)}</div>
                      </div>

                      <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}>
                        <div style={{ color: "#64748b", fontSize: 13 }}>Tegund</div>
                        <div style={{ fontWeight: 900 }}>
                          {log.pricing === "hourly"
                            ? `Tímakaup ${log.hourlyRate ? `(${kr(log.hourlyRate)}/klst)` : ""}`
                            : "Fast verð"}
                        </div>
                      </div>

                      <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}>
                        <div style={{ color: "#64748b", fontSize: 13 }}>Verk</div>
                        <div style={{ fontWeight: 900 }}>
                          {(log.note || "").toLowerCase().includes("sópa") || (log.note || "").toLowerCase().includes("þrif")
                            ? "🧹"
                            : (log.note || "").toLowerCase().includes("blóm")
                            ? "🌸"
                            : (log.note || "").toLowerCase().includes("slátt") || (log.note || "").toLowerCase().includes("gras")
                            ? "✂️"
                            : "🌿"}{" "}
                          {log.note || "Garðsláttur"}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, color: "#334155" }}>
                        <input type="checkbox" checked={log.paid} onChange={() => togglePaid(log.id)} />
                        Breyta í greitt
                      </label>

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
        <div style={cardStyle()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>Ár → mánuðir</div>
          <div style={{ color: "#64748b", marginTop: 4 }}>
            Ýttu á mánuð til að opna hann
          </div>
        </div>

        <select
  style={{ ...inputStyle(), maxWidth: 140 }}
  value={selectedStatsYear}
  onChange={(e) => {
    setSelectedStatsYear(e.target.value);
    setExpandedStatsMonth(null);
  }}
>
  <option value="2026">2026</option>
  <option value="2025">2025</option>
  <option value="2027">2027</option>
</select>

      <div style={{ display: "grid", gap: 10 }}>
        {statsMonths.map((month) => {
          const isOpen = expandedStatsMonth === month.monthKey;

          return (
            <div key={month.monthKey} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 22, overflow: "hidden" }}>
              <button
                onClick={() => setExpandedStatsMonth(isOpen ? null : month.monthKey)}
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  textAlign: "left",
                  padding: 14,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 900 }}>{month.monthLabel}</div>
                    <div style={{ color: "#64748b", marginTop: 4 }}>
                      {month.count} slættir • {minsToText(month.minutes)}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900, fontSize: 20 }}>{kr(month.earned)}</div>
                    <div style={{ color: "#1d4ed8", fontWeight: 800, marginTop: 4 }}>
                      {isOpen ? "Loka" : "Opna"}
                    </div>
                  </div>
                </div>
              </button>

              {isOpen && (
                <div style={{ padding: "0 14px 14px", display: "grid", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
                    <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}>
                      <div style={{ color: "#64748b", fontSize: 13 }}>Tekjur</div>
                      <div style={{ fontWeight: 900 }}>{kr(month.earned)}</div>
                    </div>

                    <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}>
                      <div style={{ color: "#64748b", fontSize: 13 }}>Tími</div>
                      <div style={{ fontWeight: 900 }}>{minsToText(month.minutes)}</div>
                    </div>

                    <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}>
                      <div style={{ color: "#64748b", fontSize: 13 }}>Fjöldi verka</div>
                      <div style={{ fontWeight: 900 }}>{month.count}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
      <div style={cardStyle({ background: "linear-gradient(135deg,#dbeafe 0%, #bfdbfe 100%)" })}>
        <div style={{ color: "#475569", fontSize: 13 }}>Heildartekjur</div>
        <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{kr(allTotal)}</div>
      </div>
      <div style={cardStyle({ background: "linear-gradient(135deg,#ede9fe 0%, #ddd6fe 100%)" })}>
        <div style={{ color: "#475569", fontSize: 13 }}>Heildartími</div>
        <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{minsToText(allMinutes)}</div>
      </div>
      <div style={cardStyle({ background: "linear-gradient(135deg,#dcfce7 0%, #bbf7d0 100%)" })}>
        <div style={{ color: "#475569", fontSize: 13 }}>Greitt</div>
        <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{kr(paidTotal)}</div>
      </div>
      <div style={cardStyle({ background: "linear-gradient(135deg,#fee2e2 0%, #fecaca 100%)" })}>
        <div style={{ color: "#475569", fontSize: 13 }}>Ógreitt</div>
        <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{kr(unpaidTotal)}</div>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
      <div style={cardStyle()}>
        <div style={{ color: "#64748b", fontSize: 13 }}>Meðaltal per slátt</div>
        <div style={{ fontSize: 26, fontWeight: 900, marginTop: 6 }}>{logs.length > 0 ? kr(Math.round(allTotal / logs.length)) : "0 kr."}</div>
      </div>
      <div style={cardStyle()}>
        <div style={{ color: "#64748b", fontSize: 13 }}>Meðaltími per slátt</div>
        <div style={{ fontSize: 26, fontWeight: 900, marginTop: 6 }}>{logs.length > 0 ? minsToText(Math.round(allMinutes / logs.length)) : "0 mín"}</div>
      </div>
      <div style={cardStyle()}>
        <div style={{ color: "#64748b", fontSize: 13 }}>Meðal tímakaup</div>
        <div style={{ fontSize: 26, fontWeight: 900, marginTop: 6 }}>{allMinutes > 0 ? `${kr(Math.round(allTotal / (allMinutes / 60)))}/klst` : "0 kr./klst"}</div>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
      <div style={cardStyle({ background: "linear-gradient(135deg,#fff7ed 0%, #ffedd5 100%)" })}>
        <div style={{ color: "#475569", fontSize: 13 }}>Heildarkostnaður</div>
        <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{kr(totalExpenses)}</div>
      </div>
      <div style={cardStyle({ background: "linear-gradient(135deg,#fef3c7 0%, #fde68a 100%)" })}>
        <div style={{ color: "#475569", fontSize: 13 }}>Eldsneyti samtals</div>
        <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{kr(fuelExpenses)}</div>
      </div>
      <div style={cardStyle({ background: "linear-gradient(135deg,#dcfce7 0%, #bbf7d0 100%)" })}>
        <div style={{ color: "#475569", fontSize: 13 }}>Hagnaður eftir kostnað</div>
        <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{kr(profitAfterExpenses)}</div>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
      {clientCards.length > 0 && (
        <div style={cardStyle({ background: "linear-gradient(135deg,#fef9c3 0%, #fde68a 100%)" })}>
          <div style={{ color: "#475569", fontSize: 13 }}>🏆 Besti kúnni</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>
            {[...clientCards].filter((c) => c.totalMinutes > 0).sort((a, b) => b.calculatedHourly - a.calculatedHourly)[0]?.name || "-"}
          </div>
          <div style={{ marginTop: 4 }}>
            {[...clientCards].filter((c) => c.totalMinutes > 0).length > 0
              ? `${kr([...clientCards].filter((c) => c.totalMinutes > 0).sort((a, b) => b.calculatedHourly - a.calculatedHourly)[0]?.calculatedHourly)}/klst`
              : "0 kr./klst"}
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div style={cardStyle({ background: "linear-gradient(135deg,#dcfce7 0%, #bbf7d0 100%)" })}>
          <div style={{ color: "#475569", fontSize: 13 }}>💸 Hæsta greiðsla</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>
            {kr(Math.max(...logs.map((l) => l.earned || 0)))}
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div style={cardStyle({ background: "linear-gradient(135deg,#e0e7ff 0%, #c7d2fe 100%)" })}>
          <div style={{ color: "#475569", fontSize: 13 }}>⏱️ Lengsti sláttur</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>
            {minsToText(Math.max(...logs.map((l) => l.minutes || 0)))}
          </div>
        </div>
      )}
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
      <div style={cardStyle()}>
        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Bestu kúnnar</div>
        <div style={{ display: "grid", gap: 10 }}>
          {[...clientCards]
            .filter((client) => client.totalMinutes > 0)
            .sort((a, b) => b.calculatedHourly - a.calculatedHourly)
            .slice(0, 5)
            .map((client, index) => (
              <div
                key={client.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: 10,
                  alignItems: "center",
                  background: index === 0 ? "#dcfce7" : "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 18,
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 20 }}>{index === 0 ? "🔥" : "⭐"}</div>
                <div>
                  <div style={{ fontWeight: 900 }}>{client.name}</div>
                  <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{client.area}</div>
                </div>
                <div style={{ fontWeight: 900 }}>{kr(client.calculatedHourly)}/klst</div>
              </div>
            ))}
        </div>
      </div>

      <div style={cardStyle()}>
        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Hægustu kúnnar</div>
        <div style={{ display: "grid", gap: 10 }}>
          {[...clientCards]
            .filter((client) => client.totalMinutes > 0)
            .sort((a, b) => a.calculatedHourly - b.calculatedHourly)
            .slice(0, 5)
            .map((client, index) => (
              <div
                key={client.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: 10,
                  alignItems: "center",
                  background: index === 0 ? "#fee2e2" : "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 18,
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 20 }}>{index === 0 ? "⚠️" : "•"}</div>
                <div>
                  <div style={{ fontWeight: 900 }}>{client.name}</div>
                  <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{client.area}</div>
                </div>
                <div style={{ fontWeight: 900 }}>{kr(client.calculatedHourly)}/klst</div>
              </div>
            ))}
        </div>
      </div>
    </div>

    <div style={cardStyle()}>
      <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Hverfi</div>
      <div style={{ display: "grid", gap: 10 }}>
        {areaSummary.map((row) => {
          const areaMinutes = logs.filter((l) => l.area === row.area).reduce((sum, l) => sum + l.minutes, 0);
          const areaHourly = areaMinutes > 0 ? Math.round(row.earned / (areaMinutes / 60)) : 0;
          return (
            <div key={row.area} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 10, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 12 }}>
              <div style={{ fontWeight: 800 }}>{row.area}</div>
              <div>Tekjur: {kr(row.earned)}</div>
              <div>Tími: {minsToText(areaMinutes)}</div>
              <div>Tímakaup: {areaMinutes > 0 ? `${kr(areaHourly)}/klst` : "0 kr./klst"}</div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
)}

        {screen === "Kort" && (
          <div style={{ display: "grid", gap: 16 }}>
            <button style={{ ...buttonStyle(false), width: "fit-content" }} onClick={() => setScreen("Meira")}>← Til baka</button>
            <div style={cardStyle()}>
              <div style={{ fontSize: 28, fontWeight: 900 }}>Kort af Akureyri</div>
              <div style={{ color: "#64748b", marginTop: 6 }}>Veldu hvaða kúnna sem er og smelltu svo á kortið til að setja eða færa pinna.</div>
              <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                <select style={inputStyle()} value={mapCustomerKey} onChange={(e) => setMapCustomerKey(e.target.value)}>
                  <option value="">Veldu kúnna</option>
                  {AREA_ORDER.map((area) => {
                    const areaCustomers = allCustomers.filter((c) => c.area === area);
                    if (areaCustomers.length === 0) return null;
                    return <optgroup key={area} label={area}>{areaCustomers.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}</optgroup>;
                  })}
                </select>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{selectedMapCustomer && <button style={buttonStyle(false)} onClick={clearCustomerLocation}>Eyða pinna</button>}</div>

                <div style={{ height: 520, borderRadius: 24, overflow: "hidden", border: "1px solid #dbe2ea" }}>
                  <MapContainer center={AKUREYRI_CENTER} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                    <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapClickSetter selectedCustomerKey={selectedMapCustomer?.key} onPickLocation={setCustomerLocation} />
                    {allCustomers.filter((customer) => customerLocations[customer.key]).map((customer) => (
                      <Marker key={customer.key} position={[customerLocations[customer.key].lat, customerLocations[customer.key].lng]} icon={markerIcon}>
                        <Popup>
                          <div>
                            <strong>{customer.name}</strong><br />
                            {customer.area}<br />
                            {customer.pricing === "hourly" ? `Tímakaup ${kr(customer.price)}/klst` : `Fast verð ${kr(customer.price)}`}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>

                <div style={{ color: "#64748b", fontSize: 14 }}>
                  {selectedMapCustomer
                    ? customerLocations[selectedMapCustomer.key]
                      ? `Valinn kúnni: ${selectedMapCustomer.name}. Smelltu á nýjan stað til að færa pinnann.`
                      : `Valinn kúnni: ${selectedMapCustomer.name}. Smelltu á kortið til að setja pinna.`
                    : "Veldu kúnna fyrir ofan til að byrja."}
                </div>
              </div>
            </div>
          </div>
        )}
        
                {screen === "Kostnaður" && (
          <div style={{ display: "grid", gap: 16 }}>
            <button style={{ ...buttonStyle(false), width: "fit-content" }} onClick={() => setScreen("Meira")}>← Til baka</button>
            <button onClick={() => setScreen("Skrifa kostnað")} style={{ ...cardStyle(), cursor: "pointer", textAlign: "left", border: "1px solid #dbeafe", background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(239,246,255,0.96))" }}><div style={{ fontSize: 26, fontWeight: 900 }}>✍️ Skrifa kostnað</div><div style={{ color: "#64748b", marginTop: 6 }}>Skrá eldsneyti, vinnufatnað, vinnuvörur og fleira</div></button>
            <button onClick={() => setScreen("Skanna QR")} style={{ ...cardStyle(), cursor: "pointer", textAlign: "left", border: "1px solid #dbeafe", background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(239,246,255,0.96))" }}><div style={{ fontSize: 26, fontWeight: 900 }}>📷 Skanna QR</div><div style={{ color: "#64748b", marginTop: 6 }}>Skannar kvittun og fyllir inn kostnað sjálfkrafa</div></button>
            <button onClick={() => setScreen("Lesa kvittun")} style={{ ...cardStyle(), cursor: "pointer", textAlign: "left", border: "1px solid #dbeafe", background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(239,246,255,0.96))" }}><div style={{ fontSize: 26, fontWeight: 900 }}>🧾 Lesa kvittun</div><div style={{ color: "#64748b", marginTop: 6 }}>Taka mynd eða velja kvittun</div></button>
            <button onClick={() => setScreen("Allur kostnaður")} style={{ ...cardStyle(), cursor: "pointer", textAlign: "left", border: "1px solid #dbeafe", background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(239,246,255,0.96))" }}><div style={{ fontSize: 26, fontWeight: 900 }}>📋 Sjá allan kostnað</div><div style={{ color: "#64748b", marginTop: 6 }}>Flokkað og nýjasta fyrst</div></button>
          </div>
        )}

      {screen === "Skrifa kostnað" && (
  <div style={{ display: "grid", gap: 16 }}>
    <button style={{ ...buttonStyle(false), width: "fit-content" }} onClick={() => setScreen("Kostnaður")}>← Til baka</button>
    <div style={cardStyle()}>
      <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Skrifa kostnað</div>
      <div style={{ color: "#64748b", marginBottom: 14 }}>Hér geturðu skráð allan rekstrarkostnað.</div>
      <div style={{ display: "grid", gap: 12 }}>
        <div><div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, marginLeft: 4 }}>Dagsetning</div><input style={inputStyle()} type="date" value={expenseForm.date} onChange={(e) => setExpenseForm((prev) => ({ ...prev, date: e.target.value }))} /></div>
        <div><div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, marginLeft: 4 }}>Upphæð</div><input style={inputStyle()} type="number" placeholder="Upphæð" value={expenseForm.amount} onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))} /></div>
        <div><div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, marginLeft: 4 }}>Tegund kostnaðar</div><select style={inputStyle()} value={expenseForm.category} onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value }))}><option value="fuel">Eldsneyti</option><option value="clothes">Vinnufatnaður</option><option value="tools">Vinnuvörur</option><option value="maintenance">Viðhald</option><option value="other">Annað</option></select></div>
        {expenseForm.category === "fuel" && <div><div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, marginLeft: 4 }}>Eldsneytistegund</div><select style={inputStyle()} value={expenseForm.fuelType} onChange={(e) => setExpenseForm((prev) => ({ ...prev, fuelType: e.target.value }))}><option value="diesel">Dísel</option><option value="95">95</option><option value="98">98</option></select></div>}
        <div><div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, marginLeft: 4 }}>Athugasemd</div><input style={inputStyle()} placeholder="T.d. N1, hanskar, olía eða annað" value={expenseForm.note} onChange={(e) => setExpenseForm((prev) => ({ ...prev, note: e.target.value }))} /></div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
        <div style={{ color: "#64748b" }}>Þessi kostnaður fer svo inn í tölurnar og hagnaðinn.</div>
        <button style={buttonStyle(true)} onClick={() => addExpense("manual")}>Vista kostnað</button>
      </div>
    </div>
  </div>
)}

        {screen === "Skanna QR" && (
          <div style={{ display: "grid", gap: 16 }}>
            <button style={{ ...buttonStyle(false), width: "fit-content" }} onClick={() => setScreen("Kostnaður")}>← Til baka</button>
            <div style={cardStyle()}>
              <div style={{ fontSize: 28, fontWeight: 900 }}>Skanna QR</div>
              <div style={{ color: "#64748b", marginTop: 8 }}>Beindu myndavélinni að QR kóða á kvittun. Ef appið finnur upphæð og dagsetningu fyllist formið sjálfkrafa.</div>
              <div style={{ marginTop: 14 }}><QrScannerCard onDetected={handleQrDetected} scanError={scanError} setScanError={setScanError} /></div>
            </div>

            <div style={cardStyle()}>
              <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>QR niðurstaða</div>
              {scanPreview ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
                    <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}><div style={{ color: "#64748b", fontSize: 13 }}>Dagsetning</div><div style={{ fontWeight: 900 }}>{scanPreview.date || "Fannst ekki"}</div></div>
                    <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}><div style={{ color: "#64748b", fontSize: 13 }}>Upphæð</div><div style={{ fontWeight: 900 }}>{scanPreview.amount ? kr(scanPreview.amount) : "Fannst ekki"}</div></div>
                    <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}><div style={{ color: "#64748b", fontSize: 13 }}>Eldsneyti</div><div style={{ fontWeight: 900 }}>{fuelTypeLabel(scanPreview.fuelType) || "Óþekkt"}</div></div>
                  </div>
                  <div style={{ color: "#64748b" }}>Þú getur lagað upplýsingarnar handvirkt hér fyrir neðan áður en þú vistar.</div>
                </div>
              ) : <div style={{ color: "#64748b" }}>Engin QR niðurstaða komin enn.</div>}
            </div>

            <div style={cardStyle()}>
              <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Staðfesta kostnað</div>
              <div style={{ display: "grid", gap: 12 }}>
                <input style={inputStyle()} type="date" value={expenseForm.date} onChange={(e) => setExpenseForm((prev) => ({ ...prev, date: e.target.value }))} />
                <input style={inputStyle()} type="number" placeholder="Upphæð" value={expenseForm.amount} onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))} />
                <select style={inputStyle()} value={expenseForm.fuelType} onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: "fuel", fuelType: e.target.value }))}><option value="diesel">Dísel</option><option value="95">95</option><option value="98">98</option></select>
                <input style={inputStyle()} placeholder="Raw QR text / athugasemd" value={expenseForm.note} onChange={(e) => setExpenseForm((prev) => ({ ...prev, note: e.target.value }))} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}><button style={buttonStyle(true)} onClick={() => addExpense("qr")}>Vista úr QR</button></div>
            </div>
          </div>
        )}

        {screen === "Lesa kvittun" && (
          <div style={{ display: "grid", gap: 16 }}>
            <button style={{ ...buttonStyle(false), width: "fit-content" }} onClick={() => setScreen("Kostnaður")}>← Til baka</button>
            <div style={cardStyle()}>
              <div style={{ fontSize: 28, fontWeight: 900 }}>Lesa kvittun</div>

              <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
                <label style={buttonStyle(true)}>
                  📷 Taka mynd
                  <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setReceiptImage(URL.createObjectURL(file));
                  }} />
                </label>

                <label style={buttonStyle(false)}>
                  🖼️ Velja mynd
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setReceiptImage(URL.createObjectURL(file));
                  }} />
                </label>
              </div>

              <div style={{ marginTop: 16 }}>
                {receiptImage ? (
                  <img src={receiptImage} alt="Kvittun" style={{ width: "100%", borderRadius: 16 }} />
                ) : (
                  <div style={{ color: "#64748b" }}>Engin mynd valin enn</div>
                )}
                
                {receiptImage && (
  <div style={{ marginTop: 12 }}>
    <button
      style={buttonStyle(false)}
      onClick={() => {
        setReceiptImage(null);
        setReceiptText("");
      }}
    >
      Eyða mynd
    </button>
  </div>
 )}
              </div>

              <div style={{ marginTop: 16 }}>
                <button style={buttonStyle(true)} onClick={readReceipt} disabled={!receiptImage || receiptReading}>
                  {receiptReading ? "Les kvittun..." : "Lesa kvittun"}
                </button>
              </div>

              <div style={{ marginTop: 16, padding: 16, borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0", whiteSpace: "pre-wrap" }}>
                {receiptText || "Enginn texti lesinn enn."}
              </div>

              <div style={{ marginTop: 16 }}>
                <button style={buttonStyle(true)} onClick={() => addExpense("manual")} disabled={!expenseForm.amount}>
                  Vista í kostnað
                </button>
              </div>
            </div>
          </div>
        )}

        {screen === "Allur kostnaður" && (
          <div style={{ display: "grid", gap: 16 }}>
            <button style={{ ...buttonStyle(false), width: "fit-content" }} onClick={() => setScreen("Kostnaður")}>← Til baka</button>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
              <div style={cardStyle({ background: "linear-gradient(135deg,#fff7ed 0%, #ffedd5 100%)" })}><div style={{ color: "#475569", fontSize: 13 }}>Heildarkostnaður</div><div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{kr(totalExpenses)}</div></div>
              <div style={cardStyle({ background: "linear-gradient(135deg,#fef3c7 0%, #fde68a 100%)" })}><div style={{ color: "#475569", fontSize: 13 }}>Eldsneyti samtals</div><div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{kr(fuelExpenses)}</div></div>
            </div>

            {groupedExpenses.length === 0 && (
              <div style={cardStyle()}>
                <div style={{ fontWeight: 800 }}>Enginn kostnaður skráður enn.</div>
                <div style={{ color: "#64748b", marginTop: 6 }}>Farðu í Skrifa kostnað eða Skanna QR og bættu við fyrstu færslunni.</div>
              </div>
            )}

            {groupedExpenses.map((group) => (
              <div key={group.category} style={cardStyle({ padding: 0, overflow: "hidden" })}>
                <div style={{ padding: 18, background: "linear-gradient(135deg,#0f172a 0%, #1d4ed8 100%)", color: "#fff" }}>
                  <div style={{ fontSize: 26, fontWeight: 900 }}>{expenseCategoryLabel(group.category)}</div>
                  <div style={{ opacity: 0.9, marginTop: 6 }}>{group.items.length} færslur • {kr(group.items.reduce((sum, item) => sum + item.amount, 0))}</div>
                </div>
                <div style={{ padding: 14, display: "grid", gap: 10 }}>
                  {group.items.map((expense) => (
                    <div key={expense.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 22, padding: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <div><div style={{ fontSize: 22, fontWeight: 900 }}>{kr(expense.amount)}</div><div style={{ color: "#64748b", marginTop: 4 }}>{formatLongDate(expense.date)}</div></div>
                        <button style={buttonStyle(false)} onClick={() => deleteExpense(expense.id)}>Eyða</button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginTop: 12 }}>
                        <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}><div style={{ color: "#64748b", fontSize: 13 }}>Flokkur</div><div style={{ fontWeight: 900 }}>{expenseCategoryLabel(expense.category)}</div></div>
                        {expense.category === "fuel" && <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}><div style={{ color: "#64748b", fontSize: 13 }}>Eldsneyti</div><div style={{ fontWeight: 900 }}>{fuelTypeLabel(expense.fuelType)}</div></div>}
                        <div style={{ background: "#f8fafc", borderRadius: 18, padding: 12 }}><div style={{ color: "#64748b", fontSize: 13 }}>Skráð með</div><div style={{ fontWeight: 900 }}>{expense.source === "qr" ? "QR" : "Handvirkt"}</div></div>
                      </div>
                      {expense.note && <div style={{ marginTop: 12, background: "#f8fafc", borderRadius: 18, padding: 12 }}><div style={{ color: "#64748b", fontSize: 13 }}>Athugasemd</div><div style={{ fontWeight: 700, marginTop: 4, wordBreak: "break-word" }}>{expense.note}</div></div>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {screen === "Meira" && (
          <div style={{ display: "grid", gap: 16 }}>
            <button onClick={() => setScreen("Kort")} style={{ ...cardStyle(), cursor: "pointer", textAlign: "left", border: "1px solid #dbeafe", background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(239,246,255,0.96))" }}>
              <div style={{ fontSize: 26, fontWeight: 900 }}>🗺️ Kort</div>
              <div style={{ color: "#64748b", marginTop: 6 }}>Sjá alla kúnna á korti og setja pinna</div>
            </button>

            <button onClick={() => setScreen("Kostnaður")} style={{ ...cardStyle(), cursor: "pointer", textAlign: "left", border: "1px solid #dbeafe", background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(239,246,255,0.96))" }}>
              <div style={{ fontSize: 26, fontWeight: 900 }}>⛽ Kostnaður</div>
              <div style={{ color: "#64748b", marginTop: 6 }}>Skrá, skanna og skoða kostnað</div>
            </button>

            <div style={cardStyle()}>
              <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>Bæta við kúnna</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
                <input style={inputStyle()} placeholder="Nafn" value={newCustomerForm.name} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })} />
                <select style={inputStyle()} value={newCustomerForm.area} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, area: e.target.value })}>{AREA_ORDER.map((area) => <option key={area} value={area}>{area}</option>)}</select>
                <select style={inputStyle()} value={newCustomerForm.pricing} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, pricing: e.target.value })}><option value="fixed">Fast verð</option><option value="hourly">Tímakaup</option></select>
                <input style={inputStyle()} type="number" placeholder={newCustomerForm.pricing === "hourly" ? "Kr./klst" : "Verð"} value={newCustomerForm.price} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, price: e.target.value })} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                <div style={{ color: "#64748b" }}>Bætir nýjum kúnna í appið.</div>
                <button style={buttonStyle(true)} onClick={addCustomer}>Bæta við kúnna</button>
              </div>
            </div>
            
                        <div style={cardStyle()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 900 }}>Mánaðarplan</div>
                  <div style={{ color: "#64748b", marginTop: 6 }}>Ýttu á dag og skrifaðu plan fyrir þann dag.</div>
                </div>
                <select style={{ ...inputStyle(), maxWidth: 220 }} value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setSelectedPlanDay(null); }}>
                  {monthOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
                {WEEK_DAYS.map((d) => <div key={d} style={{ textAlign: "center", fontWeight: 800, color: "#64748b", padding: "6px 0" }}>{d}</div>)}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                {monthCells.map((cell, i) => {
                  if (!cell) return <div key={i} style={{ minHeight: 86, borderRadius: 18, background: "rgba(226,232,240,0.45)" }} />;
                  const hasPlan = !!planEntries[cell.dateStr];
                  const allLines = hasPlan ? String(planEntries[cell.dateStr]).split("\n").map((line) => line.trim()).filter(Boolean) : [];
                  const previewShort = allLines.slice(0, 3).map((name) => name.slice(0, 3));
                  const extraCount = allLines.length - 3;
                  return (
                    <button
                      key={cell.dateStr}
                      onClick={() => setSelectedPlanDay(cell.dateStr)}
                      style={{ minHeight: 86, borderRadius: 18, border: selectedPlanDay === cell.dateStr ? "2px solid #1d4ed8" : "1px solid #dbe2ea", background: hasPlan ? "#dbeafe" : "#fff", textAlign: "left", padding: 10, cursor: "pointer", boxShadow: selectedPlanDay === cell.dateStr ? "0 10px 18px rgba(29,78,216,0.12)" : "none", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}
                    >
                      <div style={{ fontWeight: 900, fontSize: 22, color: hasPlan ? "#1d4ed8" : "#111827" }}>{cell.day}</div>
                      {hasPlan ? (
                        <div style={{ marginTop: 6, display: "grid", gap: 2 }}>
                          {previewShort.map((line, idx) => <div key={idx} style={{ fontSize: 11, lineHeight: 1.15, color: "#1e3a8a", fontWeight: 800 }}>{line}</div>)}
                          {extraCount > 0 && <div style={{ fontSize: 10, color: "#1d4ed8", fontWeight: 900 }}>+{extraCount}</div>}
                        </div>
                      ) : <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}> </div>}
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>{selectedPlanDay ? `Plan fyrir ${formatLongDate(selectedPlanDay)}` : "Veldu dag í dagatalinu"}</div>
                <textarea
                  style={{ ...inputStyle(), minHeight: 120, resize: "vertical" }}
                  placeholder={"T.d. Kaldbakur\nStebbi\nHalla"}
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
              <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>Stjórna custom kúnnum</div>
              <div style={{ color: "#64748b", marginBottom: 12 }}>Hér sérðu custom kúnna sem þú hefur sjálfur bætt við.</div>
              <div style={{ display: "grid", gap: 10 }}>
                {customCustomers.length === 0 && <div style={{ color: "#64748b" }}>Þú ert ekki búinn að bæta við custom kúnna enn.</div>}
                {customCustomers.map((c) => (
                  <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "center", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 12 }}>
                    <div><div style={{ fontWeight: 900 }}>{c.name}</div><div style={{ color: "#64748b", fontSize: 13 }}>{c.area} • {c.pricing === "hourly" ? `Tímakaup ${kr(c.price)}/klst` : `Fast verð ${kr(c.price)}`}</div></div>
                    <button style={buttonStyle(false)} onClick={() => updateCustomCustomer(c.id)}>Edit</button>
                    <button style={buttonStyle(false)} onClick={() => deleteCustomCustomer(c.id)}>Eyða</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          position: "fixed",
          left: 16,
          right: 16,
          bottom: 16,
          maxWidth: 900,
          margin: "0 auto",
          background: "rgba(255,255,255,0.95)",
          border: "1px solid rgba(255,255,255,0.9)",
          borderRadius: 32,
          padding: 8,
          boxShadow: "0 18px 40px rgba(15,23,42,0.16)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${NAV_ITEMS.length},1fr)`, gap: 6 }}>
          {NAV_ITEMS.map((item) => {
            const active = screen === item;
            return (
              <button
                key={item}
                onClick={() => setScreen(item)}
                style={{
                  border: "none",
                  background: active ? "rgba(99,102,241,0.12)" : "transparent",
                  borderRadius: 24,
                  padding: "10px 6px",
                  cursor: "pointer",
                  color: active ? "#ef4444" : "#111827",
                }}
              >
                <div style={{ fontSize: 24, lineHeight: 1 }}>{iconForNav(item)}</div>
                <div style={{ fontSize: 13, fontWeight: active ? 800 : 600, marginTop: 6 }}>
                  {item}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

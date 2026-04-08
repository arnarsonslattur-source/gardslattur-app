import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "gardslattur-part5-logs";
const DAY_HISTORY_KEY = "gardslattur-part5-day-history";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

function getTodayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 10);
}

function minutesBetween(start, end) {
  if (!start || !end || !start.includes(":") || !end.includes(":")) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
}

function minsToText(mins) {
  const total = Math.max(0, Math.round(mins || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h} klst ${m} mín`;
  if (h) return `${h} klst`;
  return `${m} mín`;
}

function kr(n) {
  return `${Number(n || 0).toLocaleString("is-IS")} kr.`;
}

function formatLongDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("is-IS", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function setTimestampTime(baseTimestamp, timeValue) {
  if (!baseTimestamp || !timeValue) return baseTimestamp;
  const [hours, minutes] = timeValue.split(":").map(Number);
  const d = new Date(baseTimestamp);
  d.setHours(hours, minutes, 0, 0);
  return d.getTime();
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

  for (let i = 0; i < startDay; i += 1) cells.push(null);

  for (let day = 1; day <= totalDays; day += 1) {
    const d = new Date(year, monthIndex, day);
    cells.push({
      day,
      dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    });
  }

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function inputStyle() {
  return {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #dbe2ea",
    fontSize: 16,
    boxSizing: "border-box",
    outline: "none",
    background: "#fff",
  };
}

function buttonStyle(primary = false) {
  return {
    padding: "12px 16px",
    borderRadius: 14,
    border: primary ? "none" : "1px solid #dbe2ea",
    background: primary ? "linear-gradient(135deg,#0f172a 0%, #2563eb 100%)" : "#fff",
    color: primary ? "#fff" : "#111827",
    cursor: "pointer",
    fontWeight: 700,
  };
}

function cardStyle(extra = {}) {
  return {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 16,
    boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
    ...extra,
  };
}

function getCalendarDayBackground(dayLogs, history) {
  const hasLogs = dayLogs.length > 0;
  const hasTimer = !!history?.workedMinutes;
  const allPaid = hasLogs && dayLogs.every((log) => log.paid);
  const hasUnpaid = hasLogs && dayLogs.some((log) => !log.paid);

  if (hasLogs && allPaid) return "#dcfce7";
  if (hasUnpaid) return "#fee2e2";
  if (!hasLogs && hasTimer) return "#fef3c7";
  if (hasLogs) return "#dbeafe";
  return "#fff";
}

export default function App() {
  const [screen, setScreen] = useState("Skrá");

  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [dayHistory, setDayHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(DAY_HISTORY_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [entry, setEntry] = useState({
    customer: "",
    date: getTodayLocal(),
    startTime: "12:00",
    endTime: "13:00",
    earned: "",
    note: "",
    paid: false,
  });

  const [selectedDate, setSelectedDate] = useState(getTodayLocal());
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey(new Date()));
  const [selectedStatsYear, setSelectedStatsYear] = useState(String(new Date().getFullYear()));
  const [expandedStatsMonth, setExpandedStatsMonth] = useState(null);
  const [expandedStatsWeek, setExpandedStatsWeek] = useState(null);
  const [liveTimerNow, setLiveTimerNow] = useState(Date.now());

  const [editingLogId, setEditingLogId] = useState(null);
  const [editForm, setEditForm] = useState({
    customer: "",
    date: "",
    startTime: "",
    endTime: "",
    earned: "",
    note: "",
    paid: false,
  });

  const [editingDayTimer, setEditingDayTimer] = useState(false);
  const [dayTimerEditForm, setDayTimerEditForm] = useState({
    start: "",
    end: "",
    pauseMinutes: "0",
  });

  const [dayTimerState, setDayTimerState] = useState({
    running: false,
    currentDate: getTodayLocal(),
    dayStartedAt: null,
    dayEndedAt: null,
    pauseMinutes: 0,
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch {}
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem(DAY_HISTORY_KEY, JSON.stringify(dayHistory));
    } catch {}
  }, [dayHistory]);

  useEffect(() => {
    if (!dayTimerState.running) return;
    const interval = setInterval(() => setLiveTimerNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [dayTimerState.running]);

  useEffect(() => {
    if (screen === "Skrá") {
      setEntry((prev) => ({
        ...prev,
        date: getTodayLocal(),
      }));
    }
  }, [screen]);

  const saveDayHistory = (dateKey, data) => {
    if (!dateKey) return;
    setDayHistory((prev) => ({
      ...prev,
      [dateKey]: {
        date: dateKey,
        ...prev[dateKey],
        ...data,
      },
    }));
  };

  function getLiveWorkedMinutes(timerState, nowOverride = null) {
    if (!timerState?.dayStartedAt) return 0;
    const endTime = timerState.running ? nowOverride || liveTimerNow : timerState.dayEndedAt;
    if (!endTime) return 0;
    const diffMinutes = (endTime - timerState.dayStartedAt) / 60000;
    return Math.max(0, Math.round(diffMinutes - (timerState.pauseMinutes || 0)));
  }

  const addLog = () => {
    if (!entry.customer || !entry.date) return;

    const minutes = minutesBetween(entry.startTime, entry.endTime);

    setLogs((prev) => [
      {
        id: Date.now(),
        customer: entry.customer,
        date: entry.date,
        startTime: entry.startTime,
        endTime: entry.endTime,
        earned: Number(entry.earned || 0),
        note: entry.note || "Garðsláttur",
        paid: entry.paid,
        minutes,
      },
      ...prev,
    ]);

    setEntry({
      customer: "",
      date: getTodayLocal(),
      startTime: "12:00",
      endTime: "13:00",
      earned: "",
      note: "",
      paid: false,
    });
  };

  const startEditLog = (log) => {
    setEditingLogId(log.id);
    setEditForm({
      customer: log.customer,
      date: log.date,
      startTime: log.startTime,
      endTime: log.endTime,
      earned: String(log.earned),
      note: log.note || "",
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
              customer: editForm.customer,
              date: editForm.date,
              startTime: editForm.startTime,
              endTime: editForm.endTime,
              earned: Number(editForm.earned || 0),
              note: editForm.note || "Garðsláttur",
              paid: editForm.paid,
              minutes: minutesBetween(editForm.startTime, editForm.endTime),
            }
          : log
      )
    );

    setEditingLogId(null);
  };

  const cancelEditLog = () => setEditingLogId(null);

  const deleteLog = (id) => {
    setLogs((prev) => prev.filter((log) => log.id !== id));
    if (editingLogId === id) setEditingLogId(null);
  };

  const togglePaid = (id) => {
    setLogs((prev) =>
      prev.map((log) => (log.id === id ? { ...log, paid: !log.paid } : log))
    );
  };

  const startDay = () => {
    const today = getTodayLocal();
    const now = Date.now();

    setLiveTimerNow(now);
    setDayTimerState({
      running: true,
      currentDate: today,
      dayStartedAt: now,
      dayEndedAt: null,
      pauseMinutes: 0,
    });

    saveDayHistory(today, {
      startTime: now,
      endTime: null,
      pauseMinutes: 0,
      workedMinutes: 0,
    });
  };

  const addPause = (minutes) => {
    if (!dayTimerState.dayStartedAt) return;

    setDayTimerState((prev) => {
      const next = {
        ...prev,
        pauseMinutes: (prev.pauseMinutes || 0) + minutes,
      };

      saveDayHistory(prev.currentDate, {
        startTime: next.dayStartedAt,
        endTime: next.dayEndedAt,
        pauseMinutes: next.pauseMinutes,
        workedMinutes: getLiveWorkedMinutes(next),
      });

      return next;
    });
  };

  const finishDay = () => {
    if (!dayTimerState.dayStartedAt) return;

    const now = Date.now();

    const next = {
      ...dayTimerState,
      running: false,
      dayEndedAt: now,
    };

    setDayTimerState(next);

    saveDayHistory(next.currentDate, {
      startTime: next.dayStartedAt,
      endTime: next.dayEndedAt,
      pauseMinutes: next.pauseMinutes,
      workedMinutes: getLiveWorkedMinutes(next, now),
    });
  };

  const startEditDayTimer = (dateKey) => {
    const history = dayHistory[dateKey];
    if (!history?.startTime) return;

    setDayTimerEditForm({
      start: timestampToTimeInput(history.startTime),
      end: timestampToTimeInput(history.endTime),
      pauseMinutes: String(history.pauseMinutes || 0),
    });
    setSelectedDate(dateKey);
    setEditingDayTimer(true);
  };

  const saveDayTimerEdit = () => {
    const history = dayHistory[selectedDate];
    if (!history?.startTime || !dayTimerEditForm.start) return;

    const newStart = setTimestampTime(history.startTime, dayTimerEditForm.start);
    const baseEnd = history.endTime || history.startTime;
    const newEnd = dayTimerEditForm.end ? setTimestampTime(baseEnd, dayTimerEditForm.end) : null;
    const pauseMinutes = Number(dayTimerEditForm.pauseMinutes || 0);

    const workedMinutes = newEnd
      ? Math.max(0, Math.round((newEnd - newStart) / 60000 - pauseMinutes))
      : 0;

    saveDayHistory(selectedDate, {
      startTime: newStart,
      endTime: newEnd,
      pauseMinutes,
      workedMinutes,
    });

    setEditingDayTimer(false);
  };

  const cancelDayTimerEdit = () => setEditingDayTimer(false);

  const todayKey = getTodayLocal();
  const todayLogs = logs.filter((l) => l.date === todayKey);

  const selectedDateLogs = useMemo(() => {
    return logs
      .filter((l) => l.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [logs, selectedDate]);

  const selectedDateEarned = selectedDateLogs.reduce((sum, log) => sum + log.earned, 0);
  const selectedDateWorkMinutes = selectedDateLogs.reduce((sum, log) => sum + log.minutes, 0);

  const selectedDateDayHistory = dayHistory[selectedDate] || null;
  const todayDayHistory = dayHistory[todayKey] || null;

  const currentDayTimerMinutes =
    dayTimerState.currentDate === todayKey && dayTimerState.dayStartedAt
      ? getLiveWorkedMinutes(dayTimerState)
      : todayDayHistory?.workedMinutes || 0;

  const unloggedDifference = Math.max(
    0,
    (selectedDateDayHistory?.workedMinutes || 0) - selectedDateWorkMinutes
  );

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

  const monthCells = useMemo(
    () => buildCalendar(monthDate.getFullYear(), monthDate.getMonth()),
    [monthDate]
  );

  const monthLogs = logs.filter((l) => l.date.startsWith(selectedMonth));
  const monthEarned = monthLogs.reduce((sum, log) => sum + log.earned, 0);
  const monthMinutes = monthLogs.reduce((sum, log) => sum + log.minutes, 0);

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(new Date().getFullYear(), i, 1);
    return {
      value: getMonthKey(d),
      label: `${MONTHS[i]} ${d.getFullYear()}`,
    };
  });

  const statsMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const monthNumber = index + 1;
      const monthKey = `${selectedStatsYear}-${String(monthNumber).padStart(2, "0")}`;

      const monthLogsLocal = logs.filter((log) => log.date.startsWith(monthKey));
      const monthEarnedLocal = monthLogsLocal.reduce((sum, log) => sum + log.earned, 0);
      const monthMinutesLocal = monthLogsLocal.reduce((sum, log) => sum + log.minutes, 0);
      const monthCountLocal = monthLogsLocal.length;

      const weeksMap = {};

      monthLogsLocal.forEach((log) => {
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
            daysMap: {},
          };
        }

        weeksMap[weekKey].logs.push(log);
        weeksMap[weekKey].earned += log.earned;
        weeksMap[weekKey].minutes += log.minutes;
        weeksMap[weekKey].count += 1;

        if (!weeksMap[weekKey].daysMap[log.date]) {
          weeksMap[weekKey].daysMap[log.date] = {
            date: log.date,
            logs: [],
            earned: 0,
            minutes: 0,
            count: 0,
          };
        }

        weeksMap[weekKey].daysMap[log.date].logs.push(log);
        weeksMap[weekKey].daysMap[log.date].earned += log.earned;
        weeksMap[weekKey].daysMap[log.date].minutes += log.minutes;
        weeksMap[weekKey].daysMap[log.date].count += 1;
      });

      const weeks = Object.values(weeksMap).map((week) => ({
        ...week,
        days: Object.values(week.daysMap).sort((a, b) => a.date.localeCompare(b.date)),
      }));

      return {
        monthKey,
        monthLabel: MONTHS[index],
        logs: monthLogsLocal,
        earned: monthEarnedLocal,
        minutes: monthMinutesLocal,
        count: monthCountLocal,
        weeks,
      };
    });
  }, [logs, selectedStatsYear]);

  const allTotal = logs.reduce((sum, log) => sum + log.earned, 0);
  const allMinutes = logs.reduce((sum, log) => sum + log.minutes, 0);
  const paidTotal = logs.filter((log) => log.paid).reduce((sum, log) => sum + log.earned, 0);
  const unpaidTotal = logs.filter((log) => !log.paid).reduce((sum, log) => sum + log.earned, 0);

  const averagePerJob = logs.length > 0 ? Math.round(allTotal / logs.length) : 0;
  const averagePerHour = allMinutes > 0 ? Math.round(allTotal / (allMinutes / 60)) : 0;

  const bestDay = useMemo(() => {
    const grouped = {};
    logs.forEach((log) => {
      if (!grouped[log.date]) grouped[log.date] = { date: log.date, earned: 0, minutes: 0, count: 0 };
      grouped[log.date].earned += log.earned;
      grouped[log.date].minutes += log.minutes;
      grouped[log.date].count += 1;
    });
    const days = Object.values(grouped);
    if (days.length === 0) return null;
    return days.sort((a, b) => b.earned - a.earned)[0];
  }, [logs]);

  const longestDay = useMemo(() => {
    const grouped = {};
    logs.forEach((log) => {
      if (!grouped[log.date]) grouped[log.date] = { date: log.date, earned: 0, minutes: 0, count: 0 };
      grouped[log.date].earned += log.earned;
      grouped[log.date].minutes += log.minutes;
      grouped[log.date].count += 1;
    });
    const days = Object.values(grouped);
    if (days.length === 0) return null;
    return days.sort((a, b) => b.minutes - a.minutes)[0];
  }, [logs]);

  const highestJob = logs.length > 0 ? [...logs].sort((a, b) => b.earned - a.earned)[0] : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#f8fafc 0%, #eef2ff 100%)",
        padding: 16,
        paddingBottom: 100,
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 16 }}>
        <div>
          <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.04em" }}>Garðsláttur</div>
          <div style={{ color: "#64748b", marginTop: 4 }}>Part 5 af 5</div>
        </div>

        {screen === "Skrá" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={cardStyle()}>
              <div style={{ fontSize: 26, fontWeight: 900 }}>Skrá færslu</div>
              <div style={{ color: "#64748b", marginTop: 4 }}>Dagsetningin defaultar á daginn í dag</div>

              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                <input
                  style={inputStyle()}
                  placeholder="Kúnni"
                  value={entry.customer}
                  onChange={(e) => setEntry({ ...entry, customer: e.target.value })}
                />

                <input
                  style={inputStyle()}
                  type="date"
                  value={entry.date}
                  onChange={(e) => setEntry({ ...entry, date: e.target.value })}
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input
                    style={inputStyle()}
                    type="time"
                    value={entry.startTime}
                    onChange={(e) => setEntry({ ...entry, startTime: e.target.value })}
                  />
                  <input
                    style={inputStyle()}
                    type="time"
                    value={entry.endTime}
                    onChange={(e) => setEntry({ ...entry, endTime: e.target.value })}
                  />
                </div>

                <input
                  style={inputStyle()}
                  type="number"
                  placeholder="Upphæð"
                  value={entry.earned}
                  onChange={(e) => setEntry({ ...entry, earned: e.target.value })}
                />

                <input
                  style={inputStyle()}
                  placeholder="Athugasemd"
                  value={entry.note}
                  onChange={(e) => setEntry({ ...entry, note: e.target.value })}
                />

                <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={entry.paid}
                    onChange={(e) => setEntry({ ...entry, paid: e.target.checked })}
                  />
                  Greitt
                </label>

                <button style={buttonStyle(true)} onClick={addLog}>Vista</button>
              </div>
            </div>
          </div>
        )}

        {screen === "Í dag" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={cardStyle({ background: "linear-gradient(180deg,#ffffff 0%, #eff6ff 100%)" })}>
              <div style={{ fontSize: 26, fontWeight: 900 }}>Í dag</div>
              <div style={{ color: "#64748b", marginTop: 4 }}>{formatLongDate(todayKey)}</div>

              <div style={{ marginTop: 14, background: "#0f172a", color: "#fff", borderRadius: 20, padding: 16 }}>
                <div style={{ fontSize: 14, opacity: 0.85 }}>Dagstími</div>
                <div style={{ fontSize: 34, fontWeight: 900, marginTop: 6 }}>
                  {minsToText(currentDayTimerMinutes)}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                  {!dayTimerState.running && !dayTimerState.dayStartedAt && (
                    <button style={buttonStyle(true)} onClick={startDay}>Byrja dag</button>
                  )}

                  {dayTimerState.running && (
                    <>
                      <button style={buttonStyle(false)} onClick={() => addPause(30)}>+30 mín pásu</button>
                      <button style={buttonStyle(true)} onClick={finishDay}>Klára dag</button>
                    </>
                  )}

                  {!dayTimerState.running && dayTimerState.dayStartedAt && (
                    <>
                      <div style={{ fontWeight: 700 }}>Degi lokið</div>
                      <button style={buttonStyle(false)} onClick={() => startEditDayTimer(todayKey)}>
                        Edita dagstíma
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
                  gap: 10,
                  marginTop: 14,
                }}
              >
                <div style={{ background: "#f8fafc", borderRadius: 16, padding: 12 }}>
                  <div style={{ color: "#64748b", fontSize: 13 }}>Verk í dag</div>
                  <div style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>{todayLogs.length}</div>
                </div>

                <div style={{ background: "#f8fafc", borderRadius: 16, padding: 12 }}>
                  <div style={{ color: "#64748b", fontSize: 13 }}>Tekjur í dag</div>
                  <div style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>
                    {kr(todayLogs.reduce((sum, log) => sum + log.earned, 0))}
                  </div>
                </div>

                <div style={{ background: "#f8fafc", borderRadius: 16, padding: 12 }}>
                  <div style={{ color: "#64748b", fontSize: 13 }}>Skráður tími</div>
                  <div style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>
                    {minsToText(todayLogs.reduce((sum, log) => sum + log.minutes, 0))}
                  </div>
                </div>
              </div>
            </div>

            {editingDayTimer && selectedDate === todayKey && (
              <div style={cardStyle()}>
                <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>Edita dagstíma</div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
                  <input
                    style={inputStyle()}
                    type="time"
                    value={dayTimerEditForm.start}
                    onChange={(e) => setDayTimerEditForm((prev) => ({ ...prev, start: e.target.value }))}
                  />
                  <input
                    style={inputStyle()}
                    type="time"
                    value={dayTimerEditForm.end}
                    onChange={(e) => setDayTimerEditForm((prev) => ({ ...prev, end: e.target.value }))}
                  />
                  <input
                    style={inputStyle()}
                    type="number"
                    value={dayTimerEditForm.pauseMinutes}
                    onChange={(e) => setDayTimerEditForm((prev) => ({ ...prev, pauseMinutes: e.target.value }))}
                    placeholder="Pásur"
                  />
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button style={buttonStyle(true)} onClick={saveDayTimerEdit}>Vista</button>
                  <button style={buttonStyle(false)} onClick={cancelDayTimerEdit}>Hætta við</button>
                </div>
              </div>
            )}

            <div style={cardStyle()}>
              <div style={{ fontSize: 24, fontWeight: 900 }}>Færslur í dag</div>

              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                {todayLogs.length === 0 && <div>Engar færslur í dag.</div>}

                {todayLogs.map((log) => (
                  <div key={log.id} style={{ background: "#f8fafc", borderRadius: 16, padding: 12 }}>
                    {editingLogId === log.id ? (
                      <div style={{ display: "grid", gap: 10 }}>
                        <input
                          style={inputStyle()}
                          value={editForm.customer}
                          onChange={(e) => setEditForm({ ...editForm, customer: e.target.value })}
                        />
                        <input
                          style={inputStyle()}
                          type="date"
                          value={editForm.date}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <input
                            style={inputStyle()}
                            type="time"
                            value={editForm.startTime}
                            onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                          />
                          <input
                            style={inputStyle()}
                            type="time"
                            value={editForm.endTime}
                            onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                          />
                        </div>
                        <input
                          style={inputStyle()}
                          type="number"
                          value={editForm.earned}
                          onChange={(e) => setEditForm({ ...editForm, earned: e.target.value })}
                        />
                        <input
                          style={inputStyle()}
                          value={editForm.note}
                          onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                        />
                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                          <input
                            type="checkbox"
                            checked={editForm.paid}
                            onChange={(e) => setEditForm({ ...editForm, paid: e.target.checked })}
                          />
                          Greitt
                        </label>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button style={buttonStyle(true)} onClick={saveEditLog}>Vista</button>
                          <button style={buttonStyle(false)} onClick={cancelEditLog}>Hætta við</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontWeight: 900 }}>{log.customer}</div>
                            <div style={{ color: "#64748b", marginTop: 4 }}>
                              {log.startTime} - {log.endTime}
                            </div>
                          </div>
                          <div style={{ fontWeight: 900 }}>{kr(log.earned)}</div>
                        </div>

                        <div style={{ marginTop: 8 }}>{log.note}</div>

                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                            <input
                              type="checkbox"
                              checked={log.paid}
                              onChange={() => togglePaid(log.id)}
                            />
                            {log.paid ? "Greitt" : "Ógreitt"}
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

        {screen === "Dagatal" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={cardStyle()}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: 26, fontWeight: 900 }}>Dagatal</div>
                  <div style={{ color: "#64748b", marginTop: 4 }}>
                    Grænt = allt greitt • Rautt = ógreitt • Gult = dagstími án verka
                  </div>
                </div>

                <select
                  style={{ ...inputStyle(), maxWidth: 220 }}
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginTop: 14 }}>
                {WEEK_DAYS.map((day) => (
                  <div key={day} style={{ textAlign: "center", fontWeight: 800, color: "#64748b", padding: "6px 0" }}>
                    {day}
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginTop: 6 }}>
                {monthCells.map((cell, i) => {
                  if (!cell) {
                    return <div key={i} style={{ minHeight: 96, borderRadius: 16, background: "#e2e8f0" }} />;
                  }

                  const dayLogs = logsByDate[cell.dateStr] || [];
                  const dayTotal = dayLogs.reduce((sum, log) => sum + log.earned, 0);
                  const history = dayHistory[cell.dateStr];
                  const bg = getCalendarDayBackground(dayLogs, history);

                  return (
                    <button
                      key={cell.dateStr}
                      onClick={() => setSelectedDate(cell.dateStr)}
                      style={{
                        minHeight: 96,
                        borderRadius: 16,
                        border:
                          selectedDate === cell.dateStr
                            ? "2px solid #2563eb"
                            : cell.dateStr === todayKey
                            ? "2px solid #0f172a"
                            : "1px solid #dbe2ea",
                        background: bg,
                        textAlign: "left",
                        padding: 10,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 22, fontWeight: 900 }}>{cell.day}</div>

                      {dayLogs.length > 0 && (
                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800 }}>{kr(dayTotal)}</div>
                      )}

                      {!!history?.workedMinutes && (
                        <div style={{ marginTop: 4, fontSize: 11, color: "#475569" }}>
                          {minsToText(history.workedMinutes)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={cardStyle()}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 900 }}>{formatLongDate(selectedDate)}</div>
                  <div style={{ color: "#64748b", marginTop: 4 }}>
                    Dagstími: {minsToText(selectedDateDayHistory?.workedMinutes || 0)}
                  </div>
                </div>

                {!!selectedDateDayHistory?.startTime && (
                  <button style={buttonStyle(false)} onClick={() => startEditDayTimer(selectedDate)}>
                    Edita dagstíma
                  </button>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
                  gap: 10,
                  marginTop: 14,
                }}
              >
                <div style={{ background: "#f8fafc", borderRadius: 16, padding: 12 }}>
                  <div style={{ color: "#64748b", fontSize: 13 }}>Tekjur</div>
                  <div style={{ fontWeight: 900, fontSize: 24, marginTop: 6 }}>{kr(selectedDateEarned)}</div>
                </div>

                <div style={{ background: "#f8fafc", borderRadius: 16, padding: 12 }}>
                  <div style={{ color: "#64748b", fontSize: 13 }}>Skráður tími</div>
                  <div style={{ fontWeight: 900, fontSize: 24, marginTop: 6 }}>
                    {minsToText(selectedDateWorkMinutes)}
                  </div>
                </div>

                <div style={{ background: "#f8fafc", borderRadius: 16, padding: 12 }}>
                  <div style={{ color: "#64748b", fontSize: 13 }}>Óskráður tími</div>
                  <div style={{ fontWeight: 900, fontSize: 24, marginTop: 6 }}>
                    {minsToText(unloggedDifference)}
                  </div>
                </div>

                <div style={{ background: "#f8fafc", borderRadius: 16, padding: 12 }}>
                  <div style={{ color: "#64748b", fontSize: 13 }}>Byrjaði</div>
                  <div style={{ fontWeight: 900, fontSize: 24, marginTop: 6 }}>
                    {formatClockTime(selectedDateDayHistory?.startTime)}
                  </div>
                </div>

                <div style={{ background: "#f8fafc", borderRadius: 16, padding: 12 }}>
                  <div style={{ color: "#64748b", fontSize: 13 }}>Endaði</div>
                  <div style={{ fontWeight: 900, fontSize: 24, marginTop: 6 }}>
                    {formatClockTime(selectedDateDayHistory?.endTime)}
                  </div>
                </div>
              </div>

              {editingDayTimer && selectedDateDayHistory && (
                <div style={{ ...cardStyle({ marginTop: 14, background: "#f8fafc" }) }}>
                  <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>Edita dagstíma</div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
                    <input
                      style={inputStyle()}
                      type="time"
                      value={dayTimerEditForm.start}
                      onChange={(e) => setDayTimerEditForm((prev) => ({ ...prev, start: e.target.value }))}
                    />
                    <input
                      style={inputStyle()}
                      type="time"
                      value={dayTimerEditForm.end}
                      onChange={(e) => setDayTimerEditForm((prev) => ({ ...prev, end: e.target.value }))}
                    />
                    <input
                      style={inputStyle()}
                      type="number"
                      value={dayTimerEditForm.pauseMinutes}
                      onChange={(e) => setDayTimerEditForm((prev) => ({ ...prev, pauseMinutes: e.target.value }))}
                      placeholder="Pásur"
                    />
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button style={buttonStyle(true)} onClick={saveDayTimerEdit}>Vista</button>
                    <button style={buttonStyle(false)} onClick={cancelDayTimerEdit}>Hætta við</button>
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                {selectedDateLogs.length === 0 && <div>Engar færslur þennan dag.</div>}

                {selectedDateLogs.map((log) => (
                  <div key={log.id} style={{ background: "#f8fafc", borderRadius: 16, padding: 12 }}>
                    {editingLogId === log.id ? (
                      <div style={{ display: "grid", gap: 10 }}>
                        <input
                          style={inputStyle()}
                          value={editForm.customer}
                          onChange={(e) => setEditForm({ ...editForm, customer: e.target.value })}
                        />
                        <input
                          style={inputStyle()}
                          type="date"
                          value={editForm.date}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <input
                            style={inputStyle()}
                            type="time"
                            value={editForm.startTime}
                            onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                          />
                          <input
                            style={inputStyle()}
                            type="time"
                            value={editForm.endTime}
                            onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                          />
                        </div>
                        <input
                          style={inputStyle()}
                          type="number"
                          value={editForm.earned}
                          onChange={(e) => setEditForm({ ...editForm, earned: e.target.value })}
                        />
                        <input
                          style={inputStyle()}
                          value={editForm.note}
                          onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                        />
                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                          <input
                            type="checkbox"
                            checked={editForm.paid}
                            onChange={(e) => setEditForm({ ...editForm, paid: e.target.checked })}
                          />
                          Greitt
                        </label>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button style={buttonStyle(true)} onClick={saveEditLog}>Vista</button>
                          <button style={buttonStyle(false)} onClick={cancelEditLog}>Hætta við</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontWeight: 900 }}>{log.customer}</div>
                            <div style={{ color: "#64748b", marginTop: 4 }}>
                              {log.startTime} - {log.endTime}
                            </div>
                          </div>
                          <div style={{ fontWeight: 900 }}>{kr(log.earned)}</div>
                        </div>

                        <div style={{ marginTop: 8 }}>{log.note}</div>

                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                            <input
                              type="checkbox"
                              checked={log.paid}
                              onChange={() => togglePaid(log.id)}
                            />
                            {log.paid ? "Greitt" : "Ógreitt"}
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

        {screen === "Tölur" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={cardStyle()}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 26, fontWeight: 900 }}>Tölur</div>
                  <div style={{ color: "#64748b", marginTop: 4 }}>Ár → mánuðir → vikur → dagar</div>
                </div>

                <select
                  style={{ ...inputStyle(), maxWidth: 160 }}
                  value={selectedStatsYear}
                  onChange={(e) => {
                    setSelectedStatsYear(e.target.value);
                    setExpandedStatsMonth(null);
                    setExpandedStatsWeek(null);
                  }}
                >
                  <option value={String(new Date().getFullYear() - 1)}>{new Date().getFullYear() - 1}</option>
                  <option value={String(new Date().getFullYear())}>{new Date().getFullYear()}</option>
                  <option value={String(new Date().getFullYear() + 1)}>{new Date().getFullYear() + 1}</option>
                </select>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                  gap: 10,
                }}
              >
                <div style={{ background: "#dbeafe", borderRadius: 16, padding: 12 }}>
                  <div style={{ color: "#475569", fontSize: 13 }}>Heildartekjur</div>
                  <div style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>{kr(allTotal)}</div>
                </div>

                <div style={{ background: "#ede9fe", borderRadius: 16, padding: 12 }}>
                  <div style={{ color: "#475569", fontSize: 13 }}>Heildartími</div>
                  <div style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>{minsToText(allMinutes)}</div>
                </div>

                <div style={{ background: "#dcfce7", borderRadius: 16, padding: 12 }}>
                  <div style={{ color: "#475569", fontSize: 13 }}>Greitt</div>
                  <div style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>{kr(paidTotal)}</div>
                </div>

                <div style={{ background: "#fee2e2", borderRadius: 16, padding: 12 }}>
                  <div style={{ color: "#475569", fontSize: 13 }}>Ógreitt</div>
                  <div style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>{kr(unpaidTotal)}</div>
                </div>

                <div style={{ background: "#fef3c7", borderRadius: 16, padding: 12 }}>
                  <div style={{ color: "#475569", fontSize: 13 }}>Meðaltal per verk</div>
                  <div style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>{kr(averagePerJob)}</div>
                </div>

                <div style={{ background: "#e0e7ff", borderRadius: 16, padding: 12 }}>
                  <div style={{ color: "#475569", fontSize: 13 }}>Meðal tímakaup</div>
                  <div style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>
                    {allMinutes > 0 ? `${kr(averagePerHour)}/klst` : "0 kr./klst"}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
              <div style={cardStyle()}>
                <div style={{ color: "#64748b", fontSize: 13 }}>Besti dagur</div>
                <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>
                  {bestDay ? formatLongDate(bestDay.date) : "-"}
                </div>
                <div style={{ marginTop: 4 }}>{bestDay ? kr(bestDay.earned) : "0 kr."}</div>
              </div>

              <div style={cardStyle()}>
                <div style={{ color: "#64748b", fontSize: 13 }}>Lengsti dagur</div>
                <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>
                  {longestDay ? formatLongDate(longestDay.date) : "-"}
                </div>
                <div style={{ marginTop: 4 }}>{longestDay ? minsToText(longestDay.minutes) : "0 mín"}</div>
              </div>

              <div style={cardStyle()}>
                <div style={{ color: "#64748b", fontSize: 13 }}>Hæsta staka verk</div>
                <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>
                  {highestJob ? highestJob.customer : "-"}
                </div>
                <div style={{ marginTop: 4 }}>{highestJob ? kr(highestJob.earned) : "0 kr."}</div>
              </div>
            </div>

            <div style={cardStyle()}>
              <div style={{ display: "grid", gap: 10 }}>
                {statsMonths.map((month) => {
                  const isMonthOpen = expandedStatsMonth === month.monthKey;

                  return (
                    <div
                      key={month.monthKey}
                      style={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 18,
                        overflow: "hidden",
                      }}
                    >
                      <button
                        onClick={() => {
                          setExpandedStatsMonth(isMonthOpen ? null : month.monthKey);
                          setExpandedStatsWeek(null);
                        }}
                        style={{
                          width: "100%",
                          border: "none",
                          background: "transparent",
                          textAlign: "left",
                          padding: 14,
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 22, fontWeight: 900 }}>{month.monthLabel}</div>
                            <div style={{ color: "#64748b", marginTop: 4 }}>
                              {month.count} verk • {minsToText(month.minutes)}
                            </div>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 900 }}>{kr(month.earned)}</div>
                            <div style={{ color: "#2563eb", fontWeight: 800, marginTop: 4 }}>
                              {isMonthOpen ? "Loka" : "Opna"}
                            </div>
                          </div>
                        </div>
                      </button>

                      {isMonthOpen && (
                        <div style={{ padding: "0 14px 14px", display: "grid", gap: 10 }}>
                          {month.weeks.length === 0 && (
                            <div style={{ color: "#64748b" }}>Engin verk í þessum mánuði.</div>
                          )}

                          {month.weeks.map((week) => {
                            const isWeekOpen = expandedStatsWeek === week.weekKey;

                            return (
                              <div
                                key={week.weekKey}
                                style={{
                                  background: "#f8fafc",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: 16,
                                  overflow: "hidden",
                                }}
                              >
                                <button
                                  onClick={() => setExpandedStatsWeek(isWeekOpen ? null : week.weekKey)}
                                  style={{
                                    width: "100%",
                                    border: "none",
                                    background: "transparent",
                                    textAlign: "left",
                                    padding: 12,
                                    cursor: "pointer",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      gap: 10,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <div>
                                      <div style={{ fontWeight: 900 }}>{week.weekLabel}</div>
                                      <div style={{ color: "#64748b", marginTop: 4 }}>
                                        {week.count} verk • {minsToText(week.minutes)}
                                      </div>
                                    </div>
                                    <div style={{ fontWeight: 900 }}>{kr(week.earned)}</div>
                                  </div>
                                </button>

                                {isWeekOpen && (
                                  <div style={{ padding: "0 12px 12px", display: "grid", gap: 8 }}>
                                    {week.days.map((day) => (
                                      <button
                                        key={day.date}
                                        onClick={() => {
                                          setSelectedDate(day.date);
                                          setSelectedMonth(day.date.slice(0, 7));
                                          setScreen("Dagatal");
                                        }}
                                        style={{
                                          border: "1px solid #dbe2ea",
                                          background: "#fff",
                                          borderRadius: 14,
                                          padding: 12,
                                          textAlign: "left",
                                          cursor: "pointer",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: 10,
                                            flexWrap: "wrap",
                                          }}
                                        >
                                          <div>
                                            <div style={{ fontWeight: 900 }}>{formatLongDate(day.date)}</div>
                                            <div style={{ color: "#64748b", marginTop: 4 }}>
                                              {day.count} verk • {minsToText(day.minutes)}
                                            </div>
                                          </div>
                                          <div style={{ textAlign: "right" }}>
                                            <div style={{ fontWeight: 900 }}>{kr(day.earned)}</div>
                                            <div style={{ color: "#64748b", marginTop: 4 }}>
                                              Dagstími {minsToText(dayHistory[day.date]?.workedMinutes || 0)}
                                            </div>
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            position: "fixed",
            left: 16,
            right: 16,
            bottom: 16,
            maxWidth: 900,
            margin: "0 auto",
            background: "rgba(255,255,255,0.96)",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            padding: 8,
            boxShadow: "0 16px 36px rgba(15,23,42,0.12)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
            {["Skrá", "Í dag", "Dagatal", "Tölur"].map((item) => (
              <button
                key={item}
                onClick={() => setScreen(item)}
                style={{
                  border: "none",
                  background: screen === item ? "#dbeafe" : "transparent",
                  borderRadius: 18,
                  padding: "10px 6px",
                  cursor: "pointer",
                  fontWeight: screen === item ? 800 : 600,
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
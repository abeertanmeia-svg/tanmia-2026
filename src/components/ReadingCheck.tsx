"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Rec = { id: string; name: string; date: string; words: number; errors: number; wcpm: number };
const KEY = "mm_reading_checks";

function beep(f = 880, d = 0.3) {
  try {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const c = new C();
    const o = c.createOscillator();
    o.frequency.value = f;
    o.connect(c.destination);
    o.start();
    o.stop(c.currentTime + d);
  } catch {}
}

/**
 * One-minute reading fluency check (words correct per minute). Records are kept
 * only in this browser's localStorage — children's names never leave the device.
 */
export function ReadingCheck() {
  const [name, setName] = useState("");
  const [left, setLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [errors, setErrors] = useState(0);
  const [words, setWords] = useState("");
  const [records, setRecords] = useState<Rec[]>([]);
  const [filter, setFilter] = useState("");
  const startedAt = useRef(0);

  useEffect(() => {
    try {
      setRecords(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
    } catch {}
  }, []);
  const persist = (r: Rec[]) => {
    setRecords(r);
    localStorage.setItem(KEY, JSON.stringify(r));
  };

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      const l = Math.max(0, 60 - Math.floor((Date.now() - startedAt.current) / 1000));
      setLeft(l);
      if (l === 0) {
        setRunning(false);
        setFinished(true);
        beep(660);
        setTimeout(() => beep(990), 250);
      }
    }, 250);
    return () => clearInterval(t);
  }, [running]);

  function start() {
    setErrors(0);
    setWords("");
    setFinished(false);
    setLeft(60);
    startedAt.current = Date.now();
    setRunning(true);
    beep(880, 0.15);
  }

  function stopEarly() {
    setRunning(false);
    setFinished(true);
  }

  const elapsed = 60 - left || 60;
  const total = Number(words) || 0;
  const wcpm = Math.max(0, Math.round(((total - errors) * 60) / Math.max(elapsed, 1)));

  function save() {
    if (!name.trim() || !total) return;
    persist([{ id: crypto.randomUUID(), name: name.trim(), date: new Date().toISOString().slice(0, 10), words: total, errors, wcpm }, ...records]);
    setFinished(false);
    setWords("");
    setErrors(0);
    setLeft(60);
  }

  const names = useMemo(() => [...new Set(records.map((r) => r.name))], [records]);
  const shown = records.filter((r) => !filter || r.name === filter);
  const progress = useMemo(() => {
    if (!filter) return null;
    const list = records.filter((r) => r.name === filter).slice().reverse();
    if (list.length < 2) return null;
    return list[list.length - 1].wcpm - list[0].wcpm;
  }, [records, filter]);
  const max = Math.max(10, ...shown.map((r) => r.wcpm));

  return (
    <section className="rounded-3xl border border-rose-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">📖 الفحص السريع للقرائية (دقيقة واحدة)</h2>
      <p className="text-xs text-slate-500">
        يقرأ التلميذ نصاً مناسباً لمدة دقيقة؛ اضغطي «خطأ» عند كل خطأ، ثم اكتبي آخر كلمة وصل إليها. النتائج تُحفظ على هذا الجهاز فقط.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.1fr]">
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            list="reading-names"
            placeholder="اسم التلميذ أو رقمه"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-rose-400"
          />
          <datalist id="reading-names">
            {names.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>

          <div className={`rounded-2xl p-5 text-center text-white ${running ? (left <= 10 ? "bg-rose-600" : "bg-slate-900") : finished ? "bg-emerald-600" : "bg-slate-700"}`}>
            <p className="font-mono text-6xl font-black tabular-nums" dir="ltr">
              00:{String(left).padStart(2, "0")}
            </p>
            <p className="mt-1 text-sm text-white/80">{running ? "التلميذ يقرأ الآن..." : finished ? "انتهى الوقت ✅" : "جاهزة؟"}</p>
          </div>

          {!running && !finished && (
            <button onClick={start} className="w-full rounded-2xl bg-rose-600 py-3 text-base font-bold text-white hover:bg-rose-700">
              ▶ ابدئي الدقيقة
            </button>
          )}
          {running && (
            <div className="grid grid-cols-[2fr_1fr] gap-2">
              <button onClick={() => setErrors((e) => e + 1)} className="rounded-2xl bg-amber-500 py-4 text-lg font-black text-white active:scale-95">
                ✗ خطأ ({errors})
              </button>
              <button onClick={stopEarly} className="rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700">⏹ إنهاء</button>
            </div>
          )}
          {finished && (
            <div className="space-y-2 rounded-2xl bg-slate-50 p-3">
              <label className="block text-xs font-bold text-slate-700">عدد الكلمات المقروءة حتى التوقف</label>
              <input type="number" min={0} value={words} onChange={(e) => setWords(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-center text-lg font-bold" autoFocus />
              <div className="flex items-center justify-between text-sm">
                <span>
                  الأخطاء:{" "}
                  <button onClick={() => setErrors((e) => Math.max(0, e - 1))} className="rounded bg-white px-2">−</button> <b>{errors}</b>{" "}
                  <button onClick={() => setErrors((e) => e + 1)} className="rounded bg-white px-2">+</button>
                </span>
                <span className="font-bold text-emerald-700">{total ? `${wcpm} كلمة صحيحة/دقيقة` : ""}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={save} disabled={!name.trim() || !total} className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                  💾 حفظ النتيجة
                </button>
                <button onClick={start} className="rounded-xl border border-slate-200 px-3 text-sm">↺ إعادة</button>
              </div>
              {!name.trim() && <p className="text-[11px] text-rose-600">اكتبي اسم التلميذ لحفظ النتيجة.</p>}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-800">سجل التقدّم الأسبوعي</p>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">
              <option value="">كل التلاميذ</option>
              {names.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          {progress !== null && (
            <p className={`mt-2 rounded-lg px-3 py-1.5 text-xs font-bold ${progress >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {progress >= 0 ? `📈 تحسّن ${progress} كلمة/دقيقة منذ أول فحص` : `📉 تراجع ${-progress} كلمة/دقيقة — راجعي الأسباب`}
            </p>
          )}
          {shown.length === 0 ? (
            <p className="mt-6 text-center text-xs text-slate-400">لا توجد نتائج محفوظة بعد.</p>
          ) : (
            <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto">
              {shown.map((r) => (
                <li key={r.id} className="flex items-center gap-2 text-xs">
                  <span className="w-16 shrink-0 text-slate-400" dir="ltr">{r.date.slice(5)}</span>
                  {!filter && <span className="w-20 shrink-0 truncate font-semibold">{r.name}</span>}
                  <span className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <span className="block h-full rounded-full bg-rose-400" style={{ width: `${(r.wcpm / max) * 100}%` }} />
                  </span>
                  <span className="w-10 shrink-0 text-left font-bold">{r.wcpm}</span>
                  <button onClick={() => persist(records.filter((x) => x.id !== r.id))} className="text-slate-300 hover:text-rose-500" title="حذف">✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { TeacherTask } from "@/db/schema";
import { useToast } from "./Toast";
import { ReadingCheck } from "./ReadingCheck";

type Phase = { name: string; minutes: number; icon: string };
const PRESETS: Record<string, Phase[]> = {
  "حصة 45 دقيقة": [
    { name: "تمهيد ولقاء صباحي", minutes: 5, icon: "👋" },
    { name: "شرح مباشر", minutes: 10, icon: "🧑‍🏫" },
    { name: "محطة 1", minutes: 7, icon: "1️⃣" },
    { name: "محطة 2", minutes: 7, icon: "2️⃣" },
    { name: "محطة 3", minutes: 7, icon: "3️⃣" },
    { name: "تقويم وختام", minutes: 5, icon: "✅" },
  ],
  "حصة علاجية 30 دقيقة": [
    { name: "لعبة وعي صوتي", minutes: 5, icon: "👂" },
    { name: "تعليم الحرف بالحواس", minutes: 10, icon: "✋" },
    { name: "تدريب في مجموعات", minutes: 10, icon: "👭" },
    { name: "قراءة وتقويم", minutes: 5, icon: "📖" },
  ],
  "قراءة موقوتة": [{ name: "قراءة موقوتة", minutes: 1, icon: "⏱️" }],
};

function beep(freq = 880, dur = 0.25) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch {}
}

function ClassTimer() {
  const [phases, setPhases] = useState<Phase[]>(PRESETS["حصة 45 دقيقة"]);
  const [cur, setCur] = useState(0);
  const [left, setLeft] = useState(phases[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (left > 0 || !running) return;
    beep(660);
    setTimeout(() => beep(990), 250);
    if (cur < phases.length - 1) {
      setCur(cur + 1);
      setLeft(phases[cur + 1].minutes * 60);
    } else {
      setRunning(false);
      setDone(true);
    }
  }, [left, running, cur, phases]);

  function loadPreset(name: string) {
    const p = PRESETS[name];
    setPhases(p);
    reset(p);
  }
  function reset(p = phases) {
    setRunning(false);
    setDone(false);
    setCur(0);
    setLeft(p[0].minutes * 60);
  }
  function jump(i: number) {
    setCur(i);
    setLeft(phases[i].minutes * 60);
    setDone(false);
  }
  function updateMinutes(i: number, m: number) {
    const next = phases.map((p, j) => (j === i ? { ...p, minutes: Math.max(1, Math.min(60, m || 1)) } : p));
    setPhases(next);
    if (i === cur && !running) setLeft(next[i].minutes * 60);
  }

  const total = phases[cur].minutes * 60;
  const pct = Math.max(0, Math.min(100, ((total - left) / total) * 100));
  const mm = String(Math.floor(Math.max(0, left) / 60)).padStart(2, "0");
  const ss = String(Math.max(0, left) % 60).padStart(2, "0");
  const urgent = left <= 30 && running;

  return (
    <section ref={boxRef} className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">⏰ بدء الحصة — مؤقت المراحل</h2>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(PRESETS).map((n) => (
            <button key={n} onClick={() => loadPreset(n)} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-200">
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className={`mt-4 rounded-3xl p-6 text-center transition ${done ? "bg-emerald-600" : urgent ? "bg-rose-600" : "bg-slate-900"} text-white`}>
        {done ? (
          <>
            <p className="text-5xl">🎉</p>
            <p className="mt-2 text-2xl font-extrabold">انتهت الحصة! أحسنتنّ</p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-white/70">
              المرحلة {cur + 1} من {phases.length}
            </p>
            <p className="mt-1 text-2xl font-bold">
              {phases[cur].icon} {phases[cur].name}
            </p>
            <p className="mt-2 font-mono text-7xl font-black tabular-nums md:text-8xl" dir="ltr">
              {mm}:{ss}
            </p>
            <div className="mx-auto mt-4 h-2 max-w-md overflow-hidden rounded-full bg-white/20">
              <div className="h-full bg-white transition-all" style={{ width: `${pct}%` }} />
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button onClick={() => { if (done) reset(); setRunning((r) => !r); }} className="rounded-2xl bg-emerald-600 px-6 py-3 text-base font-bold text-white hover:bg-emerald-700">
          {running ? "⏸ إيقاف مؤقت" : done ? "↺ من جديد" : "▶ ابدئي"}
        </button>
        <button onClick={() => cur < phases.length - 1 && jump(cur + 1)} disabled={cur >= phases.length - 1} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
          ⏭ المرحلة التالية
        </button>
        <button onClick={() => reset()} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">↺ إعادة</button>
        <button onClick={() => boxRef.current?.requestFullscreen?.()} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">⛶ ملء الشاشة</button>
      </div>

      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {phases.map((p, i) => (
          <li key={i} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${i === cur ? "border-emerald-400 bg-emerald-50" : i < cur ? "border-slate-100 text-slate-400" : "border-slate-200"}`}>
            <button onClick={() => jump(i)} className="flex flex-1 items-center gap-2 text-right">
              <span>{i < cur ? "✔️" : p.icon}</span>
              <span className="font-semibold">{p.name}</span>
            </button>
            <input
              type="number"
              min={1}
              max={60}
              value={p.minutes}
              onChange={(e) => updateMinutes(i, Number(e.target.value))}
              className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-center text-xs"
              aria-label="الدقائق"
            />
            <span className="text-xs text-slate-400">د</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RandomPicker() {
  const [names, setNames] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [noRepeat, setNoRepeat] = useState(true);
  const [used, setUsed] = useState<string[]>([]);

  useEffect(() => {
    setNames(localStorage.getItem("mm_picker_names") ?? "");
  }, []);
  useEffect(() => {
    localStorage.setItem("mm_picker_names", names);
  }, [names]);

  const list = names.split(/\n|،|,/).map((n) => n.trim()).filter(Boolean);
  const pool = noRepeat ? list.filter((n) => !used.includes(n)) : list;

  function pick() {
    if (!pool.length) return;
    setSpinning(true);
    let k = 0;
    const t = setInterval(() => {
      setPicked(pool[Math.floor(Math.random() * pool.length)]);
      if (++k > 14) {
        clearInterval(t);
        const final = pool[Math.floor(Math.random() * pool.length)];
        setPicked(final);
        setUsed((u) => [...u, final]);
        setSpinning(false);
        beep(1046, 0.3);
      }
    }, 80);
  }

  return (
    <section className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">🎯 الاختيار العشوائي</h2>
      <p className="text-xs text-slate-500">اكتبي الأسماء (اسم في كل سطر) — تُحفظ على جهازك فقط ولا تُرفع للمنصة.</p>
      <div className={`mt-3 grid min-h-[120px] place-items-center rounded-2xl bg-amber-50 p-4 text-center ${spinning ? "animate-pulse" : ""}`}>
        <p className="text-4xl font-black text-amber-700">{picked ?? "؟"}</p>
      </div>
      <button onClick={pick} disabled={!pool.length || spinning} className="mt-3 w-full rounded-2xl bg-amber-500 px-5 py-3 text-base font-bold text-white hover:bg-amber-600 disabled:opacity-50">
        {pool.length ? "🎲 اختاري متعلمة" : list.length ? "تم اختيار الجميع" : "أضيفي الأسماء أولاً"}
      </button>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={noRepeat} onChange={(e) => setNoRepeat(e.target.checked)} className="accent-amber-500" /> بدون تكرار
        </label>
        <span>
          {used.length}/{list.length}
          {used.length > 0 && (
            <button onClick={() => setUsed([])} className="mr-2 font-semibold text-amber-700 hover:underline">إعادة الكل</button>
          )}
        </span>
      </div>
      <textarea value={names} onChange={(e) => setNames(e.target.value)} rows={5} placeholder={"فاطمة\nمريم\nسارة\nنور"} className="mt-3 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400" />
    </section>
  );
}

function TasksBoard({ loggedIn, initial }: { loggedIn: boolean; initial: TeacherTask[] }) {
  const toast = useToast();
  const [items, setItems] = useState<TeacherTask[]>(initial);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const tmp = useRef(-1);

  async function add(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    const id = tmp.current--;
    const optimistic: TeacherTask = { id, userId: 0, title: t, done: false, dueDate: due || null, createdAt: new Date() };
    setItems((p) => [optimistic, ...p]);
    setTitle("");
    setDue("");
    const res = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: t, dueDate: due }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setItems((p) => p.filter((x) => x.id !== id));
      toast.error(data.error ?? "تعذر الإضافة");
      return;
    }
    setItems((p) => p.map((x) => (x.id === id ? data.item : x)));
  }

  async function toggle(t: TeacherTask) {
    setItems((p) => p.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)));
    const res = await fetch(`/api/tasks/${t.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ done: !t.done }) });
    if (!res.ok) {
      setItems((p) => p.map((x) => (x.id === t.id ? t : x)));
      toast.error("تعذر التحديث");
    }
  }

  async function remove(t: TeacherTask) {
    const snap = items;
    setItems((p) => p.filter((x) => x.id !== t.id));
    const res = await fetch(`/api/tasks/${t.id}`, { method: "DELETE" });
    if (!res.ok) {
      setItems(snap);
      toast.error("تعذر الحذف");
    }
  }

  const open = items.filter((t) => !t.done);
  const finished = items.filter((t) => t.done);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="rounded-3xl border border-indigo-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">✅ مهامي</h2>
        {loggedIn && open.length > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">{open.length} مهمة متبقية</span>}
      </div>
      {!loggedIn ? (
        <div className="mt-4 rounded-2xl bg-indigo-50 p-5 text-center">
          <p className="text-sm font-semibold text-indigo-800">سجّلي دخولك لحفظ مهامك (تحضير، تصحيح، متابعة...) والرجوع إليها من أي جهاز.</p>
          <Link href="/login?next=/dashboard/tools" className="mt-3 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">تسجيل الدخول</Link>
        </div>
      ) : (
        <>
          <form onSubmit={add} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: تجهيز بطاقات حرف الخاء" className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" />
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            <button className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">إضافة</button>
          </form>
          {items.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">لا توجد مهام بعد — أضيفي أول مهمة 📝</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {[...open, ...finished].map((t) => {
                const late = !t.done && t.dueDate && t.dueDate < today;
                return (
                  <li key={t.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${t.done ? "border-slate-100 bg-slate-50" : late ? "border-rose-200 bg-rose-50/40" : "border-slate-200"} ${t.id < 0 ? "opacity-60" : ""}`}>
                    <input type="checkbox" checked={t.done} onChange={() => t.id > 0 && toggle(t)} className="h-5 w-5 accent-indigo-600" />
                    <span className={`flex-1 text-sm ${t.done ? "text-slate-400 line-through" : "text-slate-800"}`}>{t.title}</span>
                    {t.dueDate && <span className={`text-[11px] font-semibold ${late ? "text-rose-600" : "text-slate-400"}`} dir="ltr">{t.dueDate}</span>}
                    {t.id > 0 && <button onClick={() => remove(t)} className="text-xs text-slate-400 hover:text-rose-600" title="حذف">✕</button>}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

export function ClassroomTools({ loggedIn, initialTasks }: { loggedIn: boolean; initialTasks: TeacherTask[] }) {
  return (
    <div className="animate-fade-up space-y-6">
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
        <h1 className="text-2xl font-extrabold text-slate-900">🧰 أدوات الحصة</h1>
        <p className="mt-1 text-sm text-slate-600">مؤقت الحصة المدمجة والمجموعات الدوارة، الفحص السريع للقرائية، اختيار عشوائي عادل للمشاركة، وقائمة مهامك اليومية.</p>
      </div>
      <ClassTimer />
      <ReadingCheck />
      <div className="grid gap-6 lg:grid-cols-2">
        <RandomPicker />
        <TasksBoard loggedIn={loggedIn} initial={initialTasks} />
      </div>
    </div>
  );
}

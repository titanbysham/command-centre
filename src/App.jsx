import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
 
const SUPABASE_URL = "https://ucxbwnjbktfzncqxevpa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjeGJ3bmpia3Rmem5jcXhldnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMjkyNDMsImV4cCI6MjA5NTgwNTI0M30.xm9ARh3MfSnI03s9zyEyWqE0wKCa3iRRqRjCCehxN0c";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DB_ID = 1;
 
function renumberAll(tasks) {
  tasks.forEach((t, i) => {
    t.num = i + 1;
    t.subs.forEach((s, j) => {
      s.num = `${t.num}.${j + 1}`;
      s.ssubs.forEach((ss, k) => { ss.num = `${s.num}.${k + 1}`; });
    });
  });
}
 
function getItem(tasks, id) {
  for (const t of tasks) {
    if (t.id === id) return t;
    for (const s of t.subs) {
      if (s.id === id) return s;
      for (const ss of s.ssubs) if (ss.id === id) return ss;
    }
  }
  return null;
}
 
function countAtt(item) {
  if (!item) return 0;
  const a = item.attachments;
  return a.notes.length + a.links.length + a.images.length;
}
 
function Pill({ status, done }) {
  if (done) return <span style={{ background: "#E1F5EE", color: "#085041", fontSize: 9, padding: "2px 7px", borderRadius: 20, fontWeight: 600 }}>Done</span>;
  if (status === "ongoing") return <span style={{ background: "#E6F1FB", color: "#185FA5", fontSize: 9, padding: "2px 7px", borderRadius: 20, fontWeight: 600 }}>Ongoing</span>;
  if (status === "blocked") return <span style={{ background: "#FCEBEB", color: "#A32D2D", fontSize: 9, padding: "2px 7px", borderRadius: 20, fontWeight: 600 }}>Blocked</span>;
  return null;
}
 
function SwipeRow({ children, onSwipeLeft, onSwipeRight, borderRadius = 12 }) {
  const ref = useRef(null);
  const state = useRef({ startX: 0, startY: 0, dx: 0, active: false, dir: null });
  const THRESHOLD = 55;
  const start = (x, y) => { state.current = { startX: x, startY: y, dx: 0, active: true, dir: null }; if (ref.current) ref.current.style.transition = "none"; };
  const move = (x, y, e) => {
    const s = state.current; if (!s.active) return;
    const dx = x - s.startX, dy = y - s.startY;
    if (!s.dir) { if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return; s.dir = Math.abs(dx) > Math.abs(dy) ? "h" : "v"; }
    if (s.dir === "v") return;
    if (e && e.cancelable) e.preventDefault();
    s.dx = dx; if (ref.current) ref.current.style.transform = `translateX(${dx}px)`;
  };
  const end = () => {
    const s = state.current; s.active = false; if (s.dir !== "h") return;
    if (ref.current) ref.current.style.transition = "transform 0.22s ease";
    if (s.dx < -THRESHOLD) { if (ref.current) ref.current.style.transform = "translateX(-80px)"; onSwipeLeft && onSwipeLeft(() => { if (ref.current) { ref.current.style.transition = "transform 0.22s ease"; ref.current.style.transform = "translateX(0)"; } }); }
    else if (s.dx > THRESHOLD) { if (ref.current) ref.current.style.transform = "translateX(0)"; onSwipeRight && onSwipeRight(); }
    else { if (ref.current) ref.current.style.transform = "translateX(0)"; }
  };
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius }}>
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: "#FCEBEB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#A32D2D", fontWeight: 600, borderRadius }}>🗑️ Delete</div>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#085041", fontWeight: 600, borderRadius }}>✏️ Edit</div>
      <div ref={ref} style={{ position: "relative", zIndex: 1, touchAction: "pan-y" }}
        onMouseDown={e => start(e.clientX, e.clientY)} onMouseMove={e => { if (state.current.active) move(e.clientX, e.clientY, e); }} onMouseUp={end} onMouseLeave={end}
        onTouchStart={e => { if (!e.target.closest("[data-grip]")) start(e.touches[0].clientX, e.touches[0].clientY); }}
        onTouchMove={e => { if (!e.target.closest("[data-grip]")) move(e.touches[0].clientX, e.touches[0].clientY, e); }}
        onTouchEnd={end}>{children}</div>
    </div>
  );
}
 
function DragGrip({ style, onReorder, listRef, idx }) {
  const dragState = useRef(null);
  const cloneRef = useRef(null);
  const onTouchStart = (e) => {
    e.stopPropagation();
    const touch = e.touches[0], items = listRef.current;
    if (!items || !items[idx]) return;
    const el = items[idx], rect = el.getBoundingClientRect();
    dragState.current = { startY: touch.clientY, offsetY: touch.clientY - rect.top, fromIdx: idx, toIdx: idx };
    const clone = el.cloneNode(true);
    clone.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;z-index:9999;pointer-events:none;opacity:0.9;box-shadow:0 8px 32px rgba(0,0,0,0.25);border-radius:10px;`;
    document.body.appendChild(clone); cloneRef.current = clone; el.style.opacity = "0.3";
  };
  const onTouchMove = (e) => {
    e.preventDefault(); e.stopPropagation();
    const ds = dragState.current; if (!ds) return;
    const touch = e.touches[0], y = touch.clientY - ds.offsetY;
    if (cloneRef.current) cloneRef.current.style.top = `${y}px`;
    const items = listRef.current; if (!items) return;
    let newTo = ds.fromIdx;
    items.forEach((el, i) => { if (!el) return; const rect = el.getBoundingClientRect(); if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) newTo = i; });
    if (newTo !== ds.toIdx) {
      items.forEach(el => { if (el) { el.style.borderTop = ""; el.style.borderBottom = ""; } });
      if (items[newTo]) { if (newTo < ds.fromIdx) items[newTo].style.borderTop = "2px solid #185FA5"; else if (newTo > ds.fromIdx) items[newTo].style.borderBottom = "2px solid #185FA5"; }
      ds.toIdx = newTo;
    }
  };
  const onTouchEnd = (e) => {
    e.stopPropagation();
    const ds = dragState.current; if (!ds) return;
    dragState.current = null;
    if (cloneRef.current) { cloneRef.current.remove(); cloneRef.current = null; }
    const items = listRef.current;
    if (items) items.forEach(el => { if (el) { el.style.borderTop = ""; el.style.borderBottom = ""; el.style.opacity = "1"; } });
    if (ds.fromIdx !== ds.toIdx) onReorder(ds.fromIdx, ds.toIdx);
  };
  return <div data-grip="true" style={{ ...style, touchAction: "none", userSelect: "none" }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>⠿</div>;
}
 
function Toast({ toast, onUndo, onDelete }) {
  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 998, opacity: toast.show ? 1 : 0, pointerEvents: toast.show ? "all" : "none", transition: "opacity 0.25s" }} onClick={onUndo} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: toast.show ? "translate(-50%,-50%) scale(1)" : "translate(-50%,-50%) scale(0.85)", opacity: toast.show ? 1 : 0, pointerEvents: toast.show ? "all" : "none", transition: "transform 0.25s, opacity 0.25s", background: "#fff", borderRadius: 20, padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center", boxShadow: "0 12px 48px rgba(0,0,0,0.18)", zIndex: 999, width: "80%", maxWidth: 320, fontFamily: "'DM Sans',sans-serif" }}>
        <span style={{ fontSize: 36 }}>🗑️</span>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#111", lineHeight: 1.5 }}>Delete<br /><span style={{ color: "#A32D2D" }}>"{toast.name}"</span>?</div>
        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <button onClick={onUndo} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: "#E1F5EE", color: "#085041", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>↩ Undo</button>
          <button onClick={onDelete} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: "#FCEBEB", color: "#A32D2D", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>🗑️ Delete</button>
        </div>
      </div>
    </>
  );
}
 
function Modal({ show, title, value, onChange, onConfirm, onCancel, confirmLabel, confirmColor, placeholder }) {
  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 998, opacity: show ? 1 : 0, pointerEvents: show ? "all" : "none", transition: "opacity 0.2s" }} onClick={onCancel} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: show ? "translate(-50%,-50%) scale(1)" : "translate(-50%,-50%) scale(0.85)", opacity: show ? 1 : 0, pointerEvents: show ? "all" : "none", transition: "transform 0.25s, opacity 0.25s", background: "#fff", borderRadius: 20, padding: "24px 20px", width: "85%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 12px 48px rgba(0,0,0,0.18)", zIndex: 999, fontFamily: "'DM Sans',sans-serif" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>{title}</span>
          <button onClick={onCancel} style={{ width: 30, height: 30, borderRadius: "50%", border: "0.5px solid #eee", background: "#f5f5f5", cursor: "pointer", fontSize: 16, color: "#888" }}>✕</button>
        </div>
        <textarea autoFocus={show} value={value} onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onConfirm(); } if (e.key === "Escape") onCancel(); }}
          placeholder={placeholder} style={{ width: "100%", background: "#f9f9f9", border: "0.5px solid #ddd", borderRadius: 10, padding: "12px 14px", fontSize: 15, color: "#111", fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "none", height: 100, lineHeight: 1.6, boxSizing: "border-box" }} />
        <button onClick={onConfirm} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: value.trim() ? confirmColor : "#ddd", color: value.trim() ? "#fff" : "#aaa", fontSize: 15, fontWeight: 700, cursor: value.trim() ? "pointer" : "default", fontFamily: "'DM Sans',sans-serif", transition: "background .2s" }}>{confirmLabel}</button>
      </div>
    </>
  );
}
 
function BulbBtn({ count, onClick, size }) {
  return (
    <button onClick={onClick} style={{ width: size, height: size, borderRadius: "50%", border: count > 0 ? "0.5px solid #E5A832" : "0.5px solid #ddd", background: count > 0 ? "#FAEEDA" : "#f5f5f5", fontSize: size * 0.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 6, position: "relative" }}>
      💡{count > 0 && <span style={{ position: "absolute", top: -3, right: -3, width: 13, height: 13, borderRadius: "50%", background: "#BA7517", color: "#fff", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, border: "1.5px solid #fff" }}>{count}</span>}
    </button>
  );
}
 
function SheetOption({ icon, title, sub, color, onClick }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, border: "0.5px solid #eee", background: "#fafafa", cursor: "pointer" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{title}</div><div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{sub}</div></div>
      <span style={{ color: "#ccc" }}>›</span>
    </div>
  );
}
 
export default function App() {
  // ─── ALL HOOKS FIRST ───────────────────────────────────────────────────────
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [urlInput, setUrlInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [images, setImages] = useState([]);
  const [showPicOptions, setShowPicOptions] = useState(false);
  const [toast, setToast] = useState({ show: false, name: "", id: null, resetFn: null });
  const [addModal, setAddModal] = useState({ show: false, type: "task", taskId: null, subId: null, value: "", url: "", images: [], showPicOpts: false });
  const [editModal, setEditModal] = useState({ show: false, id: null, value: "" });
  const [showSettings, setShowSettings] = useState(false);
  const [fullImg, setFullImg] = useState(null);
  const [logbook, setLogbook] = useState([]);
  const [logView, setLogView] = useState(null);
  const [loading, setLoading] = useState(true);
  const toastTimer = useRef(null);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const modalCameraRef = useRef(null);
  const modalGalleryRef = useRef(null);
  const taskListRef = useRef([]);
  const subListRefs = useRef({});
  const ssubListRefs = useRef({});
 
  // Temporarily skip login - load tasks directly
  useEffect(() => {
    setAuthLoading(false);
    setSession({ user: { email: "temp" } });
  }, []);
 
  // Load tasks from Supabase
  useEffect(() => {
    if (!session) return;
    const load = async () => {
      // First load from localStorage instantly
      try {
        const local = localStorage.getItem("command_centre_tasks");
        if (local) { const parsed = JSON.parse(local); if (parsed.length > 0) setTasks(parsed); }
      } catch (e) {}
      // Then try Supabase
      try {
        const { data } = await supabase.from("tasks").select("data").eq("id", DB_ID).single();
        if (data && data.data) {
          const parsed = JSON.parse(data.data);
          if (parsed.length > 0) { setTasks(parsed); localStorage.setItem("command_centre_tasks", data.data); }
        }
      } catch (e) { console.log("Offline or no data in Supabase"); }
      setLoading(false);
    };
    load();
  }, [session]);
 
  // Load logbook
  useEffect(() => {
    if (!session) return;
    const loadLogbook = async () => {
      try {
        const { data } = await supabase.from("tasks").select("data").eq("id", 2).single();
        if (data && data.data) setLogbook(JSON.parse(data.data));
      } catch (e) { try { const l = localStorage.getItem("command_centre_logbook"); if (l) setLogbook(JSON.parse(l)); } catch (e2) {} }
    };
    loadLogbook();
  }, [session]);
 
  // Save tasks - only when tasks actually have data
  useEffect(() => {
    if (loading || !session || tasks.length === 0) return;
    const tasksJson = JSON.stringify(tasks);
    localStorage.setItem("command_centre_tasks", tasksJson);
    supabase.from("tasks").upsert({ id: DB_ID, data: tasksJson }).catch(() => {});
  }, [tasks]);
 
  // ─── HELPERS ───────────────────────────────────────────────────────────────
  const update = fn => setTasks(prev => { const next = JSON.parse(JSON.stringify(prev)); fn(next); return next; });
 
  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) { setLoginError("Please enter email and password"); return; }
    setLoginLoading(true); setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) setLoginError("Wrong email or password. Try again!");
    setLoginLoading(false);
  };
 
  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) { await supabase.auth.signOut(); setSession(null); }
  };
 
  const saveToLogbook = async () => {
    const entry = { id: Date.now(), date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), tasks: JSON.parse(JSON.stringify(tasks)) };
    const updated = [entry, ...logbook].slice(0, 10);
    setLogbook(updated);
    localStorage.setItem("command_centre_logbook", JSON.stringify(updated));
    try { await supabase.from("tasks").upsert({ id: 2, data: JSON.stringify(updated) }); await supabase.from("tasks").upsert({ id: DB_ID, data: JSON.stringify(tasks) }); alert("✅ Saved to Logbook!"); }
    catch (e) { alert("✅ Saved locally!"); }
  };
 
  const getSubListRef = (taskId) => { if (!subListRefs.current[taskId]) subListRefs.current[taskId] = []; return subListRefs.current[taskId]; };
  const getSSubListRef = (subId) => { if (!ssubListRefs.current[subId]) ssubListRefs.current[subId] = []; return ssubListRefs.current[subId]; };
 
  const toggleTask = id => update(t => { const x = t.find(x => x.id === id); if (x) x.open = !x.open; });
  const toggleSub = (tid, sid) => update(t => { const s = t.find(x => x.id === tid)?.subs.find(x => x.id === sid); if (s) s.open = !s.open; });
  const toggleDone = (type, tid, sid, ssid) => update(t => {
    const task = t.find(x => x.id === tid);
    if (type === "task" && task) task.done = !task.done;
    else if (type === "sub") { const s = task?.subs.find(x => x.id === sid); if (s) s.done = !s.done; }
    else if (type === "ssub") { const ss = task?.subs.find(x => x.id === sid)?.ssubs.find(x => x.id === ssid); if (ss) ss.done = !ss.done; }
  });
 
  const reorderTasks = (from, to) => update(t => { const [m] = t.splice(from, 1); t.splice(to, 0, m); renumberAll(t); });
  const reorderSubs = (taskId, from, to) => update(t => { const task = t.find(x => x.id === taskId); if (!task) return; const [m] = task.subs.splice(from, 1); task.subs.splice(to, 0, m); renumberAll(t); });
  const reorderSSubs = (taskId, subId, from, to) => update(t => { const sub = t.find(x => x.id === taskId)?.subs.find(x => x.id === subId); if (!sub) return; const [m] = sub.ssubs.splice(from, 1); sub.ssubs.splice(to, 0, m); renumberAll(t); });
 
  const openAddModal = (type, taskId = null, subId = null) => {
    if (type === "sub") update(t => { const task = t.find(x => x.id === taskId); if (task) task.open = true; });
    if (type === "ssub") update(t => { const task = t.find(x => x.id === taskId); if (task) task.open = true; const sub = task?.subs.find(x => x.id === subId); if (sub) sub.open = true; });
    setAddModal({ show: true, type, taskId, subId, value: "", url: "", images: [], showPicOpts: false });
  };
 
  const confirmAdd = () => {
    const name = addModal.value.trim(); if (!name) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    update(t => {
      const att = { notes: [], links: addModal.url.trim() ? [{ url: addModal.url.trim(), time: now }] : [], images: addModal.images };
      if (addModal.type === "task") t.push({ id: "t" + Date.now(), num: t.length + 1, name, status: "", done: false, open: false, attachments: att, subs: [] });
      else if (addModal.type === "sub") { const task = t.find(x => x.id === addModal.taskId); if (task) { task.subs.push({ id: "s" + Date.now(), num: `${task.num}.${task.subs.length + 1}`, name, done: false, open: false, attachments: att, ssubs: [] }); task.open = true; } }
      else if (addModal.type === "ssub") { const sub = t.find(x => x.id === addModal.taskId)?.subs.find(x => x.id === addModal.subId); if (sub) sub.ssubs.push({ id: "ss" + Date.now(), num: `${sub.num}.${sub.ssubs.length + 1}`, name, done: false, attachments: att }); }
    });
    setAddModal(m => ({ ...m, show: false, value: "", url: "", images: [], showPicOpts: false }));
  };
 
  const openEditModal = (id, name) => setEditModal({ show: true, id, value: name });
  const confirmEdit = () => {
    const name = editModal.value.trim(); if (!name) return;
    update(t => { const item = getItem(t, editModal.id); if (item) item.name = name; });
    setEditModal({ show: false, id: null, value: "" });
  };
 
  const handleSwipeLeft = (id, name, resetFn) => {
    clearTimeout(toastTimer.current);
    setToast(prev => { if (prev.resetFn) prev.resetFn(); return { show: true, name, id, resetFn }; });
    toastTimer.current = setTimeout(() => setToast(t => { if (t.resetFn) t.resetFn(); return { ...t, show: false, resetFn: null }; }), 4000);
  };
  const handleUndo = () => { clearTimeout(toastTimer.current); setToast(t => { if (t.resetFn) t.resetFn(); return { show: false, name: "", id: null, resetFn: null }; }); };
  const handleDelete = () => {
    clearTimeout(toastTimer.current);
    const id = toast.id;
    setToast({ show: false, name: "", id: null, resetFn: null });
    update(t => {
      const idx = t.findIndex(x => x.id === id);
      if (idx !== -1) { t.splice(idx, 1); renumberAll(t); return; }
      for (const task of t) {
        const si = task.subs.findIndex(s => s.id === id);
        if (si !== -1) { task.subs.splice(si, 1); renumberAll(t); return; }
        for (const sub of task.subs) { const ssi = sub.ssubs.findIndex(ss => ss.id === id); if (ssi !== -1) { sub.ssubs.splice(ssi, 1); renumberAll(t); return; } }
      }
    });
  };
 
  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 1200; let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX; } } else { if (h > MAX) { w = w * MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        callback(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };
 
  const handleImageFiles = files => { Array.from(files).forEach(f => { compressImage(f, src => setImages(prev => [...prev, { src }])); }); };
  const handleModalImageFiles = files => { Array.from(files).forEach(f => { compressImage(f, src => setAddModal(m => ({ ...m, images: [...m.images, { src }] }))); }); };
 
  const saveAttachments = itemId => {
    update(t => {
      const item = getItem(t, itemId); if (!item) return;
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (urlInput.trim()) item.attachments.links.push({ url: urlInput.trim(), time: now });
      if (noteInput.trim()) item.attachments.notes.push({ text: noteInput.trim(), time: now });
      images.forEach(img => item.attachments.images.push(img));
    });
    setUrlInput(""); setNoteInput(""); setImages([]); setShowPicOptions(false);
    setSheet(null);
    setTimeout(() => setSheet({ itemId, view: "view" }), 50);
  };
 
  const deleteAtt = (itemId, type, idx) => update(t => { const item = getItem(t, itemId); if (item) item.attachments[type].splice(idx, 1); });
 
  // ─── EARLY RETURNS (after all hooks) ───────────────────────────────────────
  if (authLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f5f5f5", flexDirection: "column", gap: 16, fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ fontSize: 40 }}>⚡</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>Loading...</div>
    </div>
  );
 
  if (!session) return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: "36px 24px", width: "100%", maxWidth: 360, boxShadow: "0 12px 48px rgba(0,0,0,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>Command Centre</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 6 }}>Sign in to access your tasks</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Email</div>
            <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="your@email.com" type="email"
              style={{ width: "100%", background: "#f9f9f9", border: "0.5px solid #ddd", borderRadius: 10, padding: "12px 14px", fontSize: 15, color: "#111", fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Password</div>
            <div style={{ position: "relative" }}>
              <input value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Enter your password" type={showPassword ? "text" : "password"}
                onKeyDown={e => { if (e.key === "Enter") handleLogin(); }}
                style={{ width: "100%", background: "#f9f9f9", border: "0.5px solid #ddd", borderRadius: 10, padding: "12px 44px 12px 14px", fontSize: 15, color: "#111", fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box" }} />
              <button onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#aaa" }}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          {loginError && <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500 }}>⚠️ {loginError}</div>}
          <button onClick={handleLogin} disabled={loginLoading} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: "#185FA5", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", marginTop: 4, opacity: loginLoading ? 0.7 : 1 }}>
            {loginLoading ? "Signing in..." : "🔐 Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
 
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f5f5f5", flexDirection: "column", gap: 16, fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ fontSize: 40 }}>⚡</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>Loading your tasks...</div>
      <div style={{ fontSize: 13, color: "#aaa" }}>Syncing from database</div>
    </div>
  );
 
  // ─── MAIN RENDER ───────────────────────────────────────────────────────────
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.done).length;
  const pct = totalTasks ? Math.round(doneTasks / totalTasks * 100) : 0;
  const sheetItem = sheet ? getItem(tasks, sheet.itemId) : null;
  const attCount = sheetItem ? countAtt(sheetItem) : 0;
  const S = styles;
 
  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <div><div style={S.topTitle}>Today's Tasks</div><div style={S.topSub}>Command Centre</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={S.iconBtn}>🔍</button>
          <button style={S.iconBtn} onClick={() => setShowSettings(true)}>⚙️</button>
        </div>
      </div>
 
      <div style={S.statsRow}>
        <div style={S.statCard}><div style={{ ...S.statNum, color: "#185FA5" }}>{totalTasks}</div><div style={S.statLabel}>Total</div></div>
        <div style={S.statCard}><div style={{ ...S.statNum, color: "#1D9E75" }}>{doneTasks}</div><div style={S.statLabel}>Done</div></div>
        <div style={S.statCard}><div style={{ ...S.statNum, color: "#BA7517" }}>{pct}%</div><div style={S.statLabel}>Progress</div></div>
      </div>
 
      <div style={S.sectionHeader}>
        <span style={S.sectionLabel}>TASKS</span>
        <button style={S.addHeaderBtn} onClick={() => openAddModal("task")}>+ Add task</button>
      </div>
 
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {tasks.map((task, ti) => {
          const hasSubs = task.subs.length > 0;
          const doneSubs = task.subs.filter(s => s.done).length;
          const subListRef = { current: getSubListRef(task.id) };
          return (
            <div key={task.id} ref={el => taskListRef.current[ti] = el} style={{ borderRadius: 12, overflow: "hidden", border: "0.5px solid #eee" }}>
              <SwipeRow borderRadius={0} onSwipeLeft={resetFn => handleSwipeLeft(task.id, task.name, resetFn)} onSwipeRight={() => openEditModal(task.id, task.name)}>
                <div style={{ background: "#fff" }}>
                  <div style={S.taskRow}>
                    <DragGrip style={S.grip} listRef={taskListRef} idx={ti} onReorder={reorderTasks} />
                    <div style={S.numCol}><span style={S.numText}>{task.num}</span></div>
                    <button style={S.expandBtn} onClick={() => toggleTask(task.id)}>{task.open ? "−" : "+"}</button>
                    <div style={{ ...S.checkCircle, ...(task.done ? S.checkDone : {}) }} onClick={() => toggleDone("task", task.id)} />
                    <div style={S.taskInfo} onClick={() => toggleTask(task.id)}>
                      <div style={{ ...S.taskName, ...(task.done ? S.taskNameDone : {}) }}>{task.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                        <Pill status={task.status} done={task.done} />
                        {hasSubs && <span style={S.subCount}>{doneSubs}/{task.subs.length} subtasks</span>}
                      </div>
                      {hasSubs && <div style={S.progressBg}><div style={{ ...S.progressFill, width: `${Math.round(doneSubs / task.subs.length * 100)}%` }} /></div>}
                    </div>
                    <BulbBtn count={countAtt(task)} onClick={() => setSheet({ itemId: task.id, view: "menu" })} size={28} />
                  </div>
                </div>
              </SwipeRow>
              {task.open && (
                <div style={{ ...S.subList, background: "#fff" }}>
                  {task.subs.map((sub, si) => {
                    const ssubListRef = { current: getSSubListRef(sub.id) };
                    return (
                      <div key={sub.id} ref={el => { const arr = getSubListRef(task.id); arr[si] = el; }}>
                        <SwipeRow borderRadius={8} onSwipeLeft={resetFn => handleSwipeLeft(sub.id, sub.name, resetFn)} onSwipeRight={() => openEditModal(sub.id, sub.name)}>
                          <div style={S.subRow}>
                            <DragGrip style={S.subGrip} listRef={subListRef} idx={si} onReorder={(f, t) => reorderSubs(task.id, f, t)} />
                            <div style={S.subNumCol}><span style={S.subNumText}>{sub.num}</span></div>
                            <button style={S.subExpandBtn} onClick={() => toggleSub(task.id, sub.id)}>{sub.open ? "−" : "+"}</button>
                            <div style={{ ...S.subCheck, ...(sub.done ? S.checkDone : {}) }} onClick={() => toggleDone("sub", task.id, sub.id)} />
                            <div style={S.subInfo} onClick={() => toggleSub(task.id, sub.id)}><span style={{ ...S.subName, ...(sub.done ? S.taskNameDone : {}) }}>{sub.name}</span></div>
                            <BulbBtn count={countAtt(sub)} onClick={() => setSheet({ itemId: sub.id, view: "menu" })} size={24} />
                          </div>
                        </SwipeRow>
                        {sub.open && (
                          <div style={S.ssubList}>
                            {sub.ssubs.map((ss, ssi) => (
                              <div key={ss.id} ref={el => { const arr = getSSubListRef(sub.id); arr[ssi] = el; }}>
                                <SwipeRow borderRadius={8} onSwipeLeft={resetFn => handleSwipeLeft(ss.id, ss.name, resetFn)} onSwipeRight={() => openEditModal(ss.id, ss.name)}>
                                  <div style={S.ssubRow}>
                                    <DragGrip style={S.ssubGrip} listRef={ssubListRef} idx={ssi} onReorder={(f, t) => reorderSSubs(task.id, sub.id, f, t)} />
                                    <div style={S.ssubNumCol}><span style={S.ssubNumText}>{ss.num}</span></div>
                                    <div style={{ ...S.ssubCheck, ...(ss.done ? S.checkDone : {}) }} onClick={() => toggleDone("ssub", task.id, sub.id, ss.id)} />
                                    <span style={{ ...S.ssubName, ...(ss.done ? S.taskNameDone : {}) }}>{ss.name}</span>
                                    <BulbBtn count={countAtt(ss)} onClick={() => setSheet({ itemId: ss.id, view: "menu" })} size={20} />
                                  </div>
                                </SwipeRow>
                              </div>
                            ))}
                            <button style={S.addRowBtn} onClick={() => openAddModal("ssub", task.id, sub.id)}>+ Add sub-subtask</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button style={{ ...S.addRowBtn, margin: "0 10px 8px 52px", width: "calc(100% - 62px)" }} onClick={() => openAddModal("sub", task.id)}>+ Add subtask</button>
                </div>
              )}
            </div>
          );
        })}
        <button style={S.mainAddBtn} onClick={() => openAddModal("task")}>+ Add task</button>
      </div>
 
      {/* BULB SHEET */}
      {sheet && (
        <div style={S.overlay} onClick={() => { setSheet(null); setShowPicOptions(false); setImages([]); }}>
          <div style={S.sheetBox} onClick={e => e.stopPropagation()}>
            <div style={S.sheetHandle} />
            <div style={S.sheetHeader}>
              <span style={S.sheetTitle}>💡 {sheetItem?.name}</span>
              <button style={S.sheetClose} onClick={() => { setSheet(null); setShowPicOptions(false); setImages([]); }}>✕</button>
            </div>
            <div style={{ padding: "0 16px 28px", overflowY: "auto" }}>
              {sheet.view === "menu" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
                  <SheetOption icon="➕" title="Add" sub="Add a picture, URL link or note" color="#E6F1FB" onClick={() => setSheet({ ...sheet, view: "add" })} />
                  <SheetOption icon="👁️" title="View all" sub={attCount > 0 ? `${attCount} item(s) attached` : "Nothing added yet"} color="#FAEEDA" onClick={() => setSheet({ ...sheet, view: "view" })} />
                </div>
              )}
              {sheet.view === "add" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 8 }}>
                  <button style={S.backBtn} onClick={() => { setSheet({ ...sheet, view: "menu" }); setShowPicOptions(false); setImages([]); }}>← Back</button>
                  <div>
                    <button onClick={() => setShowPicOptions(!showPicOptions)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "0.5px dashed #ddd", background: "#f9f9f9", cursor: "pointer", fontSize: 13, color: "#185FA5", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      📷 Add Picture {showPicOptions ? "▲" : "▼"}
                    </button>
                    {showPicOptions && (
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <div onClick={() => cameraRef.current.click()} style={{ flex: 1, background: "#E6F1FB", border: "0.5px solid #93C5FD", borderRadius: 12, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                          <span style={{ fontSize: 26 }}>📸</span><span style={{ fontSize: 12, fontWeight: 600, color: "#185FA5" }}>Take Photo</span>
                        </div>
                        <div onClick={() => galleryRef.current.click()} style={{ flex: 1, background: "#F3EEFF", border: "0.5px solid #C4B5FD", borderRadius: 12, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                          <span style={{ fontSize: 26 }}>🖼️</span><span style={{ fontSize: 12, fontWeight: 600, color: "#7C3AED" }}>Gallery</span>
                        </div>
                      </div>
                    )}
                    <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => handleImageFiles(e.target.files)} />
                    <input ref={galleryRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleImageFiles(e.target.files)} />
                    {images.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6, marginTop: 8 }}>
                        {images.map((img, i) => (
                          <div key={i} style={{ position: "relative" }}>
                            <img src={img.src} onClick={() => setFullImg(img.src)} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, cursor: "pointer" }} />
                            <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: 3, right: 3, width: 18, height: 18, borderRadius: "50%", background: "#FCEBEB", border: "none", cursor: "pointer", fontSize: 10, color: "#A32D2D" }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div><div style={S.formLabel}>🔗 URL Link</div><input style={S.formInput} value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..." /></div>
                  <div><div style={S.formLabel}>📝 Notes</div><textarea style={{ ...S.formInput, height: 80, resize: "none" }} value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="Write your note here..." /></div>
                  <button style={S.saveBtn} onClick={() => saveAttachments(sheet.itemId)}>✓ Save</button>
                </div>
              )}
              {sheet.view === "view" && (
                <div style={{ paddingTop: 8 }}>
                  <button style={S.backBtn} onClick={() => setSheet({ ...sheet, view: "menu" })}>← Back</button>
                  {attCount === 0 ? <div style={{ textAlign: "center", padding: "28px 0", color: "#999", fontSize: 13 }}>Nothing added yet.</div> : <>
                    {sheetItem.attachments.images?.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={S.viewSecTitle}>📷 Pictures</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6 }}>
                          {sheetItem.attachments.images.map((img, i) => (
                            <div key={i} style={{ position: "relative" }}>
                              <img src={img.src} onClick={() => setFullImg(img.src)} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, cursor: "pointer" }} />
                              <button style={S.delBtn} onClick={() => deleteAtt(sheet.itemId, "images", i)}>✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {sheetItem.attachments.links.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={S.viewSecTitle}>🔗 Links</div>
                        {sheetItem.attachments.links.map((l, i) => (
                          <div key={i} style={{ position: "relative", marginBottom: 6 }}>
                            <a href={l.url} target="_blank" rel="noreferrer" style={S.linkCard}>{l.url}</a>
                            <button style={S.delBtn} onClick={() => deleteAtt(sheet.itemId, "links", i)}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {sheetItem.attachments.notes.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={S.viewSecTitle}>📝 Notes</div>
                        {sheetItem.attachments.notes.map((n, i) => (
                          <div key={i} style={{ ...S.noteCard, position: "relative", marginBottom: 6 }}>
                            {n.text}<div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>{n.time}</div>
                            <button style={S.delBtn} onClick={() => deleteAtt(sheet.itemId, "notes", i)}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
 
      {/* SETTINGS */}
      {showSettings && !logView && (
        <div style={S.overlay} onClick={() => setShowSettings(false)}>
          <div style={S.sheetBox} onClick={e => e.stopPropagation()}>
            <div style={S.sheetHandle} />
            <div style={S.sheetHeader}>
              <span style={S.sheetTitle}>⚙️ Settings</span>
              <button style={S.sheetClose} onClick={() => setShowSettings(false)}>✕</button>
            </div>
            <div style={{ padding: "0 16px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div onClick={saveToLogbook} style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, background: "#E6F1FB", border: "0.5px solid #93C5FD", cursor: "pointer" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#185FA5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>💾</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: "#185FA5" }}>Save Current Work</div><div style={{ fontSize: 11, color: "#5B8BC9", marginTop: 2 }}>Save all tasks to Logbook</div></div>
              </div>
              <div onClick={() => setLogView("list")} style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, background: "#FAEEDA", border: "0.5px solid #E5A832", cursor: "pointer" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#BA7517", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📖</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: "#BA7517" }}>Logbook</div><div style={{ fontSize: 11, color: "#B07A2A", marginTop: 2 }}>{logbook.length > 0 ? `${logbook.length} save(s) stored` : "No saves yet"}</div></div>
                <span style={{ color: "#ccc" }}>›</span>
              </div>
              <div onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, background: "#FCEBEB", border: "0.5px solid #FECACA", cursor: "pointer" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#A32D2D", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🚪</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: "#A32D2D" }}>Log Out</div><div style={{ fontSize: 11, color: "#C87272", marginTop: 2 }}>Sign out of your account</div></div>
              </div>
            </div>
          </div>
        </div>
      )}
 
      {/* LOGBOOK LIST */}
      {showSettings && logView === "list" && (
        <div style={S.overlay} onClick={() => { setShowSettings(false); setLogView(null); }}>
          <div style={S.sheetBox} onClick={e => e.stopPropagation()}>
            <div style={S.sheetHandle} />
            <div style={S.sheetHeader}>
              <span style={S.sheetTitle}>📖 Logbook</span>
              <button style={S.sheetClose} onClick={() => { setShowSettings(false); setLogView(null); }}>✕</button>
            </div>
            <div style={{ padding: "0 16px 32px", overflowY: "auto" }}>
              <button style={S.backBtn} onClick={() => setLogView(null)}>← Back</button>
              {logbook.length === 0
                ? <div style={{ textAlign: "center", padding: "32px 0", color: "#999", fontSize: 13 }}>No saves yet. Press 💾 Save to create your first backup!</div>
                : logbook.map((entry, i) => (
                  <div key={entry.id} onClick={() => setLogView(entry)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 12px", borderRadius: 12, background: i === 0 ? "#E6F1FB" : "#f9f9f9", border: `0.5px solid ${i === 0 ? "#93C5FD" : "#eee"}`, marginBottom: 8, cursor: "pointer" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>📅 {entry.date} · {entry.time}</div>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>{entry.tasks.length} task(s) {i === 0 ? "· Latest" : ""}</div>
                    </div>
                    <span style={{ color: "#ccc" }}>›</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
 
      {/* LOGBOOK ENTRY */}
      {showSettings && logView && logView !== "list" && (
        <div style={S.overlay} onClick={() => { setShowSettings(false); setLogView(null); }}>
          <div style={S.sheetBox} onClick={e => e.stopPropagation()}>
            <div style={S.sheetHandle} />
            <div style={S.sheetHeader}>
              <span style={S.sheetTitle}>📅 {logView.date} · {logView.time}</span>
              <button style={S.sheetClose} onClick={() => { setShowSettings(false); setLogView(null); }}>✕</button>
            </div>
            <div style={{ padding: "0 16px 32px", overflowY: "auto" }}>
              <button style={S.backBtn} onClick={() => setLogView("list")}>← Back</button>
              <div onClick={() => {
                if (window.confirm(`Restore save from ${logView.date} at ${logView.time}? Your current tasks will be replaced.`)) {
                  const restored = JSON.parse(JSON.stringify(logView.tasks));
                  setTasks(restored);
                  localStorage.setItem("command_centre_tasks", JSON.stringify(restored));
                  supabase.from("tasks").upsert({ id: DB_ID, data: JSON.stringify(restored) }).catch(() => {});
                  setShowSettings(false); setLogView(null);
                  alert("✅ Restored successfully!");
                }
              }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", borderRadius: 12, background: "#E1F5EE", border: "0.5px solid #1D9E75", cursor: "pointer", marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>♻️</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#085041" }}>Restore This Version</span>
              </div>
              <div style={{ fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{logView.tasks.length} task(s)</div>
              {logView.tasks.map((task, i) => (
                <div key={i} style={{ marginBottom: 10, background: "#f9f9f9", borderRadius: 10, padding: "10px 12px", border: "0.5px solid #eee" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{task.num}. {task.name}</div>
                  {task.subs.map((sub, j) => (
                    <div key={j} style={{ marginTop: 6, paddingLeft: 12, borderLeft: "2px solid #ddd" }}>
                      <div style={{ fontSize: 12, color: "#555" }}>{sub.num} {sub.name}</div>
                      {sub.ssubs.map((ss, k) => (
                        <div key={k} style={{ paddingLeft: 12, borderLeft: "2px solid #eee", marginTop: 3 }}>
                          <div style={{ fontSize: 11, color: "#888" }}>{ss.num} {ss.name}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                  {countAtt(task) > 0 && <div style={{ fontSize: 10, color: "#BA7517", marginTop: 6 }}>💡 {countAtt(task)} attachment(s)</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
 
      <Toast toast={toast} onUndo={handleUndo} onDelete={handleDelete} />
 
      {fullImg && (
        <div onClick={() => setFullImg(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <button onClick={() => setFullImg(null)} style={{ position: "absolute", top: 20, right: 20, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", fontSize: 20, color: "#fff" }}>✕</button>
          <img src={fullImg} style={{ maxWidth: "95vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 12 }} />
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 16 }}>Tap anywhere to close</div>
        </div>
      )}
 
      {addModal.show && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 998 }} onClick={() => setAddModal(m => ({ ...m, show: false }))}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", width: "88%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 12px 48px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>{addModal.type === "task" ? "➕ Add Task" : addModal.type === "sub" ? "➕ Add Subtask" : "➕ Add Sub-subtask"}</span>
              <button onClick={() => setAddModal(m => ({ ...m, show: false }))} style={{ width: 30, height: 30, borderRadius: "50%", border: "0.5px solid #eee", background: "#f5f5f5", cursor: "pointer", fontSize: 16, color: "#888" }}>✕</button>
            </div>
            <textarea autoFocus value={addModal.value} onChange={e => setAddModal(m => ({ ...m, value: e.target.value }))}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); confirmAdd(); } if (e.key === "Escape") setAddModal(m => ({ ...m, show: false })); }}
              placeholder={addModal.type === "task" ? "What do you need to do?" : addModal.type === "sub" ? "What is the subtask?" : "What is the sub-subtask?"}
              style={{ width: "100%", background: "#f9f9f9", border: "0.5px solid #ddd", borderRadius: 10, padding: "12px 14px", fontSize: 15, color: "#111", fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "none", height: 80, lineHeight: 1.6, boxSizing: "border-box" }} />
            <div>
              <button onClick={() => setAddModal(m => ({ ...m, showPicOpts: !m.showPicOpts }))} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "0.5px dashed #ddd", background: "#f9f9f9", cursor: "pointer", fontSize: 13, color: "#185FA5", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                📷 Add Picture {addModal.showPicOpts ? "▲" : "▼"}
              </button>
              {addModal.showPicOpts && (
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <div onClick={() => modalCameraRef.current.click()} style={{ flex: 1, background: "#E6F1FB", border: "0.5px solid #93C5FD", borderRadius: 12, padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <span style={{ fontSize: 24 }}>📸</span><span style={{ fontSize: 12, fontWeight: 600, color: "#185FA5" }}>Take Photo</span>
                  </div>
                  <div onClick={() => modalGalleryRef.current.click()} style={{ flex: 1, background: "#F3EEFF", border: "0.5px solid #C4B5FD", borderRadius: 12, padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <span style={{ fontSize: 24 }}>🖼️</span><span style={{ fontSize: 12, fontWeight: 600, color: "#7C3AED" }}>Gallery</span>
                  </div>
                </div>
              )}
              <input ref={modalCameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => handleModalImageFiles(e.target.files)} />
              <input ref={modalGalleryRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleModalImageFiles(e.target.files)} />
              {addModal.images.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginTop: 8 }}>
                  {addModal.images.map((img, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img src={img.src} onClick={() => setFullImg(img.src)} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, cursor: "pointer" }} />
                      <button onClick={() => setAddModal(m => ({ ...m, images: m.images.filter((_, idx) => idx !== i) }))} style={{ position: "absolute", top: 3, right: 3, width: 18, height: 18, borderRadius: "50%", background: "#FCEBEB", border: "none", cursor: "pointer", fontSize: 10, color: "#A32D2D" }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div style={S.formLabel}>🔗 URL Link</div>
              <input value={addModal.url} onChange={e => setAddModal(m => ({ ...m, url: e.target.value }))} placeholder="https://..."
                style={{ width: "100%", background: "#f9f9f9", border: "0.5px solid #eee", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#111", fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box" }} />
            </div>
            <button onClick={confirmAdd} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: addModal.value.trim() ? "#185FA5" : "#ddd", color: addModal.value.trim() ? "#fff" : "#aaa", fontSize: 15, fontWeight: 700, cursor: addModal.value.trim() ? "pointer" : "default", fontFamily: "'DM Sans',sans-serif", transition: "background .2s" }}>✓ Done</button>
          </div>
        </div>
      )}
 
      <Modal show={editModal.show} title="✏️ Edit" value={editModal.value} onChange={v => setEditModal(m => ({ ...m, value: v }))} onConfirm={confirmEdit} onCancel={() => setEditModal({ show: false, id: null, value: "" })} confirmLabel="✓ Save Changes" confirmColor="#1D9E75" placeholder="Edit name..." />
    </div>
  );
}
 
const styles = {
  page: { background: "#f5f5f5", minHeight: "100vh", padding: "16px 12px", maxWidth: "100%", margin: 0, fontFamily: "'DM Sans',sans-serif" },
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  topTitle: { fontSize: 18, fontWeight: 700, color: "#111", letterSpacing: -0.3 },
  topSub: { fontSize: 11, color: "#888", marginTop: 1 },
  iconBtn: { width: 34, height: 34, borderRadius: "50%", border: "0.5px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 15 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 18 },
  statCard: { background: "#fff", border: "0.5px solid #eee", borderRadius: 12, padding: "10px 12px" },
  statNum: { fontSize: 22, fontWeight: 700, fontFamily: "monospace" },
  statLabel: { fontSize: 10, color: "#aaa", marginTop: 1, textTransform: "uppercase", letterSpacing: "0.05em" },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionLabel: { fontSize: 11, fontWeight: 600, color: "#aaa", letterSpacing: "0.08em" },
  addHeaderBtn: { fontSize: 13, color: "#185FA5", background: "#E6F1FB", border: "0.5px solid #93C5FD", padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontWeight: 600 },
  taskRow: { display: "flex", alignItems: "center", padding: "11px 10px 11px 0" },
  grip: { width: 30, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", color: "#bbb", fontSize: 16, flexShrink: 0, paddingLeft: 8 },
  numCol: { width: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  numText: { fontSize: 11, fontWeight: 600, color: "#aaa", fontFamily: "monospace" },
  expandBtn: { width: 18, height: 18, borderRadius: 4, border: "0.5px solid #ddd", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 11, color: "#888", flexShrink: 0 },
  checkCircle: { width: 18, height: 18, borderRadius: "50%", border: "1.5px solid #ddd", flexShrink: 0, cursor: "pointer", marginLeft: 8 },
  checkDone: { background: "#1D9E75", borderColor: "#1D9E75" },
  taskInfo: { flex: 1, minWidth: 0, cursor: "pointer", marginLeft: 10 },
  taskName: { fontSize: 13, fontWeight: 600, color: "#111", whiteSpace: "normal", overflow: "hidden", wordBreak: "break-word" },
  taskNameDone: { textDecoration: "line-through", color: "#ccc" },
  subCount: { fontSize: 10, color: "#aaa", fontFamily: "monospace" },
  progressBg: { height: 2, background: "#f0f0f0", borderRadius: 1, marginTop: 5, overflow: "hidden" },
  progressFill: { height: "100%", background: "#1D9E75", borderRadius: 1 },
  subList: { padding: "0 10px 10px 0", display: "flex", flexDirection: "column", gap: 3 },
  subRow: { display: "flex", alignItems: "center", padding: "6px 8px 6px 0", background: "#F3F4F6", borderRadius: 8, borderLeft: "3px solid #6B7280" },
  subGrip: { width: 26, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", color: "#bbb", fontSize: 14, flexShrink: 0 },
  subNumCol: { width: 36, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  subNumText: { fontSize: 10, color: "#6B7280", fontFamily: "monospace" },
  subExpandBtn: { width: 15, height: 15, borderRadius: 3, border: "0.5px solid #ddd", background: "transparent", cursor: "pointer", fontSize: 9, color: "#888", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" },
  subCheck: { width: 14, height: 14, borderRadius: "50%", border: "1.5px solid #ddd", flexShrink: 0, cursor: "pointer", marginLeft: 8 },
  subInfo: { flex: 1, minWidth: 0, cursor: "pointer", marginLeft: 8 },
  subName: { fontSize: 13, color: "#111", whiteSpace: "normal", overflow: "hidden", wordBreak: "break-word" },
  ssubList: { padding: "3px 0 3px 52px", display: "flex", flexDirection: "column", gap: 3 },
  ssubRow: { display: "flex", alignItems: "center", padding: "5px 8px 5px 0", background: "#E5E7EB", borderRadius: 8, borderLeft: "3px solid #374151" },
  ssubGrip: { width: 22, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", color: "#bbb", fontSize: 12, flexShrink: 0 },
  ssubNumCol: { width: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  ssubNumText: { fontSize: 9, color: "#374151", fontFamily: "monospace" },
  ssubCheck: { width: 12, height: 12, borderRadius: "50%", border: "1.5px solid #ddd", flexShrink: 0, cursor: "pointer" },
  ssubName: { fontSize: 13, color: "#111", flex: 1, marginLeft: 8, whiteSpace: "normal", wordBreak: "break-word" },
  addRowBtn: { display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: 8, border: "0.5px dashed #ddd", cursor: "pointer", background: "transparent", width: "100%", color: "#aaa", fontSize: 11, fontFamily: "DM Sans,sans-serif" },
  mainAddBtn: { display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", borderRadius: 12, border: "0.5px dashed #ddd", background: "transparent", cursor: "pointer", width: "100%", color: "#aaa", fontSize: 13, fontFamily: "DM Sans,sans-serif", marginTop: 2 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 },
  sheetBox: { background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "90vh", display: "flex", flexDirection: "column" },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, background: "#ddd", margin: "12px auto 0" },
  sheetHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px" },
  sheetTitle: { fontSize: 14, fontWeight: 700, color: "#111" },
  sheetClose: { width: 28, height: 28, borderRadius: "50%", border: "0.5px solid #eee", background: "#f5f5f5", cursor: "pointer", fontSize: 14, color: "#888" },
  backBtn: { fontSize: 12, color: "#888", background: "transparent", border: "none", cursor: "pointer", marginBottom: 8, padding: 0 },
  formLabel: { fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 },
  formInput: { width: "100%", background: "#f9f9f9", border: "0.5px solid #eee", borderRadius: 8, padding: "9px 11px", fontSize: 13, color: "#111", fontFamily: "DM Sans,sans-serif", outline: "none", boxSizing: "border-box" },
  saveBtn: { width: "100%", padding: 11, borderRadius: 8, border: "none", background: "#DBEAFE", color: "#185FA5", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans,sans-serif" },
  viewSecTitle: { fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 },
  linkCard: { display: "flex", alignItems: "center", gap: 8, background: "#f5f5f5", borderRadius: 8, padding: "9px 12px", fontSize: 12, color: "#185FA5", textDecoration: "none" },
  noteCard: { background: "#f9f9f9", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#111", lineHeight: 1.5 },
  delBtn: { position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: "50%", background: "#FCEBEB", border: "none", cursor: "pointer", fontSize: 10, color: "#A32D2D" },
};
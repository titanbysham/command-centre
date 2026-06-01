import { useState, useRef } from "react";
 
const initialTasks = [
  {
    id: "t1", num: 1, name: "Water the flower", status: "done", done: true, open: true,
    attachments: { notes: [], links: [], images: [] },
    subs: [
      {
        id: "s1_1", num: "1.1", name: "Fill up water in bucket", done: true, open: true,
        attachments: { notes: [], links: [], images: [] },
        ssubs: [
          { id: "ss1_1_1", num: "1.1.1", name: "Find bucket at store", done: true, attachments: { notes: [], links: [], images: [] } },
          { id: "ss1_1_2", num: "1.1.2", name: "Clean the bucket first", done: false, attachments: { notes: [], links: [], images: [] } },
        ],
      },
      { id: "s1_2", num: "1.2", name: "Water each pot carefully", done: false, open: false, attachments: { notes: [], links: [], images: [] }, ssubs: [] },
    ],
  },
  {
    id: "t2", num: 2, name: "Open shop on social media", status: "ongoing", done: false, open: true,
    attachments: { notes: [], links: [], images: [] },
    subs: [
      {
        id: "s2_1", num: "2.1", name: "Create logo", done: false, open: true,
        attachments: { notes: [], links: [], images: [] },
        ssubs: [
          { id: "ss2_1_1", num: "2.1.1", name: "Use ChatGPT for prompt ideas", done: false, attachments: { notes: [], links: [], images: [] } },
          { id: "ss2_1_2", num: "2.1.2", name: "Export final logo as PNG", done: false, attachments: { notes: [], links: [], images: [] } },
        ],
      },
      { id: "s2_2", num: "2.2", name: "Write bio and description", done: false, open: false, attachments: { notes: [], links: [], images: [] }, ssubs: [] },
    ],
  },
  {
    id: "t3", num: 3, name: "Review finance tracker", status: "blocked", done: false, open: false,
    attachments: { notes: [], links: [], images: [] },
    subs: [
      {
        id: "s3_1", num: "3.1", name: "Check last month expenses", done: false, open: false,
        attachments: { notes: [], links: [], images: [] },
        ssubs: [{ id: "ss3_1_1", num: "3.1.1", name: "Download bank statement", done: false, attachments: { notes: [], links: [], images: [] } }],
      },
    ],
  },
  { id: "t4", num: 4, name: "Reply to client WhatsApp", status: "", done: false, open: false, attachments: { notes: [], links: [], images: [] }, subs: [] },
];
 
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
 
// ─── SWIPE ROW ────────────────────────────────────────────────────────────────
// Handles BOTH swipe left (delete) and swipe right (edit)
// The key fix: touchAction on the swipeable div must be "none" so we control all touch
function SwipeRow({ children, onSwipeLeft, onSwipeRight, borderRadius = 12 }) {
  const ref = useRef(null);
  const state = useRef({ startX: 0, startY: 0, dx: 0, active: false, dir: null });
  const THRESHOLD = 55;
 
  const start = (x, y) => {
    state.current = { startX: x, startY: y, dx: 0, active: true, dir: null };
    if (ref.current) ref.current.style.transition = "none";
  };
 
  const move = (x, y, e) => {
    const s = state.current;
    if (!s.active) return;
    const dx = x - s.startX;
    const dy = y - s.startY;
    if (!s.dir) {
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      s.dir = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
    }
    if (s.dir === "v") return; // vertical scroll — don't interfere
    if (e && e.cancelable) e.preventDefault();
    s.dx = dx;
    if (ref.current) ref.current.style.transform = `translateX(${dx}px)`;
  };
 
  const end = () => {
    const s = state.current;
    s.active = false;
    if (s.dir !== "h") return;
    if (ref.current) ref.current.style.transition = "transform 0.22s ease";
    if (s.dx < -THRESHOLD) {
      if (ref.current) ref.current.style.transform = "translateX(-80px)";
      onSwipeLeft && onSwipeLeft(() => {
        if (ref.current) { ref.current.style.transition = "transform 0.22s ease"; ref.current.style.transform = "translateX(0)"; }
      });
    } else if (s.dx > THRESHOLD) {
      if (ref.current) ref.current.style.transform = "translateX(0)";
      onSwipeRight && onSwipeRight();
    } else {
      if (ref.current) ref.current.style.transform = "translateX(0)";
    }
  };
 
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius }}>
      {/* red bg right */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: "#FCEBEB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#A32D2D", fontWeight: 600, borderRadius }}>🗑️ Delete</div>
      {/* green bg left */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#085041", fontWeight: 600, borderRadius }}>✏️ Edit</div>
      {/* content */}
      <div ref={ref} style={{ position: "relative", zIndex: 1, touchAction: "pan-y" }}
        onMouseDown={e => start(e.clientX, e.clientY)}
        onMouseMove={e => { if (state.current.active) move(e.clientX, e.clientY, e); }}
        onMouseUp={end} onMouseLeave={end}
        onTouchStart={e => { if (!e.target.closest("[data-grip]")) start(e.touches[0].clientX, e.touches[0].clientY); }}
        onTouchMove={e => { if (!e.target.closest("[data-grip]")) move(e.touches[0].clientX, e.touches[0].clientY, e); }}
        onTouchEnd={end}>
        {children}
      </div>
    </div>
  );
}
 
// ─── DRAG GRIP ────────────────────────────────────────────────────────────────
// Touch-based reorder — press & hold grip, drag up/down
function DragGrip({ style, onReorder, listRef, idx }) {
  const dragState = useRef(null);
  const cloneRef = useRef(null);
 
  const onTouchStart = (e) => {
    e.stopPropagation();
    const touch = e.touches[0];
    const items = listRef.current;
    if (!items || !items[idx]) return;
    const el = items[idx];
    const rect = el.getBoundingClientRect();
    dragState.current = { startY: touch.clientY, offsetY: touch.clientY - rect.top, fromIdx: idx, toIdx: idx };
    // floating clone
    const clone = el.cloneNode(true);
    clone.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;z-index:9999;pointer-events:none;opacity:0.9;box-shadow:0 8px 32px rgba(0,0,0,0.25);border-radius:10px;`;
    document.body.appendChild(clone);
    cloneRef.current = clone;
    el.style.opacity = "0.3";
  };
 
  const onTouchMove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const ds = dragState.current;
    if (!ds) return;
    const touch = e.touches[0];
    const y = touch.clientY - ds.offsetY;
    if (cloneRef.current) cloneRef.current.style.top = `${y}px`;
    const items = listRef.current;
    if (!items) return;
    // find hovered index
    let newTo = ds.fromIdx;
    items.forEach((el, i) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) newTo = i;
    });
    if (newTo !== ds.toIdx) {
      // clear highlights
      items.forEach(el => { if (el) { el.style.borderTop = ""; el.style.borderBottom = ""; } });
      if (items[newTo]) {
        if (newTo < ds.fromIdx) items[newTo].style.borderTop = "2px solid #185FA5";
        else if (newTo > ds.fromIdx) items[newTo].style.borderBottom = "2px solid #185FA5";
      }
      ds.toIdx = newTo;
    }
  };
 
  const onTouchEnd = (e) => {
    e.stopPropagation();
    const ds = dragState.current;
    if (!ds) return;
    dragState.current = null;
    if (cloneRef.current) { cloneRef.current.remove(); cloneRef.current = null; }
    const items = listRef.current;
    if (items) {
      items.forEach(el => { if (el) { el.style.borderTop = ""; el.style.borderBottom = ""; el.style.opacity = "1"; } });
    }
    if (ds.fromIdx !== ds.toIdx) onReorder(ds.fromIdx, ds.toIdx);
  };
 
  return (
    <div data-grip="true" style={{ ...style, touchAction: "none", userSelect: "none" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}>⠿</div>
  );
}
 
// ─── TOAST ───────────────────────────────────────────────────────────────────
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
          <button onClick={onCancel} style={{ width: 30, height: 30, borderRadius: "50%", border: "0.5px solid #eee", background: "#f5f5f5", cursor: "pointer", fontSize: 16, color: "#888", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <textarea autoFocus={show} value={value} onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onConfirm(); } if (e.key === "Escape") onCancel(); }}
          placeholder={placeholder}
          style={{ width: "100%", background: "#f9f9f9", border: "0.5px solid #ddd", borderRadius: 10, padding: "12px 14px", fontSize: 15, color: "#111", fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "none", height: 100, lineHeight: 1.6, boxSizing: "border-box" }} />
        <button onClick={onConfirm} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: value.trim() ? confirmColor : "#ddd", color: value.trim() ? "#fff" : "#aaa", fontSize: 15, fontWeight: 700, cursor: value.trim() ? "pointer" : "default", fontFamily: "'DM Sans',sans-serif", transition: "background .2s" }}>{confirmLabel}</button>
      </div>
    </>
  );
}
 
function BulbBtn({ count, onClick, size }) {
  return (
    <button onClick={onClick} style={{ width: size, height: size, borderRadius: "50%", border: count > 0 ? "0.5px solid #E5A832" : "0.5px solid #ddd", background: count > 0 ? "#FAEEDA" : "#f5f5f5", fontSize: size * 0.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 6, position: "relative" }}>
      💡
      {count > 0 && <span style={{ position: "absolute", top: -3, right: -3, width: 13, height: 13, borderRadius: "50%", background: "#BA7517", color: "#fff", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, border: "1.5px solid #fff" }}>{count}</span>}
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
 
// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tasks, setTasks] = useState(initialTasks);
  const [sheet, setSheet] = useState(null);
  const [urlInput, setUrlInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [images, setImages] = useState([]);
  const [showPicOptions, setShowPicOptions] = useState(false);
  const [toast, setToast] = useState({ show: false, name: "", id: null, resetFn: null });
  const [addModal, setAddModal] = useState({ show: false, type: "task", taskId: null, subId: null, value: "", url: "", images: [], showPicOpts: false });
  const [editModal, setEditModal] = useState({ show: false, id: null, value: "" });
  const [fullImg, setFullImg] = useState(null);
  const toastTimer = useRef(null);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const modalCameraRef = useRef(null);
  const modalGalleryRef = useRef(null);
 
  // drag list refs — stable, not recreated on render
  const taskListRef = useRef([]);
  const subListRefs = useRef({});   // keyed by taskId
  const ssubListRefs = useRef({});  // keyed by subId
 
  const getSubListRef = (taskId) => {
    if (!subListRefs.current[taskId]) subListRefs.current[taskId] = [];
    return subListRefs.current[taskId];
  };
  const getSSubListRef = (subId) => {
    if (!ssubListRefs.current[subId]) ssubListRefs.current[subId] = [];
    return ssubListRefs.current[subId];
  };
 
  const update = fn => setTasks(prev => { const next = JSON.parse(JSON.stringify(prev)); fn(next); return next; });
 
  const toggleTask = id => update(t => { const x = t.find(x => x.id === id); if (x) x.open = !x.open; });
  const toggleSub = (tid, sid) => update(t => { const s = t.find(x => x.id === tid)?.subs.find(x => x.id === sid); if (s) s.open = !s.open; });
  const toggleDone = (type, tid, sid, ssid) => update(t => {
    const task = t.find(x => x.id === tid);
    if (type === "task" && task) task.done = !task.done;
    else if (type === "sub") { const s = task?.subs.find(x => x.id === sid); if (s) s.done = !s.done; }
    else if (type === "ssub") { const ss = task?.subs.find(x => x.id === sid)?.ssubs.find(x => x.id === ssid); if (ss) ss.done = !ss.done; }
  });
 
  // reorder helpers
  const reorderTasks = (from, to) => update(t => { const [m] = t.splice(from, 1); t.splice(to, 0, m); renumberAll(t); });
  const reorderSubs = (taskId, from, to) => update(t => { const task = t.find(x => x.id === taskId); if (!task) return; const [m] = task.subs.splice(from, 1); task.subs.splice(to, 0, m); renumberAll(t); });
  const reorderSSubs = (taskId, subId, from, to) => update(t => { const sub = t.find(x => x.id === taskId)?.subs.find(x => x.id === subId); if (!sub) return; const [m] = sub.ssubs.splice(from, 1); sub.ssubs.splice(to, 0, m); renumberAll(t); });
 
  // add modal
  const openAddModal = (type, taskId = null, subId = null) => {
    if (type === "sub") update(t => { const task = t.find(x => x.id === taskId); if (task) task.open = true; });
    if (type === "ssub") update(t => {
      const task = t.find(x => x.id === taskId); if (task) task.open = true;
      const sub = task?.subs.find(x => x.id === subId); if (sub) sub.open = true;
    });
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
 
  // edit modal
  const openEditModal = (id, name) => setEditModal({ show: true, id, value: name });
  const confirmEdit = () => {
    const name = editModal.value.trim(); if (!name) return;
    update(t => { const item = getItem(t, editModal.id); if (item) item.name = name; });
    setEditModal({ show: false, id: null, value: "" });
  };
 
  // delete
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
        for (const sub of task.subs) {
          const ssi = sub.ssubs.findIndex(ss => ss.id === id);
          if (ssi !== -1) { sub.ssubs.splice(ssi, 1); renumberAll(t); return; }
        }
      }
    });
  };
 
  // attachments
  const handleImageFiles = files => { Array.from(files).forEach(f => { const r = new FileReader(); r.onload = ev => setImages(prev => [...prev, { src: ev.target.result }]); r.readAsDataURL(f); }); };
  const handleModalImageFiles = files => { Array.from(files).forEach(f => { const r = new FileReader(); r.onload = ev => setAddModal(m => ({ ...m, images: [...m.images, { src: ev.target.result }] })); r.readAsDataURL(f); }); };
  const saveAttachments = itemId => {
    update(t => {
      const item = getItem(t, itemId); if (!item) return;
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (urlInput.trim()) item.attachments.links.push({ url: urlInput.trim(), time: now });
      if (noteInput.trim()) item.attachments.notes.push({ text: noteInput.trim(), time: now });
      images.forEach(img => item.attachments.images.push(img));
    });
    setUrlInput(""); setNoteInput(""); setImages([]); setShowPicOptions(false);
    setSheet({ itemId, view: "view" });
  };
  const deleteAtt = (itemId, type, idx) => update(t => { const item = getItem(t, itemId); if (item) item.attachments[type].splice(idx, 1); });
 
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.done).length;
  const pct = totalTasks ? Math.round(doneTasks / totalTasks * 100) : 0;
  const sheetItem = sheet ? getItem(tasks, sheet.itemId) : null;
  const attCount = sheetItem ? countAtt(sheetItem) : 0;
  const S = styles;
 
  return (
    <div style={S.page}>
      {/* TOPBAR */}
      <div style={S.topbar}>
        <div><div style={S.topTitle}>Today's Tasks</div><div style={S.topSub}>Sunday, 1 Jun 2026</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={S.iconBtn}>🔍</button>
          <button style={S.iconBtn}>⚙️</button>
        </div>
      </div>
 
      {/* STATS */}
      <div style={S.statsRow}>
        <div style={S.statCard}><div style={{ ...S.statNum, color: "#185FA5" }}>{totalTasks}</div><div style={S.statLabel}>Total</div></div>
        <div style={S.statCard}><div style={{ ...S.statNum, color: "#1D9E75" }}>{doneTasks}</div><div style={S.statLabel}>Done</div></div>
        <div style={S.statCard}><div style={{ ...S.statNum, color: "#BA7517" }}>{pct}%</div><div style={S.statLabel}>Progress</div></div>
      </div>
 
      {/* SECTION HEADER */}
      <div style={S.sectionHeader}>
        <span style={S.sectionLabel}>TASKS</span>
        <button style={S.addHeaderBtn} onClick={() => openAddModal("task")}>+ Add task</button>
      </div>
 
      {/* TASK LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {tasks.map((task, ti) => {
          const hasSubs = task.subs.length > 0;
          const doneSubs = task.subs.filter(s => s.done).length;
          const subListRef = { current: getSubListRef(task.id) };
 
          return (
            <div key={task.id}
              ref={el => taskListRef.current[ti] = el}
              style={{ borderRadius: 12, overflow: "hidden", border: "0.5px solid #eee" }}>
 
              <SwipeRow borderRadius={0}
                onSwipeLeft={resetFn => handleSwipeLeft(task.id, task.name, resetFn)}
                onSwipeRight={() => openEditModal(task.id, task.name)}>
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
                    const hasSSubs = sub.ssubs.length > 0;
                    const ssubListRef = { current: getSSubListRef(sub.id) };
 
                    return (
                      <div key={sub.id} ref={el => { const arr = getSubListRef(task.id); arr[si] = el; }}>
                        <SwipeRow borderRadius={8}
                          onSwipeLeft={resetFn => handleSwipeLeft(sub.id, sub.name, resetFn)}
                          onSwipeRight={() => openEditModal(sub.id, sub.name)}>
                          <div style={S.subRow}>
                            <DragGrip style={S.subGrip} listRef={subListRef} idx={si} onReorder={(f, t) => reorderSubs(task.id, f, t)} />
                            <div style={S.subNumCol}><span style={S.subNumText}>{sub.num}</span></div>
                            <button style={S.subExpandBtn} onClick={() => toggleSub(task.id, sub.id)}>{sub.open ? "−" : "+"}</button>
                            <div style={{ ...S.subCheck, ...(sub.done ? S.checkDone : {}) }} onClick={() => toggleDone("sub", task.id, sub.id)} />
                            <div style={S.subInfo} onClick={() => toggleSub(task.id, sub.id)}>
                              <span style={{ ...S.subName, ...(sub.done ? S.taskNameDone : {}) }}>{sub.name}</span>
                            </div>
                            <BulbBtn count={countAtt(sub)} onClick={() => setSheet({ itemId: sub.id, view: "menu" })} size={24} />
                          </div>
                        </SwipeRow>
 
                        {sub.open && (
                          <div style={S.ssubList}>
                            {sub.ssubs.map((ss, ssi) => (
                              <div key={ss.id} ref={el => { const arr = getSSubListRef(sub.id); arr[ssi] = el; }}>
                                <SwipeRow borderRadius={8}
                                  onSwipeLeft={resetFn => handleSwipeLeft(ss.id, ss.name, resetFn)}
                                  onSwipeRight={() => openEditModal(ss.id, ss.name)}>
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
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginTop: 8 }}>
                        {images.map((img, i) => (
                          <div key={i} style={{ position: "relative" }}>
                            <img src={img.src} onClick={() => setFullImg(img.src)} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, border: "0.5px solid #eee", cursor: "pointer" }} />
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
                  {attCount === 0
                    ? <div style={{ textAlign: "center", padding: "28px 0", color: "#999", fontSize: 13 }}>Nothing added yet.</div>
                    : <>
                      {sheetItem.attachments.images?.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={S.viewSecTitle}>📷 Pictures</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
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
                              {n.text}
                              <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>{n.time}</div>
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
 
      {/* DELETE TOAST */}
      <Toast toast={toast} onUndo={handleUndo} onDelete={handleDelete} />
 
      {/* FULLSCREEN IMAGE */}
      {fullImg && (
        <div onClick={() => setFullImg(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <button onClick={() => setFullImg(null)} style={{ position: "absolute", top: 20, right: 20, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", fontSize: 20, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          <img src={fullImg} style={{ maxWidth: "95vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 12 }} />
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 16 }}>Tap anywhere to close</div>
        </div>
      )}
 
      {/* ADD MODAL */}
      {addModal.show && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 998 }} onClick={() => setAddModal(m => ({ ...m, show: false }))}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", width: "88%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 12px 48px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>{addModal.type === "task" ? "➕ Add Task" : addModal.type === "sub" ? "➕ Add Subtask" : "➕ Add Sub-subtask"}</span>
              <button onClick={() => setAddModal(m => ({ ...m, show: false }))} style={{ width: 30, height: 30, borderRadius: "50%", border: "0.5px solid #eee", background: "#f5f5f5", cursor: "pointer", fontSize: 16, color: "#888", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
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
            <button onClick={confirmAdd} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: addModal.value.trim() ? "#185FA5" : "#ddd", color: addModal.value.trim() ? "#fff" : "#aaa", fontSize: 15, fontWeight: 700, cursor: addModal.value.trim() ? "pointer" : "default", fontFamily: "'DM Sans',sans-serif", transition: "background .2s" }}>
              ✓ Done
            </button>
          </div>
        </div>
      )}
 
      {/* EDIT MODAL */}
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
  taskName: { fontSize: 13, fontWeight: 600, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
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
  subName: { fontSize: 13, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  ssubList: { padding: "3px 0 3px 52px", display: "flex", flexDirection: "column", gap: 3 },
  ssubRow: { display: "flex", alignItems: "center", padding: "5px 8px 5px 0", background: "#E5E7EB", borderRadius: 8, borderLeft: "3px solid #374151" },
  ssubGrip: { width: 22, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", color: "#bbb", fontSize: 12, flexShrink: 0 },
  ssubNumCol: { width: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  ssubNumText: { fontSize: 9, color: "#374151", fontFamily: "monospace" },
  ssubCheck: { width: 12, height: 12, borderRadius: "50%", border: "1.5px solid #ddd", flexShrink: 0, cursor: "pointer" },
  ssubName: { fontSize: 13, color: "#111", flex: 1, marginLeft: 8 },
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
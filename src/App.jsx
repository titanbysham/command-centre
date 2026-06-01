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
      { id: "s2_3", num: "2.3", name: "Post first product photo", done: false, open: false, attachments: { notes: [], links: [], images: [] }, ssubs: [] },
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
  if (done) return <span style={pillStyle("#E1F5EE", "#085041")}>Done</span>;
  if (status === "ongoing") return <span style={pillStyle("#E6F1FB", "#185FA5")}>Ongoing</span>;
  if (status === "blocked") return <span style={pillStyle("#FCEBEB", "#A32D2D")}>Blocked</span>;
  return null;
}
function pillStyle(bg, color) {
  return { background: bg, color, fontSize: 9, padding: "2px 7px", borderRadius: 20, fontWeight: 600 };
}
 
// SwipeRow — stopPropagation so parent card doesn't also swipe
function SwipeRow({ children, onSwipeLeft, borderRadius = 12 }) {
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const isSwiping = useRef(false);
  const isHorizontal = useRef(null);
  const innerRef = useRef(null);
  const THRESHOLD = 55;
 
  const onStart = (x, y, e) => {
    // Don't steal events from buttons/interactive elements
    if (e.target.closest("button") || e.target.closest("[data-no-swipe]")) return;
    startX.current = x;
    startY.current = y;
    isSwiping.current = true;
    isHorizontal.current = null;
    if (innerRef.current) innerRef.current.style.transition = "none";
  };
 
  const onMove = (x, y, e) => {
    if (!isSwiping.current) return;
    const dx = x - startX.current;
    const dy = y - startY.current;
    if (isHorizontal.current === null) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        isHorizontal.current = Math.abs(dx) > Math.abs(dy);
      }
    }
    if (!isHorizontal.current) return;
    // prevent page scroll when swiping horizontally
    if (e && e.cancelable) e.preventDefault();
    currentX.current = Math.min(0, dx);
    if (innerRef.current) innerRef.current.style.transform = `translateX(${currentX.current}px)`;
  };
 
  const onEnd = () => {
    if (!isSwiping.current || !isHorizontal.current) {
      isSwiping.current = false;
      return;
    }
    isSwiping.current = false;
    if (innerRef.current) innerRef.current.style.transition = "transform 0.2s ease";
    if (currentX.current < -THRESHOLD) {
      if (innerRef.current) innerRef.current.style.transform = "translateX(-80px)";
      onSwipeLeft && onSwipeLeft(() => {
        if (innerRef.current) {
          innerRef.current.style.transition = "transform 0.2s ease";
          innerRef.current.style.transform = "translateX(0)";
        }
      });
    } else {
      if (innerRef.current) innerRef.current.style.transform = "translateX(0)";
    }
    currentX.current = 0;
  };
 
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius }}>
      {/* Red delete bg */}
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: 80,
        background: "#FCEBEB", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 12, color: "#A32D2D",
        fontWeight: 600, gap: 4, borderRadius,
      }}>
        🗑️ Delete
      </div>
      {/* Swipeable content */}
      <div
        ref={innerRef}
        style={{ position: "relative", zIndex: 1, touchAction: "pan-y" }}
        onMouseDown={e => onStart(e.clientX, e.clientY, e)}
        onMouseMove={e => { if (isSwiping.current) onMove(e.clientX, e.clientY, e); }}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        onTouchStart={e => onStart(e.touches[0].clientX, e.touches[0].clientY, e)}
        onTouchMove={e => onMove(e.touches[0].clientX, e.touches[0].clientY, e)}
        onTouchEnd={onEnd}
      >
        {children}
      </div>
    </div>
  );
}
 
function Toast({ toast, onUndo, onDelete }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%",
      transform: toast.show ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(120px)",
      transition: "transform 0.3s ease",
      background: "#fff", border: "0.5px solid #e5e5e5",
      borderRadius: 16, padding: "12px 16px",
      display: "flex", alignItems: "center", gap: 10,
      fontSize: 13, fontWeight: 500,
      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      zIndex: 999, minWidth: 280,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>🗑️</span>
      <span style={{ flex: 1, fontSize: 13, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        Delete <strong style={{ color: "#A32D2D" }}>"{toast.name}"</strong>?
      </span>
      <button onClick={onUndo} style={{ padding: "7px 14px", borderRadius: 10, border: "0.5px solid #C6F0DE", background: "#E1F5EE", color: "#085041", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>↩ Undo</button>
      <button onClick={onDelete} style={{ padding: "7px 14px", borderRadius: 10, border: "0.5px solid #FCBEBE", background: "#FCEBEB", color: "#A32D2D", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>Delete</button>
    </div>
  );
}
 
export default function App() {
  const [tasks, setTasks] = useState(initialTasks);
  const [adding, setAdding] = useState({ type: null, taskId: null, subId: null });
  const [inputVal, setInputVal] = useState("");
  const [sheet, setSheet] = useState(null);
  const [urlInput, setUrlInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [toast, setToast] = useState({ show: false, name: "", id: null, resetFn: null });
  const toastTimer = useRef(null);
  const dragRef = useRef(null);
 
  const update = (fn) => setTasks(prev => { const next = JSON.parse(JSON.stringify(prev)); fn(next); return next; });
 
  const toggleTask = (id) => update(t => { const item = t.find(x => x.id === id); if (item) item.open = !item.open; });
  const toggleSub = (tid, sid) => update(t => { const s = t.find(x => x.id === tid)?.subs.find(x => x.id === sid); if (s) s.open = !s.open; });
  const toggleDone = (type, tid, sid, ssid) => update(t => {
    const task = t.find(x => x.id === tid);
    if (type === "task" && task) task.done = !task.done;
    else if (type === "sub") { const s = task?.subs.find(x => x.id === sid); if (s) s.done = !s.done; }
    else if (type === "ssub") { const ss = task?.subs.find(x => x.id === sid)?.ssubs.find(x => x.id === ssid); if (ss) ss.done = !ss.done; }
  });
 
  const handleSwipeLeft = (id, name, resetFn) => {
    clearTimeout(toastTimer.current);
    // reset any previous swipe
    setToast(prev => {
      if (prev.resetFn) prev.resetFn();
      return { show: true, name, id, resetFn };
    });
    toastTimer.current = setTimeout(() => {
      setToast(t => { if (t.resetFn) t.resetFn(); return { ...t, show: false, resetFn: null }; });
    }, 4000);
  };
 
  const handleUndo = () => {
    clearTimeout(toastTimer.current);
    setToast(t => { if (t.resetFn) t.resetFn(); return { show: false, name: "", id: null, resetFn: null }; });
  };
 
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
 
  const startAdding = (type, taskId, subId) => {
    setAdding({ type, taskId, subId }); setInputVal("");
    if (type === "sub") update(t => { const task = t.find(x => x.id === taskId); if (task) task.open = true; });
    if (type === "ssub") update(t => {
      const task = t.find(x => x.id === taskId); if (task) task.open = true;
      const sub = task?.subs.find(x => x.id === subId); if (sub) sub.open = true;
    });
  };
 
  const confirmAdd = () => {
    const name = inputVal.trim(); if (!name) { setAdding({ type: null }); return; }
    update(t => {
      if (adding.type === "task") {
        t.push({ id: "t" + Date.now(), num: t.length + 1, name, status: "", done: false, open: false, attachments: { notes: [], links: [], images: [] }, subs: [] });
      } else if (adding.type === "sub") {
        const task = t.find(x => x.id === adding.taskId);
        if (task) { task.subs.push({ id: "s" + Date.now(), num: `${task.num}.${task.subs.length + 1}`, name, done: false, open: false, attachments: { notes: [], links: [], images: [] }, ssubs: [] }); task.open = true; }
      } else if (adding.type === "ssub") {
        const sub = t.find(x => x.id === adding.taskId)?.subs.find(x => x.id === adding.subId);
        if (sub) sub.ssubs.push({ id: "ss" + Date.now(), num: `${sub.num}.${sub.ssubs.length + 1}`, name, done: false, attachments: { notes: [], links: [], images: [] } });
      }
    });
    setAdding({ type: null }); setInputVal("");
  };
 
  const saveAttachments = (itemId) => {
    update(t => {
      const item = getItem(t, itemId); if (!item) return;
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (urlInput.trim()) item.attachments.links.push({ url: urlInput.trim(), time: now });
      if (noteInput.trim()) item.attachments.notes.push({ text: noteInput.trim(), time: now });
    });
    setUrlInput(""); setNoteInput("");
    setSheet({ itemId, view: "view" });
  };
 
  const deleteAtt = (itemId, type, idx) => {
    update(t => { const item = getItem(t, itemId); if (item) item.attachments[type].splice(idx, 1); });
  };
 
  const onDragStart = (e, type, taskId, subId, idx) => { dragRef.current = { type, taskId, subId, idx }; e.dataTransfer.effectAllowed = "move"; };
  const onDrop = (e, type, taskId, subId, toIdx) => {
    e.preventDefault();
    const d = dragRef.current;
    if (!d || d.type !== type || d.idx === toIdx) return;
    update(t => {
      let list;
      if (type === "task") list = t;
      else if (type === "sub") list = t.find(x => x.id === taskId)?.subs;
      else list = t.find(x => x.id === taskId)?.subs.find(x => x.id === subId)?.ssubs;
      if (!list) return;
      const [moved] = list.splice(d.idx, 1);
      list.splice(toIdx, 0, moved);
      renumberAll(t);
    });
    dragRef.current = null;
  };
 
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
        <div>
          <div style={S.topTitle}>Today's Tasks</div>
          <div style={S.topSub}>Sunday, 1 Jun 2026</div>
        </div>
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
        <button style={S.addHeaderBtn} onClick={() => startAdding("task")}>+ Add task</button>
      </div>
 
      {/* TASK LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {tasks.map((task, ti) => {
          const hasSubs = task.subs.length > 0;
          const doneSubs = task.subs.filter(s => s.done).length;
          const isAddingSubHere = adding.type === "sub" && adding.taskId === task.id;
 
          return (
            <div key={task.id} style={{ borderRadius: 12, overflow: "hidden", border: "0.5px solid #eee" }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => onDrop(e, "task", null, null, ti)}>
 
              {/* TASK ROW — only this row swipes for the task */}
              <SwipeRow borderRadius={0} onSwipeLeft={(resetFn) => handleSwipeLeft(task.id, task.name, resetFn)}>
                <div style={{ ...S.taskCard, borderRadius: 0 }}>
                  <div style={S.taskRow}>
                    <div draggable style={S.grip} onDragStart={e => onDragStart(e, "task", null, null, ti)}>⠿</div>
                    <div style={S.numCol}><span style={S.numText}>{task.num}</span></div>
                    {hasSubs || isAddingSubHere
                      ? <button style={S.expandBtn} onClick={() => toggleTask(task.id)}>{task.open ? "−" : "+"}</button>
                      : <div style={S.expandBtnGhost} />}
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
 
              {/* SUBTASKS — each sub row swipes independently */}
              {(task.open || isAddingSubHere) && (
                <div style={{ ...S.subList, background: "#fff" }}>
                  {task.subs.map((sub, si) => {
                    const hasSSubs = sub.ssubs.length > 0;
                    const isAddingSSub = adding.type === "ssub" && adding.subId === sub.id;
                    return (
                      <div key={sub.id} onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, "sub", task.id, null, si)}>
 
                        {/* SUB ROW — swipes only this subtask */}
                        <SwipeRow borderRadius={8} onSwipeLeft={(resetFn) => handleSwipeLeft(sub.id, sub.name, resetFn)}>
                          <div style={S.subRow}>
                            <div draggable style={S.subGrip} onDragStart={e => onDragStart(e, "sub", task.id, null, si)}>⠿</div>
                            <div style={S.subNumCol}><span style={S.subNumText}>{sub.num}</span></div>
                            {hasSSubs || isAddingSSub
                              ? <button style={S.subExpandBtn} onClick={() => toggleSub(task.id, sub.id)}>{sub.open ? "−" : "+"}</button>
                              : <div style={S.subExpandGhost} />}
                            <div style={{ ...S.subCheck, ...(sub.done ? S.checkDone : {}) }} onClick={() => toggleDone("sub", task.id, sub.id)} />
                            <div style={S.subInfo} onClick={() => toggleSub(task.id, sub.id)}>
                              <span style={{ ...S.subName, ...(sub.done ? S.taskNameDone : {}) }}>{sub.name}</span>
                            </div>
                            <BulbBtn count={countAtt(sub)} onClick={() => setSheet({ itemId: sub.id, view: "menu" })} size={24} />
                          </div>
                        </SwipeRow>
 
                        {/* SUB-SUBTASKS */}
                        {(sub.open || isAddingSSub) && (
                          <div style={S.ssubList}>
                            {sub.ssubs.map((ss, ssi) => (
                              <div key={ss.id} onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, "ssub", task.id, sub.id, ssi)}>
 
                                {/* SSUB ROW — swipes only this sub-subtask */}
                                <SwipeRow borderRadius={8} onSwipeLeft={(resetFn) => handleSwipeLeft(ss.id, ss.name, resetFn)}>
                                  <div style={S.ssubRow}>
                                    <div draggable style={S.ssubGrip} onDragStart={e => onDragStart(e, "ssub", task.id, sub.id, ssi)}>⠿</div>
                                    <div style={S.ssubNumCol}><span style={S.ssubNumText}>{ss.num}</span></div>
                                    <div style={{ ...S.ssubCheck, ...(ss.done ? S.checkDone : {}) }} onClick={() => toggleDone("ssub", task.id, sub.id, ss.id)} />
                                    <span style={{ ...S.ssubName, ...(ss.done ? S.taskNameDone : {}) }}>{ss.name}</span>
                                    <BulbBtn count={countAtt(ss)} onClick={() => setSheet({ itemId: ss.id, view: "menu" })} size={20} />
                                  </div>
                                </SwipeRow>
 
                              </div>
                            ))}
                            {isAddingSSub
                              ? <InlineInput value={inputVal} onChange={setInputVal} onConfirm={confirmAdd} onCancel={() => setAdding({ type: null })} placeholder="Sub-subtask name..." />
                              : <button style={S.addRowBtn} onClick={() => startAdding("ssub", task.id, sub.id)}>+ Add sub-subtask</button>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {isAddingSubHere
                    ? <div style={{ margin: "0 10px 8px 52px" }}><InlineInput value={inputVal} onChange={setInputVal} onConfirm={confirmAdd} onCancel={() => setAdding({ type: null })} placeholder="Subtask name..." /></div>
                    : <button style={{ ...S.addRowBtn, margin: "0 10px 8px 52px", width: "calc(100% - 62px)" }} onClick={() => startAdding("sub", task.id)}>+ Add subtask</button>}
                </div>
              )}
            </div>
          );
        })}
 
        {adding.type === "task"
          ? <InlineInput value={inputVal} onChange={setInputVal} onConfirm={confirmAdd} onCancel={() => setAdding({ type: null })} placeholder="New task name..." big />
          : <button style={S.mainAddBtn} onClick={() => startAdding("task")}>+ Add task</button>}
      </div>
 
      {/* BULB SHEET */}
      {sheet && (
        <div style={S.overlay} onClick={() => setSheet(null)}>
          <div style={S.sheetBox} onClick={e => e.stopPropagation()}>
            <div style={S.sheetHandle} />
            <div style={S.sheetHeader}>
              <span style={S.sheetTitle}>💡 {sheetItem?.name}</span>
              <button style={S.sheetClose} onClick={() => setSheet(null)}>✕</button>
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
                  <button style={S.backBtn} onClick={() => setSheet({ ...sheet, view: "menu" })}>← Back</button>
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
 
      {/* WHITE TOAST */}
      <Toast toast={toast} onUndo={handleUndo} onDelete={handleDelete} />
    </div>
  );
}
 
function BulbBtn({ count, onClick, size }) {
  const lit = count > 0;
  return (
    <button onClick={onClick} style={{
      width: size, height: size, borderRadius: "50%",
      border: lit ? "0.5px solid #E5A832" : "0.5px solid #ddd",
      background: lit ? "#FAEEDA" : "#f5f5f5",
      color: lit ? "#BA7517" : "#aaa",
      fontSize: size * 0.5, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, marginLeft: 6, position: "relative",
    }}>
      💡
      {count > 0 && (
        <span style={{ position: "absolute", top: -3, right: -3, width: 13, height: 13, borderRadius: "50%", background: "#BA7517", color: "#fff", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, border: "1.5px solid #fff" }}>{count}</span>
      )}
    </button>
  );
}
 
function InlineInput({ value, onChange, onConfirm, onCancel, placeholder, big }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: "#EBF4FF", borderRadius: 8, border: "0.5px solid #93C5FD" }}>
      <input autoFocus style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: big ? 13 : 12, color: "#111", fontFamily: "DM Sans, sans-serif" }}
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onKeyDown={e => { if (e.key === "Enter") onConfirm(); if (e.key === "Escape") onCancel(); }} />
      <button onClick={onConfirm} style={{ width: 22, height: 22, borderRadius: 4, background: "#DBEAFE", border: "0.5px solid #93C5FD", cursor: "pointer", fontSize: 12, color: "#185FA5" }}>✓</button>
      <button onClick={onCancel} style={{ width: 22, height: 22, borderRadius: 4, background: "#f0f0f0", border: "0.5px solid #ddd", cursor: "pointer", fontSize: 12, color: "#888" }}>✕</button>
    </div>
  );
}
 
function SheetOption({ icon, title, sub, color, onClick }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, border: "0.5px solid #eee", background: "#fafafa", cursor: "pointer" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{title}</div>
        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{sub}</div>
      </div>
      <span style={{ color: "#ccc" }}>›</span>
    </div>
  );
}
 
const styles = {
  page: { background: "#f5f5f5", minHeight: "100vh", padding: "16px 12px", maxWidth: "100%", margin: 0, fontFamily: "'DM Sans', sans-serif" },
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
  addHeaderBtn: { fontSize: 11, color: "#185FA5", background: "#E6F1FB", border: "0.5px solid #93C5FD", padding: "4px 10px", borderRadius: 20, cursor: "pointer", fontWeight: 500 },
  taskCard: { background: "#fff" },
  taskRow: { display: "flex", alignItems: "center", padding: "11px 10px 11px 0" },
  grip: { width: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", color: "#ccc", fontSize: 14, flexShrink: 0, paddingLeft: 8 },
  numCol: { width: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  numText: { fontSize: 11, fontWeight: 600, color: "#aaa", fontFamily: "monospace" },
  expandBtn: { width: 18, height: 18, borderRadius: 4, border: "0.5px solid #ddd", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 11, color: "#888", flexShrink: 0 },
  expandBtnGhost: { width: 18, height: 18, flexShrink: 0 },
  checkCircle: { width: 18, height: 18, borderRadius: "50%", border: "1.5px solid #ddd", flexShrink: 0, cursor: "pointer", marginLeft: 8 },
  checkDone: { background: "#1D9E75", borderColor: "#1D9E75" },
  taskInfo: { flex: 1, minWidth: 0, cursor: "pointer", marginLeft: 10 },
  taskName: { fontSize: 13, fontWeight: 600, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  taskNameDone: { textDecoration: "line-through", color: "#ccc" },
  subCount: { fontSize: 10, color: "#aaa", fontFamily: "monospace" },
  progressBg: { height: 2, background: "#f0f0f0", borderRadius: 1, marginTop: 5, overflow: "hidden" },
  progressFill: { height: "100%", background: "#1D9E75", borderRadius: 1 },
  subList: { padding: "0 10px 10px 0", display: "flex", flexDirection: "column", gap: 3 },
  subRow: { display: "flex", alignItems: "center", padding: "6px 8px 6px 0", background: "#f9f9f9", borderRadius: 8 },
  subGrip: { width: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", color: "#ccc", fontSize: 12, flexShrink: 0 },
  subNumCol: { width: 36, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  subNumText: { fontSize: 10, color: "#aaa", fontFamily: "monospace" },
  subExpandBtn: { width: 15, height: 15, borderRadius: 3, border: "0.5px solid #ddd", background: "transparent", cursor: "pointer", fontSize: 9, color: "#888", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" },
  subExpandGhost: { width: 15, height: 15, flexShrink: 0 },
  subCheck: { width: 14, height: 14, borderRadius: "50%", border: "1.5px solid #ddd", flexShrink: 0, cursor: "pointer", marginLeft: 8 },
  subInfo: { flex: 1, minWidth: 0, cursor: "pointer", marginLeft: 8 },
  subName: { fontSize: 12, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  ssubList: { padding: "3px 0 3px 52px", display: "flex", flexDirection: "column", gap: 3 },
  ssubRow: { display: "flex", alignItems: "center", padding: "5px 8px 5px 0", background: "#fff", borderRadius: 8 },
  ssubGrip: { width: 16, display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", color: "#ccc", fontSize: 11, flexShrink: 0 },
  ssubNumCol: { width: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  ssubNumText: { fontSize: 9, color: "#aaa", fontFamily: "monospace" },
  ssubCheck: { width: 12, height: 12, borderRadius: "50%", border: "1.5px solid #ddd", flexShrink: 0, cursor: "pointer" },
  ssubName: { fontSize: 11, color: "#888", flex: 1, marginLeft: 8 },
  addRowBtn: { display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: 8, border: "0.5px dashed #ddd", cursor: "pointer", background: "transparent", width: "100%", color: "#aaa", fontSize: 11, fontFamily: "DM Sans, sans-serif" },
  mainAddBtn: { display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", borderRadius: 12, border: "0.5px dashed #ddd", background: "transparent", cursor: "pointer", width: "100%", color: "#aaa", fontSize: 13, fontFamily: "DM Sans, sans-serif", marginTop: 2 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 },
  sheetBox: { background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "90vh", display: "flex", flexDirection: "column" },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, background: "#ddd", margin: "12px auto 0" },
  sheetHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px" },
  sheetTitle: { fontSize: 14, fontWeight: 700, color: "#111" },
  sheetClose: { width: 28, height: 28, borderRadius: "50%", border: "0.5px solid #eee", background: "#f5f5f5", cursor: "pointer", fontSize: 14, color: "#888" },
  backBtn: { fontSize: 12, color: "#888", background: "transparent", border: "none", cursor: "pointer", marginBottom: 8, padding: 0 },
  formLabel: { fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 },
  formInput: { width: "100%", background: "#f9f9f9", border: "0.5px solid #eee", borderRadius: 8, padding: "9px 11px", fontSize: 13, color: "#111", fontFamily: "DM Sans, sans-serif", outline: "none", boxSizing: "border-box" },
  saveBtn: { width: "100%", padding: 11, borderRadius: 8, border: "none", background: "#DBEAFE", color: "#185FA5", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif" },
  viewSecTitle: { fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 },
  linkCard: { display: "flex", alignItems: "center", gap: 8, background: "#f5f5f5", borderRadius: 8, padding: "9px 12px", fontSize: 12, color: "#185FA5", textDecoration: "none" },
  noteCard: { background: "#f9f9f9", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#111", lineHeight: 1.5 },
  delBtn: { position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: "50%", background: "#FCEBEB", border: "none", cursor: "pointer", fontSize: 10, color: "#A32D2D" },
};
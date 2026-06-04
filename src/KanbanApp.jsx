import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useReducer,
  useRef,
} from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Pencil, Trash2, X, Calendar, Tag, Flag } from "lucide-react";

/* ============================================================
   PERSISTENCE
   In a real project this reads/writes window.localStorage.
   The preview sandbox blocks browser storage, so we fall back
   to an in-memory store. The localStorage code path is what
   ships in your deployed app.
   ============================================================ */
const STORAGE_KEY = "kanban-state-v1";
let memoryStore = null;

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    if (memoryStore) return memoryStore;
  }
  return null;
}

function persistState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    memoryStore = state;
  }
}

/* ============================================================
   INITIAL DATA
   ============================================================ */
const uid = () => Math.random().toString(36).slice(2, 10);

const initialState = {
  columns: [
    { id: "todo", title: "To Do" },
    { id: "inprogress", title: "In Progress" },
    { id: "done", title: "Done" },
  ],
  tasks: {
    [uid()]: {
      col: "todo",
      title: "Design login screen",
      description: "Wireframe + hi-fi mockups for auth.",
      priority: "high",
      tags: ["design"],
      deadline: "2026-06-10",
    },
    [uid()]: {
      col: "todo",
      title: "Set up CI pipeline",
      description: "GitHub Actions for lint + test.",
      priority: "low",
      tags: ["devops"],
      deadline: "",
    },
    [uid()]: {
      col: "inprogress",
      title: "Build task API",
      description: "CRUD endpoints with validation.",
      priority: "medium",
      tags: ["backend", "api"],
      deadline: "2026-06-05",
    },
    [uid()]: {
      col: "done",
      title: "Project kickoff",
      description: "Aligned on scope and milestones.",
      priority: "",
      tags: [],
      deadline: "",
    },
  },
  // ordering of task ids per column
  order: {},
};

// build initial order from tasks
(function seedOrder() {
  const order = { todo: [], inprogress: [], done: [] };
  Object.entries(initialState.tasks).forEach(([id, t]) =>
    order[t.col].push(id),
  );
  initialState.order = order;
})();

/* ============================================================
   REDUCER + CONTEXT (global task state)
   ============================================================ */
function reducer(state, action) {
  switch (action.type) {
    case "ADD_TASK": {
      const id = uid();
      const { col, ...data } = action.payload;
      return {
        ...state,
        tasks: { ...state.tasks, [id]: { col, ...data } },
        order: { ...state.order, [col]: [...state.order[col], id] },
      };
    }
    case "UPDATE_TASK": {
      const { id, data } = action.payload;
      const prev = state.tasks[id];
      let order = state.order;
      // if column changed via modal, move it in order arrays
      if (data.col && data.col !== prev.col) {
        order = {
          ...order,
          [prev.col]: order[prev.col].filter((x) => x !== id),
          [data.col]: [...order[data.col], id],
        };
      }
      return {
        ...state,
        tasks: { ...state.tasks, [id]: { ...prev, ...data } },
        order,
      };
    }
    case "DELETE_TASK": {
      const id = action.payload;
      const col = state.tasks[id].col;
      const tasks = { ...state.tasks };
      delete tasks[id];
      return {
        ...state,
        tasks,
        order: {
          ...state.order,
          [col]: state.order[col].filter((x) => x !== id),
        },
      };
    }
    case "MOVE": {
      // payload: { id, fromCol, toCol, toIndex }
      const { id, fromCol, toCol, toIndex } = action.payload;
      if (fromCol === toCol) {
        const oldIndex = state.order[fromCol].indexOf(id);
        const newOrder = arrayMove(state.order[fromCol], oldIndex, toIndex);
        return { ...state, order: { ...state.order, [fromCol]: newOrder } };
      }
      const source = state.order[fromCol].filter((x) => x !== id);
      const dest = [...state.order[toCol]];
      dest.splice(toIndex, 0, id);
      return {
        ...state,
        tasks: { ...state.tasks, [id]: { ...state.tasks[id], col: toCol } },
        order: { ...state.order, [fromCol]: source, [toCol]: dest },
      };
    }
    case "RESET":
      return action.payload;
    default:
      return state;
  }
}

const KanbanContext = createContext(null);
const useKanban = () => useContext(KanbanContext);

function KanbanProvider({ children }) {
  const [state, dispatch] = useReducer(
    reducer,
    null,
    () => loadState() || initialState,
  );
  useEffect(() => {
    persistState(state);
  }, [state]);
  return (
    <KanbanContext.Provider value={{ state, dispatch }}>
      {children}
    </KanbanContext.Provider>
  );
}

/* ============================================================
   UI HELPERS
   ============================================================ */
const PRIORITY_STYLES = {
  high: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  low: "bg-teal-500/15 text-teal-300 border-teal-500/30",
};
const PRIORITY_BAR = {
  high: "bg-rose-400",
  medium: "bg-amber-400",
  low: "bg-teal-400",
  "": "bg-slate-600",
};
const COL_ACCENT = {
  todo: "text-teal-300",
  inprogress: "text-amber-300",
  done: "text-emerald-300",
};

function isOverdue(d) {
  if (!d) return false;
  return new Date(d) < new Date(new Date().toDateString());
}
function fmtDate(d) {
  if (!d) return "";
  return new Date(d + "T00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/* ============================================================
   TASK CARD (sortable)
   ============================================================ */
function TaskCard({ id, onOpen }) {
  const { state, dispatch } = useKanban();
  const task = state.tasks[id];
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { col: task.col },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(id)}
      className="group relative cursor-grab active:cursor-grabbing rounded-xl bg-slate-800/80 border border-slate-700 hover:border-slate-500 p-3 pl-4 transition-colors"
    >
      <span
        className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${PRIORITY_BAR[task.priority || ""]}`}
      />
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-100 leading-snug break-words">
          {task.title}
        </h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(id);
            }}
            className="p-1 rounded-md bg-slate-700/70 text-slate-300 hover:text-white"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              dispatch({ type: "DELETE_TASK", payload: id });
            }}
            className="p-1 rounded-md bg-slate-700/70 text-slate-300 hover:text-rose-400"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {task.description && (
        <p className="mt-1 text-xs text-slate-400 leading-relaxed line-clamp-2 break-words">
          {task.description}
        </p>
      )}
      {(task.priority || (task.tags && task.tags.length) || task.deadline) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {task.priority && (
            <span
              className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[task.priority]}`}
            >
              {task.priority}
            </span>
          )}
          {task.tags?.map((t) => (
            <span
              key={t}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700/70 text-teal-300"
            >
              #{t}
            </span>
          ))}
          {task.deadline && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${isOverdue(task.deadline) ? "bg-rose-500/15 text-rose-300" : "bg-slate-700/70 text-slate-300"}`}
            >
              <Calendar size={10} />
              {fmtDate(task.deadline)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   COLUMN
   ============================================================ */
function Column({ col, taskIds, onOpen, onAdd }) {
  const { setNodeRef } = useSortable({
    id: col.id,
    data: { col: col.id, container: true },
  });
  return (
    <div className="flex flex-col w-full sm:w-80 shrink-0 bg-slate-900/60 border border-slate-700/70 rounded-2xl max-h-full">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <h2
          className={`text-sm font-bold tracking-wide uppercase ${COL_ACCENT[col.id] || "text-slate-200"}`}
        >
          {col.title}
        </h2>
        <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
          {taskIds.length}
        </span>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className="flex flex-col gap-2.5 px-3 pb-3 overflow-y-auto min-h-[60px] flex-1"
        >
          {taskIds.length === 0 && (
            <div className="text-xs text-slate-600 italic text-center py-6 border border-dashed border-slate-700 rounded-xl">
              Drop tasks here
            </div>
          )}
          {taskIds.map((id) => (
            <TaskCard key={id} id={id} onOpen={onOpen} />
          ))}
        </div>
      </SortableContext>
      <button
        onClick={() => onAdd(col.id)}
        className="m-3 mt-0 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-300 border border-dashed border-slate-700 hover:border-amber-400/50 rounded-xl py-2 transition-colors"
      >
        <Plus size={14} /> Add task
      </button>
    </div>
  );
}

/* ============================================================
   TASK MODAL (create / view / inline edit)
   ============================================================ */
function TaskModal({ taskId, defaultCol, onClose }) {
  const { state, dispatch } = useKanban();
  const editing = taskId && state.tasks[taskId];
  const [form, setForm] = useState(
    editing
      ? {
          ...state.tasks[taskId],
          tagsText: (state.tasks[taskId].tags || []).join(", "),
        }
      : {
          title: "",
          description: "",
          col: defaultCol || "todo",
          priority: "",
          tagsText: "",
          deadline: "",
        },
  );
  const titleRef = useRef(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.title.trim()) {
      titleRef.current?.focus();
      return;
    }
    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      col: form.col,
      priority: form.priority,
      deadline: form.deadline,
      tags: form.tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    if (editing)
      dispatch({ type: "UPDATE_TASK", payload: { id: taskId, data } });
    else dispatch({ type: "ADD_TASK", payload: data });
    onClose();
  };

  const field =
    "w-full bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none transition-colors";
  const lbl =
    "block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-xl font-bold text-slate-100"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {editing ? "Task details" : "New task"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <label className={lbl}>Title</label>
        <input
          ref={titleRef}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          className={field}
          placeholder="Task name"
        />

        <label className={`${lbl} mt-4`}>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          className={`${field} resize-y`}
          placeholder="Add detail…"
        />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <label className={lbl}>
              <Flag size={11} className="inline mr-1" />
              Status
            </label>
            <select
              value={form.col}
              onChange={(e) => set("col", e.target.value)}
              className={field}
            >
              {state.columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Priority</label>
            <select
              value={form.priority}
              onChange={(e) => set("priority", e.target.value)}
              className={field}
            >
              <option value="">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <label className={lbl}>
              <Calendar size={11} className="inline mr-1" />
              Deadline
            </label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => set("deadline", e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label className={lbl}>
              <Tag size={11} className="inline mr-1" />
              Tags
            </label>
            <input
              value={form.tagsText}
              onChange={(e) => set("tagsText", e.target.value)}
              className={field}
              placeholder="api, ui"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-amber-400 text-slate-900 hover:bg-amber-300"
          >
            Save task
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   BOARD
   ============================================================ */
function Board() {
  const { state, dispatch } = useKanban();
  const [modal, setModal] = useState(null); // { taskId } | { defaultCol }
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const findCol = (id) => {
    if (state.order[id]) return id; // dropped on a column container
    return state.tasks[id]?.col;
  };

  const onDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    const fromCol = state.tasks[active.id].col;
    const toCol = findCol(over.id);
    if (!toCol) return;

    let toIndex;
    if (state.order[over.id]) {
      // dropped onto empty/column area
      toIndex = state.order[toCol].length;
    } else {
      toIndex = state.order[toCol].indexOf(over.id);
      if (toIndex < 0) toIndex = state.order[toCol].length;
    }
    if (fromCol === toCol && active.id === over.id) return;
    dispatch({
      type: "MOVE",
      payload: { id: active.id, fromCol, toCol, toIndex },
    });
  };

  return (
    <div
      className="min-h-screen w-full text-slate-100 p-5 sm:p-7"
      style={{
        background:
          "radial-gradient(900px 500px at 10% -5%, rgba(245,197,66,.08), transparent 60%), radial-gradient(800px 500px at 95% 0%, rgba(45,212,191,.08), transparent 55%), #0b0d12",
      }}
    >
      <header className="flex items-end justify-between flex-wrap gap-3 mb-7">
        <div>
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Flow<span className="text-amber-400">board</span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Context API · dnd-kit · localStorage
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (confirm("Reset board to defaults?"))
                dispatch({ type: "RESET", payload: initialState });
            }}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700"
          >
            Reset
          </button>
          <button
            onClick={() => setModal({ defaultCol: "todo" })}
            className="px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-400 text-slate-900 hover:bg-amber-300 flex items-center gap-1.5"
          >
            <Plus size={16} /> New task
          </button>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) => setActiveId(active.id)}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div
          className="flex flex-col sm:flex-row gap-4 items-stretch sm:overflow-x-auto pb-4"
          style={{ minHeight: "60vh" }}
        >
          {state.columns.map((col) => (
            <Column
              key={col.id}
              col={col}
              taskIds={state.order[col.id] || []}
              onOpen={(id) => setModal({ taskId: id })}
              onAdd={(colId) => setModal({ defaultCol: colId })}
            />
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="rounded-xl bg-slate-800 border border-amber-400/50 p-3 pl-4 shadow-2xl rotate-2 w-72">
              <h3 className="text-sm font-semibold text-slate-100">
                {state.tasks[activeId]?.title}
              </h3>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {modal && (
        <TaskModal
          taskId={modal.taskId}
          defaultCol={modal.defaultCol}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <KanbanProvider>
      <Board />
    </KanbanProvider>
  );
}

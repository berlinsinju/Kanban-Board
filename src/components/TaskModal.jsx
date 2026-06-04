import { useTasks } from "../context/TaskContext";
import { useState, useEffect } from "react";

const TaskModal = ({ open, task, onClose }) => {
  const { tasks, setTasks } = useTasks();
  const [dueDate, setDueDate] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "todo");
      setPriority(task.priority || "medium");
      setDueDate(task.dueDate || "");
    } else {
      setTitle("");
      setDescription("");
      setStatus("todo");
      setPriority("medium");
      setDueDate("");
    }
  }, [task, open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!title.trim()) return;

    if (task) {
      const updatedTasks = tasks.map((item) =>
        item.id === task.id
          ? { ...item, title, description, status, priority, dueDate }
          : item,
      );
      setTasks(updatedTasks);
    } else {
      const newTask = {
        id: Date.now(),
        title,
        description,
        status,
        priority,
        dueDate,
      };
      setTasks([...tasks, newTask]);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-fadeIn">
        <div className="px-6 py-5 border-b bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? "Edit Task" : "Create New Task"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Organize your work efficiently and stay on track
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs font-medium text-gray-600">
              Task Title
            </label>
            <input
              type="text"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
          transition"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">
              Description
            </label>
            <textarea
              placeholder="Add task details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
          transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full rounded-xl cursor-pointer border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition"
              >
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 w-full rounded-xl cursor-pointer border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">
                Deadline Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-xl  border border-gray-200 px-3 py-2.5 text-sm
      focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl border border-gray-300
        hover:bg-gray-100 active:scale-[0.98] transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-5 py-2  inline-flex items-center gap-2
    px-5 py-2.5
    text-sm font-semibold
    text-white
    bg-[var(--button-color)]
    rounded-xl cursor-pointer
    shadow-lg shadow-blue-900/30
    hover:bg-[var(--primary-color)]
    hover:shadow-lg hover:shadow-blue-900/40
    transition-all duration-200
    active:scale-95"
          >
            {task ? "Update Task" : "Save Task"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;

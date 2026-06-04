import { useTasks } from "../context/TaskContext";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

const TaskCard = ({ task, setSelectedTask, setOpenModal }) => {
  const { tasks, setTasks } = useTasks();

  const deleteTask = () => {
    setTasks(tasks.filter((item) => item.id !== task.id));
  };
  const editTask = (e) => {
    e.stopPropagation();
    setSelectedTask(task);
    setOpenModal(true);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteTask();
  };

  const priorityStyles = {
    high: "bg-red-50 text-red-600 ring-red-100",
    medium: "bg-yellow-50 text-yellow-600 ring-yellow-100",
    low: "bg-green-50 text-green-600 ring-green-100",
  };
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate + "T23:59:59") < new Date() &&
    task.status !== "done";

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("taskId", String(task.id));
      }}
      className="group relative bg-white/80 backdrop-blur-md
                 rounded-2xl p-5 mt-3 
                 shadow-sm hover:shadow-xl hover:-translate-y-1
                 transition-all duration-300
                 border border-transparent hover:border-blue-100"
    >
      <div className="flex justify-between items-start gap-3">
        <h3 className="text-base font-semibold text-black-800 line-clamp-1">
          {task.title}
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={editTask}
            className="text-black-500 hover:text-blue-600 hover:bg-blue-50 
                       rounded-full p-2 transition cursor-pointer"
          >
            <FiEdit2 size={16} />
          </button>

          <button
            onClick={handleDelete}
            className="text-black-500 hover:text-red-500 hover:bg-red-50 
                       rounded-full p-2 transition cursor-pointer"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-black-500 mt-2 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-4">
        <span className="text-xs font-medium text-white bg-[var(--button-color)] px-2 py-1 rounded-full">
          {task.status}
        </span>

        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ring-1 ${
            priorityStyles[task.priority] || priorityStyles.low
          }`}
        >
          {task.priority}
        </span>
      </div>

      {task.dueDate && (
        <div
          className={`text-xs mt-3 font-medium px-2 py-1 rounded-md ${
            isOverdue
              ? "text-red-600 bg-red-50 border border-red-200"
              : "text-blue-500 bg-blue-50 border border-blue-200"
          }`}
        >
          Deadline: {formatDate(task.dueDate)}
        </div>
      )}
    </div>
  );
};

export default TaskCard;

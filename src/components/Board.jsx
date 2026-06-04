import { columns } from "../data/columns";
import { useTasks } from "../context/TaskContext";
import TaskCard from "./TaskCard";

const columnStyles = {
  todo: "from-blue-300/80 to-blue-150",
  inprogress: "from-purple-300/80 to-purple-150",
  done: "from-emerald-300/80 to-emerald-150",
};

const headerColors = {
  todo: "text-blue-700 bg-blue-200",
  inprogress: "text-purple-700 bg-purple-200",
  done: "text-emerald-700 bg-emerald-200",
};

const Board = ({ setSelectedTask, setOpenModal }) => {
  const { tasks, setTasks } = useTasks();

  const moveTask = (taskId, newStatus) => {
    const updated = tasks.map((task) =>
      task.id === Number(taskId) ? { ...task, status: newStatus } : task,
    );

    setTasks(updated);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.id);

        return (
          <div
            key={column.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const taskId = e.dataTransfer.getData("taskId");
              moveTask(taskId, column.id);
            }}
            className={`
              rounded-3xl p-4
              bg-gradient-to-b ${columnStyles[column.id]}
              shadow-lg hover:shadow-xl
              transition-all duration-300
              flex flex-col
              min-h-[600px]
            `}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span
                  className={`
                    w-8 h-8 flex items-center justify-center
                    rounded-full text-sm font-bold
                    ${headerColors[column.id]}
                  `}
                >
                  {columnTasks.length}
                </span>

                <h2 className="inline-flex items-center px-3 py-1 rounded-md bg-gray-100 text-sm font-semibold text-gray-800 border border-gray-200 hover:bg-gray-200 transition">
                  {column.title}
                </h2>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  setSelectedTask={setSelectedTask}
                  setOpenModal={setOpenModal}
                />
              ))}
            </div>

            <button
              onClick={() => setOpenModal(true)}
              className="
                mt-4 w-full py-3
                border-2 border-dashed
                rounded-2xl cursor-pointer
                text-gray-500
                hover:text-gray-700
                hover:border-gray-400
                transition 
              "
            >
              Create Task
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Board;

import { useState } from "react";
import Board from "./components/Board";
import TaskModal from "./components/TaskModal";
import logoImg from "./assets/logo.png";

function App() {
  const [openModal, setOpenModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  return (
    <div className="min-h-screen bg-[var(--bg-color)] ">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          {" "}
          <div className="flex items-center justify-center md:justify-start gap-3">
            <img src={logoImg} alt="Logo" className="w-[200px]" />
          </div>
          <div className="flex justify-center md:justify-start">
            <button
              onClick={() => {
                setSelectedTask(null);
                setOpenModal(true);
              }}
              className="
      inline-flex items-center gap-2
      px-5 py-2.5
      text-sm font-semibold
      text-white
      bg-[var(--button-color)]
      rounded-xl cursor-pointer
      shadow-lg shadow-blue-900/30
      hover:bg-[var(--primary-color)]
      hover:shadow-lg hover:shadow-blue-900/40
      transition-all duration-200
      active:scale-95
    "
            >
              Create Task
            </button>
          </div>
        </div>

        <Board setSelectedTask={setSelectedTask} setOpenModal={setOpenModal} />
        <TaskModal
          open={openModal}
          task={selectedTask}
          onClose={() => {
            setOpenModal(false);
            setSelectedTask(null);
          }}
        />
      </div>
    </div>
  );
}

export default App;

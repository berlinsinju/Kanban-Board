import { createContext, useContext, useState, useEffect } from "react";

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tasks");

    if (saved) {
      return JSON.parse(saved);
    }

    return [
      {
        id: 1,
        title: "Home Page Design",
        description:
          "Design and build the homepage with a modern, responsive layout.",
        priority: "medium",
        status: "todo",
        dueDate: "2026-06-10",
      },
      {
        id: 2,
        title: "Login Page Validation",
        description: "Implement validation logic for the login page.",
        priority: "high",
        status: "inprogress",
        dueDate: "2026-06-01",
      },
      {
        id: 3,
        title: "Deploy Website",
        description: "Deploy the website to the production server.",
        priority: "low",
        status: "todo",
        dueDate: "2026-06-05",
      },
      {
        id: 4,
        title: "About Page Design",
        description:
          "Design and develop the about page with company information.",
        priority: "medium",
        status: "done",
        dueDate: "2026-06-03",
      },
      {
        id: 5,
        title: "Product Page Design",
        description:
          "Design and develop the product page with images and details.",
        priority: "high",
        status: "done",
        dueDate: "2026-05-30",
      },
    ];
  });
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        setTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);

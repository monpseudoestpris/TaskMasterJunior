import { v4 as uuidv4 } from "uuid";
import { Task } from "@/types";
import { TaskForm } from "./TaskForm";

interface AddTaskProps {
  onAdd: (task: Task) => void;
}

export const AddTask = ({ onAdd }: AddTaskProps) => {
  const handleAdd = (taskData: Omit<Task, "id" | "completed" | "remindersSent" | "completedAt" | "overdueSoundPlayed">) => {
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      completed: false,
      remindersSent: { h1: false, m30: false, m15: false, m5: false },
      overdueSoundPlayed: false,
    };
    onAdd(newTask);
  };

  return (
    <div>
      <TaskForm onSubmit={handleAdd} />
    </div>
  );
};

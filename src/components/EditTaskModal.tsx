import { Task } from "@/types";
import { TaskForm } from "./TaskForm";
import { FaTimes } from "react-icons/fa";

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
}

export const EditTaskModal = ({ task, onClose, onUpdate }: EditTaskModalProps) => {
  const handleSubmit = (taskData: Omit<Task, "id" | "completed" | "remindersSent" | "completedAt"  | "overdueSoundPlayed">) => {
    onUpdate({
      ...task,
      ...taskData,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg">
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-white text-gray-500 hover:text-red-500 p-2 rounded-full shadow-lg z-10 transition-colors"
        >
          <FaTimes size={20} />
        </button>
        <TaskForm
          initialTask={task}
          onSubmit={handleSubmit}
          buttonLabel="Mettre à jour"
          titleLabel="Modifier la mission"
        />
      </div>
    </div>
  );
};

import { Task } from "@/types";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export const TaskList = ({ tasks, onComplete, onDelete, onEdit }: TaskListProps) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="text-xl">Aucune mission en cours !</p>
        <p>Ajoute une tâche pour commencer.</p>
      </div>
    );
  }

  // Sort tasks: pending first, then by deadline
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    return a.completed ? 1 : -1;
  });

  return (
    <div className="space-y-4">
      {sortedTasks.map((task) => (
        <TaskItem 
          key={task.id} 
          task={task} 
          onComplete={onComplete} 
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};

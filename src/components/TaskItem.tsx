import { Task } from "@/types";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { FaCheck, FaClock, FaRedo, FaTrash, FaPen } from "react-icons/fa";

interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export const TaskItem = ({ task, onComplete, onDelete, onEdit }: TaskItemProps) => {
  const now = new Date();
  const deadline = new Date(task.deadline);
  const isOverdue = !task.completed && deadline < now;
  
  const diff = deadline.getTime() - now.getTime();
  const minutesLeft = diff / 1000 / 60;
  const isUrgent = !task.completed && !isOverdue && minutesLeft <= 5;

  const getRecurrenceLabel = () => {
    switch (task.recurrence) {
      case "daily": return "Tous les jours";
      case "weekly": return "Hebdo";
      case "weekdays": return "Semaine";
      case "weekends": return "Week-end";
      case "custom": return "Jours choisis";
      default: return null;
    }
  };

  return (
    <div
      className={`group relative p-5 rounded-2xl shadow-lg flex items-center justify-between mb-4 transition-all transform hover:-translate-y-1 hover:shadow-xl border-4 ${
        task.completed
          ? "bg-green-50 border-green-200 opacity-75 scale-95"
          : isOverdue
          ? "bg-red-100 border-red-500 animate-alarm z-10 scale-105 shadow-red-500/50"
          : isUrgent
          ? "bg-orange-50 border-orange-400 animate-urgent shadow-orange-200"
          : "bg-white border-blue-200 hover:border-blue-300"
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`text-xl font-black ${task.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
            {task.title}
          </h3>
          {task.recurrence !== "none" && (
            <span className="bg-purple-100 text-purple-600 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <FaRedo size={10} />
              {getRecurrenceLabel()}
            </span>
          )}
        </div>
        
        <div className="flex items-center text-sm font-medium text-gray-500">
          <FaClock className={`mr-1.5 ${isOverdue ? "text-red-500" : "text-blue-400"}`} />
          <span className={isOverdue ? "text-red-600 font-bold" : ""}>
            {format(parseISO(task.deadline), "EEEE d MMMM 'à' HH:mm", { locale: fr })}
          </span>
          {isOverdue && !task.completed && (
            <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
              En retard ! 😱
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {!task.completed && (
          <>
            <button
              onClick={() => onEdit(task)}
              className="bg-blue-100 hover:bg-blue-200 text-blue-600 p-3 rounded-xl transition-colors"
              aria-label="Modifier"
            >
              <FaPen size={16} />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="bg-red-100 hover:bg-red-200 text-red-600 p-3 rounded-xl transition-colors"
              aria-label="Supprimer"
            >
              <FaTrash size={16} />
            </button>
            <button
              onClick={() => onComplete(task.id)}
              className="ml-2 bg-gradient-to-br from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white p-4 rounded-2xl shadow-lg transform transition-all hover:scale-110 active:scale-90 focus:outline-none focus:ring-4 focus:ring-green-200"
              aria-label="Valider la tâche"
            >
              <FaCheck size={24} />
            </button>
          </>
        )}
        
        {task.completed && (
          <div className="flex items-center gap-4">
             <button
              onClick={() => onDelete(task.id)}
              className="bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 p-2 rounded-lg transition-colors"
              aria-label="Supprimer"
            >
              <FaTrash size={14} />
            </button>
            <div className="text-green-500 font-bold text-lg transform rotate-12 border-2 border-green-500 rounded-lg px-2 py-1 opacity-50">
              FAIT !
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

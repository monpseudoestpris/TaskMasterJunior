import { useState, useEffect } from "react";
import { Task, RecurrenceType } from "@/types";
import { FaCalendarAlt, FaClock, FaMagic, FaSave } from "react-icons/fa";

interface TaskFormProps {
  initialTask?: Partial<Task>;
  onSubmit: (taskData: Omit<Task, "id" | "completed" | "remindersSent" | "completedAt" | "overdueSoundPlayed">) => void;
  buttonLabel?: string;
  titleLabel?: string;
}

const DAYS = [
  { id: 1, label: "L" },
  { id: 2, label: "M" },
  { id: 3, label: "M" },
  { id: 4, label: "J" },
  { id: 5, label: "V" },
  { id: 6, label: "S" },
  { id: 0, label: "D" },
];

export const TaskForm = ({ initialTask, onSubmit, buttonLabel = "Ajouter la mission !", titleLabel = "Nouvelle Mission" }: TaskFormProps) => {
  const [title, setTitle] = useState(initialTask?.title || "");
  // Format date for datetime-local input (YYYY-MM-DDThh:mm)
  const [deadline, setDeadline] = useState(
    initialTask?.deadline ? new Date(initialTask.deadline).toISOString().slice(0, 16) : ""
  );
  const [recurrence, setRecurrence] = useState<RecurrenceType>(initialTask?.recurrence || "none");
  const [customDays, setCustomDays] = useState<number[]>(initialTask?.customDays || []);

  const toggleDay = (dayId: number) => {
    setCustomDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline) return;

    onSubmit({
      title,
      deadline: new Date(deadline).toISOString(),
      recurrence,
      customDays: recurrence === "custom" ? customDays : undefined,
    });

    if (!initialTask) {
      setTitle("");
      setDeadline("");
      setRecurrence("none");
      setCustomDays([]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-xl border-4 border-yellow-300 transform transition-all hover:scale-[1.01]">
      <div className="flex items-center gap-2 mb-4">
        <FaMagic className="text-purple-500 text-2xl" />
        <h2 className="text-2xl font-black text-purple-600">{titleLabel}</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Quoi faire ? 🎮</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border-2 border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 text-gray-900 font-medium transition-all"
            placeholder="Ex: Ranger ma chambre"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Pour quand ? ⏰</label>
            <div className="relative">
              <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-3 pl-10 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-gray-900 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">On répète ? 🔄</label>
            <div className="relative">
              <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                className="w-full p-3 pl-10 border-2 border-green-200 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 text-gray-900 font-medium appearance-none bg-white"
              >
                <option value="none">Une seule fois</option>
                <option value="daily">Tous les jours</option>
                <option value="weekly">Toutes les semaines</option>
                <option value="weekdays">En semaine (Lun-Ven)</option>
                <option value="weekends">Le week-end (Sam-Dim)</option>
                <option value="custom">Jours précis...</option>
              </select>
            </div>
          </div>
        </div>

        {recurrence === "custom" && (
          <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-200">
            <label className="block text-sm font-bold text-orange-800 mb-2">Quels jours ?</label>
            <div className="flex flex-wrap gap-2 justify-center">
              {DAYS.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`w-10 h-10 rounded-full font-bold transition-all transform hover:scale-110 ${
                    customDays.includes(day.id)
                      ? "bg-orange-500 text-white shadow-lg scale-105"
                      : "bg-white text-gray-500 border-2 border-gray-200 hover:border-orange-300"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-black py-4 px-6 rounded-xl shadow-lg transform hover:scale-[1.02] active:scale-95 transition-all text-lg flex items-center justify-center gap-2"
        >
          <span>{buttonLabel}</span>
          <span>🚀</span>
        </button>
      </div>
    </form>
  );
};

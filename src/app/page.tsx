"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { v4 as uuidv4 } from "uuid";
import { addDays, addWeeks, nextDay, isSameDay } from "date-fns";
import { Task } from "@/types";
import { getTasks, saveTasks } from "@/utils/storage";
import { requestNotificationPermission, sendNotification, playSound, initAudio } from "@/utils/notifications";
import { AddTask } from "@/components/AddTask";
import { TaskList } from "@/components/TaskList";
import { EditTaskModal } from "@/components/EditTaskModal";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mounted, setMounted] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Update current time every minute to refresh the list filtering
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setMounted(true);
    setTasks(getTasks());
    requestNotificationPermission();

    const handleInteraction = () => {
      initAudio();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  useEffect(() => {
    if (mounted) {
      saveTasks(tasks);
    }
  }, [tasks, mounted]);

  // Annoying mode for overdue tasks (Loop sound every 8 seconds)
  useEffect(() => {
    if (!mounted) return;

    const checkOverdue = () => {
      const now = new Date();
      const overdueTasks = tasks.filter(t => !t.completed && new Date(t.deadline) < now);
      
      if (overdueTasks.length > 0) {
        // Check if any task is overdue by more than 5 minutes (300000 ms)
        const isVeryLate = overdueTasks.some(t => {
          const diff = new Date(t.deadline).getTime() - now.getTime();
          return diff < -300000;
        });

        playSound(isVeryLate ? "overdue2" : "overdue");
      }
    };

    // Check immediately
    checkOverdue();

    // Loop
    const annoyingInterval = setInterval(checkOverdue, 8000);

    return () => clearInterval(annoyingInterval);
  }, [tasks, mounted]);

  // Reminder check interval
  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      const now = new Date();
      const newTasks = tasks.map((task) => {
        if (task.completed) return task;

        const deadline = new Date(task.deadline);
        const diff = deadline.getTime() - now.getTime();
        const minutesLeft = diff / 1000 / 60;

        // Initialize remindersSent if it doesn't exist (migration for old tasks)
        const reminders = task.remindersSent || { h1: false, m30: false, m15: false, m5: false };
        let updatedReminders = { ...reminders };
        let hasChanged = false;

        // 1 Hour Reminder (between 59 and 61 minutes)
        if (!reminders.h1 && minutesLeft <= 60 && minutesLeft > 59) {
          sendNotification("Rappel 1h", `Plus qu'une heure pour "${task.title}" !`);
          updatedReminders.h1 = true;
          hasChanged = true;
        }

        // 30 Minutes Reminder
        if (!reminders.m30 && minutesLeft <= 30 && minutesLeft > 29) {
          sendNotification("Rappel 30mn", `Il reste 30 minutes pour "${task.title}" !`);
          updatedReminders.m30 = true;
          hasChanged = true;
        }

        // 15 Minutes Reminder
        if (!reminders.m15 && minutesLeft <= 15 && minutesLeft > 14) {
          sendNotification("Rappel 15mn", `Vite ! 15 minutes restantes pour "${task.title}" !`);
          updatedReminders.m15 = true;
          hasChanged = true;
        }

        // 5 Minutes Reminder
        if (!reminders.m5 && minutesLeft <= 5 && minutesLeft > 0) {
          sendNotification("Urgent !", `La tâche "${task.title}" est à finir dans 5 minutes !`);
          playSound("alert");
          updatedReminders.m5 = true;
          hasChanged = true;
        }

        if (hasChanged) {
          return { ...task, remindersSent: updatedReminders };
        }

        // Missed task check (as soon as deadline passes)
        if (minutesLeft < 0) {
           let updatedTask = { ...task };
           let changed = false;

           if (!task.overdueSoundPlayed) {
             playSound("overdue");
             updatedTask.overdueSoundPlayed = true;
             changed = true;
           }

           if (changed) return updatedTask;
        }
        
        return task;
      });

      // Only update if changes
      if (JSON.stringify(newTasks) !== JSON.stringify(tasks)) {
        setTasks(newTasks);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [tasks, mounted]);

  const handleAddTask = (newTask: Task) => {
    setTasks([...tasks, newTask]);
    playSound("add");
    setIsAddModalOpen(false);
  };

  const handleDeleteTask = (id: string) => {
    if (confirm("Es-tu sûr de vouloir supprimer cette mission ?")) {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setEditingTask(null);
  };

  const calculateNextDeadline = (currentDeadline: Date, recurrence: Task['recurrence'], customDays?: number[]): Date | null => {
    const now = new Date();
    // Start looking from tomorrow if the deadline was today or in the past, 
    // otherwise start from the deadline itself.
    // Actually, for a recurring task, we usually want the next slot after the current one.
    let baseDate = currentDeadline < now ? now : currentDeadline;
    
    switch (recurrence) {
      case 'daily':
        return addDays(baseDate, 1);
      case 'weekly':
        return addWeeks(baseDate, 1);
      case 'weekdays': {
        let next = addDays(baseDate, 1);
        while (next.getDay() === 0 || next.getDay() === 6) {
          next = addDays(next, 1);
        }
        return next;
      }
      case 'weekends': {
        let next = addDays(baseDate, 1);
        while (next.getDay() !== 0 && next.getDay() !== 6) {
          next = addDays(next, 1);
        }
        return next;
      }
      case 'custom': {
        if (!customDays || customDays.length === 0) return null;
        // Find the next day in the list
        // Sort days to be sure
        const sortedDays = [...customDays].sort();
        let next = addDays(baseDate, 1);
        // Safety break after 14 days
        let count = 0;
        while (!sortedDays.includes(next.getDay()) && count < 14) {
          next = addDays(next, 1);
          count++;
        }
        return next;
      }
      default:
        return null;
    }
  };

  const handleCompleteTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    // Confetti
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FF69B4', '#00BFFF', '#32CD32']
    });

    // Sound
    playSound("success");

    let updatedTasks = tasks.map((t) =>
      t.id === id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
    );

    // Handle Recurrence
    if (task.recurrence !== 'none') {
      const nextDeadline = calculateNextDeadline(new Date(task.deadline), task.recurrence, task.customDays);
      
      if (nextDeadline) {
        const nextTask: Task = {
          ...task,
          id: uuidv4(),
          deadline: nextDeadline.toISOString(),
          completed: false,
          completedAt: undefined,
          remindersSent: { h1: false, m30: false, m15: false, m5: false },
          overdueSoundPlayed: false,
        };
        // Add the new task to the list
        updatedTasks = [...updatedTasks, nextTask];
      }
    }

    setTasks(updatedTasks);
  };

  if (!mounted) return null;

  const urgentTasks = tasks.filter(task => {
    if (task.completed) return true;
    const deadline = new Date(task.deadline);
    const diff = deadline.getTime() - now.getTime();
    // Show if overdue or due in less than 1 hour (3600000 ms)
    return diff < 3600000;
  });

  const hiddenCount = tasks.length - urgentTasks.length;
  const visibleTasks = showAllTasks ? tasks : urgentTasks;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 p-4 sm:p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-2xl mx-auto">
        <header className="mb-8 text-center transform hover:scale-105 transition-transform duration-300">
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2 drop-shadow-sm">
            Task Master Junior 🚀
          </h1>
          <p className="text-xl text-gray-600 font-medium">Gère tes missions comme un super-héros ! 🦸‍♂️</p>
        </header>

        <div className="flex justify-center mb-8">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition hover:scale-110 flex items-center gap-3 text-xl"
          >
            <span className="text-3xl">➕</span>
            Ajouter une mission
          </button>
        </div>
        
        <div className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📋</span>
              <h2 className="text-2xl font-black text-gray-800">Tes Missions en cours</h2>
            </div>
            {showAllTasks && hiddenCount > 0 && (
              <button 
                onClick={() => setShowAllTasks(false)}
                className="text-sm bg-white/50 hover:bg-white/80 px-3 py-1 rounded-full text-gray-600 hover:text-blue-600 transition-colors border border-white/20 shadow-sm"
              >
                Masquer 🔼
              </button>
            )}
          </div>
          <TaskList 
            tasks={visibleTasks} 
            onComplete={handleCompleteTask} 
            onDelete={handleDeleteTask}
            onEdit={handleEditTask}
          />
          {!showAllTasks && hiddenCount > 0 && (
            <button 
              onClick={() => setShowAllTasks(true)}
              className="w-full mt-4 text-center p-3 bg-white/50 hover:bg-white/80 rounded-lg backdrop-blur-sm border border-white/20 shadow-sm transition-all duration-300 group"
            >
              <p className="text-gray-600 font-medium group-hover:text-blue-600">
                + {hiddenCount} autre{hiddenCount > 1 ? 's' : ''} mission{hiddenCount > 1 ? 's' : ''} pour plus tard 🕒
              </p>
            </button>
          )}
        </div>
      </main>

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onUpdate={handleUpdateTask}
        />
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-black text-gray-800">Nouvelle Mission 🚀</h2>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>
              <AddTask onAdd={handleAddTask} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

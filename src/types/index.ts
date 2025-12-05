export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'custom';

export interface Task {
  id: string;
  title: string;
  deadline: string; // ISO string
  completed: boolean;
  completedAt?: string; // ISO string
  remindersSent: {
    h1: boolean;
    m30: boolean;
    m15: boolean;
    m5: boolean;
  };
  overdueSoundPlayed?: boolean; // To track if overdue sound was played
  recurrence: RecurrenceType;
  customDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
}

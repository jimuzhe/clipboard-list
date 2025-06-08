export interface TodoItem {
    id: string;
    title: string;
    description?: string;
    priority: TodoPriority;
    status: TodoStatus;
    category: string;
    tags: string[];
    dueDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    pomodoroCount: number;
    estimatedPomodoros: number;
    order: number;
}
export type TodoPriority = 'high' | 'medium' | 'low';
export type TodoStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';
export interface TodoCategory {
    id: string;
    name: string;
    color: string;
    icon?: string;
    description?: string;
    order: number;
}
export interface TodoStats {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    overdue: number;
    todayDue: number;
    weekDue: number;
    totalPomodoros: number;
}
export interface TodoFilter {
    status?: TodoStatus[];
    priority?: TodoPriority[];
    category?: string[];
    tags?: string[];
    dueDateRange?: {
        start?: Date;
        end?: Date;
    };
    hasPomodoro?: boolean;
}
export interface TodoSortOptions {
    field: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title' | 'order';
    direction: 'asc' | 'desc';
}
export interface PomodoroSession {
    id: string;
    todoId: string;
    type: 'work' | 'break' | 'longBreak';
    duration: number;
    startTime: Date;
    endTime?: Date;
    completed: boolean;
    interrupted: boolean;
    interruptReason?: string;
}
export interface PomodoroStats {
    totalSessions: number;
    completedSessions: number;
    totalWorkTime: number;
    totalBreakTime: number;
    averageSessionLength: number;
    streakDays: number;
    bestStreak: number;
    todaySessions: number;
    weekSessions: number;
}
//# sourceMappingURL=todo.d.ts.map
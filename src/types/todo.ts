// 待办事项接口
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
    order: number; // 用于排序
}

// 待办事项优先级
export type TodoPriority = 'high' | 'medium' | 'low';

// 待办事项状态
export type TodoStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

// 待办事项分类
export interface TodoCategory {
    id: string;
    name: string;
    color: string;
    icon?: string;
    description?: string;
    order: number;
}

// 待办事项统计信息
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

// 待办事项过滤参数
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

// 待办事项排序选项
export interface TodoSortOptions {
    field: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title' | 'order';
    direction: 'asc' | 'desc';
}

// 番茄时钟会话
export interface PomodoroSession {
    id: string;
    todoId: string;
    type: 'work' | 'break' | 'longBreak';
    duration: number; // 分钟
    startTime: Date;
    endTime?: Date;
    completed: boolean;
    interrupted: boolean;
    interruptReason?: string;
}

// 番茄时钟统计
export interface PomodoroStats {
    totalSessions: number;
    completedSessions: number;
    totalWorkTime: number; // 分钟
    totalBreakTime: number; // 分钟
    averageSessionLength: number; // 分钟
    streakDays: number;
    bestStreak: number;
    todaySessions: number;
    weekSessions: number;
}

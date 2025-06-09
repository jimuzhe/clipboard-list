// 主要类型导出
export * from './clipboard';
export * from './todo';
export * from './notes';

// 应用配置接口
export interface AppConfig {
    theme: 'light' | 'dark' | 'blue' | 'green';
    autoStart: boolean;
    firstRun: boolean;
    window: WindowConfig;
    clipboard: ClipboardConfig;
    pomodoro: PomodoroConfig;
}

// 窗口配置接口
export interface WindowConfig {
    alwaysOnTop: boolean;
    dockToSide: boolean;
    autoHide: boolean;
    width: number;
    height: number;
    dockThreshold: number;
    dockOffset: number;
}

// 剪切板配置接口
export interface ClipboardConfig {
    maxHistorySize: number;
    enableAutoSave: boolean;
    enableNotification: boolean;
    excludedApps: string[];
    enableCodeDetection: boolean;
}

// 番茄时钟配置接口
export interface PomodoroConfig {
    workDuration: number; // 分钟
    breakDuration: number; // 分钟
    longBreakDuration: number; // 分钟
    soundEnabled: boolean;
    autoStartBreak: boolean;
    sessionsBeforeLongBreak: number;
}

// IPC消息类型
export interface IPCMessage<T = any> {
    channel: string;
    data?: T;
    timestamp: Date;
}

// 事件类型
export type AppEventType =
    | 'window-shown'
    | 'window-hidden'
    | 'clipboard-changed'
    | 'todo-added'
    | 'todo-updated'
    | 'note-saved'
    | 'theme-changed'
    | 'settings-updated';

// 通用响应接口
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: Date;
}

export * from './clipboard';
export * from './todo';
export * from './notes';
export interface AppConfig {
    theme: 'light' | 'dark' | 'blue' | 'green';
    autoStart: boolean;
    window: WindowConfig;
    clipboard: ClipboardConfig;
    pomodoro: PomodoroConfig;
}
export interface WindowConfig {
    alwaysOnTop: boolean;
    dockToSide: boolean;
    autoHide: boolean;
    width: number;
    height: number;
    dockThreshold: number;
    dockOffset: number;
}
export interface ClipboardConfig {
    maxHistorySize: number;
    enableAutoSave: boolean;
    enableNotification: boolean;
    excludedApps: string[];
    enableCodeDetection: boolean;
}
export interface PomodoroConfig {
    workDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    soundEnabled: boolean;
    autoStartBreak: boolean;
    sessionsBeforeLongBreak: number;
}
export interface IPCMessage<T = any> {
    channel: string;
    data?: T;
    timestamp: Date;
}
export type AppEventType = 'window-shown' | 'window-hidden' | 'clipboard-changed' | 'todo-added' | 'todo-updated' | 'note-saved' | 'theme-changed' | 'settings-updated';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: Date;
}
//# sourceMappingURL=index.d.ts.map
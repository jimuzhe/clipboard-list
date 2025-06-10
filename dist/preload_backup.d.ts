export interface ElectronAPI {
    minimizeWindow: () => Promise<void>;
    closeWindow: () => Promise<void>;
    getAppVersion: () => Promise<string>;
    writeToClipboard: (text: string) => Promise<void>;
    readFromClipboard: () => Promise<string>;
    onClipboardChange: (callback: (item: any) => void) => void;
    getAppData: () => Promise<any>;
    saveTodos: (todos: any[]) => Promise<boolean>;
    saveClipboard: (clipboard: any[]) => Promise<boolean>;
    saveNotes: (notes: any[]) => Promise<boolean>;
    saveSettings: (settings: any) => Promise<boolean>;
    savePomodoroTimer: (timer: any) => Promise<boolean>;
    importMarkdownFile: () => Promise<any>;
    exportNote: (note: any, customPath?: string) => Promise<string>;
    setNotesDirectory: () => Promise<string>;
    getDataDirectories: () => Promise<{
        dataDir: string;
        notesDir: string;
        backupDir: string;
    }>;
    saveData: (data: any) => Promise<void>;
    loadData: () => Promise<any>;
    setTheme: (theme: string) => Promise<void>;
    getTheme: () => Promise<string>;
    showNotification: (title: string, body: string) => Promise<void>;
    openExternal: (url: string) => Promise<void>;
}
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
//# sourceMappingURL=preload_backup.d.ts.map
export interface ElectronAPI {
    minimizeWindow: () => Promise<void>;
    closeWindow: () => Promise<void>;
    getAppVersion: () => Promise<string>;
    getDataPath: () => Promise<string>;
    writeToClipboard: (text: string) => Promise<void>;
    writeImageToClipboard: (imageData: string) => Promise<void>;
    readFromClipboard: () => Promise<string>;
    onClipboardChange: (callback: (item: any) => void) => void;
    saveData: (data: any) => Promise<void>;
    loadData: () => Promise<any>;
    saveClipboardHistory: (items: any[]) => Promise<void>;
    loadClipboardHistory: () => Promise<any[]>;
    saveTodos: (todos: any[]) => Promise<void>;
    loadTodos: () => Promise<any[]>;
    saveNotes: (notes: any[]) => Promise<void>;
    loadNotes: () => Promise<any[]>;
    saveSettings: (settings: any) => Promise<void>;
    loadSettings: () => Promise<any>;
    savePomodoroTimer: (timer: any) => Promise<void>;
    loadPomodoroTimer: () => Promise<any>;
    setTheme: (theme: string) => Promise<void>;
    getTheme: () => Promise<string>;
    showNotification: (title: string, body: string) => Promise<void>;
    openExternal: (url: string) => Promise<void>;
    getDefaultNotesFolder: () => Promise<any>;
    openFolderDialog: (options?: any) => Promise<any>;
    listMarkdownFiles: (folderPath: string) => Promise<any>;
    readFile: (filePath: string) => Promise<any>;
    writeFile: (filePath: string, content: string) => Promise<void>;
    deleteFile: (filePath: string) => Promise<void>;
    openDevTools: () => Promise<void>;
    closeDevTools: () => Promise<void>;
    toggleDevTools: () => Promise<void>;
    checkForUpdates: () => Promise<any>;
    downloadUpdate: (updateInfo: any) => Promise<any>;
    installUpdate: (filePath: string) => Promise<void>;
    getCurrentVersion: () => Promise<string>;
    updateAnimationSettings: (settings: {
        showAnimationDuration: number;
        hideAnimationDuration: number;
    }) => Promise<void>;
    onUpdateAvailable: (callback: (updateInfo: any) => void) => void;
    onUpdateNotAvailable: (callback: () => void) => void;
    onUpdateError: (callback: (error: string) => void) => void;
    onUpdateDownloadStarted: (callback: (updateInfo: any) => void) => void;
    onUpdateDownloadProgress: (callback: (progress: any) => void) => void;
    onUpdateDownloadCompleted: (callback: (result: any) => void) => void;
    onUpdateDownloadError: (callback: (error: string) => void) => void;
}
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
//# sourceMappingURL=preload.d.ts.map
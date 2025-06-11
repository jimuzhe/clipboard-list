import { contextBridge, ipcRenderer } from 'electron';

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {    // 窗口控制
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    closeWindow: () => ipcRenderer.invoke('close-window'),

    // 窗口置顶功能
    setAlwaysOnTop: (enabled: boolean) => ipcRenderer.invoke('window:set-always-on-top', enabled),
    getAlwaysOnTop: () => ipcRenderer.invoke('window:get-always-on-top'),
    toggleAlwaysOnTop: () => ipcRenderer.invoke('window:toggle-always-on-top'),

    // 应用信息
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getDataPath: () => ipcRenderer.invoke('get-data-path'),// 剪切板相关
    writeToClipboard: (text: string) => ipcRenderer.invoke('write-clipboard', text),
    writeImageToClipboard: (imageData: string) => ipcRenderer.invoke('write-image-clipboard', imageData),
    readFromClipboard: () => ipcRenderer.invoke('read-clipboard'),
    onClipboardChange: (callback: (item: any) => void) => {
        ipcRenderer.on('clipboard-changed', (_, item) => callback(item));
    },    // 文件操作 - 保持向后兼容
    saveData: (data: any) => ipcRenderer.invoke('save-data', data),
    loadData: () => ipcRenderer.invoke('load-data'),

    // 新的分类数据持久化 API
    saveClipboardHistory: (items: any[]) => ipcRenderer.invoke('save-clipboard-history', items),
    loadClipboardHistory: () => ipcRenderer.invoke('load-clipboard-history'),
    saveTodos: (todos: any[]) => ipcRenderer.invoke('save-todos', todos),
    loadTodos: () => ipcRenderer.invoke('load-todos'),
    saveNotes: (notes: any[]) => ipcRenderer.invoke('save-notes', notes),
    loadNotes: () => ipcRenderer.invoke('load-notes'),
    saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
    loadSettings: () => ipcRenderer.invoke('load-settings'),
    savePomodoroTimer: (timer: any) => ipcRenderer.invoke('save-pomodoro-timer', timer),
    loadPomodoroTimer: () => ipcRenderer.invoke('load-pomodoro-timer'),

    // 主题相关
    setTheme: (theme: string) => ipcRenderer.invoke('set-theme', theme),
    getTheme: () => ipcRenderer.invoke('get-theme'),    // 通知
    showNotification: (title: string, body: string) =>
        ipcRenderer.invoke('show-notification', { title, body }),    // 外部链接
    /**
     * 通过IPC调用主进程打开外部链接
     * @param url - 要打开的外部链接地址
     */
    openExternal: (url: string) => ipcRenderer.invoke('open-external', url),    // 文件夹和文件操作
    getDefaultNotesFolder: () => ipcRenderer.invoke('get-default-notes-folder'),
    openFolderDialog: (options?: any) => ipcRenderer.invoke('open-folder-dialog', options),
    listMarkdownFiles: (folderPath: string) => ipcRenderer.invoke('list-markdown-files', folderPath),
    readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
    deleteFile: (filePath: string) => ipcRenderer.invoke('delete-file', filePath),

    // 开发者工具
    openDevTools: () => ipcRenderer.invoke('open-devtools'),
    closeDevTools: () => ipcRenderer.invoke('close-devtools'),
    toggleDevTools: () => ipcRenderer.invoke('toggle-devtools'),    // 更新相关
    checkForUpdates: () => ipcRenderer.invoke('update:check'),
    downloadUpdate: (updateInfo: any) => ipcRenderer.invoke('update:download', updateInfo),
    installUpdate: (filePath: string) => ipcRenderer.invoke('update:install', filePath),
    getCurrentVersion: () => ipcRenderer.invoke('update:get-current-version'),

    // 动画设置
    updateAnimationSettings: (settings: { showAnimationDuration: number; hideAnimationDuration: number }) =>
        ipcRenderer.invoke('update-animation-settings', settings),

    // 更新事件监听
    onUpdateAvailable: (callback: (updateInfo: any) => void) => {
        ipcRenderer.on('update-available', (_, updateInfo) => callback(updateInfo));
    },
    onUpdateNotAvailable: (callback: () => void) => {
        ipcRenderer.on('update-not-available', () => callback());
    },
    onUpdateError: (callback: (error: string) => void) => {
        ipcRenderer.on('update-error', (_, error) => callback(error));
    },
    onUpdateDownloadStarted: (callback: (updateInfo: any) => void) => {
        ipcRenderer.on('update-download-started', (_, updateInfo) => callback(updateInfo));
    },
    onUpdateDownloadProgress: (callback: (progress: any) => void) => {
        ipcRenderer.on('update-download-progress', (_, progress) => callback(progress));
    },
    onUpdateDownloadCompleted: (callback: (result: any) => void) => {
        ipcRenderer.on('update-download-completed', (_, result) => callback(result));
    },
    onUpdateDownloadError: (callback: (error: string) => void) => {
        ipcRenderer.on('update-download-error', (_, error) => callback(error));
    },
});

// 类型声明
export interface ElectronAPI {
    minimizeWindow: () => Promise<void>;
    closeWindow: () => Promise<void>;

    // 窗口置顶功能
    setAlwaysOnTop: (enabled: boolean) => Promise<void>;
    getAlwaysOnTop: () => Promise<boolean>;
    toggleAlwaysOnTop: () => Promise<boolean>;

    getAppVersion: () => Promise<string>;
    getDataPath: () => Promise<string>;
    writeToClipboard: (text: string) => Promise<void>;
    writeImageToClipboard: (imageData: string) => Promise<void>;
    readFromClipboard: () => Promise<string>;
    onClipboardChange: (callback: (item: any) => void) => void;

    // 数据持久化 - 保持向后兼容
    saveData: (data: any) => Promise<void>;
    loadData: () => Promise<any>;

    // 新的分类数据持久化 API
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
    openFolderDialog: (options?: any) => Promise<any>; listMarkdownFiles: (folderPath: string) => Promise<any>;
    readFile: (filePath: string) => Promise<any>;
    writeFile: (filePath: string, content: string) => Promise<void>;
    deleteFile: (filePath: string) => Promise<void>;
    openDevTools: () => Promise<void>;
    closeDevTools: () => Promise<void>; toggleDevTools: () => Promise<void>;

    // 更新相关
    checkForUpdates: () => Promise<any>;
    downloadUpdate: (updateInfo: any) => Promise<any>;
    installUpdate: (filePath: string) => Promise<void>;
    getCurrentVersion: () => Promise<string>;

    // 动画设置
    updateAnimationSettings: (settings: { showAnimationDuration: number; hideAnimationDuration: number }) => Promise<void>;

    // 更新事件监听
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

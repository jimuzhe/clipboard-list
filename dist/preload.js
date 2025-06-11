"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// 暴露安全的 API 给渲染进程
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // 窗口控制
    minimizeWindow: () => electron_1.ipcRenderer.invoke('minimize-window'),
    closeWindow: () => electron_1.ipcRenderer.invoke('close-window'), // 应用信息
    getAppVersion: () => electron_1.ipcRenderer.invoke('get-app-version'),
    getDataPath: () => electron_1.ipcRenderer.invoke('get-data-path'), // 剪切板相关
    writeToClipboard: (text) => electron_1.ipcRenderer.invoke('write-clipboard', text),
    writeImageToClipboard: (imageData) => electron_1.ipcRenderer.invoke('write-image-clipboard', imageData),
    readFromClipboard: () => electron_1.ipcRenderer.invoke('read-clipboard'),
    onClipboardChange: (callback) => {
        electron_1.ipcRenderer.on('clipboard-changed', (_, item) => callback(item));
    }, // 文件操作 - 保持向后兼容
    saveData: (data) => electron_1.ipcRenderer.invoke('save-data', data),
    loadData: () => electron_1.ipcRenderer.invoke('load-data'),
    // 新的分类数据持久化 API
    saveClipboardHistory: (items) => electron_1.ipcRenderer.invoke('save-clipboard-history', items),
    loadClipboardHistory: () => electron_1.ipcRenderer.invoke('load-clipboard-history'),
    saveTodos: (todos) => electron_1.ipcRenderer.invoke('save-todos', todos),
    loadTodos: () => electron_1.ipcRenderer.invoke('load-todos'),
    saveNotes: (notes) => electron_1.ipcRenderer.invoke('save-notes', notes),
    loadNotes: () => electron_1.ipcRenderer.invoke('load-notes'),
    saveSettings: (settings) => electron_1.ipcRenderer.invoke('save-settings', settings),
    loadSettings: () => electron_1.ipcRenderer.invoke('load-settings'),
    savePomodoroTimer: (timer) => electron_1.ipcRenderer.invoke('save-pomodoro-timer', timer),
    loadPomodoroTimer: () => electron_1.ipcRenderer.invoke('load-pomodoro-timer'),
    // 主题相关
    setTheme: (theme) => electron_1.ipcRenderer.invoke('set-theme', theme),
    getTheme: () => electron_1.ipcRenderer.invoke('get-theme'), // 通知
    showNotification: (title, body) => electron_1.ipcRenderer.invoke('show-notification', { title, body }), // 外部链接
    /**
     * 通过IPC调用主进程打开外部链接
     * @param url - 要打开的外部链接地址
     */
    openExternal: (url) => electron_1.ipcRenderer.invoke('open-external', url), // 文件夹和文件操作
    getDefaultNotesFolder: () => electron_1.ipcRenderer.invoke('get-default-notes-folder'),
    openFolderDialog: (options) => electron_1.ipcRenderer.invoke('open-folder-dialog', options),
    listMarkdownFiles: (folderPath) => electron_1.ipcRenderer.invoke('list-markdown-files', folderPath),
    readFile: (filePath) => electron_1.ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath, content) => electron_1.ipcRenderer.invoke('write-file', filePath, content),
    deleteFile: (filePath) => electron_1.ipcRenderer.invoke('delete-file', filePath),
    // 开发者工具
    openDevTools: () => electron_1.ipcRenderer.invoke('open-devtools'),
    closeDevTools: () => electron_1.ipcRenderer.invoke('close-devtools'),
    toggleDevTools: () => electron_1.ipcRenderer.invoke('toggle-devtools'), // 更新相关
    checkForUpdates: () => electron_1.ipcRenderer.invoke('update:check'),
    downloadUpdate: (updateInfo) => electron_1.ipcRenderer.invoke('update:download', updateInfo),
    installUpdate: (filePath) => electron_1.ipcRenderer.invoke('update:install', filePath),
    getCurrentVersion: () => electron_1.ipcRenderer.invoke('update:get-current-version'),
    // 动画设置
    updateAnimationSettings: (settings) => electron_1.ipcRenderer.invoke('update-animation-settings', settings),
    // 更新事件监听
    onUpdateAvailable: (callback) => {
        electron_1.ipcRenderer.on('update-available', (_, updateInfo) => callback(updateInfo));
    },
    onUpdateNotAvailable: (callback) => {
        electron_1.ipcRenderer.on('update-not-available', () => callback());
    },
    onUpdateError: (callback) => {
        electron_1.ipcRenderer.on('update-error', (_, error) => callback(error));
    },
    onUpdateDownloadStarted: (callback) => {
        electron_1.ipcRenderer.on('update-download-started', (_, updateInfo) => callback(updateInfo));
    },
    onUpdateDownloadProgress: (callback) => {
        electron_1.ipcRenderer.on('update-download-progress', (_, progress) => callback(progress));
    },
    onUpdateDownloadCompleted: (callback) => {
        electron_1.ipcRenderer.on('update-download-completed', (_, result) => callback(result));
    },
    onUpdateDownloadError: (callback) => {
        electron_1.ipcRenderer.on('update-download-error', (_, error) => callback(error));
    },
});
//# sourceMappingURL=preload.js.map
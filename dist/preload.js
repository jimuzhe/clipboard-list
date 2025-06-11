"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// 暴露安全的 API 给渲染进程
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // 窗口控制
    minimizeWindow: () => electron_1.ipcRenderer.invoke('minimize-window'),
    closeWindow: () => electron_1.ipcRenderer.invoke('close-window'),
    // 应用信息
    getAppVersion: () => electron_1.ipcRenderer.invoke('get-app-version'), // 剪切板相关
    writeToClipboard: (text) => electron_1.ipcRenderer.invoke('write-clipboard', text),
    writeImageToClipboard: (imageData) => electron_1.ipcRenderer.invoke('write-image-clipboard', imageData),
    readFromClipboard: () => electron_1.ipcRenderer.invoke('read-clipboard'),
    onClipboardChange: (callback) => {
        electron_1.ipcRenderer.on('clipboard-changed', (_, item) => callback(item));
    },
    // 文件操作
    saveData: (data) => electron_1.ipcRenderer.invoke('save-data', data),
    loadData: () => electron_1.ipcRenderer.invoke('load-data'),
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
    toggleDevTools: () => electron_1.ipcRenderer.invoke('toggle-devtools'),
});
//# sourceMappingURL=preload.js.map
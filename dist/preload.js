"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// 暴露安全的 API 给渲染进程
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // 窗口控制
    minimizeWindow: () => electron_1.ipcRenderer.invoke('minimize-window'),
    closeWindow: () => electron_1.ipcRenderer.invoke('close-window'),
    toggleAlwaysOnTop: () => electron_1.ipcRenderer.invoke('toggle-always-on-top'),
    // 应用信息
    getAppVersion: () => electron_1.ipcRenderer.invoke('get-app-version'), // 剪切板相关
    writeToClipboard: (text) => electron_1.ipcRenderer.invoke('write-clipboard', text),
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
    showNotification: (title, body) => electron_1.ipcRenderer.invoke('show-notification', { title, body }),
    // 外部链接
    openExternal: (url) => electron_1.ipcRenderer.invoke('open-external', url),
});
//# sourceMappingURL=preload.js.map
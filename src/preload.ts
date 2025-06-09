import { contextBridge, ipcRenderer } from 'electron';

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 窗口控制
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    closeWindow: () => ipcRenderer.invoke('close-window'),
    toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
    getAlwaysOnTop: () => ipcRenderer.invoke('get-always-on-top'),

    // 应用信息
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),    // 剪切板相关
    writeToClipboard: (text: string) => ipcRenderer.invoke('write-clipboard', text),
    readFromClipboard: () => ipcRenderer.invoke('read-clipboard'),
    onClipboardChange: (callback: (item: any) => void) => {
        ipcRenderer.on('clipboard-changed', (_, item) => callback(item));
    },

    // 文件操作
    saveData: (data: any) => ipcRenderer.invoke('save-data', data),
    loadData: () => ipcRenderer.invoke('load-data'),

    // 主题相关
    setTheme: (theme: string) => ipcRenderer.invoke('set-theme', theme),
    getTheme: () => ipcRenderer.invoke('get-theme'),    // 通知
    showNotification: (title: string, body: string) =>
        ipcRenderer.invoke('show-notification', { title, body }),

    // 外部链接
    openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
});

// 类型声明
export interface ElectronAPI {
    minimizeWindow: () => Promise<void>;
    closeWindow: () => Promise<void>;
    toggleAlwaysOnTop: () => Promise<boolean>;
    getAlwaysOnTop: () => Promise<boolean>;
    getAppVersion: () => Promise<string>;
    writeToClipboard: (text: string) => Promise<void>;
    readFromClipboard: () => Promise<string>;
    onClipboardChange: (callback: (item: any) => void) => void;
    saveData: (data: any) => Promise<void>;
    loadData: () => Promise<any>; setTheme: (theme: string) => Promise<void>;
    getTheme: () => Promise<string>;
    showNotification: (title: string, body: string) => Promise<void>;
    openExternal: (url: string) => Promise<void>;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

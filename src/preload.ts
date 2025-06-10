import { contextBridge, ipcRenderer } from 'electron';

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 窗口控制
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    closeWindow: () => ipcRenderer.invoke('close-window'),

    // 应用信息
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),    // 剪切板相关
    writeToClipboard: (text: string) => ipcRenderer.invoke('write-clipboard', text),
    writeImageToClipboard: (imageData: string) => ipcRenderer.invoke('write-image-clipboard', imageData),
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
});

// 类型声明
export interface ElectronAPI {
    minimizeWindow: () => Promise<void>;
    closeWindow: () => Promise<void>;
    getAppVersion: () => Promise<string>;
    writeToClipboard: (text: string) => Promise<void>;
    writeImageToClipboard: (imageData: string) => Promise<void>;
    readFromClipboard: () => Promise<string>;
    onClipboardChange: (callback: (item: any) => void) => void;
    saveData: (data: any) => Promise<void>;
    loadData: () => Promise<any>; setTheme: (theme: string) => Promise<void>;
    getTheme: () => Promise<string>;
    showNotification: (title: string, body: string) => Promise<void>;
    openExternal: (url: string) => Promise<void>;
    getDefaultNotesFolder: () => Promise<any>;
    openFolderDialog: (options?: any) => Promise<any>;
    listMarkdownFiles: (folderPath: string) => Promise<any>;
    readFile: (filePath: string) => Promise<any>;
    writeFile: (filePath: string, content: string) => Promise<void>;
    deleteFile: (filePath: string) => Promise<void>;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

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
//# sourceMappingURL=preload.d.ts.map
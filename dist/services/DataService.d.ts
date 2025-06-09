import { EventEmitter } from 'events';
import { ClipboardItem } from '../types/clipboard';
import { TodoItem } from '../types/todo';
import { Note } from '../types/notes';
import { AppConfig } from '../types';
/**
 * ć°ćŽćĺĄ - č´č´Łĺşç¨ć°ćŽçćŹĺ°ćäšĺĺ­ĺ¨
 */
export declare class DataService extends EventEmitter {
    private dataPath;
    private configPath;
    private backupPath;
    constructor();
    /**
     * ĺĺ§ĺć°ćŽçŽĺ˝?
     */
    private initializeDirectories;
    /**
     * äżĺ­ĺşç¨éç˝Ž
     */
    saveConfig(config: AppConfig): Promise<void>;
    /**
     * ĺ č˝˝ĺşç¨éç˝Ž
     */
    loadConfig(): Promise<AppConfig | null>;
    /**
     * äżĺ­ĺŞĺćżĺĺ?
     */
    saveClipboardHistory(items: ClipboardItem[]): Promise<void>;
    /**
     * ĺ č˝˝ĺŞĺćżĺĺ?
     */
    loadClipboardHistory(): Promise<ClipboardItem[]>;
    /**
     * äżĺ­ĺžĺäşéĄš
     */
    saveTodos(todos: TodoItem[]): Promise<void>;
    /**
     * ĺ č˝˝ĺžĺäşéĄš
     */
    loadTodos(): Promise<TodoItem[]>;
    /**
     * äżĺ­çŹčŽ°
     */
    saveNotes(notes: Note[]): Promise<void>;
    /**
     * ĺ č˝˝çŹčŽ°
     */
    loadNotes(): Promise<Note[]>;
    /**
     * äżĺ­éç¨ć°ćŽ
     */
    saveData(filename: string, data: any): Promise<void>;
    /**
     * ĺ č˝˝éç¨ć°ćŽ
     */
    loadData<T>(filename: string): Promise<T | null>;
    /**
     * ĺ é¤ć°ćŽćäťś
     */
    deleteData(filename: string): Promise<void>;
    /**
     * ĺĺťşć°ćŽĺ¤äť˝
     */
    createBackup(filename: string): Promise<void>;
    /**
     * ć¸çć§ĺ¤äť˝ćäť?
     */
    private cleanupOldBackups;
    /**
     * čżĺĺ¤äť˝
     */
    restoreBackup(filename: string, backupTimestamp?: number): Promise<void>;
    /**
     * čˇĺĺ¤äť˝ĺčĄ¨
     */
    getBackupList(filename: string): Promise<Array<{
        name: string;
        timestamp: number;
        date: Date;
        size: number;
    }>>;
    /**
     * ĺŻźĺşććć°ć?
     */
    exportAllData(): Promise<{
        config: AppConfig | null;
        clipboardHistory: ClipboardItem[];
        todos: TodoItem[];
        notes: Note[];
        exportDate: string;
    }>;
    /**
     * ĺŻźĺĽććć°ć?
     */
    importAllData(data: {
        config?: AppConfig;
        clipboardHistory?: ClipboardItem[];
        todos?: TodoItem[];
        notes?: Note[];
    }): Promise<void>;
    /**
     * čŻťĺJSONćäťś
     */
    private readJsonFile;
    /**
     * ĺĺĽJSONćäťś
     */
    private writeJsonFile;
    /**
     * čˇĺć°ćŽçŽĺ˝äżĄćŻ
     */
    getDataDirectories(): {
        dataPath: string;
        configPath: string;
        backupPath: string;
    };
    /**
     * éćŻćĺ?
     */
    destroy(): void;
}
//# sourceMappingURL=DataService.d.ts.map
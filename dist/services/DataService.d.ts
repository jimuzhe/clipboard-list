import { EventEmitter } from 'events';
import { ClipboardItem } from '../types/clipboard';
import { TodoItem } from '../types/todo';
import { Note } from '../types/notes';
import { AppConfig } from '../types';
/**
 * 数据服务 - 负责应用数据的本地持久化存储
 */
export declare class DataService extends EventEmitter {
    private dataPath;
    private configPath;
    private backupPath;
    constructor();
    /**
     * 初始化数据目�?
     */
    private initializeDirectories;
    /**
     * 保存应用配置
     */
    saveConfig(config: AppConfig): Promise<void>;
    /**
     * 加载应用配置
     */
    loadConfig(): Promise<AppConfig | null>;
    /**
     * 保存剪切板历�?
     */
    saveClipboardHistory(items: ClipboardItem[]): Promise<void>;
    /**
     * 加载剪切板历�?
     */
    loadClipboardHistory(): Promise<ClipboardItem[]>;
    /**
     * 保存待办事项
     */
    saveTodos(todos: TodoItem[]): Promise<void>;
    /**
     * 加载待办事项
     */
    loadTodos(): Promise<TodoItem[]>;
    /**
     * 保存笔记
     */
    saveNotes(notes: Note[]): Promise<void>;
    /**
     * 加载笔记
     */
    loadNotes(): Promise<Note[]>;
    /**
     * 保存通用数据
     */
    saveData(filename: string, data: any): Promise<void>;
    /**
     * 加载通用数据
     */
    loadData<T>(filename: string): Promise<T | null>;
    /**
     * 删除数据文件
     */
    deleteData(filename: string): Promise<void>;
    /**
     * 创建数据备份
     */
    createBackup(filename: string): Promise<void>;
    /**
     * 清理旧备份文�?
     */
    private cleanupOldBackups;
    /**
     * 还原备份
     */
    restoreBackup(filename: string, backupTimestamp?: number): Promise<void>;
    /**
     * 获取备份列表
     */
    getBackupList(filename: string): Promise<Array<{
        name: string;
        timestamp: number;
        date: Date;
        size: number;
    }>>;
    /**
     * 导出所有数�?
     */
    exportAllData(): Promise<{
        config: AppConfig | null;
        clipboardHistory: ClipboardItem[];
        todos: TodoItem[];
        notes: Note[];
        exportDate: string;
    }>;
    /**
     * 导入所有数�?
     */
    importAllData(data: {
        config?: AppConfig;
        clipboardHistory?: ClipboardItem[];
        todos?: TodoItem[];
        notes?: Note[];
    }): Promise<void>;
    /**
     * 读取JSON文件
     */
    private readJsonFile;
    /**
     * 写入JSON文件
     */
    private writeJsonFile;
    /**
     * 获取数据目录信息
     */
    getDataDirectories(): {
        dataPath: string;
        configPath: string;
        backupPath: string;
    };
    /**
     * 销毁服�?
     */
    destroy(): void;
}
//# sourceMappingURL=DataService.d.ts.map
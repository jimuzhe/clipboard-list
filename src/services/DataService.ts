import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';
import { logger } from '../utils/Logger';
import { ClipboardItem } from '../types/clipboard';
import { TodoItem } from '../types/todo';
import { Note } from '../types/notes';
import { AppConfig } from '../types';

/**
 * 数据服务 - 负责应用数据的本地持久化存储
 */
export class DataService extends EventEmitter {
    private dataPath: string;
    private configPath: string;
    private backupPath: string;

    constructor() {
        super();

        const userDataPath = app.getPath('userData');
        this.dataPath = path.join(userDataPath, 'data');
        this.configPath = path.join(userDataPath, 'config');
        this.backupPath = path.join(userDataPath, 'backups');

        this.initializeDirectories();
    }

    /**
     * 初始化数据目�?
     */
    private async initializeDirectories(): Promise<void> {
        try {
            await fs.mkdir(this.dataPath, { recursive: true });
            await fs.mkdir(this.configPath, { recursive: true });
            await fs.mkdir(this.backupPath, { recursive: true });

            logger.info('Data directories initialized', {
                dataPath: this.dataPath,
                configPath: this.configPath,
                backupPath: this.backupPath
            });
        } catch (error) {
            logger.error('Failed to initialize directories:', error);
            throw error;
        }
    }

    /**
     * 保存应用配置
     */
    public async saveConfig(config: AppConfig): Promise<void> {
        const configFile = path.join(this.configPath, 'app-config.json');

        try {
            await this.writeJsonFile(configFile, config);
            logger.info('App config saved');
            this.emit('config-saved', config);
        } catch (error) {
            logger.error('Failed to save config:', error);
            throw error;
        }
    }

    /**
     * 加载应用配置
     */
    public async loadConfig(): Promise<AppConfig | null> {
        const configFile = path.join(this.configPath, 'app-config.json');

        try {
            const config = await this.readJsonFile<AppConfig>(configFile);
            logger.info('App config loaded');
            return config;
        } catch (error) {
            logger.warn('Failed to load config:', error);
            return null;
        }
    }

    /**
     * 保存剪切板历�?
     */
    public async saveClipboardHistory(items: ClipboardItem[]): Promise<void> {
        const clipboardFile = path.join(this.dataPath, 'clipboard-history.json');

        try {
            // 创建备份
            await this.createBackup('clipboard-history.json');

            await this.writeJsonFile(clipboardFile, {
                version: '1.0',
                timestamp: new Date().toISOString(),
                items
            });

            logger.info(`Saved ${items.length} clipboard items`);
            this.emit('clipboard-history-saved', items);
        } catch (error) {
            logger.error('Failed to save clipboard history:', error);
            throw error;
        }
    }

    /**
     * 加载剪切板历�?
     */
    public async loadClipboardHistory(): Promise<ClipboardItem[]> {
        const clipboardFile = path.join(this.dataPath, 'clipboard-history.json');

        try {
            const data = await this.readJsonFile<{
                version: string;
                timestamp: string;
                items: ClipboardItem[];
            }>(clipboardFile);

            if (data && data.items) {
                logger.info(`Loaded ${data.items.length} clipboard items`);
                return data.items;
            }

            return [];
        } catch (error) {
            logger.warn('Failed to load clipboard history:', error);
            return [];
        }
    }

    /**
     * 保存待办事项
     */
    public async saveTodos(todos: TodoItem[]): Promise<void> {
        const todosFile = path.join(this.dataPath, 'todos.json');

        try {
            await this.createBackup('todos.json');

            await this.writeJsonFile(todosFile, {
                version: '1.0',
                timestamp: new Date().toISOString(),
                todos
            });

            logger.info(`Saved ${todos.length} todo items`);
            this.emit('todos-saved', todos);
        } catch (error) {
            logger.error('Failed to save todos:', error);
            throw error;
        }
    }

    /**
     * 加载待办事项
     */
    public async loadTodos(): Promise<TodoItem[]> {
        const todosFile = path.join(this.dataPath, 'todos.json');

        try {
            const data = await this.readJsonFile<{
                version: string;
                timestamp: string;
                todos: TodoItem[];
            }>(todosFile);

            if (data && data.todos) {
                logger.info(`Loaded ${data.todos.length} todo items`);
                return data.todos;
            }

            return [];
        } catch (error) {
            logger.warn('Failed to load todos:', error);
            return [];
        }
    }

    /**
     * 保存笔记
     */
    public async saveNotes(notes: Note[]): Promise<void> {
        const notesFile = path.join(this.dataPath, 'notes.json');

        try {
            await this.createBackup('notes.json');

            await this.writeJsonFile(notesFile, {
                version: '1.0',
                timestamp: new Date().toISOString(),
                notes
            });

            logger.info(`Saved ${notes.length} notes`);
            this.emit('notes-saved', notes);
        } catch (error) {
            logger.error('Failed to save notes:', error);
            throw error;
        }
    }

    /**
     * 加载笔记
     */
    public async loadNotes(): Promise<Note[]> {
        const notesFile = path.join(this.dataPath, 'notes.json');

        try {
            const data = await this.readJsonFile<{
                version: string;
                timestamp: string;
                notes: Note[];
            }>(notesFile);

            if (data && data.notes) {
                logger.info(`Loaded ${data.notes.length} notes`);
                return data.notes;
            }

            return [];
        } catch (error) {
            logger.warn('Failed to load notes:', error);
            return [];
        }
    }

    /**
     * 保存通用数据
     */
    public async saveData(filename: string, data: any): Promise<void> {
        const filePath = path.join(this.dataPath, `${filename}.json`);

        try {
            await this.createBackup(`${filename}.json`);
            await this.writeJsonFile(filePath, data);
            logger.info(`Data saved to ${filename}`);
            this.emit('data-saved', { filename, data });
        } catch (error) {
            logger.error(`Failed to save data to ${filename}:`, error);
            throw error;
        }
    }

    /**
     * 加载通用数据
     */
    public async loadData<T>(filename: string): Promise<T | null> {
        const filePath = path.join(this.dataPath, `${filename}.json`);

        try {
            const data = await this.readJsonFile<T>(filePath);
            logger.info(`Data loaded from ${filename}`);
            return data;
        } catch (error) {
            logger.warn(`Failed to load data from ${filename}:`, error);
            return null;
        }
    }

    /**
     * 删除数据文件
     */
    public async deleteData(filename: string): Promise<void> {
        const filePath = path.join(this.dataPath, `${filename}.json`);

        try {
            await fs.unlink(filePath);
            logger.info(`Data file deleted: ${filename}`);
            this.emit('data-deleted', filename);
        } catch (error) {
            if ((error as any).code !== 'ENOENT') {
                logger.error(`Failed to delete data file ${filename}:`, error);
                throw error;
            }
        }
    }

    /**
     * 创建数据备份
     */
    public async createBackup(filename: string): Promise<void> {
        const sourceFile = path.join(this.dataPath, filename);
        const backupFile = path.join(
            this.backupPath,
            `${path.parse(filename).name}_${new Date().getTime()}.json`
        );

        try {
            await fs.access(sourceFile);
            await fs.copyFile(sourceFile, backupFile);
            logger.debug(`Backup created: ${backupFile}`);

            // 清理旧备份（保留最�?0个）
            await this.cleanupOldBackups(filename, 10);
        } catch (error) {
            if ((error as any).code !== 'ENOENT') {
                logger.warn(`Failed to create backup for ${filename}:`, error);
            }
        }
    }

    /**
     * 清理旧备份文�?
     */
    private async cleanupOldBackups(filename: string, keepCount: number): Promise<void> {
        try {
            const baseName = path.parse(filename).name;
            const files = await fs.readdir(this.backupPath);

            const backupFiles = files
                .filter(file => file.startsWith(baseName) && file.endsWith('.json'))
                .map(file => ({
                    name: file,
                    path: path.join(this.backupPath, file),
                    time: parseInt(file.split('_').pop()?.replace('.json', '') || '0')
                }))
                .sort((a, b) => b.time - a.time);

            if (backupFiles.length > keepCount) {
                const filesToDelete = backupFiles.slice(keepCount);
                for (const file of filesToDelete) {
                    await fs.unlink(file.path);
                    logger.debug(`Old backup deleted: ${file.name}`);
                }
            }
        } catch (error) {
            logger.warn('Failed to cleanup old backups:', error);
        }
    }

    /**
     * 还原备份
     */
    public async restoreBackup(filename: string, backupTimestamp?: number): Promise<void> {
        try {
            const baseName = path.parse(filename).name;
            const files = await fs.readdir(this.backupPath);

            let backupFile: string;

            if (backupTimestamp) {
                backupFile = `${baseName}_${backupTimestamp}.json`;
            } else {
                // 使用最新的备份
                const backupFiles = files
                    .filter(file => file.startsWith(baseName) && file.endsWith('.json'))
                    .sort()
                    .reverse();

                if (backupFiles.length === 0) {
                    throw new Error(`No backup found for ${filename}`);
                }

                backupFile = backupFiles[0];
            }

            const backupPath = path.join(this.backupPath, backupFile);
            const targetPath = path.join(this.dataPath, filename);

            await fs.copyFile(backupPath, targetPath);
            logger.info(`Backup restored: ${backupFile} -> ${filename}`);
            this.emit('backup-restored', { filename, backupFile });
        } catch (error) {
            logger.error(`Failed to restore backup for ${filename}:`, error);
            throw error;
        }
    }

    /**
     * 获取备份列表
     */
    public async getBackupList(filename: string): Promise<Array<{
        name: string;
        timestamp: number;
        date: Date;
        size: number;
    }>> {
        try {
            const baseName = path.parse(filename).name;
            const files = await fs.readdir(this.backupPath);

            const backupFiles = [];

            for (const file of files) {
                if (file.startsWith(baseName) && file.endsWith('.json')) {
                    const filePath = path.join(this.backupPath, file);
                    const stats = await fs.stat(filePath);
                    const timestamp = parseInt(file.split('_').pop()?.replace('.json', '') || '0');

                    backupFiles.push({
                        name: file,
                        timestamp,
                        date: new Date(timestamp),
                        size: stats.size
                    });
                }
            }

            return backupFiles.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            logger.error(`Failed to get backup list for ${filename}:`, error);
            return [];
        }
    }

    /**
     * 导出所有数�?
     */
    public async exportAllData(): Promise<{
        config: AppConfig | null;
        clipboardHistory: ClipboardItem[];
        todos: TodoItem[];
        notes: Note[];
        exportDate: string;
    }> {
        try {
            const [config, clipboardHistory, todos, notes] = await Promise.all([
                this.loadConfig(),
                this.loadClipboardHistory(),
                this.loadTodos(),
                this.loadNotes()
            ]);

            const exportData = {
                config,
                clipboardHistory,
                todos,
                notes,
                exportDate: new Date().toISOString()
            };

            logger.info('All data exported');
            return exportData;
        } catch (error) {
            logger.error('Failed to export all data:', error);
            throw error;
        }
    }

    /**
     * 导入所有数�?
     */
    public async importAllData(data: {
        config?: AppConfig;
        clipboardHistory?: ClipboardItem[];
        todos?: TodoItem[];
        notes?: Note[];
    }): Promise<void> {
        try {
            if (data.config) {
                await this.saveConfig(data.config);
            }

            if (data.clipboardHistory) {
                await this.saveClipboardHistory(data.clipboardHistory);
            }

            if (data.todos) {
                await this.saveTodos(data.todos);
            }

            if (data.notes) {
                await this.saveNotes(data.notes);
            }

            logger.info('All data imported');
            this.emit('data-imported', data);
        } catch (error) {
            logger.error('Failed to import data:', error);
            throw error;
        }
    }

    /**
     * 读取JSON文件
     */
    private async readJsonFile<T>(filePath: string): Promise<T | null> {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return JSON.parse(content) as T;
        } catch (error) {
            if ((error as any).code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }

    /**
     * 写入JSON文件
     */
    private async writeJsonFile(filePath: string, data: any): Promise<void> {
        const content = JSON.stringify(data, null, 2);
        await fs.writeFile(filePath, content, 'utf8');
    }

    /**
     * 获取数据目录信息
     */
    public getDataDirectories(): {
        dataPath: string;
        configPath: string;
        backupPath: string;
    } {
        return {
            dataPath: this.dataPath,
            configPath: this.configPath,
            backupPath: this.backupPath
        };
    }

    /**
     * 销毁服�?
     */
    public destroy(): void {
        this.removeAllListeners();
        logger.info('DataService destroyed');
    }
}

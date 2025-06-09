"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataService = void 0;
const electron_1 = require("electron");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const events_1 = require("events");
const Logger_1 = require("../utils/Logger");
/**
 * ć°ćŽćĺĄ - č´č´Łĺşç¨ć°ćŽçćŹĺ°ćäšĺĺ­ĺ¨
 */
class DataService extends events_1.EventEmitter {
    constructor() {
        super();
        const userDataPath = electron_1.app.getPath('userData');
        this.dataPath = path.join(userDataPath, 'data');
        this.configPath = path.join(userDataPath, 'config');
        this.backupPath = path.join(userDataPath, 'backups');
        this.initializeDirectories();
    }
    /**
     * ĺĺ§ĺć°ćŽçŽĺ˝?
     */
    async initializeDirectories() {
        try {
            await fs.mkdir(this.dataPath, { recursive: true });
            await fs.mkdir(this.configPath, { recursive: true });
            await fs.mkdir(this.backupPath, { recursive: true });
            Logger_1.logger.info('Data directories initialized', {
                dataPath: this.dataPath,
                configPath: this.configPath,
                backupPath: this.backupPath
            });
        }
        catch (error) {
            Logger_1.logger.error('Failed to initialize directories:', error);
            throw error;
        }
    }
    /**
     * äżĺ­ĺşç¨éç˝Ž
     */
    async saveConfig(config) {
        const configFile = path.join(this.configPath, 'app-config.json');
        try {
            await this.writeJsonFile(configFile, config);
            Logger_1.logger.info('App config saved');
            this.emit('config-saved', config);
        }
        catch (error) {
            Logger_1.logger.error('Failed to save config:', error);
            throw error;
        }
    }
    /**
     * ĺ č˝˝ĺşç¨éç˝Ž
     */
    async loadConfig() {
        const configFile = path.join(this.configPath, 'app-config.json');
        try {
            const config = await this.readJsonFile(configFile);
            Logger_1.logger.info('App config loaded');
            return config;
        }
        catch (error) {
            Logger_1.logger.warn('Failed to load config:', error);
            return null;
        }
    }
    /**
     * äżĺ­ĺŞĺćżĺĺ?
     */
    async saveClipboardHistory(items) {
        const clipboardFile = path.join(this.dataPath, 'clipboard-history.json');
        try {
            // ĺĺťşĺ¤äť˝
            await this.createBackup('clipboard-history.json');
            await this.writeJsonFile(clipboardFile, {
                version: '1.0',
                timestamp: new Date().toISOString(),
                items
            });
            Logger_1.logger.info(`Saved ${items.length} clipboard items`);
            this.emit('clipboard-history-saved', items);
        }
        catch (error) {
            Logger_1.logger.error('Failed to save clipboard history:', error);
            throw error;
        }
    }
    /**
     * ĺ č˝˝ĺŞĺćżĺĺ?
     */
    async loadClipboardHistory() {
        const clipboardFile = path.join(this.dataPath, 'clipboard-history.json');
        try {
            const data = await this.readJsonFile(clipboardFile);
            if (data && data.items) {
                Logger_1.logger.info(`Loaded ${data.items.length} clipboard items`);
                return data.items;
            }
            return [];
        }
        catch (error) {
            Logger_1.logger.warn('Failed to load clipboard history:', error);
            return [];
        }
    }
    /**
     * äżĺ­ĺžĺäşéĄš
     */
    async saveTodos(todos) {
        const todosFile = path.join(this.dataPath, 'todos.json');
        try {
            await this.createBackup('todos.json');
            await this.writeJsonFile(todosFile, {
                version: '1.0',
                timestamp: new Date().toISOString(),
                todos
            });
            Logger_1.logger.info(`Saved ${todos.length} todo items`);
            this.emit('todos-saved', todos);
        }
        catch (error) {
            Logger_1.logger.error('Failed to save todos:', error);
            throw error;
        }
    }
    /**
     * ĺ č˝˝ĺžĺäşéĄš
     */
    async loadTodos() {
        const todosFile = path.join(this.dataPath, 'todos.json');
        try {
            const data = await this.readJsonFile(todosFile);
            if (data && data.todos) {
                Logger_1.logger.info(`Loaded ${data.todos.length} todo items`);
                return data.todos;
            }
            return [];
        }
        catch (error) {
            Logger_1.logger.warn('Failed to load todos:', error);
            return [];
        }
    }
    /**
     * äżĺ­çŹčŽ°
     */
    async saveNotes(notes) {
        const notesFile = path.join(this.dataPath, 'notes.json');
        try {
            await this.createBackup('notes.json');
            await this.writeJsonFile(notesFile, {
                version: '1.0',
                timestamp: new Date().toISOString(),
                notes
            });
            Logger_1.logger.info(`Saved ${notes.length} notes`);
            this.emit('notes-saved', notes);
        }
        catch (error) {
            Logger_1.logger.error('Failed to save notes:', error);
            throw error;
        }
    }
    /**
     * ĺ č˝˝çŹčŽ°
     */
    async loadNotes() {
        const notesFile = path.join(this.dataPath, 'notes.json');
        try {
            const data = await this.readJsonFile(notesFile);
            if (data && data.notes) {
                Logger_1.logger.info(`Loaded ${data.notes.length} notes`);
                return data.notes;
            }
            return [];
        }
        catch (error) {
            Logger_1.logger.warn('Failed to load notes:', error);
            return [];
        }
    }
    /**
     * äżĺ­éç¨ć°ćŽ
     */
    async saveData(filename, data) {
        const filePath = path.join(this.dataPath, `${filename}.json`);
        try {
            await this.createBackup(`${filename}.json`);
            await this.writeJsonFile(filePath, data);
            Logger_1.logger.info(`Data saved to ${filename}`);
            this.emit('data-saved', { filename, data });
        }
        catch (error) {
            Logger_1.logger.error(`Failed to save data to ${filename}:`, error);
            throw error;
        }
    }
    /**
     * ĺ č˝˝éç¨ć°ćŽ
     */
    async loadData(filename) {
        const filePath = path.join(this.dataPath, `${filename}.json`);
        try {
            const data = await this.readJsonFile(filePath);
            Logger_1.logger.info(`Data loaded from ${filename}`);
            return data;
        }
        catch (error) {
            Logger_1.logger.warn(`Failed to load data from ${filename}:`, error);
            return null;
        }
    }
    /**
     * ĺ é¤ć°ćŽćäťś
     */
    async deleteData(filename) {
        const filePath = path.join(this.dataPath, `${filename}.json`);
        try {
            await fs.unlink(filePath);
            Logger_1.logger.info(`Data file deleted: ${filename}`);
            this.emit('data-deleted', filename);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                Logger_1.logger.error(`Failed to delete data file ${filename}:`, error);
                throw error;
            }
        }
    }
    /**
     * ĺĺťşć°ćŽĺ¤äť˝
     */
    async createBackup(filename) {
        const sourceFile = path.join(this.dataPath, filename);
        const backupFile = path.join(this.backupPath, `${path.parse(filename).name}_${new Date().getTime()}.json`);
        try {
            await fs.access(sourceFile);
            await fs.copyFile(sourceFile, backupFile);
            Logger_1.logger.debug(`Backup created: ${backupFile}`);
            // ć¸çć§ĺ¤äť˝ďźäżçćčż?0ä¸Şďź
            await this.cleanupOldBackups(filename, 10);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                Logger_1.logger.warn(`Failed to create backup for ${filename}:`, error);
            }
        }
    }
    /**
     * ć¸çć§ĺ¤äť˝ćäť?
     */
    async cleanupOldBackups(filename, keepCount) {
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
                    Logger_1.logger.debug(`Old backup deleted: ${file.name}`);
                }
            }
        }
        catch (error) {
            Logger_1.logger.warn('Failed to cleanup old backups:', error);
        }
    }
    /**
     * čżĺĺ¤äť˝
     */
    async restoreBackup(filename, backupTimestamp) {
        try {
            const baseName = path.parse(filename).name;
            const files = await fs.readdir(this.backupPath);
            let backupFile;
            if (backupTimestamp) {
                backupFile = `${baseName}_${backupTimestamp}.json`;
            }
            else {
                // ä˝żç¨ćć°çĺ¤äť˝
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
            Logger_1.logger.info(`Backup restored: ${backupFile} -> ${filename}`);
            this.emit('backup-restored', { filename, backupFile });
        }
        catch (error) {
            Logger_1.logger.error(`Failed to restore backup for ${filename}:`, error);
            throw error;
        }
    }
    /**
     * čˇĺĺ¤äť˝ĺčĄ¨
     */
    async getBackupList(filename) {
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
        }
        catch (error) {
            Logger_1.logger.error(`Failed to get backup list for ${filename}:`, error);
            return [];
        }
    }
    /**
     * ĺŻźĺşććć°ć?
     */
    async exportAllData() {
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
            Logger_1.logger.info('All data exported');
            return exportData;
        }
        catch (error) {
            Logger_1.logger.error('Failed to export all data:', error);
            throw error;
        }
    }
    /**
     * ĺŻźĺĽććć°ć?
     */
    async importAllData(data) {
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
            Logger_1.logger.info('All data imported');
            this.emit('data-imported', data);
        }
        catch (error) {
            Logger_1.logger.error('Failed to import data:', error);
            throw error;
        }
    }
    /**
     * čŻťĺJSONćäťś
     */
    async readJsonFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return JSON.parse(content);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }
    /**
     * ĺĺĽJSONćäťś
     */
    async writeJsonFile(filePath, data) {
        const content = JSON.stringify(data, null, 2);
        await fs.writeFile(filePath, content, 'utf8');
    }
    /**
     * čˇĺć°ćŽçŽĺ˝äżĄćŻ
     */
    getDataDirectories() {
        return {
            dataPath: this.dataPath,
            configPath: this.configPath,
            backupPath: this.backupPath
        };
    }
    /**
     * éćŻćĺ?
     */
    destroy() {
        this.removeAllListeners();
        Logger_1.logger.info('DataService destroyed');
    }
}
exports.DataService = DataService;
//# sourceMappingURL=DataService.js.map
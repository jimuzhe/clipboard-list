import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export class Logger {
    private static instance: Logger;
    private logLevel: LogLevel = LogLevel.INFO;
    private logDir: string;
    private logFile: string;

    private constructor() {
        this.logDir = path.join(app.getPath('userData'), 'logs');
        this.logFile = path.join(this.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
        this.ensureLogDirectory();
    }

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    private ensureLogDirectory(): void {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    private formatMessage(level: string, message: string, meta?: any): string {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level}] ${message}${metaStr}`;
    }

    private writeToFile(formattedMessage: string): void {
        try {
            fs.appendFileSync(this.logFile, formattedMessage + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    private log(level: LogLevel, levelName: string, message: string, meta?: any): void {
        if (level >= this.logLevel) {
            const formattedMessage = this.formatMessage(levelName, message, meta);

            // 控制台输出
            switch (level) {
                case LogLevel.DEBUG:
                    console.debug(formattedMessage);
                    break;
                case LogLevel.INFO:
                    console.log(formattedMessage);
                    break;
                case LogLevel.WARN:
                    console.warn(formattedMessage);
                    break;
                case LogLevel.ERROR:
                    console.error(formattedMessage);
                    break;
            }

            // 写入文件
            this.writeToFile(formattedMessage);
        }
    }

    debug(message: string, meta?: any): void {
        this.log(LogLevel.DEBUG, 'DEBUG', message, meta);
    }

    info(message: string, meta?: any): void {
        this.log(LogLevel.INFO, 'INFO', message, meta);
    }

    warn(message: string, meta?: any): void {
        this.log(LogLevel.WARN, 'WARN', message, meta);
    }

    error(message: string, error?: Error | any): void {
        const meta = error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
        } : error;

        this.log(LogLevel.ERROR, 'ERROR', message, meta);
    }

    // 清理旧日志文件
    cleanOldLogs(daysToKeep: number = 30): void {
        try {
            const files = fs.readdirSync(this.logDir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            files.forEach(file => {
                if (file.startsWith('app-') && file.endsWith('.log')) {
                    const filePath = path.join(this.logDir, file);
                    const stats = fs.statSync(filePath);

                    if (stats.mtime < cutoffDate) {
                        fs.unlinkSync(filePath);
                        this.info(`Deleted old log file: ${file}`);
                    }
                }
            });
        } catch (error) {
            this.error('Failed to clean old logs', error);
        }
    }
}

// 创建全局实例
export const logger = Logger.getInstance();

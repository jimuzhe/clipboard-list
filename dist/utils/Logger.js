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
exports.logger = exports.Logger = exports.LogLevel = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor() {
        this.logLevel = LogLevel.INFO;
        this.logDir = path.join(electron_1.app.getPath('userData'), 'logs');
        this.logFile = path.join(this.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
        this.ensureLogDirectory();
    }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    setLogLevel(level) {
        this.logLevel = level;
    }
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }
    formatMessage(level, message, meta) {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level}] ${message}${metaStr}`;
    }
    writeToFile(formattedMessage) {
        try {
            fs.appendFileSync(this.logFile, formattedMessage + '\n');
        }
        catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
    log(level, levelName, message, meta) {
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
    debug(message, meta) {
        this.log(LogLevel.DEBUG, 'DEBUG', message, meta);
    }
    info(message, meta) {
        this.log(LogLevel.INFO, 'INFO', message, meta);
    }
    warn(message, meta) {
        this.log(LogLevel.WARN, 'WARN', message, meta);
    }
    error(message, error) {
        const meta = error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
        } : error;
        this.log(LogLevel.ERROR, 'ERROR', message, meta);
    }
    // 清理旧日志文件
    cleanOldLogs(daysToKeep = 30) {
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
        }
        catch (error) {
            this.error('Failed to clean old logs', error);
        }
    }
}
exports.Logger = Logger;
// 创建全局实例
exports.logger = Logger.getInstance();
//# sourceMappingURL=Logger.js.map
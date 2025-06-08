export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export declare class Logger {
    private static instance;
    private logLevel;
    private logDir;
    private logFile;
    private constructor();
    static getInstance(): Logger;
    setLogLevel(level: LogLevel): void;
    private ensureLogDirectory;
    private formatMessage;
    private writeToFile;
    private log;
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, error?: Error | any): void;
    cleanOldLogs(daysToKeep?: number): void;
}
export declare const logger: Logger;
//# sourceMappingURL=Logger.d.ts.map
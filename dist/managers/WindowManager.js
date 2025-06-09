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
exports.WindowManager = void 0;
const electron_1 = require("electron");
const events_1 = require("events");
const path = __importStar(require("path"));
const Logger_1 = require("../utils/Logger");
class WindowManager extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.window = null;
        this.isDocked = false;
        this.dockSide = 'right';
        this.isHidden = false;
        this.mouseLeaveTimer = null;
    }
    createWindow() {
        const { width: screenWidth, height: screenHeight } = electron_1.screen.getPrimaryDisplay().workAreaSize;
        this.window = new electron_1.BrowserWindow({
            width: this.config.width,
            height: Math.min(this.config.height, screenHeight - 100),
            x: screenWidth - this.config.width - 20,
            y: 50,
            frame: false,
            resizable: true,
            alwaysOnTop: this.config.alwaysOnTop,
            skipTaskbar: true,
            transparent: true,
            show: false, // 初始不显示，等待内容加载完成
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, '../preload.js'),
                backgroundThrottling: false, // 防止后台节流
            },
        });
        // 设置初始隐藏状态，因为窗口创建时 show: false
        this.isHidden = true;
        this.setupWindowEvents();
        this.initDocking();
        Logger_1.logger.info('Window created successfully', {
            width: this.config.width,
            height: this.config.height,
            alwaysOnTop: this.config.alwaysOnTop
        });
        return this.window;
    }
    setupWindowEvents() {
        if (!this.window)
            return;
        // 窗口关闭事件
        this.window.on('close', (event) => {
            event.preventDefault();
            this.hide();
            Logger_1.logger.debug('Window close prevented, hiding instead');
        });
        // 窗口最小化事件
        this.window.on('minimize', () => {
            this.hide();
        });
        // 窗口失去焦点
        this.window.on('blur', () => {
            if (this.config.autoHide && !this.isDocked) {
                this.startHideTimer();
            }
        });
        // 窗口获得焦点
        this.window.on('focus', () => {
            this.clearHideTimer();
        }); // 窗口准备就绪
        this.window.once('ready-to-show', () => {
            // 不自动显示窗口，让用户通过托盘或快捷键显示
            // 窗口显示逻辑现在由主进程的 handleCommandLineArgs 方法控制
            Logger_1.logger.info('Window ready to show (controlled by startup logic)');
        });
        // 窗口移动事件
        this.window.on('moved', () => {
            if (this.config.dockToSide) {
                this.checkDocking();
            }
        });
        // 鼠标进入窗口
        this.window.webContents.on('dom-ready', () => {
            this.window?.webContents.executeJavaScript(`
        document.addEventListener('mouseenter', () => {
          window.electronAPI?.windowEvents?.mouseEnter();
        });
        
        document.addEventListener('mouseleave', () => {
          window.electronAPI?.windowEvents?.mouseLeave();
        });
      `);
        });
    }
    initDocking() {
        if (!this.config.dockToSide || !this.window)
            return;
        // 检查初始位置是否需要吸附
        this.checkDocking();
    }
    checkDocking() {
        if (!this.window || !this.config.dockToSide)
            return;
        const bounds = this.window.getBounds();
        const display = electron_1.screen.getDisplayMatching(bounds);
        const { x: screenX, y: screenY, width: screenWidth, height: screenHeight } = display.workArea;
        // 检查是否接近屏幕边缘
        let shouldDock = false;
        let newX = bounds.x;
        let newSide = this.dockSide;
        // 检查左边缘
        if (bounds.x <= screenX + this.config.dockThreshold) {
            newX = screenX - bounds.width + this.config.dockOffset;
            newSide = 'left';
            shouldDock = true;
        }
        // 检查右边缘
        else if (bounds.x + bounds.width >= screenX + screenWidth - this.config.dockThreshold) {
            newX = screenX + screenWidth - this.config.dockOffset;
            newSide = 'right';
            shouldDock = true;
        }
        if (shouldDock && (!this.isDocked || newSide !== this.dockSide)) {
            this.dockToSide(newSide, newX, bounds.y);
        }
        else if (!shouldDock && this.isDocked) {
            this.undock();
        }
    }
    dockToSide(side, x, y) {
        if (!this.window)
            return;
        this.window.setBounds({ x, y });
        this.isDocked = true;
        this.dockSide = side;
        Logger_1.logger.debug(`Window docked to ${side}`, { x, y });
        this.emit('window-docked', { side, x, y });
    }
    undock() {
        this.isDocked = false;
        Logger_1.logger.debug('Window undocked');
        this.emit('window-undocked');
    }
    startHideTimer() {
        this.clearHideTimer();
        this.mouseLeaveTimer = setTimeout(() => {
            if (this.config.autoHide && !this.window?.isFocused()) {
                this.hide();
            }
        }, 2000); // 2秒后隐藏
    }
    clearHideTimer() {
        if (this.mouseLeaveTimer) {
            clearTimeout(this.mouseLeaveTimer);
            this.mouseLeaveTimer = null;
        }
    }
    // 公共方法
    show() {
        if (this.window) {
            this.window.show();
            this.isHidden = false;
            this.emit('window-shown');
            Logger_1.logger.debug('Window shown');
        }
    }
    hide() {
        if (this.window && !this.isHidden) {
            this.window.hide();
            this.isHidden = true;
            this.emit('window-hidden');
            Logger_1.logger.debug('Window hidden');
        }
    }
    toggle() {
        if (this.isHidden) {
            this.show();
        }
        else {
            this.hide();
        }
    }
    focus() {
        if (this.window) {
            this.window.focus();
            this.show();
        }
    }
    isVisible() {
        return this.window?.isVisible() || false;
    }
    isFocused() {
        return this.window?.isFocused() || false;
    }
    getBounds() {
        return this.window?.getBounds();
    }
    setBounds(bounds) {
        if (this.window) {
            this.window.setBounds(bounds);
        }
    }
    setAlwaysOnTop(flag) {
        if (this.window) {
            this.window.setAlwaysOnTop(flag);
            this.config.alwaysOnTop = flag;
        }
    }
    toggleAlwaysOnTop() {
        const newValue = !this.config.alwaysOnTop;
        this.setAlwaysOnTop(newValue);
        return newValue;
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (this.window) {
            if (newConfig.alwaysOnTop !== undefined) {
                this.window.setAlwaysOnTop(newConfig.alwaysOnTop);
            }
        }
        Logger_1.logger.info('Window config updated', newConfig);
    }
    // 鼠标事件处理
    handleMouseEnter() {
        this.clearHideTimer();
        if (this.isDocked && this.isHidden) {
            this.show();
        }
    }
    handleMouseLeave() {
        if (this.isDocked && this.config.autoHide) {
            this.startHideTimer();
        }
    }
    destroy() {
        this.clearHideTimer();
        if (this.window) {
            this.window.destroy();
            this.window = null;
        }
        this.removeAllListeners();
        Logger_1.logger.info('Window manager destroyed');
    }
    getWindow() {
        return this.window;
    }
}
exports.WindowManager = WindowManager;
//# sourceMappingURL=WindowManager.js.map
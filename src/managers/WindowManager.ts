import { BrowserWindow, screen, app } from 'electron';
import { EventEmitter } from 'events';
import * as path from 'path';
import { WindowConfig } from '../types';
import { logger } from '../utils/Logger';

export class WindowManager extends EventEmitter {
    private window: BrowserWindow | null = null;
    private isDocked = false;
    private dockSide: 'left' | 'right' | 'top' = 'right';
    private isHidden = false;
    private mouseLeaveTimer: NodeJS.Timeout | null = null;

    constructor(private config: WindowConfig) {
        super();
    } createWindow(): BrowserWindow {
        const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

        this.window = new BrowserWindow({
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
                webviewTag: true, // 启用webview标签支持
            },
        });

        // 设置初始隐藏状态，因为窗口创建时 show: false
        this.isHidden = true;

        this.setupWindowEvents();
        this.initDocking();

        logger.info('Window created successfully', {
            width: this.config.width,
            height: this.config.height,
            alwaysOnTop: this.config.alwaysOnTop
        });

        return this.window;
    }

    private setupWindowEvents(): void {
        if (!this.window) return;

        // 窗口关闭事件
        this.window.on('close', (event) => {
            event.preventDefault();
            this.hide();
            logger.debug('Window close prevented, hiding instead');
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
        });

        // 窗口准备就绪
        this.window.once('ready-to-show', () => {
            // 不自动显示窗口，让用户通过托盘或快捷键显示
            // 窗口显示逻辑现在由主进程的 handleCommandLineArgs 方法控制
            logger.info('Window ready to show (controlled by startup logic)');
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

    private initDocking(): void {
        if (!this.config.dockToSide || !this.window) return;

        // 检查初始位置是否需要吸附
        this.checkDocking();
    }

    private checkDocking(): void {
        if (!this.window || !this.config.dockToSide) return;

        const bounds = this.window.getBounds();
        const display = screen.getDisplayMatching(bounds);
        const { x: screenX, y: screenY, width: screenWidth, height: screenHeight } = display.workArea;

        // 检查是否接近屏幕边缘
        let shouldDock = false;
        let newX = bounds.x;
        let newSide: 'left' | 'right' | 'top' = this.dockSide;

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
        } else if (!shouldDock && this.isDocked) {
            this.undock();
        }
    }

    private dockToSide(side: 'left' | 'right' | 'top', x: number, y: number): void {
        if (!this.window) return;

        this.window.setBounds({ x, y });
        this.isDocked = true;
        this.dockSide = side;

        logger.debug(`Window docked to ${side}`, { x, y });
        this.emit('window-docked', { side, x, y });
    }

    private undock(): void {
        this.isDocked = false;
        logger.debug('Window undocked');
        this.emit('window-undocked');
    }

    private startHideTimer(): void {
        this.clearHideTimer();
        this.mouseLeaveTimer = setTimeout(() => {
            if (this.config.autoHide && !this.window?.isFocused()) {
                this.hide();
            }
        }, 2000); // 2秒后隐藏
    }

    private clearHideTimer(): void {
        if (this.mouseLeaveTimer) {
            clearTimeout(this.mouseLeaveTimer);
            this.mouseLeaveTimer = null;
        }
    }

    // 公共方法

    show(): void {
        if (this.window) {
            this.window.show();
            this.isHidden = false;
            this.emit('window-shown');
            logger.debug('Window shown');
        }
    }

    hide(): void {
        if (this.window && !this.isHidden) {
            this.window.hide();
            this.isHidden = true;
            this.emit('window-hidden');
            logger.debug('Window hidden');
        }
    }

    toggle(): void {
        if (this.isHidden) {
            this.show();
        } else {
            this.hide();
        }
    }

    focus(): void {
        if (this.window) {
            this.window.focus();
            this.show();
        }
    }

    isVisible(): boolean {
        return this.window?.isVisible() || false;
    }

    isFocused(): boolean {
        return this.window?.isFocused() || false;
    }

    getBounds() {
        return this.window?.getBounds();
    }

    setBounds(bounds: { x?: number; y?: number; width?: number; height?: number }) {
        if (this.window) {
            this.window.setBounds(bounds);
        }
    }
    setAlwaysOnTop(flag: boolean): void {
        if (this.window) {
            this.window.setAlwaysOnTop(flag);
            this.config.alwaysOnTop = flag;
        }
    }

    toggleAlwaysOnTop(): boolean {
        const newValue = !this.config.alwaysOnTop;
        this.setAlwaysOnTop(newValue);
        return newValue;
    }

    updateConfig(newConfig: Partial<WindowConfig>): void {
        this.config = { ...this.config, ...newConfig };

        if (this.window) {
            if (newConfig.alwaysOnTop !== undefined) {
                this.window.setAlwaysOnTop(newConfig.alwaysOnTop);
            }
        }

        logger.info('Window config updated', newConfig);
    }

    // 鼠标事件处理
    handleMouseEnter(): void {
        this.clearHideTimer();
        if (this.isDocked && this.isHidden) {
            this.show();
        }
    }

    handleMouseLeave(): void {
        if (this.isDocked && this.config.autoHide) {
            this.startHideTimer();
        }
    }

    destroy(): void {
        this.clearHideTimer();
        if (this.window) {
            this.window.destroy();
            this.window = null;
        }
        this.removeAllListeners();
        logger.info('Window manager destroyed');
    }

    getWindow(): BrowserWindow | null {
        return this.window;
    }
}

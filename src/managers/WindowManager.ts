import { BrowserWindow, screen, app, globalShortcut } from 'electron';
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
    private alwaysOnTopTimer: NodeJS.Timeout | null = null; private cursorMonitorTimer: NodeJS.Timeout | null = null;
    private lastCursorPos = { x: 0, y: 0 };
    private triggerZoneWidth = 5; // 触发区域宽度（像素）
    private isInTriggerZone = false; // 跟踪鼠标是否在触发区域
    private isDev: boolean;
    // 动画持续时间配置
    private showAnimationDuration = 150; // 显示动画持续时间(毫秒)
    private hideAnimationDuration = 40;  // 隐藏动画持续时间(毫秒)

    constructor(private config: WindowConfig, isDev = false) {
        super();
        this.isDev = isDev;
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
        });        // 设置初始隐藏状态，因为窗口创建时 show: false
        this.isHidden = true; this.setupWindowEvents();
        this.initDocking();

        // 初始化强制置顶功能
        this.enforceAlwaysOnTop();

        // 启动光标监听（仅当启用吸附功能时）
        if (this.config.dockToSide) {
            this.startCursorMonitoring();
        }

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
        });        // 鼠标进入窗口
        this.window.webContents.on('dom-ready', () => {
            this.window?.webContents.executeJavaScript(`
        document.addEventListener('mouseenter', () => {
          window.electronAPI?.windowEvents?.mouseEnter();
        });
        
        document.addEventListener('mouseleave', () => {
          window.electronAPI?.windowEvents?.mouseLeave();
        });
      `);
        });        // 开发者工具快捷键支持（仅开发模式）
        this.window.webContents.on('before-input-event', (event, input) => {
            // 只在开发模式下允许 F12 或 Ctrl+Shift+I 打开/关闭开发者工具
            if ((input.key === 'F12' || (input.control && input.shift && input.key === 'I')) &&
                this.isDev) {
                if (this.window?.webContents.isDevToolsOpened()) {
                    this.window.webContents.closeDevTools();
                    logger.info('DevTools closed (development mode)');
                } else {
                    this.window?.webContents.openDevTools({ mode: 'detach' });
                    logger.info('DevTools opened (development mode)');
                }
            } else if ((input.key === 'F12' || (input.control && input.shift && input.key === 'I')) &&
                !this.isDev) {
                logger.warn('DevTools access denied - not in development mode');
            }
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
        const { x: screenX, y: screenY, width: screenWidth, height: screenHeight } = display.workArea;        // 检查是否接近屏幕边缘
        let shouldDock = false;
        let newX = bounds.x;
        let newY = bounds.y;
        let newSide: 'left' | 'right' | 'top' = this.dockSide;

        // 检查顶部边缘（优先级最高）
        if (bounds.y <= screenY + this.config.dockThreshold) {
            newY = screenY - bounds.height + this.config.dockOffset;
            newSide = 'top';
            shouldDock = true;
        }
        // 检查左边缘
        else if (bounds.x <= screenX + this.config.dockThreshold) {
            newX = screenX - bounds.width + this.config.dockOffset;
            newSide = 'left';
            shouldDock = true;
        }
        // 检查右边缘
        else if (bounds.x + bounds.width >= screenX + screenWidth - this.config.dockThreshold) {
            newX = screenX + screenWidth - this.config.dockOffset;
            newSide = 'right';
            shouldDock = true;
        } if (shouldDock && (!this.isDocked || newSide !== this.dockSide)) {
            this.dockToSide(newSide, newX, newY);
        } else if (!shouldDock && this.isDocked) {
            this.undock();
        }
    } private dockToSide(side: 'left' | 'right' | 'top', x: number, y: number): void {
        if (!this.window) return;

        this.window.setBounds({ x, y, width: this.window.getBounds().width, height: this.window.getBounds().height });
        this.isDocked = true;
        this.dockSide = side;

        // 吸附后自动隐藏窗口
        if (this.config.autoHide) {
            setTimeout(() => {
                this.hideToEdge();
            }, 1000); // 1秒后自动隐藏
        }

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
    }    /**
     * 启动光标位置监听（优化性能）
     */
    private startCursorMonitoring(): void {
        if (this.cursorMonitorTimer) {
            clearInterval(this.cursorMonitorTimer);
        }

        // 优化检查频率：每30ms检查一次，在性能和响应性之间平衡
        this.cursorMonitorTimer = setInterval(() => {
            if (this.isDocked) {
                this.checkCursorPosition();
            }
        }, 30);

        logger.info('Cursor monitoring started with optimized interval');
    }

    /**
     * 停止光标位置监听
     */
    private stopCursorMonitoring(): void {
        if (this.cursorMonitorTimer) {
            clearInterval(this.cursorMonitorTimer);
            this.cursorMonitorTimer = null;
            logger.info('Cursor monitoring stopped');
        }
    }    /**
     * 检查光标位置是否触发显示条件
     */
    private checkCursorPosition(): void {
        if (!this.window || !this.isDocked) return;

        try {
            // 获取当前光标位置
            const cursorPos = screen.getCursorScreenPoint();

            // 获取主显示器信息
            const display = screen.getPrimaryDisplay();
            const { x: screenX, y: screenY, width: screenWidth, height: screenHeight } = display.workArea;

            // 获取窗口位置信息
            const windowBounds = this.window.getBounds();

            let isInTriggerZone = false;

            // 根据吸附边检查触发条件
            switch (this.dockSide) {
                case 'left':
                    // 检查光标是否接近左边缘
                    if (cursorPos.x <= screenX + this.triggerZoneWidth &&
                        cursorPos.y >= windowBounds.y &&
                        cursorPos.y <= windowBounds.y + windowBounds.height) {
                        isInTriggerZone = true;
                    }
                    break;

                case 'right':
                    // 检查光标是否接近右边缘
                    if (cursorPos.x >= screenX + screenWidth - this.triggerZoneWidth &&
                        cursorPos.y >= windowBounds.y &&
                        cursorPos.y <= windowBounds.y + windowBounds.height) {
                        isInTriggerZone = true;
                    }
                    break;

                case 'top':
                    // 检查光标是否接近顶部边缘
                    if (cursorPos.y <= screenY + this.triggerZoneWidth &&
                        cursorPos.x >= windowBounds.x &&
                        cursorPos.x <= windowBounds.x + windowBounds.width) {
                        isInTriggerZone = true;
                    }
                    break;
            }

            // 更新触发区域状态
            const wasInTriggerZone = this.isInTriggerZone;
            this.isInTriggerZone = isInTriggerZone;

            // 只有当鼠标刚进入触发区域且窗口隐藏时才显示窗口
            if (isInTriggerZone && !wasInTriggerZone && this.isHidden) {
                this.showFromEdge();
                logger.debug(`Window triggered by cursor at ${this.dockSide} edge`, cursorPos);
            }
            // 如果鼠标离开触发区域且窗口显示，开始监听鼠标离开
            else if (!isInTriggerZone && wasInTriggerZone && !this.isHidden) {
                this.startMouseLeaveMonitoring();
                logger.debug(`Mouse left trigger zone, starting leave monitoring`);
            }

        } catch (error) {
            logger.error('Error checking cursor position:', error);
        }
    }/**
     * 从边缘显示窗口（带动画效果）
     */
    private showFromEdge(): void {
        if (!this.window || !this.isHidden) return;

        // 使用动画版本提供更好的用户体验
        this.showFromEdgeWithAnimation();

        logger.debug('Window triggered from edge with animation');
    }/**
     * 从边缘快速显示窗口（带动画效果）
     */
    private showFromEdgeWithAnimation(): void {
        if (!this.window || !this.isHidden) return;

        try {
            // 先设置窗口到隐藏位置
            const currentBounds = this.window.getBounds();
            const display = screen.getDisplayMatching(currentBounds);
            const { x: screenX, y: screenY, width: screenWidth, height: screenHeight } = display.workArea;

            let startX = currentBounds.x;
            let startY = currentBounds.y;
            let targetX = currentBounds.x;
            let targetY = currentBounds.y;

            // 根据吸附方向计算起始和目标位置
            switch (this.dockSide) {
                case 'left':
                    startX = screenX - currentBounds.width + this.config.dockOffset;
                    targetX = screenX + 10; // 显示时稍微偏移一点
                    break;
                case 'right':
                    startX = screenX + screenWidth - this.config.dockOffset;
                    targetX = screenX + screenWidth - currentBounds.width - 10;
                    break;
                case 'top':
                    startY = screenY - currentBounds.height + this.config.dockOffset;
                    targetY = screenY + 10;
                    break;
            }

            // 设置起始位置并显示窗口
            this.window.setBounds({
                x: startX,
                y: startY,
                width: currentBounds.width,
                height: currentBounds.height
            });

            this.show(); // 显示窗口            // 快速滑入动画
            const startTime = Date.now();
            const duration = this.showAnimationDuration; // 使用可配置的显示动画持续时间
            const deltaX = targetX - startX;
            const deltaY = targetY - startY;

            const animate = () => {
                if (!this.window || this.window.isDestroyed() || this.isHidden) return;

                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // 使用easeOut缓动
                const easeProgress = 1 - Math.pow(1 - progress, 2);

                const currentX = startX + deltaX * easeProgress;
                const currentY = startY + deltaY * easeProgress;

                this.window.setBounds({
                    x: Math.round(currentX),
                    y: Math.round(currentY),
                    width: currentBounds.width,
                    height: currentBounds.height
                });

                if (progress < 1) {
                    setImmediate(animate);
                } else {
                    // 动画完成，开始监听鼠标离开
                    this.startMouseLeaveMonitoring();
                    logger.debug(`Window shown from ${this.dockSide} edge with animation in ${Date.now() - startTime}ms`);
                }
            };

            animate();

        } catch (error) {
            logger.error('Error in showFromEdgeWithAnimation:', error);
            // 如果动画失败，直接显示
            this.show();
            this.startMouseLeaveMonitoring();
        }
    }

    /**
     * 开始监听鼠标离开窗口区域
     */
    private startMouseLeaveMonitoring(): void {
        if (!this.window || this.isHidden) return;

        // 使用定时器持续检查鼠标位置
        const checkMousePosition = () => {
            if (!this.window || this.isHidden) return;

            try {
                const cursorPos = screen.getCursorScreenPoint();
                const windowBounds = this.window.getBounds();
                // 检查光标是否在窗口区域内（减小缓冲区域，提高响应速度）
                const buffer = 5; // 进一步减少缓冲区域到5像素，更快响应
                const isInWindow = cursorPos.x >= windowBounds.x - buffer &&
                    cursorPos.x <= windowBounds.x + windowBounds.width + buffer &&
                    cursorPos.y >= windowBounds.y - buffer &&
                    cursorPos.y <= windowBounds.y + windowBounds.height + buffer;                // 如果鼠标不在窗口区域内，且也不在触发区域内，则开始隐藏倒计时
                if (!isInWindow && !this.isInTriggerZone) {
                    // 光标离开窗口区域且不在触发区域，立即开始快速隐藏
                    this.startFastHideTimer();
                } else if (isInWindow || this.isInTriggerZone) {
                    // 光标还在窗口区域或触发区域，清除隐藏倒计时
                    this.clearHideTimer();// 更频繁地检查，提高响应速度
                    setTimeout(checkMousePosition, 15); // 从20ms改为15ms，更快响应
                }
            } catch (error) {
                logger.error('Error checking mouse leave:', error);
            }
        };

        // 减少延迟，更快开始检查
        setTimeout(checkMousePosition, 100); // 从500ms改为100ms
    }    /**
     * 开始快速自动隐藏倒计时（更快响应）
     */
    private startFastHideTimer(): void {
        this.clearHideTimer();

        this.mouseLeaveTimer = setTimeout(() => {
            if (this.isDocked && !this.isHidden && this.config.autoHide) {
                this.hideToEdgeWithAnimation();
            }
        }, 30); // 进一步减少到30ms，为动画留出时间
    }

    /**
     * 隐藏窗口到边缘
     */
    private hideToEdge(): void {
        if (!this.window || this.isHidden) return;

        this.hide();
        logger.debug('Window hidden to edge');
    }

    /**
     * 带动画效果的快速隐藏到边缘
     */
    private hideToEdgeWithAnimation(): void {
        if (!this.window || this.isHidden) return;

        try {
            const currentBounds = this.window.getBounds();
            const display = screen.getDisplayMatching(currentBounds);
            const { x: screenX, y: screenY, width: screenWidth, height: screenHeight } = display.workArea;

            let targetX = currentBounds.x;
            let targetY = currentBounds.y;

            // 根据吸附方向计算目标位置
            switch (this.dockSide) {
                case 'left':
                    targetX = screenX - currentBounds.width + this.config.dockOffset;
                    break;
                case 'right':
                    targetX = screenX + screenWidth - this.config.dockOffset;
                    break;
                case 'top':
                    targetY = screenY - currentBounds.height + this.config.dockOffset;
                    break;
            }            // 快速动画：使用可配置的持续时间
            const startTime = Date.now();
            const duration = this.hideAnimationDuration; // 使用可配置的隐藏动画持续时间
            const startX = currentBounds.x;
            const startY = currentBounds.y;
            const deltaX = targetX - startX;
            const deltaY = targetY - startY;

            const animate = () => {
                if (!this.window || this.window.isDestroyed()) return;

                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // 使用easeOut缓动函数，让动画开始快速，结束时减速
                const easeProgress = 1 - Math.pow(1 - progress, 3);

                const currentX = startX + deltaX * easeProgress;
                const currentY = startY + deltaY * easeProgress;

                this.window.setBounds({
                    x: Math.round(currentX),
                    y: Math.round(currentY),
                    width: currentBounds.width,
                    height: currentBounds.height
                });

                if (progress < 1) {
                    // 使用 setImmediate 而不是 setTimeout 来获得更高的帧率
                    setImmediate(animate);
                } else {
                    // 动画完成，隐藏窗口
                    this.hide();
                    logger.debug(`Window hidden to ${this.dockSide} edge with animation in ${Date.now() - startTime}ms`);
                }
            };

            // 开始动画
            animate();

        } catch (error) {
            logger.error('Error in hideToEdgeWithAnimation:', error);
            // 如果动画失败，直接隐藏
            this.hideToEdge();
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
    } setAlwaysOnTop(flag: boolean): void {
        if (this.window) {
            // 使用更强制的置顶方式
            if (flag) {
                // 设置为置顶，使用 'screen-saver' 级别确保真正置顶
                this.window.setAlwaysOnTop(true, 'screen-saver');
                // 确保窗口获得焦点
                this.window.moveTop();
                this.window.focus();
                logger.info('Window set to always on top with screen-saver level');

                // 启动强制置顶检查
                this.enforceAlwaysOnTop();
            } else {
                this.window.setAlwaysOnTop(false);

                // 清理置顶检查定时器
                if (this.alwaysOnTopTimer) {
                    clearInterval(this.alwaysOnTopTimer);
                    this.alwaysOnTopTimer = null;
                }

                logger.info('Window always on top disabled');
            }
            this.config.alwaysOnTop = flag;
        }
    }

    toggleAlwaysOnTop(): boolean {
        const newValue = !this.config.alwaysOnTop;
        this.setAlwaysOnTop(newValue);
        return newValue;
    }

    isAlwaysOnTop(): boolean {
        return this.config.alwaysOnTop;
    } updateConfig(newConfig: Partial<WindowConfig>): void {
        this.config = { ...this.config, ...newConfig };

        if (this.window) {
            if (newConfig.alwaysOnTop !== undefined) {
                this.setAlwaysOnTop(newConfig.alwaysOnTop);
            }

            // 如果吸附设置发生变化，重新启动或停止光标监听
            if (newConfig.dockToSide !== undefined) {
                if (newConfig.dockToSide) {
                    this.startCursorMonitoring();
                } else {
                    this.stopCursorMonitoring();
                }
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
    } destroy(): void {
        this.clearHideTimer();
        this.stopCursorMonitoring();

        // 清理置顶检查定时器
        if (this.alwaysOnTopTimer) {
            clearInterval(this.alwaysOnTopTimer);
            this.alwaysOnTopTimer = null;
        }

        if (this.window) {
            this.window.destroy();
            this.window = null;
        }
        this.removeAllListeners();
        logger.info('Window manager destroyed');
    } getWindow(): BrowserWindow | null {
        return this.window;
    }

    /**
     * 设置边缘触发区域宽度
     */
    setTriggerZoneWidth(width: number): void {
        this.triggerZoneWidth = Math.max(1, Math.min(width, 50)); // 限制在1-50像素之间
        logger.info(`Trigger zone width set to ${this.triggerZoneWidth}px`);
    }

    /**
     * 获取当前触发区域宽度
     */
    getTriggerZoneWidth(): number {
        return this.triggerZoneWidth;
    }

    /**
     * 启用/禁用边缘触发功能
     */
    setEdgeTriggerEnabled(enabled: boolean): void {
        if (enabled && this.config.dockToSide) {
            this.startCursorMonitoring();
        } else {
            this.stopCursorMonitoring();
        }
        logger.info(`Edge trigger ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * 检查边缘触发功能是否启用
     */
    isEdgeTriggerEnabled(): boolean {
        return this.cursorMonitorTimer !== null;
    }

    /**
     * 强制窗口置顶并保持在最前面
     */
    private enforceAlwaysOnTop(): void {
        // 清除现有定时器
        if (this.alwaysOnTopTimer) {
            clearInterval(this.alwaysOnTopTimer);
            this.alwaysOnTopTimer = null;
        } if (this.window && this.config.alwaysOnTop) {
            // 定期检查并强制置顶
            this.alwaysOnTopTimer = setInterval(() => {
                if (this.window && !this.window.isDestroyed() && this.config.alwaysOnTop) {
                    this.window.setAlwaysOnTop(true, 'screen-saver');
                    this.window.moveTop();
                }
            }, 1000); // 每秒检查一次

            logger.info('Always on top enforcement started');
        }
    }    /**
     * 打开开发者工具（仅开发模式）
     */
    openDevTools(): void {
        if (!this.isDev) {
            logger.warn('DevTools access denied - not in development mode');
            return;
        }

        if (this.window && !this.window.webContents.isDevToolsOpened()) {
            this.window.webContents.openDevTools({ mode: 'detach' });
            logger.info('DevTools opened manually (development mode)');
        }
    }

    /**
     * 关闭开发者工具（仅开发模式）
     */
    closeDevTools(): void {
        if (!this.isDev) {
            logger.warn('DevTools access denied - not in development mode');
            return;
        }

        if (this.window && this.window.webContents.isDevToolsOpened()) {
            this.window.webContents.closeDevTools();
            logger.info('DevTools closed manually (development mode)');
        }
    }    /**
     * 切换开发者工具状态（仅开发模式）
     */
    toggleDevTools(): void {
        if (!this.isDev) {
            logger.warn('DevTools access denied - not in development mode');
            return;
        }

        if (this.window) {
            if (this.window.webContents.isDevToolsOpened()) {
                this.closeDevTools();
            } else {
                this.openDevTools();
            }
        }
    }

    /**
     * 更新动画设置
     */
    updateAnimationSettings(showDuration: number, hideDuration: number): void {
        this.showAnimationDuration = showDuration;
        this.hideAnimationDuration = hideDuration;
        logger.debug(`Animation settings updated: show=${showDuration}ms, hide=${hideDuration}ms`);
    }
}

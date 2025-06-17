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
    constructor(config, isDev = false) {
        super();
        this.config = config;
        this.window = null;
        this.isDocked = false;
        this.dockSide = 'right';
        this.isHidden = false;
        this.mouseLeaveTimer = null;
        this.alwaysOnTopTimer = null;
        this.cursorMonitorTimer = null;
        this.lastCursorPos = { x: 0, y: 0 };
        this.triggerZoneWidth = 5; // 触发区域宽度（像素）
        this.isInTriggerZone = false; // 跟踪鼠标是否在触发区域
        // 动画持续时间配置
        this.showAnimationDuration = 150; // 显示动画持续时间(毫秒)
        this.hideAnimationDuration = 40; // 隐藏动画持续时间(毫秒)
        // 储存窗口的原始尺寸，用于展开/收缩动画
        this.originalWindowBounds = null;
        this.isDev = isDev;
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
            backgroundColor: '#00000000', // 完全透明的背景
            hasShadow: false, // 禁用系统阴影，使用CSS阴影
            titleBarStyle: 'hidden', // 隐藏标题栏
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, '../preload.js'),
                backgroundThrottling: false, // 防止后台节流
                webviewTag: true, // 启用webview标签支持
                experimentalFeatures: true, // 启用实验性功能
            },
        });
        // 设置初始隐藏状态，因为窗口创建时 show: false
        this.isHidden = true;
        // 保存原始窗口尺寸
        this.originalWindowBounds = {
            width: this.config.width,
            height: Math.min(this.config.height, screenHeight - 100)
        };
        this.setupWindowEvents();
        this.initDocking();
        // 初始化强制置顶功能
        this.enforceAlwaysOnTop();
        // 启动光标监听（仅当启用吸附功能时）
        if (this.config.dockToSide) {
            this.startCursorMonitoring();
        }
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
        // 窗口关闭事件 - 直接退出应用而不是隐藏
        this.window.on('close', (event) => {
            // 不阻止关闭事件，让应用直接退出
            Logger_1.logger.debug('Window close - application will exit');
        });
        // 窗口最小化事件
        this.window.on('minimize', () => {
            this.hide();
        }); // 窗口失去焦点
        this.window.on('blur', () => {
            // 如果窗口置顶，则不自动隐藏
            if (this.config.autoHide && !this.isDocked && !this.config.alwaysOnTop) {
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
            Logger_1.logger.info('Window ready to show (controlled by startup logic)');
        }); // 窗口移动事件
        this.window.on('moved', () => {
            if (this.config.dockToSide) {
                this.checkDocking();
            }
        });
        // 窗口大小改变事件
        this.window.on('resized', () => {
            // 更新原始窗口尺寸，确保展开动画使用正确的尺寸
            const newBounds = this.window?.getBounds();
            if (newBounds && this.originalWindowBounds) {
                this.originalWindowBounds.width = newBounds.width;
                this.originalWindowBounds.height = newBounds.height;
                Logger_1.logger.debug('Window bounds updated after resize', {
                    width: newBounds.width,
                    height: newBounds.height
                });
            }
        }); // 鼠标进入窗口
        this.window.webContents.on('dom-ready', () => {
            this.window?.webContents.executeJavaScript(`
        document.addEventListener('mouseenter', () => {
          window.electronAPI?.windowEvents?.mouseEnter();
        });
        
        document.addEventListener('mouseleave', () => {
          window.electronAPI?.windowEvents?.mouseLeave();
        });
      `);
        }); // 开发者工具快捷键支持（仅开发模式）
        this.window.webContents.on('before-input-event', (event, input) => {
            // 只在开发模式下允许 F12 或 Ctrl+Shift+I 打开/关闭开发者工具
            if ((input.key === 'F12' || (input.control && input.shift && input.key === 'I')) &&
                this.isDev) {
                if (this.window?.webContents.isDevToolsOpened()) {
                    this.window.webContents.closeDevTools();
                    Logger_1.logger.info('DevTools closed (development mode)');
                }
                else {
                    this.window?.webContents.openDevTools({ mode: 'detach' });
                    Logger_1.logger.info('DevTools opened (development mode)');
                }
            }
            else if ((input.key === 'F12' || (input.control && input.shift && input.key === 'I')) &&
                !this.isDev) {
                Logger_1.logger.warn('DevTools access denied - not in development mode');
            }
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
        const { x: screenX, y: screenY, width: screenWidth, height: screenHeight } = display.workArea; // 检查是否接近屏幕边缘
        let shouldDock = false;
        let newX = bounds.x;
        let newY = bounds.y;
        let newSide = this.dockSide;
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
        }
        if (shouldDock && (!this.isDocked || newSide !== this.dockSide)) {
            this.dockToSide(newSide, newX, newY);
        }
        else if (!shouldDock && this.isDocked) {
            this.undock();
        }
    }
    dockToSide(side, x, y) {
        if (!this.window)
            return;
        this.window.setBounds({ x, y, width: this.window.getBounds().width, height: this.window.getBounds().height });
        this.isDocked = true;
        this.dockSide = side;
        // 吸附后自动隐藏窗口
        if (this.config.autoHide) {
            setTimeout(() => {
                this.hideToEdge();
            }, 1000); // 1秒后自动隐藏
        }
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
            // 如果窗口置顶，则不自动隐藏
            if (this.config.autoHide && !this.window?.isFocused() && !this.config.alwaysOnTop) {
                this.hide();
            }
        }, 2000); // 2秒后隐藏
    }
    clearHideTimer() {
        if (this.mouseLeaveTimer) {
            clearTimeout(this.mouseLeaveTimer);
            this.mouseLeaveTimer = null;
        }
    } /**
     * 启动光标位置监听（优化性能）
     */
    startCursorMonitoring() {
        if (this.cursorMonitorTimer) {
            clearInterval(this.cursorMonitorTimer);
        }
        // 优化检查频率：每30ms检查一次，在性能和响应性之间平衡
        this.cursorMonitorTimer = setInterval(() => {
            if (this.isDocked) {
                this.checkCursorPosition();
            }
        }, 30);
        Logger_1.logger.info('Cursor monitoring started with optimized interval');
    }
    /**
     * 停止光标位置监听
     */
    stopCursorMonitoring() {
        if (this.cursorMonitorTimer) {
            clearInterval(this.cursorMonitorTimer);
            this.cursorMonitorTimer = null;
            Logger_1.logger.info('Cursor monitoring stopped');
        }
    } /**
     * 检查光标位置是否触发显示条件
     */
    checkCursorPosition() {
        if (!this.window || !this.isDocked)
            return;
        try {
            // 获取当前光标位置
            const cursorPos = electron_1.screen.getCursorScreenPoint();
            // 获取主显示器信息
            const display = electron_1.screen.getPrimaryDisplay();
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
                Logger_1.logger.debug(`Window triggered by cursor at ${this.dockSide} edge`, cursorPos);
            }
            // 如果鼠标离开触发区域且窗口显示，开始监听鼠标离开
            else if (!isInTriggerZone && wasInTriggerZone && !this.isHidden) {
                this.startMouseLeaveMonitoring();
                Logger_1.logger.debug(`Mouse left trigger zone, starting leave monitoring`);
            }
        }
        catch (error) {
            Logger_1.logger.error('Error checking cursor position:', error);
        }
    } /**
     * 从边缘显示窗口（带动画效果）
     */
    showFromEdge() {
        if (!this.window || !this.isHidden)
            return;
        // 使用动画版本提供更好的用户体验
        this.showFromEdgeWithAnimation();
        Logger_1.logger.debug('Window triggered from edge with animation');
    } /**
     * 从边缘快速显示窗口（带动画效果）
     */
    showFromEdgeWithAnimation() {
        if (!this.window || !this.isHidden)
            return;
        try {
            // 先设置窗口到隐藏位置
            const currentBounds = this.window.getBounds();
            const display = electron_1.screen.getDisplayMatching(currentBounds);
            const { x: screenX, y: screenY, width: screenWidth, height: screenHeight } = display.workArea;
            let startX = currentBounds.x;
            let startY = currentBounds.y;
            let targetX = currentBounds.x;
            let targetY = currentBounds.y; // 根据吸附方向选择不同的动画策略
            if (this.dockSide === 'top') {
                // 顶部吸附：使用高度展开动画（从上到下）
                // 使用保存的原始尺寸作为目标尺寸，确保高度一致
                const finalWidth = this.originalWindowBounds?.width || this.config.width;
                const finalHeight = this.originalWindowBounds?.height || this.config.height;
                // 计算正确的展开位置：应该在屏幕可见区域内
                const expandTargetX = currentBounds.x;
                const expandTargetY = screenY + 10; // 稍微偏移一点，避免贴着屏幕边缘                // 设置初始状态：高度为1（避免0高度的问题），位置在目标位置
                this.window.setBounds({
                    x: expandTargetX,
                    y: expandTargetY,
                    width: finalWidth,
                    height: 1 // 初始高度为1像素，避免完全隐藏
                });
                this.show(); // 显示窗口
                // 展开动画 - 使用更平滑的实现
                const startTime = Date.now();
                const duration = this.showAnimationDuration;
                const frameInterval = 1000 / 60; // 60fps
                let lastFrameTime = 0;
                const animate = () => {
                    if (!this.window || this.window.isDestroyed() || this.isHidden)
                        return;
                    const now = Date.now();
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    // 使用三次贝塞尔曲线进行更平滑的缓动（类似CSS ease-out）
                    // bezier(0.25, 0.46, 0.45, 0.94) - 平滑的ease-out效果
                    const cubicBezier = (t) => {
                        const p0 = 0, p1 = 0.25, p2 = 0.45, p3 = 1;
                        const u = 1 - t;
                        return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
                    };
                    const easeProgress = cubicBezier(progress);
                    // 计算当前高度，确保精确到像素
                    const currentHeight = Math.round(1 + (finalHeight - 1) * easeProgress);
                    // 限制更新频率以减少闪烁，但在动画结束时确保设置最终状态
                    if (progress >= 1 || now - lastFrameTime >= frameInterval) {
                        lastFrameTime = now;
                        this.window.setBounds({
                            x: expandTargetX,
                            y: expandTargetY,
                            width: finalWidth,
                            height: currentHeight
                        });
                    }
                    if (progress < 1) {
                        // 使用requestAnimationFrame的替代方案，保持60fps
                        setTimeout(animate, 16); // ~60fps
                    }
                    else {
                        // 动画完成，确保最终状态精确
                        this.window.setBounds({
                            x: expandTargetX,
                            y: expandTargetY,
                            width: finalWidth,
                            height: finalHeight
                        });
                        // 开始监听鼠标离开
                        this.startMouseLeaveMonitoring();
                        Logger_1.logger.debug(`Window expanded from top with animation in ${Date.now() - startTime}ms, final size: ${finalWidth}x${finalHeight}`);
                    }
                };
                animate();
            }
            else {
                // 左右吸附：使用滑动动画
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
                }
                // 设置起始位置并显示窗口
                this.window.setBounds({
                    x: startX,
                    y: startY,
                    width: currentBounds.width,
                    height: currentBounds.height
                });
                this.show(); // 显示窗口
                // 滑动动画
                const startTime = Date.now();
                const duration = this.showAnimationDuration;
                const deltaX = targetX - startX;
                const deltaY = targetY - startY;
                const animate = () => {
                    if (!this.window || this.window.isDestroyed() || this.isHidden)
                        return;
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
                    }
                    else {
                        // 动画完成，开始监听鼠标离开
                        this.startMouseLeaveMonitoring();
                        Logger_1.logger.debug(`Window shown from ${this.dockSide} edge with animation in ${Date.now() - startTime}ms`);
                    }
                };
                animate();
            }
        }
        catch (error) {
            Logger_1.logger.error('Error in showFromEdgeWithAnimation:', error);
            // 如果动画失败，直接显示
            this.show();
            this.startMouseLeaveMonitoring();
        }
    }
    /**
     * 开始监听鼠标离开窗口区域
     */
    startMouseLeaveMonitoring() {
        if (!this.window || this.isHidden)
            return;
        // 使用定时器持续检查鼠标位置
        const checkMousePosition = () => {
            if (!this.window || this.isHidden)
                return;
            try {
                const cursorPos = electron_1.screen.getCursorScreenPoint();
                const windowBounds = this.window.getBounds();
                // 检查光标是否在窗口区域内（减小缓冲区域，提高响应速度）
                const buffer = 5; // 进一步减少缓冲区域到5像素，更快响应
                const isInWindow = cursorPos.x >= windowBounds.x - buffer &&
                    cursorPos.x <= windowBounds.x + windowBounds.width + buffer &&
                    cursorPos.y >= windowBounds.y - buffer &&
                    cursorPos.y <= windowBounds.y + windowBounds.height + buffer; // 如果鼠标不在窗口区域内，且也不在触发区域内，则开始隐藏倒计时
                if (!isInWindow && !this.isInTriggerZone) {
                    // 光标离开窗口区域且不在触发区域，立即开始快速隐藏
                    this.startFastHideTimer();
                }
                else if (isInWindow || this.isInTriggerZone) {
                    // 光标还在窗口区域或触发区域，清除隐藏倒计时
                    this.clearHideTimer(); // 更频繁地检查，提高响应速度
                    setTimeout(checkMousePosition, 15); // 从20ms改为15ms，更快响应
                }
            }
            catch (error) {
                Logger_1.logger.error('Error checking mouse leave:', error);
            }
        };
        // 减少延迟，更快开始检查
        setTimeout(checkMousePosition, 100); // 从500ms改为100ms
    } /**
     * 开始快速自动隐藏倒计时（更快响应）
     */
    startFastHideTimer() {
        this.clearHideTimer();
        this.mouseLeaveTimer = setTimeout(() => {
            // 如果窗口置顶，则不自动隐藏
            if (this.isDocked && !this.isHidden && this.config.autoHide && !this.config.alwaysOnTop) {
                this.hideToEdgeWithAnimation();
            }
        }, 30); // 进一步减少到30ms，为动画留出时间
    }
    /**
     * 隐藏窗口到边缘
     */
    hideToEdge() {
        if (!this.window || this.isHidden)
            return;
        this.hide();
        Logger_1.logger.debug('Window hidden to edge');
    }
    /**
     * 带动画效果的快速隐藏到边缘
     */
    hideToEdgeWithAnimation() {
        if (!this.window || this.isHidden)
            return;
        try {
            const currentBounds = this.window.getBounds();
            const display = electron_1.screen.getDisplayMatching(currentBounds);
            const { x: screenX, y: screenY, width: screenWidth, height: screenHeight } = display.workArea;
            let targetX = currentBounds.x;
            let targetY = currentBounds.y; // 根据吸附方向选择不同的动画策略
            if (this.dockSide === 'top') {
                // 顶部吸附：使用高度收缩动画（从下到上）
                const startTime = Date.now();
                const duration = this.hideAnimationDuration;
                const initialHeight = currentBounds.height;
                const originalBounds = { ...currentBounds }; // 保存原始窗口尺寸
                const frameInterval = 1000 / 60; // 60fps
                let lastFrameTime = 0;
                const animate = () => {
                    if (!this.window || this.window.isDestroyed())
                        return;
                    const now = Date.now();
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    // 使用平滑的easeIn缓动（收缩动画）
                    const easeProgress = progress * progress * (3 - 2 * progress); // smoothstep函数
                    // 计算当前高度（从原始高度逐渐减小到1像素）
                    const currentHeight = Math.round(initialHeight * (1 - easeProgress) + 1 * easeProgress);
                    // 限制更新频率以减少闪烁
                    if (progress >= 1 || now - lastFrameTime >= frameInterval) {
                        lastFrameTime = now;
                        this.window.setBounds({
                            x: currentBounds.x,
                            y: currentBounds.y,
                            width: currentBounds.width,
                            height: Math.max(1, currentHeight) // 确保最小高度为1像素
                        });
                    }
                    if (progress < 1) {
                        setTimeout(animate, 16); // ~60fps
                    }
                    else {
                        // 动画完成，先恢复原始窗口尺寸，再隐藏窗口
                        this.window.setBounds(originalBounds);
                        this.hide();
                        Logger_1.logger.debug(`Window collapsed to top with animation in ${Date.now() - startTime}ms`);
                    }
                };
                animate();
            }
            else {
                // 左右吸附：使用滑动动画
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
                }
                // 滑动动画
                const startTime = Date.now();
                const duration = this.hideAnimationDuration;
                const startX = currentBounds.x;
                const startY = currentBounds.y;
                const deltaX = targetX - startX;
                const deltaY = targetY - startY;
                const animate = () => {
                    if (!this.window || this.window.isDestroyed())
                        return;
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
                    }
                    else {
                        // 动画完成，隐藏窗口
                        this.hide();
                        Logger_1.logger.debug(`Window hidden to ${this.dockSide} edge with animation in ${Date.now() - startTime}ms`);
                    }
                };
                // 开始动画
                animate();
            }
        }
        catch (error) {
            Logger_1.logger.error('Error in hideToEdgeWithAnimation:', error);
            // 如果动画失败，直接隐藏
            this.hideToEdge();
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
            // 使用更强制的置顶方式
            if (flag) {
                // 设置为置顶，使用 'screen-saver' 级别确保真正置顶
                this.window.setAlwaysOnTop(true, 'screen-saver');
                // 确保窗口获得焦点
                this.window.moveTop();
                this.window.focus();
                Logger_1.logger.info('Window set to always on top with screen-saver level');
                // 启动强制置顶检查
                this.enforceAlwaysOnTop();
                // 清除所有隐藏计时器，置顶状态下不应该自动隐藏
                this.clearHideTimer();
            }
            else {
                this.window.setAlwaysOnTop(false);
                // 清理置顶检查定时器
                if (this.alwaysOnTopTimer) {
                    clearInterval(this.alwaysOnTopTimer);
                    this.alwaysOnTopTimer = null;
                }
                Logger_1.logger.info('Window always on top disabled');
            }
            this.config.alwaysOnTop = flag;
        }
    }
    toggleAlwaysOnTop() {
        const newValue = !this.config.alwaysOnTop;
        this.setAlwaysOnTop(newValue);
        return newValue;
    }
    isAlwaysOnTop() {
        return this.config.alwaysOnTop;
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (this.window) {
            if (newConfig.alwaysOnTop !== undefined) {
                this.setAlwaysOnTop(newConfig.alwaysOnTop);
            }
            // 如果吸附设置发生变化，重新启动或停止光标监听
            if (newConfig.dockToSide !== undefined) {
                if (newConfig.dockToSide) {
                    this.startCursorMonitoring();
                }
                else {
                    this.stopCursorMonitoring();
                }
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
        // 如果窗口置顶，则不自动隐藏
        if (this.isDocked && this.config.autoHide && !this.config.alwaysOnTop) {
            this.startHideTimer();
        }
    }
    destroy() {
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
        Logger_1.logger.info('Window manager destroyed');
    }
    getWindow() {
        return this.window;
    }
    /**
     * 设置边缘触发区域宽度
     */
    setTriggerZoneWidth(width) {
        this.triggerZoneWidth = Math.max(1, Math.min(width, 50)); // 限制在1-50像素之间
        Logger_1.logger.info(`Trigger zone width set to ${this.triggerZoneWidth}px`);
    }
    /**
     * 获取当前触发区域宽度
     */
    getTriggerZoneWidth() {
        return this.triggerZoneWidth;
    }
    /**
     * 启用/禁用边缘触发功能
     */
    setEdgeTriggerEnabled(enabled) {
        if (enabled && this.config.dockToSide) {
            this.startCursorMonitoring();
        }
        else {
            this.stopCursorMonitoring();
        }
        Logger_1.logger.info(`Edge trigger ${enabled ? 'enabled' : 'disabled'}`);
    }
    /**
     * 检查边缘触发功能是否启用
     */
    isEdgeTriggerEnabled() {
        return this.cursorMonitorTimer !== null;
    }
    /**
     * 强制窗口置顶并保持在最前面
     */
    enforceAlwaysOnTop() {
        // 清除现有定时器
        if (this.alwaysOnTopTimer) {
            clearInterval(this.alwaysOnTopTimer);
            this.alwaysOnTopTimer = null;
        }
        if (this.window && this.config.alwaysOnTop) {
            // 定期检查并强制置顶
            this.alwaysOnTopTimer = setInterval(() => {
                if (this.window && !this.window.isDestroyed() && this.config.alwaysOnTop) {
                    this.window.setAlwaysOnTop(true, 'screen-saver');
                    this.window.moveTop();
                }
            }, 1000); // 每秒检查一次
            Logger_1.logger.info('Always on top enforcement started');
        }
    } /**
     * 打开开发者工具（仅开发模式）
     */
    openDevTools() {
        if (!this.isDev) {
            Logger_1.logger.warn('DevTools access denied - not in development mode');
            return;
        }
        if (this.window && !this.window.webContents.isDevToolsOpened()) {
            this.window.webContents.openDevTools({ mode: 'detach' });
            Logger_1.logger.info('DevTools opened manually (development mode)');
        }
    }
    /**
     * 关闭开发者工具（仅开发模式）
     */
    closeDevTools() {
        if (!this.isDev) {
            Logger_1.logger.warn('DevTools access denied - not in development mode');
            return;
        }
        if (this.window && this.window.webContents.isDevToolsOpened()) {
            this.window.webContents.closeDevTools();
            Logger_1.logger.info('DevTools closed manually (development mode)');
        }
    } /**
     * 切换开发者工具状态（仅开发模式）
     */
    toggleDevTools() {
        if (!this.isDev) {
            Logger_1.logger.warn('DevTools access denied - not in development mode');
            return;
        }
        if (this.window) {
            if (this.window.webContents.isDevToolsOpened()) {
                this.closeDevTools();
            }
            else {
                this.openDevTools();
            }
        }
    } /**
     * 更新动画设置
     */
    updateAnimationSettings(showDuration, hideDuration) {
        this.showAnimationDuration = showDuration;
        this.hideAnimationDuration = hideDuration;
        Logger_1.logger.debug(`Animation settings updated: show=${showDuration}ms, hide=${hideDuration}ms`);
    }
    /**
     * 设置窗口透明度
     */
    setOpacity(opacity) {
        if (!this.window) {
            Logger_1.logger.error('Cannot set opacity: window not initialized');
            return;
        }
        // 确保透明度值在有效范围内 (0.1-1.0)
        const clampedOpacity = Math.max(0.1, Math.min(1.0, opacity));
        try {
            this.window.setOpacity(clampedOpacity);
            Logger_1.logger.debug(`Window opacity set to: ${clampedOpacity}`);
        }
        catch (error) {
            Logger_1.logger.error('Failed to set window opacity:', error);
        }
    }
    /**
     * 获取当前窗口透明度
     */
    getOpacity() {
        if (!this.window) {
            Logger_1.logger.error('Cannot get opacity: window not initialized');
            return 1.0;
        }
        try {
            const opacity = this.window.getOpacity();
            Logger_1.logger.debug(`Current window opacity: ${opacity}`);
            return opacity;
        }
        catch (error) {
            Logger_1.logger.error('Failed to get window opacity:', error);
            return 1.0;
        }
    }
}
exports.WindowManager = WindowManager;
//# sourceMappingURL=WindowManager.js.map
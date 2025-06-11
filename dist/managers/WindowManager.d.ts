import { BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import { WindowConfig } from '../types';
export declare class WindowManager extends EventEmitter {
    private config;
    private window;
    private isDocked;
    private dockSide;
    private isHidden;
    private mouseLeaveTimer;
    private alwaysOnTopTimer;
    private cursorMonitorTimer;
    private lastCursorPos;
    private triggerZoneWidth;
    private isInTriggerZone;
    constructor(config: WindowConfig);
    createWindow(): BrowserWindow;
    private setupWindowEvents;
    private initDocking;
    private checkDocking;
    private dockToSide;
    private undock;
    private startHideTimer;
    private clearHideTimer; /**
     * 启动光标位置监听（优化性能）
     */
    private startCursorMonitoring;
    /**
     * 停止光标位置监听
     */
    private stopCursorMonitoring; /**
     * 检查光标位置是否触发显示条件
     */
    private checkCursorPosition; /**
     * 从边缘显示窗口（带动画效果）
     */
    private showFromEdge; /**
     * 从边缘快速显示窗口（带动画效果）
     */
    private showFromEdgeWithAnimation;
    /**
     * 开始监听鼠标离开窗口区域
     */
    private startMouseLeaveMonitoring; /**
     * 开始快速自动隐藏倒计时（更快响应）
     */
    private startFastHideTimer;
    /**
     * 隐藏窗口到边缘
     */
    private hideToEdge;
    /**
     * 带动画效果的快速隐藏到边缘
     */
    private hideToEdgeWithAnimation;
    show(): void;
    hide(): void;
    toggle(): void;
    focus(): void;
    isVisible(): boolean;
    isFocused(): boolean;
    getBounds(): Electron.Rectangle | undefined;
    setBounds(bounds: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    }): void;
    setAlwaysOnTop(flag: boolean): void;
    toggleAlwaysOnTop(): boolean;
    isAlwaysOnTop(): boolean;
    updateConfig(newConfig: Partial<WindowConfig>): void;
    handleMouseEnter(): void;
    handleMouseLeave(): void;
    destroy(): void;
    getWindow(): BrowserWindow | null;
    /**
     * 设置边缘触发区域宽度
     */
    setTriggerZoneWidth(width: number): void;
    /**
     * 获取当前触发区域宽度
     */
    getTriggerZoneWidth(): number;
    /**
     * 启用/禁用边缘触发功能
     */
    setEdgeTriggerEnabled(enabled: boolean): void;
    /**
     * 检查边缘触发功能是否启用
     */
    isEdgeTriggerEnabled(): boolean;
    /**
     * 强制窗口置顶并保持在最前面
     */
    private enforceAlwaysOnTop;
    /**
     * 打开开发者工具
     */
    openDevTools(): void;
    /**
     * 关闭开发者工具
     */
    closeDevTools(): void;
    /**
     * 切换开发者工具状态
     */
    toggleDevTools(): void;
}
//# sourceMappingURL=WindowManager.d.ts.map
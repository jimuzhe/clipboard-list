import { EventEmitter } from 'events';
/**
 * 托盘管理器 - 简化版，只包含核心功能
 * 功能：显示/隐藏、快捷设置（自启动、窗口置顶）、退出
 */
export declare class TrayManager extends EventEmitter {
    private tray;
    private contextMenu;
    /**
     * 创建系统托盘
     */
    create(): void;
    /**
     * 获取托盘图标路径
     */
    private getIconPath;
    /**
     * 设置托盘菜单（简化版）
     */
    private setupTrayMenu;
    /**
     * 设置托盘事件
     */
    private setupTrayEvents;
    /**
     * 获取自启动状态
     */
    private getAutoStartStatus;
    /**
     * 更新自启动状态
     */
    updateAutoStartStatus(enabled: boolean): void;
    /**
     * 更新窗口置顶状态
     */
    updateAlwaysOnTopStatus(enabled: boolean): void;
    /**
     * 刷新菜单状态
     */
    refreshMenu(): void;
    /**
     * 显示气球提示
     */
    showBalloon(title: string, content: string, icon?: 'info' | 'warning' | 'error'): void;
    /**
     * 设置工具提示
     */
    setToolTip(tooltip: string): void;
    /**
     * 销毁托盘
     */
    destroy(): void;
    /**
     * 检查托盘是否已销毁
     */
    isDestroyed(): boolean;
}
//# sourceMappingURL=TrayManager.d.ts.map
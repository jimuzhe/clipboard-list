import { EventEmitter } from 'events';
export declare class TrayManager extends EventEmitter {
    private tray;
    private contextMenu;
    create(): void;
    private getIconPath;
    private createDefaultIcon;
    private setupTrayMenu;
    private setupTrayEvents;
    private getAutoStartStatus;
    updateAutoStartStatus(enabled: boolean): void;
    updateAlwaysOnTopStatus(enabled: boolean): void;
    showBalloon(title: string, content: string, icon?: 'info' | 'warning' | 'error'): void;
    setTitle(title: string): void;
    setToolTip(tooltip: string): void;
    updateIcon(iconType?: 'normal' | 'active' | 'disabled'): void;
    flash(duration?: number): void;
    destroy(): void;
    isDestroyed(): boolean;
}
//# sourceMappingURL=TrayManager.d.ts.map
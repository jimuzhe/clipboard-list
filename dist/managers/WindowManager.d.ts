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
    constructor(config: WindowConfig);
    createWindow(): BrowserWindow;
    private setupWindowEvents;
    private initDocking;
    private checkDocking;
    private dockToSide;
    private undock;
    private startHideTimer;
    private clearHideTimer;
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
    updateConfig(newConfig: Partial<WindowConfig>): void;
    handleMouseEnter(): void;
    handleMouseLeave(): void;
    destroy(): void;
    getWindow(): BrowserWindow | null;
}
//# sourceMappingURL=WindowManager.d.ts.map
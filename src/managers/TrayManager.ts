import { Tray, Menu, app, nativeImage } from 'electron';
import { EventEmitter } from 'events';
import * as path from 'path';
import { logger } from '../utils/Logger';

/**
 * 托盘管理器 - 简化版，只包含核心功能
 * 功能：显示/隐藏、快捷设置（自启动、窗口置顶）、退出
 */
export class TrayManager extends EventEmitter {
    private tray: Tray | null = null;
    private contextMenu: Menu | null = null;

    /**
     * 创建系统托盘
     */
    create(): void {
        if (this.tray) {
            logger.warn('Tray already exists');
            return;
        }

        try {
            const iconPath = this.getIconPath();
            let icon: Electron.NativeImage;

            if (iconPath && iconPath.length > 0) {
                icon = nativeImage.createFromPath(iconPath);
            } else {
                // 创建一个简单的默认图标
                icon = nativeImage.createEmpty();
            }

            // 调整图标大小适应系统托盘
            if (process.platform === 'win32') {
                icon.setTemplateImage(false);
            } this.tray = new Tray(icon);
            this.tray.setToolTip('移记 - 剪贴板和待办管理工具');
            this.setupTrayMenu();
            this.setupTrayEvents();

            logger.info('Tray created successfully');
            this.emit('tray-created');

        } catch (error) {
            logger.error('Failed to create tray', error);
            throw error;
        }
    }

    /**
     * 获取托盘图标路径
     */
    private getIconPath(): string {
        const iconPath = path.join(__dirname, '../../assets/tray-icon.png');

        try {
            if (require('fs').existsSync(iconPath)) {
                return iconPath;
            }
        } catch (error) {
            logger.warn('Failed to access tray icon file:', error);
        }

        // 如果文件不存在，返回空字符串使用默认图标
        logger.warn('Using system default tray icon');
        return '';
    }

    /**
     * 设置托盘菜单（简化版）
     */
    private setupTrayMenu(): void {
        if (!this.tray) return; this.contextMenu = Menu.buildFromTemplate([
            {
                label: '显示/隐藏',
                type: 'normal',
                click: () => {
                    this.emit('toggle-window');
                    logger.debug('Tray: Toggle window clicked');
                }
            },
            { type: 'separator' },
            {
                label: '开机自启动',
                type: 'checkbox',
                checked: this.getAutoStartStatus(),
                click: (menuItem) => {
                    this.emit('toggle-auto-start', menuItem.checked);
                    logger.debug('Tray: Auto start toggled', { checked: menuItem.checked });
                }
            },
            { type: 'separator' },
            {
                label: '退出',
                type: 'normal',
                click: () => {
                    this.emit('quit-app');
                    logger.info('Tray: Quit app clicked');
                }
            }]);

        this.tray.setContextMenu(this.contextMenu);
        this.tray.setToolTip('移记 - 剪贴板和待办管理工具');
    }

    /**
     * 设置托盘事件
     */
    private setupTrayEvents(): void {
        if (!this.tray) return;

        // 单击托盘图标 - 切换窗口显示
        this.tray.on('click', () => {
            this.emit('tray-clicked');
            logger.debug('Tray clicked');
        });

        // 双击托盘图标 - 显示窗口
        this.tray.on('double-click', () => {
            this.emit('tray-double-clicked');
            logger.debug('Tray double-clicked');
        });

        // 右击托盘图标 - 显示上下文菜单
        this.tray.on('right-click', () => {
            this.emit('tray-right-clicked');
            logger.debug('Tray right-clicked');
        });
    }

    /**
     * 获取自启动状态
     */
    private getAutoStartStatus(): boolean {
        try {
            const loginSettings = app.getLoginItemSettings();
            return loginSettings.openAtLogin;
        } catch (error) {
            logger.warn('Failed to get auto-start status:', error);
            return false;
        }
    }    /**
     * 更新自启动状态
     */
    updateAutoStartStatus(enabled: boolean): void {
        if (!this.contextMenu) return;

        const autoStartItem = this.contextMenu.items.find(item => item.label === '开机自启动');
        if (autoStartItem) {
            autoStartItem.checked = enabled;
        }
    }/**
     * 刷新菜单状态
     */
    refreshMenu(): void {
        if (!this.tray) return;
        this.setupTrayMenu();
    }

    /**
     * 显示气球提示
     */
    showBalloon(title: string, content: string, icon?: 'info' | 'warning' | 'error'): void {
        if (!this.tray) return;

        try {
            this.tray.displayBalloon({
                title,
                content,
                icon: icon || 'info'
            });
            logger.debug('Balloon shown', { title, content, icon });
        } catch (error) {
            logger.error('Failed to show balloon', error);
        }
    }

    /**
     * 设置工具提示
     */
    setToolTip(tooltip: string): void {
        if (this.tray) {
            this.tray.setToolTip(tooltip);
        }
    }

    /**
     * 销毁托盘
     */
    destroy(): void {
        if (this.tray) {
            this.tray.destroy();
            this.tray = null;
            this.contextMenu = null;
            logger.info('Tray destroyed');
        }
        this.removeAllListeners();
    }

    /**
     * 检查托盘是否已销毁
     */
    isDestroyed(): boolean {
        return this.tray === null || this.tray.isDestroyed();
    }
}

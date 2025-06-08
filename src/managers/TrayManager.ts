import { Tray, Menu, app, nativeImage, MenuItem } from 'electron';
import { EventEmitter } from 'events';
import * as path from 'path';
import { logger } from '../utils/Logger';

export class TrayManager extends EventEmitter {
    private tray: Tray | null = null;
    private contextMenu: Menu | null = null;

    create(): void {
        if (this.tray) {
            logger.warn('Tray already exists');
            return;
        } try {
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
            }

            this.tray = new Tray(icon);
            this.setupTrayMenu();
            this.setupTrayEvents();

            logger.info('Tray created successfully');
            this.emit('tray-created');

        } catch (error) {
            logger.error('Failed to create tray', error);
            throw error;
        }
    } private getIconPath(): string {
        // 使用项目中的托盘图标
        const iconPath = path.join(__dirname, '../../assets/tray-icon.png');

        try {
            if (require('fs').existsSync(iconPath)) {
                return iconPath;
            }
        } catch (error) {
            logger.warn('Failed to access tray icon file:', error);
        }

        // 如果文件不存在，创建默认图标
        return this.createDefaultIcon();
    }
    private createDefaultIcon(): string {
        try {
            // 尝试使用系统默认图标路径
            const systemIconPath = process.platform === 'win32'
                ? path.join(process.env.WINDIR || 'C:\\Windows', 'System32', 'shell32.dll')
                : '';

            // 如果是 Windows，返回空字符串让 Electron 使用默认图标
            // 其他平台也返回空字符串
            logger.warn('Using system default tray icon');
            return '';
        } catch (error) {
            logger.error('Failed to create default tray icon:', error);
            return '';
        }
    }

    private setupTrayMenu(): void {
        if (!this.tray) return;

        this.contextMenu = Menu.buildFromTemplate([
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
                label: '功能',
                type: 'submenu',
                submenu: [
                    {
                        label: '剪切板',
                        type: 'normal',
                        click: () => {
                            this.emit('show-tab', 'clipboard');
                        }
                    },
                    {
                        label: '待办事项',
                        type: 'normal',
                        click: () => {
                            this.emit('show-tab', 'todo');
                        }
                    },
                    {
                        label: '笔记',
                        type: 'normal',
                        click: () => {
                            this.emit('show-tab', 'notes');
                        }
                    },
                    { type: 'separator' },
                    {
                        label: '番茄时钟',
                        type: 'normal',
                        click: () => {
                            this.emit('show-pomodoro');
                        }
                    }
                ]
            },
            {
                label: '设置',
                type: 'submenu',
                submenu: [
                    {
                        label: '偏好设置',
                        type: 'normal',
                        click: () => {
                            this.emit('open-settings');
                            logger.debug('Tray: Settings clicked');
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
                    {
                        label: '窗口置顶',
                        type: 'checkbox',
                        checked: false, // 将由主进程更新
                        click: (menuItem) => {
                            this.emit('toggle-always-on-top', menuItem.checked);
                            logger.debug('Tray: Always on top toggled', { checked: menuItem.checked });
                        }
                    }
                ]
            },
            { type: 'separator' },
            {
                label: '关于',
                type: 'normal',
                click: () => {
                    this.emit('show-about');
                }
            },
            {
                label: '退出',
                type: 'normal',
                accelerator: 'CmdOrCtrl+Q',
                click: () => {
                    this.emit('quit-app');
                    logger.info('Tray: Quit app clicked');
                }
            }
        ]);

        this.tray.setContextMenu(this.contextMenu);
        this.tray.setToolTip('ClipBoard List - 智能剪切板管理工具');
    }

    private setupTrayEvents(): void {
        if (!this.tray) return;

        // 单击托盘图标
        this.tray.on('click', () => {
            this.emit('tray-clicked');
            logger.debug('Tray clicked');
        });

        // 双击托盘图标
        this.tray.on('double-click', () => {
            this.emit('tray-double-clicked');
            logger.debug('Tray double-clicked');
        });

        // 右击托盘图标（显示上下文菜单）
        this.tray.on('right-click', () => {
            this.emit('tray-right-clicked');
            logger.debug('Tray right-clicked');
        });

        // 气球提示点击
        this.tray.on('balloon-click', () => {
            this.emit('balloon-clicked');
        });
    }

    private getAutoStartStatus(): boolean {
        // 这里应该从配置中获取，暂时返回false
        return false;
    }

    // 公共方法

    updateAutoStartStatus(enabled: boolean): void {
        if (!this.contextMenu) return;

        const settingsMenu = this.contextMenu.items.find(item => item.label === '设置');
        if (settingsMenu && settingsMenu.submenu) {
            const autoStartItem = settingsMenu.submenu.items.find(item => item.label === '开机自启动');
            if (autoStartItem) {
                autoStartItem.checked = enabled;
            }
        }
    }

    updateAlwaysOnTopStatus(enabled: boolean): void {
        if (!this.contextMenu) return;

        const settingsMenu = this.contextMenu.items.find(item => item.label === '设置');
        if (settingsMenu && settingsMenu.submenu) {
            const alwaysOnTopItem = settingsMenu.submenu.items.find(item => item.label === '窗口置顶');
            if (alwaysOnTopItem) {
                alwaysOnTopItem.checked = enabled;
            }
        }
    }

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

    setTitle(title: string): void {
        if (this.tray) {
            this.tray.setTitle(title);
        }
    }

    setToolTip(tooltip: string): void {
        if (this.tray) {
            this.tray.setToolTip(tooltip);
        }
    }

    // 更新托盘图标（比如显示状态指示）
    updateIcon(iconType: 'normal' | 'active' | 'disabled' = 'normal'): void {
        if (!this.tray) return;

        try {
            let iconPath = this.getIconPath();

            // 根据状态选择不同的图标
            switch (iconType) {
                case 'active':
                    // 可以有一个激活状态的图标
                    iconPath = iconPath.replace('.png', '-active.png');
                    break;
                case 'disabled':
                    // 可以有一个禁用状态的图标
                    iconPath = iconPath.replace('.png', '-disabled.png');
                    break;
            }

            const icon = nativeImage.createFromPath(iconPath);
            this.tray.setImage(icon);

        } catch (error) {
            logger.error('Failed to update tray icon', error);
        }
    }

    // 闪烁托盘图标来吸引注意
    flash(duration: number = 3000): void {
        if (!this.tray) return;

        let isHighlighted = false;
        const interval = setInterval(() => {
            this.updateIcon(isHighlighted ? 'normal' : 'active');
            isHighlighted = !isHighlighted;
        }, 500);

        setTimeout(() => {
            clearInterval(interval);
            this.updateIcon('normal');
        }, duration);
    }

    destroy(): void {
        if (this.tray) {
            this.tray.destroy();
            this.tray = null;
            this.contextMenu = null;
            logger.info('Tray destroyed');
        }
        this.removeAllListeners();
    }

    isDestroyed(): boolean {
        return this.tray === null || this.tray.isDestroyed();
    }
}

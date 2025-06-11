import { app, shell, dialog, ipcMain } from 'electron';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs/promises';
import { logger } from '../utils/Logger';

// 更新信息接口
interface UpdateInfo {
    version: string;
    description: string;
    downloadUrl: string;
    releaseDate: string;
    changelog: string[];
    minSupportedVersion: string;
    isForced: boolean;
}

// 下载进度接口
interface DownloadProgress {
    percent: number;
    transferredBytes: number;
    totalBytes: number;
}

/**
 * 更新服务 - 负责检查和处理应用程序更新
 */
export class UpdateService extends EventEmitter {
    private updateUrl: string = 'https://explain.name666.top/downloads/update-info.json';
    private isChecking: boolean = false;
    private isDownloading: boolean = false;
    private currentVersion: string;
    private downloadPath: string;

    constructor() {
        super();
        this.currentVersion = app.getVersion();
        this.downloadPath = path.join(app.getPath('downloads'), '移记-Setup.exe');
        this.setupIPCHandlers();
    }

    /**
     * 设置IPC处理程序
     */
    private setupIPCHandlers(): void {
        ipcMain.handle('update:check', this.handleCheckUpdates.bind(this));
        ipcMain.handle('update:download', this.handleDownloadUpdate.bind(this));
        ipcMain.handle('update:install', this.handleInstallUpdate.bind(this));
        ipcMain.handle('update:get-current-version', this.handleGetCurrentVersion.bind(this));
    }

    /**
     * 检查更新
     */
    public async checkForUpdates(): Promise<{
        hasUpdate: boolean;
        updateInfo?: UpdateInfo;
        error?: string;
    }> {
        if (this.isChecking) {
            return { hasUpdate: false, error: '正在检查更新中...' };
        }

        this.isChecking = true;
        logger.info('开始检查更新...');

        try {
            const updateInfo = await this.fetchUpdateInfo();

            if (!updateInfo) {
                throw new Error('无法获取更新信息');
            }

            const hasUpdate = this.compareVersions(updateInfo.version, this.currentVersion) > 0;

            if (hasUpdate) {
                // 检查最小支持版本
                const isSupported = this.compareVersions(this.currentVersion, updateInfo.minSupportedVersion) >= 0;

                if (!isSupported && updateInfo.isForced) {
                    logger.warn('当前版本过低，需要强制更新');
                }

                logger.info(`发现新版本: ${updateInfo.version}, 当前版本: ${this.currentVersion}`);
                this.emit('update-available', updateInfo);

                return { hasUpdate: true, updateInfo };
            } else {
                logger.info('当前已是最新版本');
                this.emit('update-not-available');

                return { hasUpdate: false };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '检查更新失败';
            logger.error('检查更新失败:', error);
            this.emit('update-error', errorMessage);

            return { hasUpdate: false, error: errorMessage };
        } finally {
            this.isChecking = false;
        }
    }    /**
     * 获取更新信息
     */
    private async fetchUpdateInfo(): Promise<UpdateInfo | null> {
        try {
            logger.info(`正在从网络获取更新信息: ${this.updateUrl}`);

            // 创建 AbortController 用于超时控制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                logger.warn('更新信息请求超时');
            }, 15000); // 15秒超时
            const response = await fetch(this.updateUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': `ClipboardList/${this.currentVersion}`,
                    'Cache-Control': 'no-cache',
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip, deflate, br'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            logger.info(`收到响应: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                throw new Error(`网络请求失败: HTTP ${response.status} ${response.statusText}`);
            } const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                logger.warn(`响应内容类型: ${contentType}`);
            }

            // 先获取响应文本进行调试
            const responseText = await response.text();
            logger.info('服务器响应内容:', responseText.substring(0, 500)); // 只记录前500个字符

            // 解析JSON
            let updateInfo: UpdateInfo;
            try {
                updateInfo = JSON.parse(responseText) as UpdateInfo;
            } catch (parseError) {
                logger.error('JSON解析失败:', parseError);
                logger.error('响应文本内容:', responseText);
                throw new Error('服务器返回的数据格式不正确，无法解析JSON');
            }

            // 验证必要字段
            if (!updateInfo.version || !updateInfo.downloadUrl) {
                throw new Error('更新信息格式不正确，缺少必要字段');
            }

            logger.info('成功获取更新信息:', {
                version: updateInfo.version,
                releaseDate: updateInfo.releaseDate,
                isForced: updateInfo.isForced,
                downloadUrl: updateInfo.downloadUrl
            });

            return updateInfo;
        } catch (error: unknown) {
            if (error instanceof TypeError && error.message.includes('fetch')) {
                logger.error('网络连接失败，请检查网络连接和URL是否正确:', this.updateUrl);
                throw new Error('网络连接失败，请检查网络连接');
            } else if (error instanceof Error && error.name === 'AbortError') {
                logger.error('请求超时:', this.updateUrl);
                throw new Error('请求超时，请稍后重试');
            } else {
                logger.error('获取更新信息失败:', error);
                throw error instanceof Error ? error : new Error('未知错误');
            }
        }
    }

    /**
     * 比较版本号
     */
    private compareVersions(version1: string, version2: string): number {
        const v1parts = version1.split('.').map(Number);
        const v2parts = version2.split('.').map(Number);

        const maxLength = Math.max(v1parts.length, v2parts.length);

        for (let i = 0; i < maxLength; i++) {
            const v1part = v1parts[i] || 0;
            const v2part = v2parts[i] || 0;

            if (v1part > v2part) return 1;
            if (v1part < v2part) return -1;
        }

        return 0;
    }

    /**
     * 下载更新文件
     */
    public async downloadUpdate(updateInfo: UpdateInfo): Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
    }> {
        if (this.isDownloading) {
            return { success: false, error: '正在下载中...' };
        }

        this.isDownloading = true;
        logger.info(`开始下载更新: ${updateInfo.downloadUrl}`); try {
            this.emit('download-started', updateInfo);

            // 创建 AbortController 用于下载超时控制（30分钟）
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000);

            const response = await fetch(updateInfo.downloadUrl, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`下载失败: HTTP ${response.status}`);
            }

            const totalBytes = parseInt(response.headers.get('content-length') || '0');
            let transferredBytes = 0;

            // 确保下载目录存在
            const downloadDir = path.dirname(this.downloadPath);
            await fs.mkdir(downloadDir, { recursive: true });

            // 生成唯一文件名
            const timestamp = new Date().getTime();
            const fileName = `移记-Setup-${updateInfo.version}-${timestamp}.exe`;
            const filePath = path.join(downloadDir, fileName);

            const fileStream = await fs.open(filePath, 'w');
            const reader = response.body?.getReader();

            if (!reader) {
                throw new Error('无法读取下载内容');
            }

            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) break;

                    await fileStream.write(value);
                    transferredBytes += value.length;

                    const progress: DownloadProgress = {
                        percent: totalBytes > 0 ? (transferredBytes / totalBytes) * 100 : 0,
                        transferredBytes,
                        totalBytes
                    };

                    this.emit('download-progress', progress);
                }
            } finally {
                await fileStream.close();
                reader.releaseLock();
            }

            logger.info(`更新下载完成: ${filePath}`);
            this.emit('download-completed', { filePath, updateInfo });

            return { success: true, filePath };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '下载失败';
            logger.error('下载更新失败:', error);
            this.emit('download-error', errorMessage);

            return { success: false, error: errorMessage };
        } finally {
            this.isDownloading = false;
        }
    }

    /**
     * 安装更新
     */
    public async installUpdate(filePath: string): Promise<void> {
        try {
            logger.info(`开始安装更新: ${filePath}`);

            // 检查文件是否存在
            await fs.access(filePath);

            // 显示安装确认对话框
            const result = await dialog.showMessageBox({
                type: 'question',
                buttons: ['立即安装', '稍后安装'],
                defaultId: 0,
                cancelId: 1,
                title: '安装更新',
                message: '准备安装更新',
                detail: '应用程序将会关闭并安装新版本。是否立即安装？'
            });

            if (result.response === 0) {
                // 用户选择立即安装
                this.emit('install-started', filePath);

                // 启动安装程序
                await shell.openPath(filePath);

                // 退出当前应用
                setTimeout(() => {
                    app.quit();
                }, 1000);
            } else {
                // 用户选择稍后安装，打开文件位置
                shell.showItemInFolder(filePath);
            }
        } catch (error) {
            logger.error('安装更新失败:', error);
            this.emit('install-error', error);
            throw error;
        }
    }

    /**
     * IPC 处理程序
     */
    private async handleCheckUpdates(): Promise<any> {
        return await this.checkForUpdates();
    }

    private async handleDownloadUpdate(event: any, updateInfo: UpdateInfo): Promise<any> {
        return await this.downloadUpdate(updateInfo);
    }

    private async handleInstallUpdate(event: any, filePath: string): Promise<void> {
        return await this.installUpdate(filePath);
    }

    private async handleGetCurrentVersion(): Promise<string> {
        return this.currentVersion;
    }

    /**
     * 设置更新服务器URL
     */
    public setUpdateUrl(url: string): void {
        this.updateUrl = url;
        logger.info(`更新服务器URL已设置为: ${url}`);
    }

    /**
     * 获取下载状态
     */
    public getDownloadStatus(): {
        isChecking: boolean;
        isDownloading: boolean;
        currentVersion: string;
    } {
        return {
            isChecking: this.isChecking,
            isDownloading: this.isDownloading,
            currentVersion: this.currentVersion
        };
    }

    /**
     * 清理旧的下载文件
     */
    public async cleanupOldDownloads(): Promise<void> {
        try {
            const downloadDir = path.dirname(this.downloadPath);
            const files = await fs.readdir(downloadDir);

            const updateFiles = files.filter(file =>
                file.startsWith('移记-Setup-') && file.endsWith('.exe')
            );

            for (const file of updateFiles) {
                const filePath = path.join(downloadDir, file);
                const stats = await fs.stat(filePath);

                // 删除7天前的文件
                const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                if (stats.mtime.getTime() < sevenDaysAgo) {
                    await fs.unlink(filePath);
                    logger.info(`已清理旧的更新文件: ${file}`);
                }
            }
        } catch (error) {
            logger.warn('清理旧下载文件失败:', error);
        }
    }

    /**
     * 销毁服务
     */
    public destroy(): void {
        this.removeAllListeners();
        logger.info('UpdateService destroyed');
    }
}

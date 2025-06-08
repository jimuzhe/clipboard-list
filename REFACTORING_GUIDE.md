# 代码重构指南 - 模块化低耦合架构

## 重构目标

将当前的单体代码重构为模块化、低耦合的架构，提高代码的可维护性、可测试性和可扩展性。

## 重构步骤

### 第一阶段：主进程模块化

#### 1. 创建基础架构

```bash
# 创建目录结构
mkdir -p src/managers src/services src/utils src/types
```

#### 2. 抽取窗口管理器

**创建 `src/managers/WindowManager.ts`**
```typescript
import { BrowserWindow, screen, app } from 'electron';
import { EventEmitter } from 'events';

export interface WindowConfig {
  width: number;
  height: number;
  transparent: boolean;
  frame: boolean;
  alwaysOnTop: boolean;
}

export class WindowManager extends EventEmitter {
  private window: BrowserWindow | null = null;
  private isDocked = false;
  private dockSide: 'left' | 'right' | 'top' = 'right';
  private readonly DOCK_THRESHOLD = 50;
  private readonly DOCK_OFFSET = 5;

  constructor(private config: WindowConfig) {
    super();
  }

  createWindow(): BrowserWindow {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    this.window = new BrowserWindow({
      width: this.config.width,
      height: height - 100,
      x: width - this.config.width - 20,
      y: 50,
      frame: this.config.frame,
      transparent: this.config.transparent,
      alwaysOnTop: this.config.alwaysOnTop,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload.js'),
      },
    });

    this.setupWindowEvents();
    this.initDocking();
    
    return this.window;
  }

  private setupWindowEvents(): void {
    if (!this.window) return;

    this.window.on('close', (event) => {
      event.preventDefault();
      this.hide();
    });

    this.window.on('moved', () => this.checkDocking());
    this.window.on('mouse-enter', () => this.handleMouseEnter());
    this.window.on('mouse-leave', () => this.handleMouseLeave());
  }

  show(): void {
    if (this.window) {
      this.window.show();
      this.emit('window-shown');
    }
  }

  hide(): void {
    if (this.window) {
      this.window.hide();
      this.emit('window-hidden');
    }
  }

  // 更多方法...
}
```

#### 3. 抽取托盘管理器

**创建 `src/managers/TrayManager.ts`**
```typescript
import { Tray, Menu, app, nativeImage } from 'electron';
import { EventEmitter } from 'events';
import * as path from 'path';

export class TrayManager extends EventEmitter {
  private tray: Tray | null = null;

  constructor() {
    super();
  }

  create(): void {
    const iconPath = path.join(__dirname, '../assets/tray/icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    
    this.tray = new Tray(icon);
    this.setupTrayMenu();
    this.setupTrayEvents();
  }

  private setupTrayMenu(): void {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示/隐藏',
        click: () => this.emit('toggle-window')
      },
      {
        label: '设置',
        click: () => this.emit('open-settings')
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => this.emit('quit-app')
      }
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('ClipBoard List');
  }

  private setupTrayEvents(): void {
    if (!this.tray) return;

    this.tray.on('click', () => {
      this.emit('tray-clicked');
    });

    this.tray.on('double-click', () => {
      this.emit('tray-double-clicked');
    });
  }

  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
```

#### 4. 抽取剪切板管理器

**创建 `src/managers/ClipboardManager.ts`**
```typescript
import { clipboard } from 'electron';
import { EventEmitter } from 'events';
import { ClipboardItem } from '../types/clipboard';

export class ClipboardManager extends EventEmitter {
  private monitorTimer: NodeJS.Timeout | null = null;
  private lastContent = '';
  private history: ClipboardItem[] = [];

  constructor(private maxHistory: number = 100) {
    super();
  }

  startMonitoring(): void {
    this.monitorTimer = setInterval(() => {
      this.checkClipboard();
    }, 500);
  }

  stopMonitoring(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
  }

  private checkClipboard(): void {
    const content = clipboard.readText();
    
    if (content && content !== this.lastContent) {
      this.lastContent = content;
      this.addToHistory(content);
    }
  }

  private addToHistory(content: string): void {
    const item: ClipboardItem = {
      id: this.generateId(),
      content,
      type: this.detectContentType(content),
      timestamp: new Date(),
      isPinned: false
    };

    this.history.unshift(item);
    
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }

    this.emit('clipboard-changed', item);
  }

  getHistory(): ClipboardItem[] {
    return this.history;
  }

  // 更多方法...
}
```

#### 5. 创建IPC服务

**创建 `src/services/IPCService.ts`**
```typescript
import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { EventEmitter } from 'events';

export class IPCService extends EventEmitter {
  constructor() {
    super();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // 剪切板相关
    ipcMain.handle('clipboard:getHistory', this.handleGetClipboardHistory.bind(this));
    ipcMain.handle('clipboard:copyItem', this.handleCopyItem.bind(this));
    ipcMain.handle('clipboard:deleteItem', this.handleDeleteItem.bind(this));
    
    // 待办事项相关
    ipcMain.handle('todo:getAll', this.handleGetTodos.bind(this));
    ipcMain.handle('todo:add', this.handleAddTodo.bind(this));
    ipcMain.handle('todo:update', this.handleUpdateTodo.bind(this));
    ipcMain.handle('todo:delete', this.handleDeleteTodo.bind(this));
    
    // 笔记相关
    ipcMain.handle('notes:getAll', this.handleGetNotes.bind(this));
    ipcMain.handle('notes:save', this.handleSaveNote.bind(this));
    ipcMain.handle('notes:delete', this.handleDeleteNote.bind(this));
    
    // 设置相关
    ipcMain.handle('settings:get', this.handleGetSettings.bind(this));
    ipcMain.handle('settings:update', this.handleUpdateSettings.bind(this));
  }

  private async handleGetClipboardHistory(event: IpcMainInvokeEvent): Promise<any> {
    this.emit('clipboard:getHistory');
    // 处理逻辑
  }

  private async handleCopyItem(event: IpcMainInvokeEvent, itemId: string): Promise<void> {
    this.emit('clipboard:copyItem', itemId);
  }

  // 更多处理器方法...
}
```

#### 6. 重构主文件

**修改 `src/main.ts`**
```typescript
import { app, BrowserWindow } from 'electron';
import { WindowManager } from './managers/WindowManager';
import { TrayManager } from './managers/TrayManager';
import { ClipboardManager } from './managers/ClipboardManager';
import { AutoStartManager } from './managers/AutoStartManager';
import { IPCService } from './services/IPCService';
import { DataService } from './services/DataService';
import { Logger } from './utils/Logger';

class App {
  private windowManager: WindowManager;
  private trayManager: TrayManager;
  private clipboardManager: ClipboardManager;
  private autoStartManager: AutoStartManager;
  private ipcService: IPCService;
  private dataService: DataService;

  constructor() {
    this.initializeServices();
    this.setupAppEvents();
  }

  private initializeServices(): void {
    this.windowManager = new WindowManager({
      width: 350,
      height: 800,
      transparent: true,
      frame: false,
      alwaysOnTop: false
    });

    this.trayManager = new TrayManager();
    this.clipboardManager = new ClipboardManager(100);
    this.autoStartManager = new AutoStartManager();
    this.ipcService = new IPCService();
    this.dataService = new DataService();

    this.setupManagerEvents();
  }

  private setupManagerEvents(): void {
    // 托盘事件
    this.trayManager.on('toggle-window', () => {
      // 处理窗口显示/隐藏
    });

    this.trayManager.on('quit-app', () => {
      app.quit();
    });

    // 剪切板事件
    this.clipboardManager.on('clipboard-changed', (item) => {
      this.dataService.saveClipboardItem(item);
      // 通知渲染进程
    });

    // 窗口事件
    this.windowManager.on('window-shown', () => {
      Logger.info('Window shown');
    });
  }

  private setupAppEvents(): void {
    app.whenReady().then(() => {
      this.createWindow();
      this.trayManager.create();
      this.clipboardManager.startMonitoring();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  private createWindow(): void {
    const window = this.windowManager.createWindow();
    window.loadFile('renderer/index.html');
  }
}

// 启动应用
new App();
```

### 第二阶段：渲染进程模块化

#### 1. 创建应用主控制器

**创建 `renderer/scripts/App.js`**
```javascript
class App {
  constructor() {
    this.managers = {};
    this.services = {};
    this.components = {};
    this.init();
  }

  init() {
    this.initServices();
    this.initManagers();
    this.initComponents();
    this.setupGlobalEvents();
  }

  initServices() {
    this.services.theme = new ThemeService();
    this.services.data = new DataService();
    this.services.search = new SearchService();
  }

  initManagers() {
    this.managers.clipboard = new ClipboardUI(this.services);
    this.managers.todo = new TodoUI(this.services);
    this.managers.notes = new NotesUI(this.services);
    this.managers.settings = new SettingsUI(this.services);
    this.managers.pomodoro = new PomodoroUI(this.services);
  }

  initComponents() {
    this.components.modal = new Modal();
    this.components.notification = new Notification();
    this.components.contextMenu = new ContextMenu();
  }

  setupGlobalEvents() {
    // 全局快捷键
    document.addEventListener('keydown', (e) => {
      this.handleGlobalKeydown(e);
    });

    // 主题切换
    this.services.theme.on('theme-changed', (theme) => {
      document.body.setAttribute('data-theme', theme);
    });
  }

  handleGlobalKeydown(e) {
    if (e.ctrlKey) {
      switch (e.key) {
        case '1':
          this.switchTab('clipboard');
          break;
        case '2':
          this.switchTab('todo');
          break;
        case '3':
          this.switchTab('notes');
          break;
      }
    }
  }

  switchTab(tabName) {
    // 切换标签页逻辑
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
  }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
```

#### 2. 创建剪切板UI管理器

**创建 `renderer/scripts/managers/ClipboardUI.js`**
```javascript
class ClipboardUI {
  constructor(services) {
    this.services = services;
    this.items = [];
    this.filteredItems = [];
    this.searchTerm = '';
    this.selectedTypes = ['all'];
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadClipboardHistory();
  }

  bindEvents() {
    // 搜索输入
    const searchInput = document.getElementById('clipboard-search');
    searchInput.addEventListener('input', (e) => {
      this.searchTerm = e.target.value;
      this.filterItems();
    });

    // 类型过滤
    const typeFilters = document.querySelectorAll('.type-filter');
    typeFilters.forEach(filter => {
      filter.addEventListener('change', () => {
        this.updateTypeFilters();
        this.filterItems();
      });
    });

    // 清空历史
    const clearBtn = document.getElementById('clear-clipboard');
    clearBtn.addEventListener('click', () => {
      this.clearHistory();
    });
  }

  async loadClipboardHistory() {
    try {
      this.items = await window.electronAPI.clipboard.getHistory();
      this.filterItems();
    } catch (error) {
      console.error('Failed to load clipboard history:', error);
    }
  }

  filterItems() {
    this.filteredItems = this.items.filter(item => {
      // 类型过滤
      if (!this.selectedTypes.includes('all') && 
          !this.selectedTypes.includes(item.type)) {
        return false;
      }

      // 搜索过滤
      if (this.searchTerm) {
        return item.content.toLowerCase().includes(this.searchTerm.toLowerCase());
      }

      return true;
    });

    this.renderItems();
  }

  renderItems() {
    const container = document.getElementById('clipboard-list');
    container.innerHTML = '';

    this.filteredItems.forEach(item => {
      const element = this.createItemElement(item);
      container.appendChild(element);
    });
  }

  createItemElement(item) {
    const div = document.createElement('div');
    div.className = 'clipboard-item';
    div.setAttribute('data-id', item.id);

    div.innerHTML = `
      <div class="clipboard-item-header">
        <span class="clipboard-type ${item.type}">${item.type}</span>
        <span class="clipboard-time">${this.formatTime(item.timestamp)}</span>
        <div class="clipboard-actions">
          <button class="btn-icon" onclick="clipboardUI.copyItem('${item.id}')">
            <i class="icon-copy"></i>
          </button>
          <button class="btn-icon" onclick="clipboardUI.pinItem('${item.id}')">
            <i class="icon-pin ${item.isPinned ? 'pinned' : ''}"></i>
          </button>
          <button class="btn-icon" onclick="clipboardUI.deleteItem('${item.id}')">
            <i class="icon-delete"></i>
          </button>
        </div>
      </div>
      <div class="clipboard-content">
        ${this.renderContent(item)}
      </div>
    `;

    return div;
  }

  renderContent(item) {
    switch (item.type) {
      case 'code':
        return `<pre><code class="language-${item.subType || 'text'}">${this.escapeHtml(item.content)}</code></pre>`;
      case 'text':
        return `<p>${this.escapeHtml(item.preview || item.content)}</p>`;
      case 'image':
        return `<img src="${item.content}" alt="Clipboard image" />`;
      default:
        return `<p>${this.escapeHtml(item.content)}</p>`;
    }
  }

  async copyItem(id) {
    try {
      await window.electronAPI.clipboard.copyItem(id);
      this.services.notification.show('已复制到剪切板', 'success');
    } catch (error) {
      this.services.notification.show('复制失败', 'error');
    }
  }

  async pinItem(id) {
    try {
      await window.electronAPI.clipboard.pinItem(id);
      await this.loadClipboardHistory();
      this.services.notification.show('已置顶', 'success');
    } catch (error) {
      this.services.notification.show('置顶失败', 'error');
    }
  }

  async deleteItem(id) {
    try {
      await window.electronAPI.clipboard.deleteItem(id);
      await this.loadClipboardHistory();
      this.services.notification.show('已删除', 'success');
    } catch (error) {
      this.services.notification.show('删除失败', 'error');
    }
  }

  // 工具方法
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return date.toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
```

#### 3. 创建主题服务

**创建 `renderer/scripts/services/ThemeService.js`**
```javascript
class ThemeService extends EventTarget {
  constructor() {
    super();
    this.currentTheme = 'light';
    this.init();
  }

  init() {
    this.loadTheme();
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('app-theme') || 'light';
    this.setTheme(savedTheme);
  }

  setTheme(theme) {
    this.currentTheme = theme;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
    
    this.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme }
    }));
  }

  getTheme() {
    return this.currentTheme;
  }

  getAvailableThemes() {
    return [
      { id: 'light', name: '明亮主题' },
      { id: 'dark', name: '暗色主题' },
      { id: 'blue', name: '蓝色主题' },
      { id: 'green', name: '绿色主题' }
    ];
  }

  toggleTheme() {
    const themes = ['light', 'dark', 'blue', 'green'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }
}
```

### 第三阶段：组件化UI

#### 1. 创建模态框组件

**创建 `renderer/scripts/components/Modal.js`**
```javascript
class Modal {
  constructor() {
    this.currentModal = null;
    this.init();
  }

  init() {
    this.createModalContainer();
    this.bindEvents();
  }

  createModalContainer() {
    if (document.getElementById('modal-container')) return;

    const container = document.createElement('div');
    container.id = 'modal-container';
    container.className = 'modal-overlay';
    container.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title"></h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body"></div>
        <div class="modal-footer"></div>
      </div>
    `;

    document.body.appendChild(container);
  }

  bindEvents() {
    const container = document.getElementById('modal-container');
    
    // 点击背景关闭
    container.addEventListener('click', (e) => {
      if (e.target === container) {
        this.close();
      }
    });

    // 点击关闭按钮
    container.querySelector('.modal-close').addEventListener('click', () => {
      this.close();
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.currentModal) {
        this.close();
      }
    });
  }

  show(options) {
    const { title, content, footer, className = '' } = options;
    
    const container = document.getElementById('modal-container');
    const modalContent = container.querySelector('.modal-content');
    
    // 设置内容
    container.querySelector('.modal-title').textContent = title;
    container.querySelector('.modal-body').innerHTML = content;
    container.querySelector('.modal-footer').innerHTML = footer || '';
    
    // 设置样式
    modalContent.className = `modal-content ${className}`;
    
    // 显示模态框
    container.style.display = 'flex';
    this.currentModal = options;

    // 添加动画类
    setTimeout(() => {
      container.classList.add('show');
    }, 10);
  }

  close() {
    const container = document.getElementById('modal-container');
    container.classList.remove('show');
    
    setTimeout(() => {
      container.style.display = 'none';
      this.currentModal = null;
    }, 300);
  }

  confirm(options) {
    const { title, message, onConfirm, onCancel } = options;
    
    this.show({
      title,
      content: `<p>${message}</p>`,
      footer: `
        <button class="btn btn-secondary" onclick="modal.close()">取消</button>
        <button class="btn btn-primary" onclick="modal.handleConfirm()">确认</button>
      `,
      className: 'confirm-modal'
    });

    this.confirmCallback = onConfirm;
    this.cancelCallback = onCancel;
  }

  handleConfirm() {
    if (this.confirmCallback) {
      this.confirmCallback();
    }
    this.close();
  }
}
```

### 第四阶段：数据持久化

#### 1. 创建数据服务

**创建 `src/services/DataService.ts`**
```typescript
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { ClipboardItem } from '../types/clipboard';
import { TodoItem } from '../types/todo';
import { Note } from '../types/notes';

export class DataService {
  private dataPath: string;

  constructor() {
    this.dataPath = path.join(app.getPath('userData'), 'data');
    this.ensureDataDirectory();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  // 剪切板数据
  async saveClipboardHistory(items: ClipboardItem[]): Promise<void> {
    const filePath = path.join(this.dataPath, 'clipboard.json');
    await fs.promises.writeFile(filePath, JSON.stringify(items, null, 2));
  }

  async loadClipboardHistory(): Promise<ClipboardItem[]> {
    const filePath = path.join(this.dataPath, 'clipboard.json');
    
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  // 待办事项数据
  async saveTodos(todos: TodoItem[]): Promise<void> {
    const filePath = path.join(this.dataPath, 'todos.json');
    await fs.promises.writeFile(filePath, JSON.stringify(todos, null, 2));
  }

  async loadTodos(): Promise<TodoItem[]> {
    const filePath = path.join(this.dataPath, 'todos.json');
    
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  // 笔记数据
  async saveNotes(notes: Note[]): Promise<void> {
    const filePath = path.join(this.dataPath, 'notes.json');
    await fs.promises.writeFile(filePath, JSON.stringify(notes, null, 2));
  }

  async loadNotes(): Promise<Note[]> {
    const filePath = path.join(this.dataPath, 'notes.json');
    
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  // 配置数据
  async saveConfig(config: any): Promise<void> {
    const filePath = path.join(this.dataPath, 'config.json');
    await fs.promises.writeFile(filePath, JSON.stringify(config, null, 2));
  }

  async loadConfig(): Promise<any> {
    const filePath = path.join(this.dataPath, 'config.json');
    
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): any {
    return {
      theme: 'light',
      autoStart: true,
      clipboard: {
        maxHistory: 100,
        enableNotification: true,
        excludedApps: []
      },
      window: {
        alwaysOnTop: false,
        dockToSide: true,
        autoHide: true
      },
      pomodoro: {
        workDuration: 25,
        breakDuration: 5,
        longBreakDuration: 15,
        soundEnabled: true
      }
    };
  }
}
```

## 重构检查清单

### 主进程模块化
- [ ] WindowManager 类创建完成
- [ ] TrayManager 类创建完成
- [ ] ClipboardManager 类创建完成
- [ ] AutoStartManager 类创建完成
- [ ] IPCService 服务创建完成
- [ ] DataService 服务创建完成
- [ ] Logger 工具类创建完成
- [ ] 主文件重构完成

### 渲染进程模块化
- [ ] App 主控制器创建完成
- [ ] ClipboardUI 管理器创建完成
- [ ] TodoUI 管理器创建完成
- [ ] NotesUI 管理器创建完成
- [ ] SettingsUI 管理器创建完成
- [ ] PomodoroUI 管理器创建完成
- [ ] ThemeService 服务创建完成
- [ ] DataService 服务创建完成

### 组件化
- [ ] Modal 组件创建完成
- [ ] Notification 组件创建完成
- [ ] ContextMenu 组件创建完成
- [ ] DragDrop 组件创建完成

### 数据层
- [ ] 类型定义完成
- [ ] 数据持久化完成
- [ ] IPC 通信完成
- [ ] 错误处理完成

### 测试
- [ ] 单元测试编写
- [ ] 集成测试编写
- [ ] E2E 测试编写
- [ ] 性能测试完成

## 重构注意事项

1. **渐进式重构**: 一次重构一个模块，确保应用始终可用
2. **保持接口稳定**: 重构内部实现，保持外部接口不变
3. **充分测试**: 每个模块重构后都要进行充分测试
4. **文档更新**: 及时更新相关文档和注释
5. **性能监控**: 关注重构对性能的影响

## 重构后的优势

1. **可维护性**: 代码结构清晰，易于理解和修改
2. **可测试性**: 模块独立，便于单元测试
3. **可扩展性**: 新功能可以独立模块形式添加
4. **可重用性**: 组件和服务可以在不同场景下重用
5. **可调试性**: 问题定位更加精确
6. **团队协作**: 不同开发者可以并行开发不同模块

通过这种模块化重构，代码将具有更好的架构设计，为后续功能开发和维护提供坚实基础。

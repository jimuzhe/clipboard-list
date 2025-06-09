# 边界触发功能说明

## 功能概述

边界触发功能允许用户将鼠标移动到屏幕边缘来自动显示隐藏的应用窗口，当鼠标离开窗口时自动隐藏。这个功能类似于 QQ 的窗口吸附特性。

## 主要特性

### 🎯 智能触发
- **触发区域**: 屏幕边缘5像素范围内
- **精确定位**: 只在窗口对应的垂直/水平范围内触发
- **实时监听**: 50ms 检查间隔，响应迅速

### 🖱️ 鼠标跟随
- **边缘显示**: 鼠标移到边缘立即显示窗口
- **延时隐藏**: 鼠标离开窗口1秒后自动隐藏
- **缓冲区域**: 20像素缓冲区域防止误触发

### ⚙️ 可配置性
- **触发区域宽度**: 1-50像素可调 (默认5像素)
- **启用/禁用**: 可以随时开启或关闭功能
- **自动管理**: 配置更新时自动应用

## 使用方法

### 基本使用

1. **启用吸附功能**: 确保 `WindowConfig.dockToSide` 为 `true`
2. **移动窗口**: 将窗口拖拽到屏幕边缘进行吸附
3. **自动隐藏**: 窗口吸附后会自动隐藏
4. **触发显示**: 将鼠标移动到对应边缘显示窗口

### 配置选项

```typescript
interface WindowConfig {
    dockToSide: boolean;     // 启用吸附功能
    autoHide: boolean;       // 启用自动隐藏
    dockThreshold: number;   // 吸附触发距离
    dockOffset: number;      // 吸附时的隐藏偏移
}
```

### API 方法

```typescript
// 设置触发区域宽度
windowManager.setTriggerZoneWidth(10); // 设置为10像素

// 获取当前触发区域宽度
const width = windowManager.getTriggerZoneWidth();

// 启用/禁用边缘触发
windowManager.setEdgeTriggerEnabled(true);

// 检查是否已启用
const enabled = windowManager.isEdgeTriggerEnabled();
```

## 技术实现

### 光标位置监听
- 使用 `screen.getCursorScreenPoint()` 获取实时光标位置
- 定时器每50ms检查一次光标位置
- 只在窗口吸附且隐藏时进行检查

### 触发条件判断
```typescript
// 右边缘触发示例
if (cursorPos.x >= screenX + screenWidth - this.triggerZoneWidth &&
    cursorPos.y >= windowBounds.y &&
    cursorPos.y <= windowBounds.y + windowBounds.height) {
    shouldShow = true;
}
```

### 隐藏逻辑
```typescript
// 检查鼠标是否在窗口区域内 (含缓冲区)
const buffer = 20;
const isInWindow = cursorPos.x >= windowBounds.x - buffer &&
                 cursorPos.x <= windowBounds.x + windowBounds.width + buffer &&
                 cursorPos.y >= windowBounds.y - buffer &&
                 cursorPos.y <= windowBounds.y + windowBounds.height + buffer;
```

## 性能优化

### 智能监听
- 只在必要时启动光标监听
- 只在窗口隐藏时检查触发条件
- 配置变更时自动调整监听状态

### 资源管理
- 自动清理定时器和事件监听器
- 窗口销毁时释放所有资源
- 错误处理防止内存泄漏

## 兼容性

### 支持的吸附边
- ✅ **左边缘**: 窗口吸附到屏幕左侧
- ✅ **右边缘**: 窗口吸附到屏幕右侧  
- ✅ **顶部边缘**: 窗口吸附到屏幕顶部

### 多显示器支持
- 自动检测窗口所在显示器
- 使用对应显示器的工作区域计算
- 支持不同分辨率的显示器

## 测试

### 测试文件
- `test-edge-trigger.js`: 功能测试脚本
- `test-edge-trigger.html`: 测试界面

### 运行测试
```bash
# 在项目根目录运行
node test-edge-trigger.js
```

### 测试步骤
1. 启动测试脚本
2. 观察窗口自动吸附并隐藏
3. 移动鼠标到屏幕右边缘
4. 验证窗口自动显示
5. 移动鼠标离开窗口
6. 验证窗口自动隐藏

## 常见问题

### Q: 为什么光标移到边缘没有反应？
A: 检查以下设置：
- `dockToSide` 是否为 `true`
- 窗口是否已正确吸附
- 光标是否在窗口对应的垂直范围内

### Q: 窗口显示后不会自动隐藏？
A: 检查以下设置：
- `autoHide` 是否为 `true`
- 鼠标是否真正离开了窗口区域 (包含20像素缓冲区)
- 窗口是否处于焦点状态

### Q: 如何调整触发的敏感度？
A: 使用以下方法：
```typescript
// 增加触发区域宽度 (更容易触发)
windowManager.setTriggerZoneWidth(10);

// 减少触发区域宽度 (需要更精确)
windowManager.setTriggerZoneWidth(3);
```

## 更新日志

### v1.0.0 (2025-01-09)
- ✨ 新增边界触发功能
- ✨ 支持三个方向的边缘吸附 (左、右、上)
- ✨ 智能光标位置检测
- ✨ 可配置的触发区域宽度
- ✨ 自动资源管理和清理
- ✨ 完整的测试套件

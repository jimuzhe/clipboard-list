/**
 * ClipBoard List - Electron 桌面应用程序
 * 主入口文件 - 负责引入所有模块并初始化应用
 */

console.log('🚀 ClipBoard List 应用启动中...');

// 应用启动
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM已加载，开始初始化应用...'); // 检查所有必需的类是否已加载
    const requiredClasses = ['AppState', 'ClipboardManager', 'TodoManager', 'PomodoroManager', 'NotesManager', 'ThemeManager', 'App'];
    const missingClasses = requiredClasses.filter(className => !window[className]);

    if (missingClasses.length > 0) {
        console.error('❌ 缺少必需的类:', missingClasses);
        console.error('请确保所有管理器文件都已正确加载');

        // 详细检查每个类
        requiredClasses.forEach(className => {
            if (window[className]) {
                console.log(`✅ ${className} 已加载`);
            } else {
                console.error(`❌ ${className} 未加载`);
            }
        });

        return;
    }

    console.log('✅ 所有模块已加载完成');
    console.log('🔧 创建应用实例...');

    try {
        // 创建应用实例并启动
        window.app = new App();
        console.log('✅ 应用启动完成');
    } catch (error) {
        console.error('❌ 应用启动失败:', error);
        console.error('错误堆栈:', error.stack);

        // 显示错误通知
        if (window.electronAPI && window.electronAPI.showNotification) {
            window.electronAPI.showNotification('应用启动失败', '请检查控制台查看详细错误信息');
        }
    }
});

// 监听页面卸载，清理资源
window.addEventListener('beforeunload', () => {
    console.log('📝 页面卸载中，保存应用状态...');

    if (window.app && window.app.state) {
        try {
            // 保存应用状态
            window.app.state.saveData();
            console.log('✅ 应用状态已保存');
        } catch (error) {
            console.error('❌ 保存应用状态失败:', error);
        }
    }
});

// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('❌ 应用发生错误:', event.error);
    console.error('错误文件:', event.filename);
    console.error('错误行号:', event.lineno);
    console.error('错误列号:', event.colno);

    // 如果有通知API，显示错误通知
    if (window.electronAPI && window.electronAPI.showNotification) {
        window.electronAPI.showNotification('应用错误', '应用发生了意外错误，请检查控制台');
    }
});

// 全局未处理Promise rejection处理
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ 未处理的Promise rejection:', event.reason);

    // 记录Promise rejection的详细信息
    if (event.reason && event.reason.stack) {
        console.error('Promise rejection 堆栈:', event.reason.stack);
    }

    // 防止错误传播到控制台（可选）
    event.preventDefault();

    // 显示用户友好的错误提示
    if (window.electronAPI && window.electronAPI.showNotification) {
        window.electronAPI.showNotification('异步操作错误', '某个异步操作失败，请检查控制台获取详细信息');
    }
});

// 监听应用焦点变化，用于优化性能
window.addEventListener('focus', () => {
    console.log('🔍 应用获得焦点');
    // 可以在这里恢复某些定时器或更新操作
});

window.addEventListener('blur', () => {
    console.log('😴 应用失去焦点');
    // 可以在这里暂停某些不必要的操作
});

// 开发环境下的调试工具 - 在渲染进程中移除process引用
// if (process && process.env && process.env.NODE_ENV === 'development') {
//     console.log('🛠️ 开发模式已启用');
// }

// 提供调试工具（简化版，不依赖process）
console.log('🛠️ 调试工具已加载');

// 提供全局调试方法
window.debug = {
    app: () => window.app,
    state: () => window.app ?.state,
    clipboard: () => window.app ?.clipboardManager,
    todo: () => window.app ?.todoManager,
    notes: () => window.app ?.notesManager,
    theme: () => window.app ?.themeManager,
    pomodoro: () => window.app ?.pomodoroManager,

    // 调试工具方法
    logState: () => {
        console.log('📊 应用状态:', window.app ?.state);
    },

    exportData: () => {
        if (window.app ?.state) {
            const data = {
                clipboardItems: window.app.state.clipboardItems,
                todoItems: window.app.state.todoItems,
                notes: window.app.state.notes,
                settings: window.app.state.settings
            };
            console.log('📤 导出数据:', JSON.stringify(data, null, 2));
            return data;
        }
    },

    clearAll: () => {
        if (confirm('确定要清除所有数据吗？')) {
            window.app ?.state ?.clearAllData ?.();
            console.log('🗑️ 所有数据已清除');
        }
    }
};

console.log('🎯 调试工具已准备就绪，使用 window.debug 访问');

console.log('📋 ClipBoard List 入口文件加载完成');
// 主题管理器
class ThemeManager {
    constructor(appState) {
        this.appState = appState;
        this.init();
    }

    init() {
        this.applyTheme(this.appState.settings.theme);
        this.applyGlassEffect(this.appState.settings.glassEffect);
    }

    applyTheme(theme) {
        document.body.dataset.theme = theme;

        // 更新CSS变量
        const root = document.documentElement;

        switch (theme) {
            case 'dark':
                root.style.setProperty('--bg-primary', 'rgba(30, 30, 30, 0.95)');
                root.style.setProperty('--bg-secondary', 'rgba(40, 40, 40, 0.9)');
                root.style.setProperty('--bg-glass', 'rgba(0, 0, 0, 0.2)');
                root.style.setProperty('--text-primary', '#ffffff');
                root.style.setProperty('--text-secondary', '#b0b0b0');
                root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.1)');
                break;
            case 'blue':
                root.style.setProperty('--primary-color', '#0078d4');
                root.style.setProperty('--bg-primary', 'rgba(240, 248, 255, 0.95)');
                break;
            case 'green':
                root.style.setProperty('--primary-color', '#107c10');
                root.style.setProperty('--bg-primary', 'rgba(240, 255, 240, 0.95)');
                break;
            default: // light
                root.style.setProperty('--bg-primary', 'rgba(255, 255, 255, 0.95)');
                root.style.setProperty('--bg-secondary', 'rgba(248, 249, 250, 0.9)');
                root.style.setProperty('--bg-glass', 'rgba(255, 255, 255, 0.1)');
                root.style.setProperty('--text-primary', '#333');
                root.style.setProperty('--text-secondary', '#6c757d');
                root.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.1)');
                root.style.setProperty('--primary-color', '#007acc');
        }
    }

    applyGlassEffect(enabled) {
        if (enabled) {
            document.body.classList.add('glass-effect');
        } else {
            document.body.classList.remove('glass-effect');
        }
    }
}

// 导出给其他模块使用
window.ThemeManager = ThemeManager;
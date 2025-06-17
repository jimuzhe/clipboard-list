// 主题管理器
class ThemeManager {
    constructor(appState) {
        this.appState = appState;
        this.liquidGlassEffects = new LiquidGlassEffectsManager();
        this.init();
    }
    init() {
        this.applyTheme(this.appState.settings.theme);
        this.applyGlassEffect(this.appState.settings.glassEffect);
        this.applyLiquidGlassTheme(this.appState.settings.liquidGlassTheme);
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
    applyLiquidGlassTheme(enabled) {
        if (enabled) {
            this.liquidGlassEffects.enable();
            this.updateLiquidGlassOpacity(this.appState.settings.liquidGlassOpacity);
            this.updateLiquidGlassColor(this.appState.settings.liquidGlassColor);

            // 初始化鼠标追踪效果
            if (window.app && window.app.reinitializeLiquidGlassEffects) {
                window.app.reinitializeLiquidGlassEffects();
            }
        } else {
            this.liquidGlassEffects.disable();
        }
    }
    updateLiquidGlassOpacity(opacity) {
        const root = document.documentElement;
        root.style.setProperty('--liquid-glass-opacity', opacity);
        root.style.setProperty('--app-base-opacity', opacity); // 新增：控制整个应用的透明度
        root.style.setProperty('--liquid-glass-alpha', Math.round(opacity * 255).toString(16).padStart(2, '0'));

        // 更新交互效果透明度
        this.liquidGlassEffects.updateOpacity(opacity);
    }
    updateLiquidGlassColor(color) {
        const root = document.documentElement;
        root.style.setProperty('--liquid-glass-color', color);

        // 转换十六进制颜色为RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        root.style.setProperty('--liquid-glass-rgb', `${r}, ${g}, ${b}`);

        // 计算亮度调整的颜色变量
        root.style.setProperty('--liquid-glass-light', this.lightenColor(color, 20));
        root.style.setProperty('--liquid-glass-dark', this.darkenColor(color, 20));

        // 更新交互效果颜色
        this.liquidGlassEffects.updateThemeColor(color);
    }

    // 颜色辅助函数 - 调亮颜色
    lightenColor(color, percent) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.round(255 * percent / 100));
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.round(255 * percent / 100));
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.round(255 * percent / 100));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    // 颜色辅助函数 - 调暗颜色
    darkenColor(color, percent) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.round(255 * percent / 100));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.round(255 * percent / 100));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.round(255 * percent / 100));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}

// 导出给其他模块使用
window.ThemeManager = ThemeManager;
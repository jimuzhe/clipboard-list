// 液态玻璃主题交互效果管理器
class LiquidGlassEffectsManager {
    constructor() {
        this.isEnabled = false;
        this.rippleEffects = new Set();
        this.init();
    }

    init() {
        this.bindEvents();
        this.createDynamicBackground();
    }

    enable() {
        this.isEnabled = true;
        document.body.classList.add('liquid-glass-theme');
        this.initializeAllEffects();
    }

    disable() {
        this.isEnabled = false;
        document.body.classList.remove('liquid-glass-theme');
        this.cleanupEffects();
    }

    bindEvents() {
        // 点击波纹效果
        document.addEventListener('click', (e) => {
            if (!this.isEnabled) return;

            const target = e.target.closest('.btn, .tab-btn, .clipboard-item, .todo-item, .note-item');
            if (target) {
                this.createRippleEffect(e, target);
            }
        });

        // 鼠标移动光影效果
        document.addEventListener('mousemove', (e) => {
            if (!this.isEnabled) return;
            this.updateMouseGlow(e);
        });

        // 窗口大小变化时重新初始化
        window.addEventListener('resize', () => {
            if (this.isEnabled) {
                this.updateDynamicBackground();
            }
        });
    }

    createRippleEffect(event, element) {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const ripple = document.createElement('div');
        ripple.className = 'liquid-glass-ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        this.rippleEffects.add(ripple);

        // 移除波纹效果
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
            this.rippleEffects.delete(ripple);
        }, 600);
    }

    updateMouseGlow(event) {
        const x = (event.clientX / window.innerWidth) * 100;
        const y = (event.clientY / window.innerHeight) * 100;

        document.documentElement.style.setProperty('--mouse-glow-x', x + '%');
        document.documentElement.style.setProperty('--mouse-glow-y', y + '%');
    }

    createDynamicBackground() {
        if (document.querySelector('.liquid-glass-background')) return;

        const background = document.createElement('div');
        background.className = 'liquid-glass-background';

        // 创建多个动态光点
        for (let i = 0; i < 5; i++) {
            const orb = document.createElement('div');
            orb.className = 'liquid-glass-orb';
            orb.style.animationDelay = (i * 0.8) + 's';
            orb.style.animationDuration = (3 + Math.random() * 2) + 's';
            background.appendChild(orb);
        }

        document.body.insertBefore(background, document.body.firstChild);
    }

    updateDynamicBackground() {
        const background = document.querySelector('.liquid-glass-background');
        if (background) {
            background.remove();
            this.createDynamicBackground();
        }
    }

    initializeAllEffects() {
        this.createDynamicBackground();
        this.addInteractiveElements();
    }

    addInteractiveElements() {
        const elements = document.querySelectorAll('.btn, .tab-btn, .clipboard-item, .todo-item, .note-item');
        elements.forEach(element => {
            element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

            element.addEventListener('mouseenter', (e) => {
                this.addHoverGlow(e.target);
            });

            element.addEventListener('mouseleave', (e) => {
                this.removeHoverGlow(e.target);
            });
        });
    }

    addHoverGlow(element) {
        if (!element.querySelector('.hover-glow')) {
            const glow = document.createElement('div');
            glow.className = 'hover-glow';
            element.appendChild(glow);
        }
    }

    removeHoverGlow(element) {
        const glow = element.querySelector('.hover-glow');
        if (glow) {
            glow.style.opacity = '0';
            setTimeout(() => {
                if (glow.parentNode) {
                    glow.parentNode.removeChild(glow);
                }
            }, 300);
        }
    }

    cleanupEffects() {
        // 清理所有波纹效果
        this.rippleEffects.forEach(ripple => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        });
        this.rippleEffects.clear();

        // 移除动态背景
        const background = document.querySelector('.liquid-glass-background');
        if (background) {
            background.remove();
        }

        // 清理悬停效果
        const glows = document.querySelectorAll('.hover-glow');
        glows.forEach(glow => glow.remove());
    }

    updateThemeColor(color) {
        if (!this.isEnabled) return;

        // 更新动态背景颜色
        const orbs = document.querySelectorAll('.liquid-glass-orb');
        orbs.forEach(orb => {
            orb.style.background = `radial-gradient(circle, ${color}40 0%, transparent 70%)`;
        });
    }

    updateOpacity(opacity) {
        if (!this.isEnabled) return;

        document.documentElement.style.setProperty('--liquid-glass-opacity', opacity);

        // 更新动态背景透明度
        const background = document.querySelector('.liquid-glass-background');
        if (background) {
            background.style.opacity = opacity * 0.5;
        }
    }
}

// 导出给其他模块使用
window.LiquidGlassEffectsManager = LiquidGlassEffectsManager;
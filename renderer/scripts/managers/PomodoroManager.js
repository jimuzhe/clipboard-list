// 番茄时钟管理器
class PomodoroManager {
    constructor(appState) {
        this.appState = appState;
        this.timer = null;
        this.sessionCount = 0;
        this.totalFocusTime = 0;
        this.totalBreakTime = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.updateButtons();
        this.updateStatus();
        this.updateStats();
        this.updateProgressDots();
        this.loadSettings();
    }

    setupEventListeners() {
        // 主要控制按钮
        document.getElementById('pomodoro-start').addEventListener('click', () => {
            this.start();
        });

        document.getElementById('pomodoro-pause').addEventListener('click', () => {
            this.pause();
        });

        document.getElementById('pomodoro-reset').addEventListener('click', () => {
            this.reset();
        });

        // 模态框关闭按钮
        const closeBtn = document.querySelector('#pomodoro-modal .modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // 高级设置切换
        const advancedToggle = document.getElementById('advanced-toggle');
        if (advancedToggle) {
            advancedToggle.addEventListener('change', (e) => {
                this.toggleAdvancedSettings(e.target.checked);
            });
        }

        // 点击模态框背景关闭
        const modal = document.getElementById('pomodoro-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // 输入按钮事件
        this.setupInputButtons();

        // 设置输入框变化事件监听器
        this.setupSettingsInputListeners();
    }

    setupInputButtons() {
        // 为所有输入按钮添加事件监听
        document.querySelectorAll('.input-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.target;
                const input = document.getElementById(target);
                const isPlus = btn.classList.contains('plus');
                const isMinus = btn.classList.contains('minus');

                if (input) {
                    let value = parseInt(input.value);
                    const min = parseInt(input.min) || 1;
                    const max = parseInt(input.max) || 60;

                    if (isPlus && value < max) {
                        input.value = value + 1;
                    } else if (isMinus && value > min) {
                        input.value = value - 1;
                    }

                    // 触发change事件
                    input.dispatchEvent(new Event('change'));
                }
            });
        });
    }

    setupSettingsInputListeners() {
        // 工作时长设置
        const workDurationInput = document.getElementById('work-duration');
        if (workDurationInput) {
            workDurationInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                if (value >= 1 && value <= 60) {
                    this.appState.pomodoroTimer.workDuration = value;
                    // 如果当前是工作时间且未运行，更新当前时间
                    if (this.appState.pomodoroTimer.isWork && !this.appState.pomodoroTimer.isRunning) {
                        this.appState.pomodoroTimer.currentTime = value * 60;
                        this.updateDisplay();
                    }
                    this.saveSettings();
                }
            });
        }

        // 休息时长设置
        const breakDurationInput = document.getElementById('break-duration');
        if (breakDurationInput) {
            breakDurationInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                if (value >= 1 && value <= 30) {
                    this.appState.pomodoroTimer.breakDuration = value;
                    // 如果当前是休息时间且未运行，更新当前时间
                    if (!this.appState.pomodoroTimer.isWork && !this.appState.pomodoroTimer.isRunning) {
                        this.appState.pomodoroTimer.currentTime = value * 60;
                        this.updateDisplay();
                    }
                    this.saveSettings();
                }
            });
        }

        // 长休息时长设置
        const longBreakDurationInput = document.getElementById('long-break-duration');
        if (longBreakDurationInput) {
            longBreakDurationInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                if (value >= 5 && value <= 60) {
                    this.appState.pomodoroTimer.longBreakDuration = value;
                    this.saveSettings();
                }
            });
        }

        // 长休息间隔设置
        const sessionsUntilLongBreakInput = document.getElementById('sessions-until-long-break');
        if (sessionsUntilLongBreakInput) {
            sessionsUntilLongBreakInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                if (value >= 2 && value <= 8) {
                    this.appState.pomodoroTimer.sessionsUntilLongBreak = value;
                    this.saveSettings();
                }
            });
        }

        // 自动开始休息设置
        const autoStartBreaksInput = document.getElementById('auto-start-breaks');
        if (autoStartBreaksInput) {
            autoStartBreaksInput.addEventListener('change', (e) => {
                this.appState.pomodoroTimer.autoStartBreaks = e.target.checked;
                this.saveSettings();
            });
        }

        // 声音通知设置
        const soundNotificationsInput = document.getElementById('sound-notifications');
        if (soundNotificationsInput) {
            soundNotificationsInput.addEventListener('change', (e) => {
                this.appState.pomodoroTimer.soundNotifications = e.target.checked;
                this.saveSettings();
            });
        }
    }

    start() {
        this.appState.pomodoroTimer.isRunning = true;
        this.timer = setInterval(() => {
            this.tick();
        }, 1000);
        this.updateButtons();
        this.updateStatus();
        this.updateModalState();
    }

    pause() {
        this.appState.pomodoroTimer.isRunning = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.updateButtons();
        this.updateStatus();
        this.updateModalState();
    }

    reset() {
        this.pause();
        const timer = this.appState.pomodoroTimer;
        timer.currentTime = timer.isWork ? timer.workDuration * 60 : timer.breakDuration * 60;
        this.updateDisplay();
        this.updateButtons();
        this.updateStatus();
        this.updateModalState();
    }

    tick() {
        this.appState.pomodoroTimer.currentTime--;
        this.updateDisplay();

        if (this.appState.pomodoroTimer.currentTime <= 0) {
            this.complete();
        }
    }

    complete() {
        this.pause();
        const timer = this.appState.pomodoroTimer;

        if (timer.isWork) {
            // 工作时间完成
            this.sessionCount++;
            this.totalFocusTime += timer.workDuration;
            this.showNotification('工作完成！', '是时候休息一下了 ☕');

            // 判断是否需要长休息
            const needLongBreak = this.sessionCount % (timer.sessionsUntilLongBreak || 4) === 0;
            const breakDuration = needLongBreak ?
                (timer.longBreakDuration || 15) : timer.breakDuration;

            timer.isWork = false;
            timer.currentTime = breakDuration * 60;

            // 更新会话类型显示
            this.updateSessionType(needLongBreak ? 'long-break' : 'break');

        } else {
            // 休息时间完成
            this.totalBreakTime += timer.breakDuration;
            this.showNotification('休息结束！', '开始新的工作周期 🔥');
            timer.isWork = true;
            timer.currentTime = timer.workDuration * 60;
            this.updateSessionType('work');
        }

        this.updateDisplay();
        this.updateButtons();
        this.updateStats();
        this.updateProgressDots();

        // 播放提示音
        if (timer.soundNotifications !== false) {
            this.playNotificationSound();
        }

        // 自动开始下一阶段
        if (timer.autoStartBreaks && !timer.isWork) {
            setTimeout(() => this.start(), 2000);
        }
    }

    updateSessionType(type) {
        const sessionTypeEl = document.getElementById('session-type');
        if (sessionTypeEl) {
            switch (type) {
                case 'work':
                    sessionTypeEl.textContent = '工作时间';
                    break;
                case 'break':
                    sessionTypeEl.textContent = '短休息';
                    break;
                case 'long-break':
                    sessionTypeEl.textContent = '长休息';
                    break;
                default:
                    sessionTypeEl.textContent = '工作时间';
            }
        }
    }

    updateProgressDots() {
        const dots = document.querySelectorAll('.progress-dots .dot');
        const currentSession = this.sessionCount % 4;

        dots.forEach((dot, index) => {
            if (index < currentSession) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    updateStats() {
        // 更新完成轮次
        const completedEl = document.getElementById('completed-sessions');
        if (completedEl) {
            completedEl.textContent = this.sessionCount;
        }

        // 更新专注时长 (转换为小时:分钟格式)
        const focusTimeEl = document.getElementById('focus-time');
        if (focusTimeEl) {
            const hours = Math.floor(this.totalFocusTime / 60);
            const minutes = this.totalFocusTime % 60;
            focusTimeEl.textContent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        }

        // 更新休息时长
        const breakTimeEl = document.getElementById('break-time');
        if (breakTimeEl) {
            const hours = Math.floor(this.totalBreakTime / 60);
            const minutes = this.totalBreakTime % 60;
            breakTimeEl.textContent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        }
    }

    toggleAdvancedSettings(show) {
        const advancedSettings = document.querySelector('.settings-advanced');
        if (advancedSettings) {
            if (show) {
                advancedSettings.style.display = 'block';
                setTimeout(() => advancedSettings.style.opacity = '1', 10);
            } else {
                advancedSettings.style.opacity = '0';
                setTimeout(() => advancedSettings.style.display = 'none', 300);
            }
        }
    }

    loadSettings() {
        // 加载设置到界面
        const timer = this.appState.pomodoroTimer;

        document.getElementById('work-duration').value = timer.workDuration || 25;
        document.getElementById('break-duration').value = timer.breakDuration || 5;

        const longBreakDuration = document.getElementById('long-break-duration');
        if (longBreakDuration) {
            longBreakDuration.value = timer.longBreakDuration || 15;
        }

        const sessionsUntilLongBreak = document.getElementById('sessions-until-long-break');
        if (sessionsUntilLongBreak) {
            sessionsUntilLongBreak.value = timer.sessionsUntilLongBreak || 4;
        }

        const autoStartBreaks = document.getElementById('auto-start-breaks');
        if (autoStartBreaks) {
            autoStartBreaks.checked = timer.autoStartBreaks || false;
        }

        const soundNotifications = document.getElementById('sound-notifications');
        if (soundNotifications) {
            soundNotifications.checked = timer.soundNotifications !== false;
        }
    }

    saveSettings() {
        // 保存番茄时钟设置到appState
        this.appState.savePomodoroData();
    }

    updateModalState() {
        const modal = document.getElementById('pomodoro-modal');
        const timer = this.appState.pomodoroTimer;

        // 移除所有状态类
        modal.classList.remove('running', 'break', 'long-break');

        if (timer.isRunning) {
            modal.classList.add('running');
            if (!timer.isWork) {
                modal.classList.add('break');
            }
        }
    }

    playNotificationSound() {
        // 简单的声音提示，使用Web Audio API创建提示音
        try {
            const audioContext = new(window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('无法播放提示音:', error);
        }
    }

    updateDisplay() {
        const time = this.appState.pomodoroTimer.currentTime;
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        document.getElementById('pomodoro-time').textContent = display;

        // 更新进度环
        this.updateProgress();

        // 更新状态显示
        this.updateStatus();
    }

    updateProgress() {
        const timer = this.appState.pomodoroTimer;
        const totalTime = timer.isWork ? timer.workDuration * 60 : timer.breakDuration * 60;
        const progress = ((totalTime - timer.currentTime) / totalTime) * 100;

        const progressRing = document.querySelector('.progress-ring-fill');
        if (progressRing) {
            const circumference = 628.32; // 2 * π * 100 (半径为100)
            const offset = circumference - (progress / 100) * circumference;
            progressRing.style.strokeDashoffset = offset;
        }
    }

    updateStatus() {
        const timer = this.appState.pomodoroTimer;
        const statusElement = document.getElementById('pomodoro-status');

        if (statusElement) {
            if (timer.isRunning) {
                if (timer.isWork) {
                    statusElement.innerHTML = '<i class="fas fa-fire"></i> 专注工作中...';
                } else {
                    statusElement.innerHTML = '<i class="fas fa-coffee"></i> 休息时间...';
                }
            } else {
                if (timer.isWork) {
                    statusElement.textContent = '准备开始工作时间';
                } else {
                    statusElement.textContent = '准备开始休息时间';
                }
            }
        }

        // 更新会话类型显示
        const sessionTypeEl = document.getElementById('session-type');
        if (sessionTypeEl && !timer.isRunning) {
            sessionTypeEl.textContent = timer.isWork ? '工作时间' : '休息时间';
        }
    }

    updateButtons() {
        const startBtn = document.getElementById('pomodoro-start');
        const pauseBtn = document.getElementById('pomodoro-pause');

        if (this.appState.pomodoroTimer.isRunning) {
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-flex';
        } else {
            startBtn.style.display = 'inline-flex';
            pauseBtn.style.display = 'none';
        }
    }

    closeModal() {
        const modal = document.getElementById('pomodoro-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                // 重置模态框标题
                const title = modal.querySelector('.modal-header h3');
                if (title) {
                    title.innerHTML = '<i class="fas fa-stopwatch"></i> 番茄专注计时器';
                }
            }, 300);
        }
    }

    showNotification(title, body) {
        // 检查是否启用了桌面通知
        if (!this.appState.settings.enableNotifications) {
            return;
        }

        if (window.electronAPI && window.electronAPI.showNotification) {
            window.electronAPI.showNotification(title, body);
        } else {
            // 浏览器环境下的fallback
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title, {
                    body
                });
            }
        }
    }
}

// 导出给其他模块使用
window.PomodoroManager = PomodoroManager;
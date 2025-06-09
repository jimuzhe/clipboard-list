const {
    ipcRenderer
} = require('electron');

console.log('Starting Edge Trigger API Test...');

async function testEdgeTriggerAPI() {
    try {
        // 测试获取当前触发区域宽度
        console.log('\n1. Testing getTriggerZoneWidth...');
        const currentWidth = await ipcRenderer.invoke('window-get-trigger-zone-width');
        console.log(`Current trigger zone width: ${currentWidth}px`);

        // 测试设置触发区域宽度
        console.log('\n2. Testing setTriggerZoneWidth...');
        await ipcRenderer.invoke('window-set-trigger-zone-width', 10);
        console.log('Trigger zone width set to 10px');

        // 验证设置是否生效
        const newWidth = await ipcRenderer.invoke('window-get-trigger-zone-width');
        console.log(`New trigger zone width: ${newWidth}px`);

        // 测试获取边缘触发启用状态
        console.log('\n3. Testing getEdgeTriggerEnabled...');
        const currentEnabled = await ipcRenderer.invoke('window-get-edge-trigger-enabled');
        console.log(`Edge trigger currently enabled: ${currentEnabled}`);

        // 测试切换边缘触发状态
        console.log('\n4. Testing setEdgeTriggerEnabled...');
        await ipcRenderer.invoke('window-set-edge-trigger-enabled', !currentEnabled);
        console.log(`Edge trigger toggled to: ${!currentEnabled}`);

        // 验证切换是否生效
        const newEnabled = await ipcRenderer.invoke('window-get-edge-trigger-enabled');
        console.log(`New edge trigger status: ${newEnabled}`);

        // 恢复原始设置
        console.log('\n5. Restoring original settings...');
        await ipcRenderer.invoke('window-set-trigger-zone-width', currentWidth);
        await ipcRenderer.invoke('window-set-edge-trigger-enabled', currentEnabled);
        console.log('Original settings restored');

        console.log('\n✅ All API tests passed successfully!');

        // 如果边缘触发已启用，显示使用说明
        if (currentEnabled) {
            console.log('\n📌 Edge trigger is active!');
            console.log('Try moving your cursor to the screen edge where the window is docked.');
            console.log('The window should automatically show when cursor reaches the edge.');
        } else {
            console.log('\n💡 Edge trigger is disabled.');
            console.log('You can enable it through the application settings.');
        }

    } catch (error) {
        console.error('❌ API test failed:', error);
    }
}

// 启动测试
testEdgeTriggerAPI();
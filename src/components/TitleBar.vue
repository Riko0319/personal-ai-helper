<template>
    <div class="title-bar no-select">
        <!-- 可拖拽区域 -->
        <div class="title-bar-draggable">
            <!-- 应用图标和标题 -->
            <div class="app-info">
                <el-icon class="app-icon"><Monitor /></el-icon>
                <span class="app-title">AI助手--By Riko</span>
            </div>
        </div>

        <!-- 窗口控制按钮 -->
        <div class="window-controls non-draggable">
            <button
                class="control-btn minimize"
                @click="minimizeWindow"
                title="最小化"
            >
                <el-icon><Minus /></el-icon>
            </button>
            <button
                class="control-btn maximize"
                @click="maximizeWindow"
                title="最大化"
            >
                <el-icon><FullScreen /></el-icon>
            </button>
            <button class="control-btn close" @click="closeWindow" title="关闭">
                <el-icon><Close /></el-icon>
            </button>
        </div>
    </div>
</template>

<script setup>
const minimizeWindow = () => {
    if (window.electronAPI) {
        window.electronAPI.minimizeWindow();
    }
};

const maximizeWindow = () => {
    if (window.electronAPI) {
        window.electronAPI.maximizeWindow();
    }
};

const closeWindow = () => {
    if (window.electronAPI) {
        window.electronAPI.closeWindow();
    }
};
</script>

<style scoped>
.title-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 48px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
}

.title-bar-draggable {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    padding-left: 12px;
}

.app-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.app-icon {
    font-size: 16px;
}

.app-title {
    font-size: 13px;
    font-weight: 500;
}

.window-controls {
    display: flex;
    height: 100%;
}

.control-btn {
    width: 46px;
    height: 100%;
    border: none;
    background: transparent;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s;
}

.control-btn:hover {
    background: rgba(255, 255, 255, 0.1);
}

.control-btn.close:hover {
    background: #e81123;
}

.control-btn .el-icon {
    font-size: 12px;
}
</style>

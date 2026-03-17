<template>
    <div class="color-picker-container">
        <!-- 返回按钮 -->
        <div class="page-header">
            <el-button text @click="router.push('/tools')">
                <el-icon><ArrowLeft /></el-icon>
                返回工具箱
            </el-button>
            <h3>屏幕吸色器</h3>
            <el-button type="primary" @click="startScreenPicker">
                <el-icon><Aim /></el-icon>
                启动屏幕吸色
            </el-button>
        </div>

        <div class="color-picker-content">
            <!-- 使用说明 -->
            <div class="picker-guide">
                <el-card>
                    <template #header>
                        <div class="guide-header">
                            <el-icon><InfoFilled /></el-icon>
                            <span>使用说明</span>
                        </div>
                    </template>
                    <div class="guide-steps">
                        <div class="step">
                            <div class="step-num">1</div>
                            <div class="step-text">点击"启动屏幕吸色"按钮</div>
                        </div>
                        <div class="step">
                            <div class="step-num">2</div>
                            <div class="step-text">
                                鼠标移动到屏幕上任意位置
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-num">3</div>
                            <div class="step-text">实时预览当前位置颜色</div>
                        </div>
                        <div class="step">
                            <div class="step-num">4</div>
                            <div class="step-text">点击左键吸取颜色</div>
                        </div>
                        <div class="step">
                            <div class="step-num">5</div>
                            <div class="step-text">按 ESC 或右键取消</div>
                        </div>
                    </div>
                </el-card>
            </div>

            <!-- 当前颜色 -->
            <div class="current-color-section" v-if="currentColor">
                <el-card>
                    <template #header>
                        <span>当前颜色</span>
                    </template>
                    <div class="color-display">
                        <div
                            class="color-preview-large"
                            :style="{ background: currentColor }"
                        ></div>
                        <div class="color-values">
                            <div class="value-row">
                                <span class="label">HEX</span>
                                <el-input
                                    v-model="hexValue"
                                    size="small"
                                    readonly
                                >
                                    <template #append>
                                        <el-button @click="copyValue(hexValue)">
                                            <el-icon><CopyDocument /></el-icon>
                                        </el-button>
                                    </template>
                                </el-input>
                            </div>
                            <div class="value-row">
                                <span class="label">RGB</span>
                                <el-input
                                    v-model="rgbValue"
                                    size="small"
                                    readonly
                                >
                                    <template #append>
                                        <el-button @click="copyValue(rgbValue)">
                                            <el-icon><CopyDocument /></el-icon>
                                        </el-button>
                                    </template>
                                </el-input>
                            </div>
                        </div>
                    </div>
                </el-card>
            </div>

            <!-- 历史颜色 -->
            <div class="history-section" v-if="colorHistory.length > 0">
                <el-card>
                    <template #header>
                        <div class="panel-header">
                            <span>历史颜色</span>
                            <el-button text type="danger" @click="clearHistory">
                                <el-icon><Delete /></el-icon>
                                清空
                            </el-button>
                        </div>
                    </template>
                    <div class="color-grid">
                        <div
                            v-for="(color, index) in colorHistory"
                            :key="index"
                            class="color-item"
                            :style="{ background: color }"
                            @click="selectColor(color)"
                        >
                            <span class="color-code">{{ color }}</span>
                            <el-button
                                text
                                class="delete-btn"
                                @click.stop="removeFromHistory(index)"
                            >
                                <el-icon><Close /></el-icon>
                            </el-button>
                        </div>
                    </div>
                </el-card>
            </div>

            <el-empty
                v-else-if="!currentColor"
                description="点击上方按钮开始吸取屏幕颜色"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
    saveUserData,
    loadUserData,
    STORAGE_KEYS
} from '@/utils/userStorage.js';
import {
    ArrowLeft,
    Aim,
    InfoFilled,
    CopyDocument,
    Delete,
    Close
} from '@element-plus/icons-vue';

const router = useRouter();

const currentColor = ref('');
const colorHistory = ref([]);

const hexValue = computed(() => {
    return currentColor.value.toUpperCase();
});

const rgbValue = computed(() => {
    const rgb = hexToRgb(currentColor.value);
    return rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '';
});

// HEX 转 RGB
const hexToRgb = (hex) => {
    if (!hex || !hex.match(/^#[0-9A-Fa-f]{6}$/)) return null;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
};

// 启动屏幕吸色
const startScreenPicker = async () => {
    if (window.electronAPI && window.electronAPI.startScreenPicker) {
        const result = await window.electronAPI.startScreenPicker();
        if (result.success) {
            ElMessage.success('屏幕吸色已启动，移动鼠标预览颜色，点击吸取');
        } else {
            ElMessage.error(result.error || '启动失败');
        }
    } else {
        ElMessage.info('请在 Electron 环境中使用此功能');
    }
};

// 添加颜色到历史
const addColor = async (color) => {
    currentColor.value = color;
    if (!colorHistory.value.includes(color)) {
        colorHistory.value.unshift(color);
        if (colorHistory.value.length > 20) {
            colorHistory.value.pop();
        }
        await saveUserData(STORAGE_KEYS.PICKER_HISTORY, colorHistory.value);
    }
};

// 选择颜色
const selectColor = (color) => {
    currentColor.value = color;
};

// 删除历史
const removeFromHistory = async (index) => {
    colorHistory.value.splice(index, 1);
    await saveUserData(STORAGE_KEYS.PICKER_HISTORY, colorHistory.value);
};

// 清空历史
const clearHistory = async () => {
    colorHistory.value = [];
    await saveUserData(STORAGE_KEYS.PICKER_HISTORY, []);
};

// 复制值
const copyValue = async (value) => {
    await navigator.clipboard.writeText(value);
    ElMessage.success('已复制');
};

// 监听吸色结果
onMounted(async () => {
    // 加载历史
    const saved = await loadUserData(STORAGE_KEYS.PICKER_HISTORY, []);
    colorHistory.value = saved;

    // 监听吸色结果
    if (window.electronAPI && window.electronAPI.onPickerResult) {
        window.electronAPI.onPickerResult((color) => {
            addColor(color);
            ElMessage.success(`已吸取颜色: ${color}`);
        });
    }
});
</script>

<style scoped>
.color-picker-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f5f7fa;
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.page-header h3 {
    margin: 0;
    font-size: 18px;
    color: #333;
}

.color-picker-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
}

.picker-guide {
    margin-bottom: 20px;
}

.guide-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
}

.guide-steps {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.step {
    display: flex;
    align-items: center;
    gap: 12px;
}

.step-num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #409eff;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    font-size: 14px;
}

.step-text {
    font-size: 14px;
    color: #333;
}

.current-color-section {
    margin-bottom: 20px;
}

.color-display {
    display: flex;
    gap: 20px;
    align-items: center;
}

.color-preview-large {
    width: 100px;
    height: 100px;
    border-radius: 8px;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.color-values {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.value-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.value-row .label {
    width: 50px;
    font-size: 14px;
    color: #666;
    font-weight: 500;
}

.value-row .el-input {
    flex: 1;
}

.history-section {
    max-width: 800px;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.color-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
}

.color-item {
    height: 60px;
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    display: flex;
    align-items: flex-end;
    padding: 8px;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
}

.color-item:hover {
    transform: scale(1.05);
}

.color-code {
    font-size: 12px;
    font-weight: 500;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.delete-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    padding: 4px;
    opacity: 0;
    transition: opacity 0.2s;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.color-item:hover .delete-btn {
    opacity: 1;
}
</style>

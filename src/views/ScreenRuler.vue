<template>
    <div class="ruler-container">
        <!-- 返回按钮 -->
        <div class="page-header">
            <el-button text @click="router.push('/tools')">
                <el-icon><ArrowLeft /></el-icon>
                返回工具箱
            </el-button>
            <h3>屏幕尺子</h3>
            <el-button type="primary" @click="startScreenRuler">
                <el-icon><FullScreen /></el-icon>
                启动屏幕尺子
            </el-button>
        </div>

        <div class="ruler-content">
            <!-- 使用说明 -->
            <div class="ruler-guide">
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
                            <div class="step-text">点击"启动屏幕尺子"按钮</div>
                        </div>
                        <div class="step">
                            <div class="step-num">2</div>
                            <div class="step-text">在屏幕上点击起点</div>
                        </div>
                        <div class="step">
                            <div class="step-num">3</div>
                            <div class="step-text">
                                拖动到终点，实时显示距离
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-num">4</div>
                            <div class="step-text">松开鼠标完成测量</div>
                        </div>
                        <div class="step">
                            <div class="step-num">5</div>
                            <div class="step-text">按 ESC 退出尺子模式</div>
                        </div>
                    </div>
                </el-card>
            </div>

            <!-- 测量结果 -->
            <div class="measurements-panel" v-if="measurements.length > 0">
                <el-card>
                    <template #header>
                        <div class="panel-header">
                            <span>测量记录</span>
                            <el-button
                                text
                                type="danger"
                                @click="clearMeasurements"
                            >
                                <el-icon><Delete /></el-icon>
                                清空
                            </el-button>
                        </div>
                    </template>
                    <div class="measure-list">
                        <div
                            v-for="(m, index) in measurements"
                            :key="index"
                            class="measure-item"
                        >
                            <div
                                class="measure-color"
                                :style="{ background: m.color }"
                            ></div>
                            <div class="measure-info">
                                <div class="measure-distance">
                                    {{ m.distance.toFixed(2) }} px
                                </div>
                                <div class="measure-pos">
                                    ({{ m.start.x }}, {{ m.start.y }}) → ({{
                                        m.end.x
                                    }}, {{ m.end.y }})
                                </div>
                            </div>
                            <el-button text @click="copyDistance(m.distance)">
                                <el-icon><CopyDocument /></el-icon>
                            </el-button>
                            <el-button
                                text
                                type="danger"
                                @click="removeMeasurement(index)"
                            >
                                <el-icon><Close /></el-icon>
                            </el-button>
                        </div>
                    </div>
                    <div class="measure-total" v-if="measurements.length > 1">
                        总距离: {{ totalDistance.toFixed(2) }} px
                    </div>
                </el-card>
            </div>

            <el-empty v-else description="暂无测量记录，点击上方按钮开始测量" />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
    saveUserData,
    loadUserData,
    STORAGE_KEYS
} from '@/utils/userStorage.js';
import {
    ArrowLeft,
    FullScreen,
    InfoFilled,
    Delete,
    CopyDocument,
    Close
} from '@element-plus/icons-vue';

const router = useRouter();

const measurements = ref([]);
const isRulerActive = ref(false);

const colors = [
    '#409EFF',
    '#67C23A',
    '#E6A23C',
    '#F56C6C',
    '#909399',
    '#9254DE'
];

const totalDistance = computed(() => {
    return measurements.value.reduce((sum, m) => sum + m.distance, 0);
});

// 启动屏幕尺子
const startScreenRuler = async () => {
    if (window.electronAPI && window.electronAPI.startScreenRuler) {
        const result = await window.electronAPI.startScreenRuler();
        if (result.success) {
            isRulerActive.value = true;
            ElMessage.success('屏幕尺子已启动，在屏幕上拖动测量');
        } else {
            ElMessage.error(result.error || '启动失败');
        }
    } else {
        // 降级方案：在当前页面模拟
        ElMessage.info('请在 Electron 环境中使用此功能');
    }
};

// 添加测量结果（从主进程返回）
const addMeasurement = async (data) => {
    measurements.value.push({
        ...data,
        color: colors[measurements.value.length % colors.length]
    });
    // 保存到用户数据目录
    await saveUserData(STORAGE_KEYS.RULER_MEASUREMENTS, measurements.value);
};

// 清空测量
const clearMeasurements = async () => {
    measurements.value = [];
    await saveUserData(STORAGE_KEYS.RULER_MEASUREMENTS, []);
};

// 删除单条
const removeMeasurement = async (index) => {
    measurements.value.splice(index, 1);
    await saveUserData(STORAGE_KEYS.RULER_MEASUREMENTS, measurements.value);
};

// 复制距离
const copyDistance = async (distance) => {
    await navigator.clipboard.writeText(distance.toFixed(2));
    ElMessage.success('已复制');
};

// 监听主进程返回的测量结果
onMounted(async () => {
    // 加载历史
    const saved = await loadUserData(STORAGE_KEYS.RULER_MEASUREMENTS, []);
    measurements.value = saved;

    // 监听测量结果
    if (window.electronAPI && window.electronAPI.onRulerResult) {
        window.electronAPI.onRulerResult((data) => {
            addMeasurement(data);
        });
    }
});
</script>

<style scoped>
.ruler-container {
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

.ruler-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
}

.ruler-guide {
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

.measurements-panel {
    max-width: 800px;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.measure-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.measure-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 6px;
}

.measure-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
}

.measure-info {
    flex: 1;
}

.measure-distance {
    font-size: 16px;
    font-weight: 500;
    color: #333;
}

.measure-pos {
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
}

.measure-total {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e0e0e0;
    font-size: 16px;
    font-weight: bold;
    color: #409eff;
    text-align: right;
}
</style>

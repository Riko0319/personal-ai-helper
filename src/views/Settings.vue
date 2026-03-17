<template>
    <div class="settings-container">
        <el-scrollbar>
            <div class="settings-content">
                <!-- API配置 -->
                <div class="settings-section">
                    <h3>API 配置</h3>
                    <el-form label-width="120px">
                        <el-form-item label="API 地址">
                            <el-input
                                v-model="settings.apiBaseUrl"
                                placeholder="https://api.openai.com/v1"
                            />
                        </el-form-item>
                        <el-form-item label="API Key">
                            <el-input
                                v-model="settings.apiKey"
                                type="password"
                                show-password
                                placeholder="sk-..."
                            />
                        </el-form-item>
                        <el-form-item label="默认模型">
                            <el-select
                                v-model="settings.model"
                                style="width: 100%"
                            >
                                <el-option
                                    label="GPT-3.5-turbo"
                                    value="gpt-3.5-turbo"
                                />
                                <el-option label="GPT-4" value="gpt-4" />
                                <el-option
                                    label="GPT-4-turbo"
                                    value="gpt-4-turbo-preview"
                                />
                                <el-option
                                    label="Claude-3"
                                    value="claude-3-opus"
                                />
                            </el-select>
                        </el-form-item>
                    </el-form>
                </div>

                <!-- 外观设置 -->
                <div class="settings-section">
                    <h3>外观设置</h3>
                    <el-form label-width="120px">
                        <el-form-item label="主题">
                            <el-radio-group v-model="settings.theme">
                                <el-radio label="light">浅色</el-radio>
                                <el-radio label="dark">深色</el-radio>
                                <el-radio label="auto">跟随系统</el-radio>
                            </el-radio-group>
                        </el-form-item>
                        <el-form-item label="语言">
                            <el-select
                                v-model="settings.language"
                                style="width: 200px"
                            >
                                <el-option label="简体中文" value="zh-CN" />
                                <el-option label="English" value="en-US" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="字体大小">
                            <el-slider
                                v-model="settings.fontSize"
                                :min="12"
                                :max="20"
                                :marks="{
                                    12: '小',
                                    14: '中',
                                    16: '大',
                                    18: '特大'
                                }"
                            />
                        </el-form-item>
                    </el-form>
                </div>

                <!-- 快捷键设置 -->
                <div class="settings-section">
                    <h3>快捷键</h3>
                    <el-form label-width="150px">
                        <el-form-item label="显示/隐藏窗口">
                            <el-input
                                v-model="settings.shortcuts.showWindow"
                                placeholder="CommandOrControl+Shift+A"
                            />
                        </el-form-item>
                        <el-form-item label="快速搜索">
                            <el-input
                                v-model="settings.shortcuts.quickSearch"
                                placeholder="CommandOrControl+Shift+F"
                            />
                        </el-form-item>
                    </el-form>
                </div>

                <!-- 存储设置 -->
                <div class="settings-section">
                    <h3>数据管理</h3>
                    <el-form label-width="120px">
                        <el-form-item label="清除缓存">
                            <el-button @click="clearCache"
                                >清除应用缓存</el-button
                            >
                        </el-form-item>
                        <el-form-item label="导出数据">
                            <el-button @click="exportData"
                                >导出所有数据</el-button
                            >
                        </el-form-item>
                        <el-form-item label="重置设置">
                            <el-button type="danger" @click="resetSettings"
                                >恢复默认设置</el-button
                            >
                        </el-form-item>
                    </el-form>
                </div>

                <!-- 关于 -->
                <div class="settings-section">
                    <h3>关于</h3>
                    <div class="about-info">
                        <p><strong>AI 助手</strong></p>
                        <p>版本：{{ appVersion }}</p>
                        <p>作者：Riko</p>
                        <p>技术栈：Electron + Vue 3 + Element Plus</p>
                        <el-divider />
                        <p class="copyright">
                            © 2024 AI Assistant. All rights reserved.
                        </p>
                    </div>
                </div>

                <!-- 保存按钮 -->
                <div class="settings-actions">
                    <el-button @click="cancelSettings">取消</el-button>
                    <el-button type="primary" @click="saveSettings"
                        >保存设置</el-button
                    >
                </div>
            </div>
        </el-scrollbar>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { clearUserCache, getCurrentUser } from '@/utils/userStorage.js';

const router = useRouter();

const appVersion = ref('1.0.1');

const defaultSettings = {
    apiBaseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    theme: 'light',
    language: 'zh-CN',
    fontSize: 14,
    shortcuts: {
        showWindow: 'CommandOrControl+Shift+A',
        quickSearch: 'CommandOrControl+Shift+F'
    }
};

const settings = reactive({ ...defaultSettings });

// 加载设置
const loadSettings = async () => {
    // 从用户数据目录加载
    const saved = await loadUserData(STORAGE_KEYS.APP_SETTINGS, null);
    if (saved) {
        Object.assign(settings, saved);
    }

    // 从 Electron 加载（兼容旧版）
    if (window.electronAPI) {
        const config = await window.electronAPI.getConfig();
        if (config.settings) {
            Object.assign(settings, config.settings);
        }
        appVersion.value = await window.electronAPI.getAppVersion();
    }
};

// 取消设置 - 返回主页
const cancelSettings = () => {
    loadSettings(); // 重新加载设置，放弃当前修改
    router.push('/home');
};

// 保存设置
const saveSettings = async () => {
    // 保存到用户数据目录
    await saveUserData(STORAGE_KEYS.APP_SETTINGS, settings);

    // 保存到 Electron（兼容旧版）
    if (window.electronAPI) {
        const config = await window.electronAPI.getConfig();
        config.settings = settings;
        await window.electronAPI.setConfig(config);
    }

    ElMessage.success('设置已保存');
    router.push('/home');
};

// 清除缓存
const clearCache = async () => {
    try {
        const user = await getCurrentUser();
        await ElMessageBox.confirm(
            user
                ? `确定要清除当前账号「${user}」的所有缓存数据吗？`
                : '确定要清除所有缓存数据吗？',
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        );

        const result = await clearUserCache();
        if (result.success) {
            ElMessage.success('缓存已清除');
        } else {
            ElMessage.error('清除失败: ' + result.error);
        }
    } catch (e) {
        // 取消
    }
};

// 导出数据
const exportData = () => {
    const data = {
        settings: settings,
        notes: JSON.parse(localStorage.getItem('notes-data') || '[]'),
        history: JSON.parse(localStorage.getItem('translate-history') || '[]'),
        exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-assistant-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    ElMessage.success('数据已导出');
};

// 重置设置
const resetSettings = async () => {
    try {
        await ElMessageBox.confirm('确定要恢复默认设置吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        Object.assign(settings, defaultSettings);
        await saveSettings();
        ElMessage.success('已恢复默认设置');
    } catch (e) {
        // 取消
    }
};

onMounted(() => {
    loadSettings();
});
</script>

<style scoped>
.settings-container {
    height: 100%;
    background: #f5f7fa;
}

.settings-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

.settings-section {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.settings-section h3 {
    margin: 0 0 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e4e7ed;
    color: #333;
}

.about-info {
    line-height: 2;
}

.about-info p {
    margin: 0;
}

.copyright {
    color: #909399;
    font-size: 12px;
}

.settings-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 0;
}
</style>

<template>
    <div class="translate-container">
        <!-- 返回按钮 -->
        <div class="page-header">
            <el-button text @click="router.push('/home')">
                <el-icon><ArrowLeft /></el-icon>
                返回主页
            </el-button>
            <el-button text @click="showConfig = true">
                <el-icon><Setting /></el-icon>
                配置密钥
            </el-button>
        </div>
        <div class="translate-layout">
            <!-- 源语言 -->
            <div class="translate-panel">
                <div class="panel-header">
                    <el-select v-model="sourceLang" style="width: 140px">
                        <el-option label="自动检测" value="auto" />
                        <el-option label="中文" value="zh" />
                        <el-option label="英文" value="en" />
                        <el-option label="日文" value="ja" />
                        <el-option label="韩文" value="ko" />
                        <el-option label="法文" value="fr" />
                        <el-option label="德文" value="de" />
                        <el-option label="西班牙文" value="es" />
                    </el-select>
                    <el-button text @click="clearSource">
                        <el-icon><Delete /></el-icon>
                        清空
                    </el-button>
                </div>
                <el-input
                    v-model="sourceText"
                    type="textarea"
                    :rows="12"
                    placeholder="请输入要翻译的文本..."
                />
                <div class="panel-footer">
                    <span class="char-count">{{ sourceText.length }} 字符</span>
                </div>
            </div>

            <!-- 中间操作 -->
            <div class="translate-actions">
                <el-button circle @click="swapLanguages">
                    <el-icon><Switch /></el-icon>
                </el-button>
                <el-button
                    type="primary"
                    :loading="loading"
                    @click="handleTranslate"
                >
                    <el-icon><Position /></el-icon>
                    翻译
                </el-button>
            </div>

            <!-- 目标语言 -->
            <div class="translate-panel">
                <div class="panel-header">
                    <el-select v-model="targetLang" style="width: 140px">
                        <el-option label="中文" value="zh" />
                        <el-option label="英文" value="en" />
                        <el-option label="日文" value="ja" />
                        <el-option label="韩文" value="ko" />
                        <el-option label="法文" value="fr" />
                        <el-option label="德文" value="de" />
                        <el-option label="西班牙文" value="es" />
                    </el-select>
                    <el-button text @click="copyResult">
                        <el-icon><CopyDocument /></el-icon>
                        复制
                    </el-button>
                </div>
                <el-input
                    v-model="targetText"
                    type="textarea"
                    :rows="12"
                    readonly
                    placeholder="翻译结果将显示在这里..."
                />
                <div class="panel-footer">
                    <span class="char-count">{{ targetText.length }} 字符</span>
                </div>
            </div>
        </div>

        <!-- 历史记录 -->
        <div class="history-section">
            <div class="history-header">
                <h4>翻译历史</h4>
                <el-button
                    v-if="history.length > 0"
                    text
                    type="danger"
                    @click="clearAllHistory"
                >
                    <el-icon><Delete /></el-icon>
                    清空全部
                </el-button>
            </div>
            <div class="history-list">
                <div
                    v-for="(item, index) in history"
                    :key="index"
                    class="history-item"
                >
                    <div class="history-content" @click="loadHistory(item)">
                        <div class="history-source">{{ item.source }}</div>
                        <div class="history-target">{{ item.target }}</div>
                    </div>
                    <el-button
                        text
                        type="danger"
                        class="delete-btn"
                        @click.stop="deleteHistory(index)"
                    >
                        <el-icon><Delete /></el-icon>
                    </el-button>
                </div>
                <el-empty
                    v-if="history.length === 0"
                    description="暂无翻译历史"
                />
            </div>
        </div>

        <!-- 配置弹窗 -->
        <el-dialog v-model="showConfig" title="百度翻译配置" width="450px">
            <el-form label-width="120px">
                <el-form-item label="API Key">
                    <el-input
                        v-model="config.apiKey"
                        placeholder="请输入百度翻译 API Key"
                    />
                </el-form-item>
                <el-form-item label="Secret Key">
                    <el-input
                        v-model="config.secretKey"
                        type="password"
                        placeholder="请输入百度翻译 Secret Key"
                        show-password
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showConfig = false">取消</el-button>
                <el-button type="primary" @click="saveConfig">保存</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Setting } from '@element-plus/icons-vue';
import {
    saveUserData,
    loadUserData,
    STORAGE_KEYS
} from '@/utils/userStorage.js';

const router = useRouter();

const sourceLang = ref('auto');
const targetLang = ref('en');
const sourceText = ref('');
const targetText = ref('');
const loading = ref(false);
const history = ref([]);
const showConfig = ref(false);

// 百度翻译配置
const config = ref({
    apiKey: '',
    secretKey: ''
});

// 百度翻译语言代码映射
const langMap = {
    auto: 'auto',
    zh: 'zh',
    en: 'en',
    ja: 'jp',
    ko: 'kor',
    fr: 'fra',
    de: 'de',
    es: 'spa'
};

// 保存配置
const saveConfig = async () => {
    if (!config.value.apiKey || !config.value.secretKey) {
        ElMessage.warning('请填写完整的配置信息');
        return;
    }
    await saveUserData(STORAGE_KEYS.TRANSLATE_CONFIG, config.value);
    ElMessage.success('配置已保存');
    showConfig.value = false;
};

// 翻译
const handleTranslate = async () => {
    if (!sourceText.value.trim()) {
        ElMessage.warning('请输入要翻译的文本');
        return;
    }

    // 检查配置
    if (!config.value.apiKey || !config.value.secretKey) {
        ElMessage.warning('请先配置百度翻译密钥');
        showConfig.value = true;
        return;
    }

    loading.value = true;

    try {
        const from = langMap[sourceLang.value] || 'auto';
        const to = langMap[targetLang.value] || 'en';

        const result = await window.electronAPI.baiduTranslate(
            sourceText.value,
            from,
            to,
            JSON.parse(JSON.stringify(config.value))
        );

        if (!result.success) {
            throw new Error(result.error || '翻译失败');
        }

        // 解析翻译结果
        const data = result.data;
        if (
            data.result &&
            data.result.trans_result &&
            data.result.trans_result.length > 0
        ) {
            targetText.value = data.result.trans_result
                .map((item) => item.dst)
                .join('\n');
        } else {
            throw new Error('翻译结果为空');
        }

        // 添加到历史
        history.value.unshift({
            source: sourceText.value.slice(0, 50),
            target: targetText.value.slice(0, 50),
            sourceLang: sourceLang.value,
            targetLang: targetLang.value,
            time: new Date().toLocaleString()
        });

        // 只保留最近10条
        if (history.value.length > 10) {
            history.value.pop();
        }

        // 保存历史到用户数据目录
        await saveUserData(STORAGE_KEYS.TRANSLATE_HISTORY, history.value);
    } catch (error) {
        ElMessage.error('翻译失败: ' + error.message);
    } finally {
        loading.value = false;
    }
};

// 交换语言
const swapLanguages = () => {
    if (sourceLang.value === 'auto') {
        ElMessage.warning('自动检测模式下无法交换语言');
        return;
    }
    const temp = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = temp;

    const tempText = sourceText.value;
    sourceText.value = targetText.value;
    targetText.value = tempText;
};

// 清空源文本
const clearSource = () => {
    sourceText.value = '';
    targetText.value = '';
};

// 复制结果
const copyResult = async () => {
    if (!targetText.value) {
        ElMessage.warning('没有可复制的内容');
        return;
    }

    try {
        await navigator.clipboard.writeText(targetText.value);
        ElMessage.success('已复制到剪贴板');
    } catch (error) {
        ElMessage.error('复制失败');
    }
};

// 加载历史记录
const loadHistory = (item) => {
    sourceText.value = item.source;
    targetText.value = item.target;
    sourceLang.value = item.sourceLang;
    targetLang.value = item.targetLang;
};

// 删除单条历史
const deleteHistory = async (index) => {
    history.value.splice(index, 1);
    await saveUserData(STORAGE_KEYS.TRANSLATE_HISTORY, history.value);
    ElMessage.success('已删除');
};

// 清空全部历史
const clearAllHistory = async () => {
    history.value = [];
    await saveUserData(STORAGE_KEYS.TRANSLATE_HISTORY, []);
    ElMessage.success('已清空全部历史');
};

// 初始化
onMounted(async () => {
    // 从用户数据目录加载
    const savedHistory = await loadUserData(STORAGE_KEYS.TRANSLATE_HISTORY, []);
    history.value = savedHistory;

    const savedConfig = await loadUserData(STORAGE_KEYS.TRANSLATE_CONFIG, {
        apiKey: '',
        secretKey: ''
    });
    config.value = savedConfig;
});
</script>

<style scoped>
.translate-container {
    height: 100%;
    overflow-y: auto;
}

.page-header {
    padding: 12px 20px;
    background: #fff;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    align-items: center;
}

.translate-layout {
    display: flex;
    gap: 20px;
    padding: 20px;
}

.translate-panel {
    flex: 1;
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.panel-footer {
    margin-top: 8px;
    text-align: right;
}

.char-count {
    font-size: 12px;
    color: #999;
}

.translate-actions {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 12px;
}

.history-section {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.history-header h4 {
    margin: 0;
    color: #333;
}

.history-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.history-item {
    display: flex;
    align-items: center;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 6px;
    transition: background 0.2s;
}

.history-item:hover {
    background: #e8eaed;
}

.history-content {
    flex: 1;
    cursor: pointer;
    overflow: hidden;
}

.delete-btn {
    margin-left: 8px;
    opacity: 0;
    transition: opacity 0.2s;
}

.history-item:hover .delete-btn {
    opacity: 1;
}

.history-source {
    font-size: 14px;
    color: #333;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.history-target {
    font-size: 12px;
    color: #666;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>

<template>
    <div class="chat-container">
        <!-- 返回按钮 -->
        <div class="page-header">
            <el-button text @click="router.push('/home')">
                <el-icon><ArrowLeft /></el-icon>
                返回主页
            </el-button>
        </div>
        <!-- 对话历史 -->
        <div class="chat-history" ref="historyRef">
            <div class="message-list">
                <div
                    v-for="(msg, index) in messages"
                    :key="index"
                    :class="['message-item', msg.role]"
                >
                    <div class="message-avatar">
                        <el-avatar
                            v-if="msg.role === 'user'"
                            :size="36"
                            icon="User"
                        />
                        <el-avatar
                            v-else
                            :size="36"
                            style="
                                background: linear-gradient(
                                    135deg,
                                    #667eea 0%,
                                    #764ba2 100%
                                );
                            "
                        >
                            <el-icon><Monitor /></el-icon>
                        </el-avatar>
                    </div>
                    <div class="message-content">
                        <div
                            class="message-text"
                            v-html="formatMessage(msg.content)"
                        ></div>
                        <div class="message-time">{{ msg.time }}</div>
                    </div>
                </div>

                <!-- 加载中 -->
                <div v-if="loading" class="message-item assistant loading">
                    <div class="message-avatar">
                        <el-avatar
                            :size="36"
                            style="
                                background: linear-gradient(
                                    135deg,
                                    #667eea 0%,
                                    #764ba2 100%
                                );
                            "
                        >
                            <el-icon><Monitor /></el-icon>
                        </el-avatar>
                    </div>
                    <div class="message-content">
                        <div class="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input-area">
            <div class="input-wrapper">
                <el-input
                    v-model="inputMessage"
                    type="textarea"
                    :rows="3"
                    placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
                    @keydown="handleKeydown"
                />
                <div class="input-actions">
                    <el-button text @click="clearMessages">
                        <el-icon><Delete /></el-icon>
                        清空对话
                    </el-button>
                    <el-button
                        type="primary"
                        :loading="loading"
                        @click="sendMessage"
                    >
                        <el-icon><Promotion /></el-icon>
                        发送
                    </el-button>
                </div>
            </div>
        </div>

        <!-- API 配置提示 -->
        <el-dialog
            v-model="showConfigDialog"
            title="配置 API Key"
            width="400px"
            :close-on-click-modal="false"
        >
            <el-form :model="apiConfig" label-width="100px">
                <el-form-item label="API 地址">
                    <el-input
                        v-model="apiConfig.baseUrl"
                        placeholder="https://api.openai.com/v1"
                    />
                </el-form-item>
                <el-form-item label="API Key">
                    <el-input
                        v-model="apiConfig.apiKey"
                        type="password"
                        show-password
                        placeholder="sk-..."
                    />
                </el-form-item>
                <el-form-item label="模型">
                    <el-select v-model="apiConfig.model" style="width: 100%">
                        <el-option
                            label="GPT-3.5-turbo"
                            value="gpt-3.5-turbo"
                        />
                        <el-option label="GPT-4" value="gpt-4" />
                        <el-option
                            label="GPT-4-turbo"
                            value="gpt-4-turbo-preview"
                        />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showConfigDialog = false">取消</el-button>
                <el-button type="primary" @click="saveApiConfig"
                    >保存</el-button
                >
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import { marked } from 'marked';
import {
    saveUserData,
    loadUserData,
    STORAGE_KEYS
} from '@/utils/userStorage.js';
import { Agent } from '@/utils/agent/index.js';

import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

const router = useRouter();
const historyRef = ref(null);
const inputMessage = ref('');
const loading = ref(false);
const showConfigDialog = ref(false);

console.log(123);
const messages = ref([
    {
        role: 'assistant',
        content: '你好！我是AI助手，有什么可以帮助你的吗？',
        time: new Date().toLocaleTimeString()
    }
]);

const apiConfig = reactive({
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-3.5-turbo'
});

// 配置 marked
marked.setOptions({
    highlight: (code, lang) => {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    },
    breaks: true
});

// 格式化消息
const formatMessage = (content) => {
    return marked(content);
};

// 滚动到底部
const scrollToBottom = () => {
    nextTick(() => {
        if (historyRef.value) {
            historyRef.value.scrollTop = historyRef.value.scrollHeight;
        }
    });
};

// 发送消息
const sendMessage = async () => {
    if (!inputMessage.value.trim()) return;

    // 检查 API 配置
    if (!apiConfig.apiKey) {
        showConfigDialog.value = true;
        ElMessage.warning('请先配置 API Key');
        return;
    }

    const userMessage = inputMessage.value.trim();

    // 添加用户消息
    messages.value.push({
        role: 'user',
        content: userMessage,
        time: new Date().toLocaleTimeString()
    });

    inputMessage.value = '';
    scrollToBottom();

    loading.value = true;

    try {
        // 使用 Agent 系统处理消息
        const agent = new Agent(apiConfig);
        agent.setMessages(messages.value);

        const assistantMessage = await agent.processUserMessage(userMessage);

        // 添加助手消息
        messages.value.push({
            role: 'assistant',
            content: assistantMessage,
            time: new Date().toLocaleTimeString()
        });

        scrollToBottom();
    } catch (error) {
        ElMessage.error('请求失败: ' + error.message);
        // 模拟响应（演示用）
        messages.value.push({
            role: 'assistant',
            content: `抱歉，API 请求失败。这是一个模拟响应：\n\n你说的是："${userMessage}"\n\n请检查你的 API 配置是否正确。`,
            time: new Date().toLocaleTimeString()
        });
    } finally {
        loading.value = false;
        scrollToBottom();
    }
};

// 清空对话
const clearMessages = () => {
    messages.value = [
        {
            role: 'assistant',
            content: '对话已清空。有什么可以帮助你的吗？',
            time: new Date().toLocaleTimeString()
        }
    ];
};

// 键盘事件
const handleKeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
};

// 保存 API 配置
const saveApiConfig = async () => {
    await saveUserData(STORAGE_KEYS.AI_API_CONFIG, apiConfig);
    showConfigDialog.value = false;
    ElMessage.success('配置已保存');
};

// 加载配置
onMounted(async () => {
    scrollToBottom();

    // 从用户数据目录加载配置
    const savedConfig = await loadUserData(STORAGE_KEYS.AI_API_CONFIG, null);
    if (savedConfig) {
        Object.assign(apiConfig, savedConfig);
    }

    // 从 Electron 加载配置（兼容旧版）
    if (window.electronAPI) {
        const config = await window.electronAPI.getConfig();
        if (config.apiKeys?.openai) {
            Object.assign(apiConfig, config.apiKeys.openai);
        }
    }
});
</script>

<style scoped>
.chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #f5f7fa;
}

.page-header {
    padding: 12px 20px;
    background: #fff;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    align-items: center;
}

.chat-history {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
}

.message-list {
    max-width: 800px;
    margin: 0 auto;
}

.message-item {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    animation: fadeIn 0.3s ease;
}

.message-item.user {
    flex-direction: row-reverse;
}

.message-content {
    max-width: 70%;
    padding: 12px 16px;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.message-item.user .message-content {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
}

.message-text {
    line-height: 1.6;
    word-break: break-word;
}

.message-text :deep(pre) {
    background: #1e1e1e;
    border-radius: 8px;
    padding: 12px;
    overflow-x: auto;
    margin: 8px 0;
}

.message-text :deep(code) {
    font-family: 'Fira Code', monospace;
    font-size: 13px;
}

.message-item.user .message-text :deep(pre) {
    background: rgba(0, 0, 0, 0.2);
}

.message-time {
    font-size: 12px;
    color: #999;
    margin-top: 8px;
}

.message-item.user .message-time {
    color: rgba(255, 255, 255, 0.7);
}

/* 打字动画 */
.typing-indicator {
    display: flex;
    gap: 4px;
    padding: 8px 0;
}

.typing-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #667eea;
    animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes typing {
    0%,
    60%,
    100% {
        transform: translateY(0);
    }
    30% {
        transform: translateY(-10px);
    }
}

.chat-input-area {
    padding: 16px 20px;
    background: #fff;
    border-top: 1px solid #e4e7ed;
}

.input-wrapper {
    max-width: 800px;
    margin: 0 auto;
}

.input-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>

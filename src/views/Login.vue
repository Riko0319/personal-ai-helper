<template>
    <div class="login-container">
        <!-- 窗口控制按钮 -->
        <div class="window-controls">
            <div class="window-btn close-btn" @click="handleClose">
                <el-icon><Close /></el-icon>
            </div>
        </div>
        <div class="login-card animate-slideInUp">
            <!-- Logo -->
            <div class="login-header">
                <div class="logo">
                    <el-icon :size="48"><Monitor /></el-icon>
                </div>
                <h1>AI 助手</h1>
                <p class="subtitle">智能桌面助手 v1.0.1</p>
            </div>

            <!-- 登录表单 -->
            <el-form
                ref="loginFormRef"
                :model="loginForm"
                :rules="loginRules"
                class="login-form"
                @submit.prevent="handleLogin"
            >
                <el-form-item prop="username">
                    <el-input
                        v-model="loginForm.username"
                        placeholder="请输入用户名"
                        size="large"
                        :prefix-icon="User"
                    />
                </el-form-item>

                <el-form-item prop="password">
                    <el-input
                        v-model="loginForm.password"
                        type="password"
                        placeholder="请输入密码"
                        size="large"
                        :prefix-icon="Lock"
                        show-password
                        @keyup.enter="handleLogin"
                    />
                </el-form-item>

                <el-form-item>
                    <el-checkbox v-model="rememberMe">记住我</el-checkbox>
                </el-form-item>

                <el-form-item>
                    <el-button
                        type="primary"
                        size="large"
                        :loading="loading"
                        class="login-btn"
                        @click="handleLogin"
                    >
                        {{ loading ? '登录中...' : '登 录' }}
                    </el-button>
                </el-form-item>
            </el-form>

            <!-- 提示信息 -->
            <div class="login-tips">
                <el-alert
                    title="测试账号：admin / admin123 或 test / test123"
                    type="info"
                    :closable="false"
                    show-icon
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock, Close } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/user';
import {
    saveUserData,
    loadUserData,
    STORAGE_KEYS
} from '@/utils/userStorage.js';

const router = useRouter();
const userStore = useUserStore();

const loginFormRef = ref(null);
const loading = ref(false);
const rememberMe = ref(false);

const loginForm = reactive({
    username: '',
    password: ''
});

const loginRules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
    ]
};

// 读取记住的用户名
onMounted(async () => {
    const savedUsername = await loadUserData(
        STORAGE_KEYS.REMEMBERED_USERNAME,
        null
    );
    if (savedUsername) {
        loginForm.username = savedUsername;
        rememberMe.value = true;
    }
});

// 关闭登录窗口
const handleClose = () => {
    if (window.electronAPI) {
        window.electronAPI.closeLoginWindow();
    }
};

const handleLogin = async () => {
    if (!loginFormRef.value) return;

    await loginFormRef.value.validate(async (valid) => {
        if (!valid) return;

        loading.value = true;

        try {
            // 调用 Electron 登录
            if (window.electronAPI) {
                const result = await window.electronAPI.login({
                    username: loginForm.username,
                    password: loginForm.password
                });

                if (result.success) {
                    userStore.setLoggedIn(result.username);

                    // 记住用户名
                    if (rememberMe.value) {
                        await saveUserData(
                            STORAGE_KEYS.REMEMBERED_USERNAME,
                            loginForm.username
                        );
                    } else {
                        await saveUserData(
                            STORAGE_KEYS.REMEMBERED_USERNAME,
                            null
                        );
                    }

                    ElMessage.success('登录成功');
                    // 登录成功，Electron 会自动关闭登录窗口并打开主窗口
                    // 不需要手动跳转路由
                } else {
                    ElMessage.error(result.message || '登录失败');
                }
            } else {
                // 非Electron环境，模拟登录
                if (
                    loginForm.username === 'admin' &&
                    loginForm.password === 'admin123'
                ) {
                    userStore.setLoggedIn(loginForm.username);
                    ElMessage.success('登录成功');
                    router.push('/home');
                } else {
                    ElMessage.error('用户名或密码错误');
                }
            }
        } catch (error) {
            ElMessage.error('登录失败：' + error.message);
        } finally {
            loading.value = false;
        }
    });
};
</script>

<style scoped>
.login-container {
    width: 100%;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: relative;
    overflow: hidden;
}

/* 窗口控制按钮 */
.window-controls {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 100;
    display: flex;
}

.window-btn {
    width: 40px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: transparent;
    color: rgba(255, 255, 255, 0.8);
    font-size: 16px;
}

.window-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
}

.close-btn:hover {
    background: #ff5f57;
    color: #fff;
}

.login-card {
    width: 400px;
    padding: 40px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    position: relative;
    z-index: 10;
}

.login-header {
    text-align: center;
    margin-bottom: 30px;
}

.logo {
    width: 80px;
    height: 80px;
    margin: 0 auto 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
}

.login-header h1 {
    font-size: 24px;
    color: #333;
    margin-bottom: 8px;
}

.subtitle {
    color: #999;
    font-size: 14px;
}

.login-form {
    margin-top: 20px;
}

.login-btn {
    width: 100%;
    height: 44px;
    font-size: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
}

.login-btn:hover {
    opacity: 0.9;
}

.login-tips {
    margin-top: 20px;
}
</style>

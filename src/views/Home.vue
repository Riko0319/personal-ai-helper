<template>
    <div class="home-container">
        <!-- 顶部标签页 -->
        <div class="tabs-header">
            <el-tabs
                v-model="activeTab"
                type="card"
                @tab-click="handleTabClick"
                @tab-remove="handleTabRemove"
            >
                <el-tab-pane
                    v-for="tab in tabs"
                    :key="tab.name"
                    :label="tab.title"
                    :name="tab.name"
                    :closable="tab.closable"
                />
            </el-tabs>

            <!-- 用户信息 -->
            <div class="user-info">
                <el-dropdown trigger="click" @command="handleCommand">
                    <span class="user-avatar">
                        <el-avatar :size="32" icon="User" />
                        <span class="username">{{ userStore.username }}</span>
                    </span>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item command="settings">
                                <el-icon><Setting /></el-icon>设置
                            </el-dropdown-item>
                            <el-dropdown-item command="about">
                                <el-icon><InfoFilled /></el-icon>关于
                            </el-dropdown-item>
                            <el-dropdown-item divided command="logout">
                                <el-icon><SwitchButton /></el-icon>退出登录
                            </el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
        </div>

        <!-- 主内容区域 -->
        <div class="main-area">
            <!-- 首页内容 - 宫格快捷入口 -->
            <div v-if="activeTab === 'Home'" class="home-content">
                <div class="welcome-section">
                    <h2>欢迎使用 AI 助手</h2>
                    <p>选择下方功能开始使用</p>
                </div>

                <!-- 宫格功能入口 -->
                <div class="grid-container">
                    <div
                        v-for="item in gridItems"
                        :key="item.name"
                        class="grid-item"
                        @click="openFeature(item)"
                    >
                        <div
                            class="grid-icon"
                            :style="{ background: item.color }"
                        >
                            <el-icon :size="32"
                                ><component :is="item.icon"
                            /></el-icon>
                        </div>
                        <div class="grid-title">{{ item.title }}</div>
                        <div class="grid-desc">{{ item.desc }}</div>
                    </div>
                </div>
            </div>

            <!-- 子页面内容 -->
            <div v-else class="sub-page-content">
                <router-view v-slot="{ Component }">
                    <keep-alive>
                        <component :is="Component" />
                    </keep-alive>
                </router-view>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/store/user';
import { useTabStore } from '@/store/tabs';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const tabStore = useTabStore();

const tabs = computed(() => tabStore.tabs);
const activeTab = computed({
    get: () => tabStore.activeTab,
    set: (val) => tabStore.setActiveTab(val)
});

// 宫格功能项
const gridItems = [
    {
        name: 'AIChat',
        title: 'AI 对话',
        desc: '智能对话助手',
        icon: 'ChatDotRound',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        path: '/chat'
    },
    {
        name: 'Translate',
        title: 'AI 翻译',
        desc: '多语言智能翻译',
        icon: 'Position',
        color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        path: '/translate'
    },
    {
        name: 'OCR',
        title: '图片识别',
        desc: 'OCR文字识别',
        icon: 'Picture',
        color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        path: '/ocr'
    },
    {
        name: 'Notes',
        title: '智能笔记',
        desc: 'AI辅助笔记',
        icon: 'Notebook',
        color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        path: '/notes'
    },
    {
        name: 'Tools',
        title: '实用工具',
        desc: '常用小工具集',
        icon: 'Tools',
        color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        path: '/tools'
    },
    {
        name: 'Settings',
        title: '系统设置',
        desc: '个性化配置',
        icon: 'Setting',
        color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        path: '/settings'
    }
];

// 打开功能
const openFeature = (item) => {
    tabStore.addTab({
        name: item.name,
        title: item.title,
        path: item.path,
        closable: true
    });
    router.push(item.path);
};

// 标签页点击
const handleTabClick = (tab) => {
    const tabItem = tabs.value.find((t) => t.name === tab.paneName);
    if (tabItem) {
        router.push(tabItem.path);
    }
};

// 标签页移除
const handleTabRemove = (name) => {
    const newActiveName = tabStore.removeTab(name);
    const activeTabItem = tabs.value.find((t) => t.name === newActiveName);
    if (activeTabItem) {
        router.push(activeTabItem.path);
    }
};

// 下拉菜单命令
const handleCommand = async (command) => {
    switch (command) {
        case 'settings':
            openFeature({
                name: 'Settings',
                title: '系统设置',
                path: '/settings'
            });
            break;
        case 'about':
            ElMessageBox.alert(
                'AI 助手 v1.0.0\n\n基于 Electron + Vue 3 + Element Plus 构建\n\n作者：Riko',
                '关于',
                { confirmButtonText: '确定' }
            );
            break;
        case 'logout':
            try {
                await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                userStore.logout();
                router.push('/login');
                ElMessage.success('已退出登录');
            } catch (e) {
                // 取消
            }
            break;
    }
};

// 监听路由变化，同步标签页
watch(
    () => route.name,
    (name) => {
        if (name && name !== 'Login') {
            tabStore.setActiveTab(name);
        }
    },
    { immediate: true }
);

// 监听 Electron 导航事件
onMounted(() => {
    if (window.electronAPI) {
        window.electronAPI.onNavigateTo((route) => {
            router.push(route);
        });
    }
});
</script>

<style scoped>
.home-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #f5f7fa;
    padding-top: 8px;
}

.tabs-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: #fff;
    border-bottom: 1px solid #e4e7ed;
}

.tabs-header :deep(.el-tabs) {
    flex: 1;
}

.tabs-header :deep(.el-tabs__header) {
    margin: 0;
    border-bottom: none;
}

.tabs-header :deep(.el-tabs__nav) {
    border: none;
    height: 34px;
    padding-top: 2px;
}

.tabs-header :deep(.el-tabs__item) {
    height: 32px;
    line-height: 32px;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    margin-right: 8px;
    padding: 0 16px;
}

.tabs-header :deep(.el-tabs__item.is-active) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border-color: transparent;
}

.user-info {
    margin-left: 16px;
}

.user-avatar {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.username {
    font-size: 14px;
    color: #333;
}

.main-area {
    flex: 1;
    overflow: auto;
    padding: 20px;
}

.home-content {
    max-width: 1000px;
    margin: 0 auto;
}

.welcome-section {
    text-align: center;
    margin-bottom: 40px;
}

.welcome-section h2 {
    font-size: 28px;
    color: #333;
    margin-bottom: 8px;
}

.welcome-section p {
    color: #999;
    font-size: 16px;
}

.grid-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
}

.grid-item {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.grid-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.grid-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    color: #fff;
}

.grid-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
}

.grid-desc {
    font-size: 12px;
    color: #999;
}

.sub-page-content {
    width: 100%;
    height: 100%;
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
}

@media (max-width: 900px) {
    .grid-container {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (max-width: 700px) {
    .grid-container {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>

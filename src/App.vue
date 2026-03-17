<template>
    <div class="app-container" :class="{ 'is-electron': isElectron }">
        <!-- 自定义标题栏 -->
        <TitleBar v-if="isElectron && !isLoginPage" />

        <!-- 主内容区域 -->
        <div
            class="main-content"
            :class="{ 'with-titlebar': isElectron && !isLoginPage }"
        >
            <router-view v-slot="{ Component }">
                <transition name="fade" mode="out-in">
                    <keep-alive :include="cachedViews">
                        <component :is="Component" />
                    </keep-alive>
                </transition>
            </router-view>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import TitleBar from '@/components/TitleBar.vue';

// 检测是否在 Electron 环境中
const isElectron = ref(false);
const cachedViews = ['Home', 'AIChat', 'Translate', 'Settings'];

onMounted(() => {
    isElectron.value = !!window.electronAPI;
});

const route = useRoute();
const isLoginPage = computed(() => route.path === '/login');
</script>

<style>
.app-container {
    width: 100%;
    height: 100vh;
    overflow: hidden;
}

.main-content {
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.main-content.with-titlebar {
    height: calc(100vh - 48px);
    margin-top: 48px;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>

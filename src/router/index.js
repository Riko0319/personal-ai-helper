import { createRouter, createWebHashHistory } from 'vue-router';
import { useUserStore } from '@/store/user';

const routes = [
    {
        path: '/',
        redirect: '/home'
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/Login.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { requiresAuth: true, keepAlive: true }
    },
    {
        path: '/chat',
        name: 'AIChat',
        component: () => import('@/views/AIChat.vue'),
        meta: { requiresAuth: true, keepAlive: true }
    },
    {
        path: '/translate',
        name: 'Translate',
        component: () => import('@/views/Translate.vue'),
        meta: { requiresAuth: true, keepAlive: true }
    },
    {
        path: '/ocr',
        name: 'OCR',
        component: () => import('@/views/OCR.vue'),
        meta: { requiresAuth: true, keepAlive: true }
    },
    {
        path: '/notes',
        name: 'Notes',
        component: () => import('@/views/Notes.vue'),
        meta: { requiresAuth: true, keepAlive: true }
    },
    {
        path: '/tools',
        name: 'Tools',
        component: () => import('@/views/Tools.vue'),
        meta: { requiresAuth: true, keepAlive: true }
    },
    {
        path: '/settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { requiresAuth: true, keepAlive: true }
    },
    {
        path: '/tools/ruler',
        name: 'ScreenRuler',
        component: () => import('@/views/ScreenRuler.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/tools/color-picker',
        name: 'ColorPicker',
        component: () => import('@/views/ColorPicker.vue'),
        meta: { requiresAuth: true }
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

// 路由守卫 - 检查登录状态
router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore();

    if (to.meta.requiresAuth !== false) {
        // 需要认证的页面
        if (!userStore.isLoggedIn) {
            // 尝试从 Electron 获取登录状态
            if (window.electronAPI) {
                const result = await window.electronAPI.checkLogin();
                if (result.isLoggedIn) {
                    userStore.setLoggedIn(result.username);
                    next();
                    return;
                }
            }
            next('/login');
            return;
        }
    }

    next();
});

export default router;

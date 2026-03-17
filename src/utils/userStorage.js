/**
 * 用户数据存储工具
 * 数据存储在 C:\Users\<用户名>\AppData\Roaming\ai-assistant-desktop\users\<账号>\
 */

const STORAGE_KEYS = {
    TRANSLATE_CONFIG: 'translate-config.json',
    TRANSLATE_HISTORY: 'translate-history.json',
    OCR_CONFIG: 'ocr-config.json',
    COLOR_HISTORY: 'color-history.json',
    RULER_MEASUREMENTS: 'ruler-measurements.json',
    PICKER_HISTORY: 'picker-history.json',
    QUICK_LAUNCH: 'quick-launch.json',
    AI_API_CONFIG: 'ai-api-config.json',
    NOTES_DATA: 'notes-data.json',
    APP_SETTINGS: 'app-settings.json',
    REMEMBERED_USERNAME: 'remembered-username.json'
};

// 检查是否在 Electron 环境
const isElectron = () => {
    return window.electronAPI && window.electronAPI.saveUserData;
};

// 保存数据
export const saveUserData = async (key, data) => {
    // 将 Vue 响应式对象转换为普通对象
    const plainData = JSON.parse(JSON.stringify(data));

    if (isElectron()) {
        const result = await window.electronAPI.saveUserData(key, plainData);
        if (!result.success) {
            console.error('保存失败:', result.error);
            // 降级到 localStorage
            localStorage.setItem(key, JSON.stringify(plainData));
        }
    } else {
        // 非 Electron 环境使用 localStorage
        localStorage.setItem(key, JSON.stringify(plainData));
    }
};

// 读取数据
export const loadUserData = async (key, defaultValue = null) => {
    if (isElectron()) {
        const result = await window.electronAPI.loadUserData(key);
        if (result.success && result.data !== null) {
            return result.data;
        }
        // 尝试从 localStorage 读取（兼容旧数据）
        const localData = localStorage.getItem(key);
        if (localData) {
            const parsed = JSON.parse(localData);
            // 迁移到文件存储
            await saveUserData(key, parsed);
            return parsed;
        }
    } else {
        const localData = localStorage.getItem(key);
        if (localData) {
            return JSON.parse(localData);
        }
    }
    return defaultValue;
};

// 删除数据
export const deleteUserData = async (key) => {
    if (isElectron()) {
        await window.electronAPI.deleteUserData(key);
    }
    localStorage.removeItem(key);
};

// 获取当前用户
export const getCurrentUser = async () => {
    if (isElectron()) {
        const result = await window.electronAPI.getCurrentUser();
        return result.username;
    }
    return null;
};

// 清除当前用户所有缓存
export const clearUserCache = async () => {
    if (isElectron()) {
        const result = await window.electronAPI.clearUserCache();
        if (result.success) {
            // 同时清除 localStorage
            Object.values(STORAGE_KEYS).forEach((key) => {
                localStorage.removeItem(key);
            });
        }
        return result;
    } else {
        // 非 Electron 环境只清除 localStorage
        Object.values(STORAGE_KEYS).forEach((key) => {
            localStorage.removeItem(key);
        });
        return { success: true };
    }
};

export { STORAGE_KEYS };

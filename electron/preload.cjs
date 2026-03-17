const { contextBridge, ipcRenderer } = require('electron');

/**
 * 通过 preload 脚本向渲染进程暴露安全的 API
 * 使用 contextBridge 可以确保渲染进程只能访问指定的 API
 */

// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld('electronAPI', {
    // ========== 窗口控制 ==========
    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    maximizeWindow: () => ipcRenderer.send('window-maximize'),
    closeWindow: () => ipcRenderer.send('window-close'),
    showWindow: () => ipcRenderer.send('window-show'),
    closeLoginWindow: () => ipcRenderer.send('login-window-close'),

    // ========== 配置管理 ==========
    getConfig: () => ipcRenderer.invoke('get-config'),
    setConfig: (config) => ipcRenderer.invoke('set-config', config),

    // ========== 用户认证 ==========
    login: (credentials) => ipcRenderer.invoke('login', credentials),
    checkLogin: () => ipcRenderer.invoke('check-login'),
    logout: () => ipcRenderer.invoke('logout'),

    // ========== 系统功能 ==========
    showNotification: (options) =>
        ipcRenderer.send('show-notification', options),
    openExternal: (url) => ipcRenderer.send('open-external', url),
    selectFile: () => ipcRenderer.invoke('select-file'),
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppPath: (name) => ipcRenderer.invoke('get-app-path', name),

    // ========== OCR 识别 ==========
    baiduOCR: (imageBase64, config) =>
        ipcRenderer.invoke('baidu-ocr', imageBase64, config),
    readImageFile: (filePath) =>
        ipcRenderer.invoke('read-image-file', filePath),

    // ========== 翻译 ==========
    baiduTranslate: (text, from, to, config) =>
        ipcRenderer.invoke('baidu-translate', text, from, to, config),

    // ========== 屏幕尺子 ==========
    startScreenRuler: () => ipcRenderer.invoke('start-screen-ruler'),
    onRulerResult: (callback) => {
        ipcRenderer.on('ruler-result', (event, data) => callback(data));
    },

    // ========== 屏幕吸色器 ==========
    startScreenPicker: () => ipcRenderer.invoke('start-screen-picker'),
    onPickerResult: (callback) => {
        ipcRenderer.on('picker-result', (event, color) => callback(color));
    },

    // ========== 用户数据存储 ==========
    getCurrentUser: () => ipcRenderer.invoke('get-current-user'),
    saveUserData: (filename, data) =>
        ipcRenderer.invoke('save-user-data', filename, data),
    loadUserData: (filename) => ipcRenderer.invoke('load-user-data', filename),
    deleteUserData: (filename) =>
        ipcRenderer.invoke('delete-user-data', filename),
    clearUserCache: () => ipcRenderer.invoke('clear-user-cache'),

    // ========== 事件监听 ==========
    onNavigateTo: (callback) => {
        ipcRenderer.on('navigate-to', (event, route) => callback(route));
    },
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});

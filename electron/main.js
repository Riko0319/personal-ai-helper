import {
    app,
    BrowserWindow,
    ipcMain,
    Tray,
    nativeImage,
    Menu,
    globalShortcut,
    Notification,
    dialog,
    shell
} from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import https from 'node:https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 判断是否为开发环境
const isDev = !app.isPackaged;

// 窗口引用
let mainWindow = null;
let loginWindow = null;
let tray = null;
let rulerWindow = null;
let pickerWindow = null;

// 用户数据存储路径（使用系统用户数据目录）
const userDataPath = path.join(app.getPath('userData'), 'userData');
const configPath = path.join(userDataPath, 'config.json');

// 当前登录用户
let currentUser = null;

// 确保 userData 目录存在
if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
}

// 获取用户数据目录
function getUserDataDir(username) {
    const userDir = path.join(userDataPath, 'users', username);
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }
    return userDir;
}

// 获取用户数据文件路径
function getUserDataPath(username, filename) {
    return path.join(getUserDataDir(username), filename);
}

/**
 * 确保配置文件存在
 */
function ensureConfigFile() {
    if (!fs.existsSync(configPath)) {
        const defaultConfig = {
            theme: 'light',
            language: 'zh-CN',
            shortcuts: {
                showWindow: 'CommandOrControl+Shift+A',
                quickSearch: 'CommandOrControl+Shift+F'
            }
        };
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    }
}

/**
 * 读取配置
 */
function readConfig() {
    ensureConfigFile();
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
}

/**
 * 写入配置
 */
function writeConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * 创建登录窗口
 */
function createLoginWindow() {
    loginWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        frame: false, // 无边框
        transparent: false,
        resizable: false, // 登录窗口固定大小
        maximizable: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs'),
            webSecurity: true
        },
        icon: path.join(__dirname, '../build/icon.ico'),
        show: false
    });

    // 加载登录页面（通过路由）
    if (isDev) {
        loginWindow.loadURL('http://localhost:5173#/login');
    } else {
        loginWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
            hash: '/login'
        });
    }

    loginWindow.once('ready-to-show', () => {
        loginWindow.show();
    });

    loginWindow.on('closed', () => {
        loginWindow = null;
        // 如果登录窗口关闭且主窗口未创建，退出应用
        if (!mainWindow) {
            app.quit();
        }
    });
}

/**
 * 创建主窗口
 */
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        frame: false, // 无边框窗口，自定义标题栏
        transparent: false,
        resizable: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs'),
            webSecurity: true
        },
        icon: path.join(__dirname, '../build/icon.ico'),
        show: false // 先隐藏，加载完成后再显示
    });

    // 开发环境加载本地服务器
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // 窗口准备显示时
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // 关闭窗口时最小化到托盘
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

/**
 * 创建系统托盘
 */
function createTray() {
    // 创建托盘图标（这里用简单的图标，实际项目应该用自定义图标）
    const iconPath = path.join(__dirname, '../build/icon.ico');
    let trayIcon;

    if (fs.existsSync(iconPath)) {
        trayIcon = nativeImage.createFromPath(iconPath);
    } else {
        // 如果没有图标文件，创建一个简单的图标
        trayIcon = nativeImage.createEmpty();
    }

    tray = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: '显示主窗口',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        {
            label: '新建窗口',
            click: () => {
                if (!mainWindow) {
                    createWindow();
                }
            }
        },
        { type: 'separator' },
        {
            label: '设置',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.webContents.send('navigate-to', '/settings');
                }
            }
        },
        { type: 'separator' },
        {
            label: '退出',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('AI助手--By Riko');
    tray.setContextMenu(contextMenu);

    // 点击托盘图标显示窗口
    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });
}

/**
 * 注册全局快捷键
 */
function registerShortcuts() {
    const config = readConfig();

    // 显示/隐藏窗口快捷键
    const showWindowShortcut =
        config.shortcuts?.showWindow || 'CommandOrControl+Shift+A';

    try {
        globalShortcut.register(showWindowShortcut, () => {
            if (mainWindow) {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        });
    } catch (error) {
        console.log('快捷键注册失败:', error);
    }
}

/**
 * IPC 处理器
 */
function setupIpcHandlers() {
    // 窗口控制
    ipcMain.on('window-minimize', () => {
        mainWindow?.minimize();
    });

    ipcMain.on('window-maximize', () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow?.maximize();
        }
    });

    ipcMain.on('window-close', () => {
        mainWindow?.hide();
    });

    ipcMain.on('window-show', () => {
        mainWindow?.show();
        mainWindow?.focus();
    });

    // 关闭登录窗口（用户点击关闭按钮时）
    ipcMain.on('login-window-close', () => {
        loginWindow?.close();
    });

    // 配置管理
    ipcMain.handle('get-config', () => {
        return readConfig();
    });

    ipcMain.handle('set-config', (event, config) => {
        writeConfig(config);
        return { success: true };
    });

    // 登录验证（模拟）
    ipcMain.handle('login', (event, { username, password }) => {
        // 模拟登录验证 - 实际项目应该调用后端API
        const validUsers = [
            { username: 'admin', password: 'admin123' },
            { username: 'test', password: 'test123' }
        ];

        const user = validUsers.find(
            (u) => u.username === username && u.password === password
        );

        if (user) {
            currentUser = username;
            const config = readConfig();
            config.lastUser = username;
            config.isLoggedIn = true;
            writeConfig(config);

            // 确保用户目录存在
            getUserDataDir(username);

            // 登录成功：关闭登录窗口，打开主窗口
            if (loginWindow) {
                loginWindow.close();
                loginWindow = null;
            }
            if (!mainWindow) {
                createMainWindow();
                createTray();
                registerShortcuts();
            }

            return { success: true, username };
        }

        return { success: false, message: '用户名或密码错误' };
    });

    // 检查登录状态
    ipcMain.handle('check-login', () => {
        const config = readConfig();
        return {
            isLoggedIn: config.isLoggedIn || false,
            username: config.lastUser
        };
    });

    // 退出登录
    ipcMain.handle('logout', () => {
        currentUser = null;
        const config = readConfig();
        config.isLoggedIn = false;
        writeConfig(config);

        // 关闭主窗口
        if (mainWindow) {
            mainWindow.close();
            mainWindow = null;
        }

        // 销毁托盘
        if (tray) {
            tray.destroy();
            tray = null;
        }

        // 注销快捷键
        unregisterShortcuts();

        // 打开登录窗口
        createLoginWindow();

        return { success: true };
    });

    // 发送系统通知
    ipcMain.on('show-notification', (event, { title, body }) => {
        new Notification({
            title,
            body,
            icon: path.join(__dirname, '../build/icon.ico')
        }).show();
    });

    // 打开外部链接
    ipcMain.on('open-external', (event, url) => {
        shell.openExternal(url);
    });

    // 选择文件
    ipcMain.handle('select-file', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'Images', extensions: ['jpg', 'png', 'gif', 'bmp'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        return result;
    });

    // 选择目录
    ipcMain.handle('select-directory', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });
        return result;
    });

    // 获取应用版本
    ipcMain.handle('get-app-version', () => {
        return app.getVersion();
    });

    // 获取应用路径
    ipcMain.handle('get-app-path', (event, name) => {
        return app.getPath(name);
    });

    // 读取图片文件为 base64
    ipcMain.handle('read-image-file', async (event, filePath) => {
        try {
            // 处理 file:// 协议路径
            let realPath = filePath;
            if (filePath.startsWith('file://')) {
                realPath = filePath.replace('file://', '');
                // Windows 路径处理
                if (realPath.startsWith('/')) {
                    realPath = realPath.substring(1);
                }
            }

            const buffer = fs.readFileSync(realPath);
            const base64 = buffer.toString('base64');
            // 检测图片类型
            const ext = path.extname(realPath).toLowerCase();
            let mimeType = 'image/jpeg';
            if (ext === '.png') mimeType = 'image/png';
            else if (ext === '.gif') mimeType = 'image/gif';
            else if (ext === '.bmp') mimeType = 'image/bmp';
            else if (ext === '.webp') mimeType = 'image/webp';

            return { success: true, data: `data:${mimeType};base64,${base64}` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // 百度翻译（文本翻译 API）
    ipcMain.handle('baidu-translate', async (event, text, from, to, config) => {
        try {
            // 1. 获取 access_token
            const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${config.apiKey}&client_secret=${config.secretKey}`;

            const accessToken = await new Promise((resolve, reject) => {
                const req = https.request(
                    tokenUrl,
                    { method: 'POST' },
                    (res) => {
                        let data = '';
                        res.on('data', (chunk) => (data += chunk));
                        res.on('end', () => {
                            try {
                                const json = JSON.parse(data);
                                if (json.access_token) {
                                    resolve(json.access_token);
                                } else {
                                    reject(
                                        new Error(
                                            json.error_description ||
                                                '获取 token 失败'
                                        )
                                    );
                                }
                            } catch (e) {
                                reject(e);
                            }
                        });
                    }
                );
                req.on('error', reject);
                req.end();
            });

            // 2. 调用文本翻译接口
            const translateUrl = `https://aip.baidubce.com/rpc/2.0/mt/texttrans/v1?access_token=${accessToken}`;

            const postData = JSON.stringify({
                from: from,
                to: to,
                q: text
            });

            const translateResult = await new Promise((resolve, reject) => {
                const req = https.request(
                    translateUrl,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json'
                        }
                    },
                    (res) => {
                        let data = '';
                        res.on('data', (chunk) => (data += chunk));
                        res.on('end', () => {
                            try {
                                const json = JSON.parse(data);
                                if (json.error_code) {
                                    reject(
                                        new Error(
                                            json.error_msg ||
                                                `翻译失败: ${json.error_code}`
                                        )
                                    );
                                } else {
                                    resolve(json);
                                }
                            } catch (e) {
                                reject(e);
                            }
                        });
                    }
                );
                req.on('error', reject);
                req.write(postData);
                req.end();
            });

            return { success: true, data: translateResult };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // 百度云 OCR 识别
    ipcMain.handle('baidu-ocr', async (event, imageBase64, config) => {
        try {
            // 1. 获取 access_token
            const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${config.apiKey}&client_secret=${config.secretKey}`;

            const tokenData = await new Promise((resolve, reject) => {
                const req = https.request(
                    tokenUrl,
                    { method: 'POST' },
                    (res) => {
                        let data = '';
                        res.on('data', (chunk) => (data += chunk));
                        res.on('end', () => {
                            try {
                                const json = JSON.parse(data);
                                if (json.access_token) {
                                    resolve(json.access_token);
                                } else {
                                    reject(
                                        new Error(
                                            json.error_description ||
                                                '获取 token 失败'
                                        )
                                    );
                                }
                            } catch (e) {
                                reject(e);
                            }
                        });
                    }
                );
                req.on('error', reject);
                req.end();
            });

            // 2. 调用 OCR 接口
            const ocrUrl = `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${tokenData}`;

            // 移除 base64 前缀
            const base64Data = imageBase64.replace(
                /^data:image\/\w+;base64,/,
                ''
            );

            const postData = new URLSearchParams();
            postData.append('image', base64Data);
            postData.append('detect_direction', 'false');
            postData.append('detect_language', 'false');

            const ocrResult = await new Promise((resolve, reject) => {
                const req = https.request(
                    ocrUrl,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            Accept: 'application/json'
                        }
                    },
                    (res) => {
                        let data = '';
                        res.on('data', (chunk) => (data += chunk));
                        res.on('end', () => {
                            try {
                                const json = JSON.parse(data);
                                if (json.error_code) {
                                    reject(
                                        new Error(json.error_msg || '识别失败')
                                    );
                                } else {
                                    resolve(json);
                                }
                            } catch (e) {
                                reject(e);
                            }
                        });
                    }
                );
                req.on('error', reject);
                req.write(postData.toString());
                req.end();
            });

            return { success: true, data: ocrResult };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // 屏幕尺子 - 启动透明测量窗口
    ipcMain.handle('start-screen-ruler', async () => {
        try {
            if (rulerWindow) {
                rulerWindow.close();
                rulerWindow = null;
            }

            const { screen } = await import('electron');
            const primaryDisplay = screen.getPrimaryDisplay();
            const { width, height } = primaryDisplay.size;

            rulerWindow = new BrowserWindow({
                width,
                height,
                x: 0,
                y: 0,
                transparent: true,
                frame: false,
                alwaysOnTop: true,
                skipTaskbar: true,
                resizable: false,
                movable: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    preload: path.join(__dirname, 'ruler-preload.cjs')
                }
            });

            // 加载尺子页面
            if (isDev) {
                await rulerWindow.loadURL(
                    'http://localhost:5173/ruler-overlay.html'
                );
            } else {
                await rulerWindow.loadFile(
                    path.join(__dirname, '../dist/ruler-overlay.html')
                );
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // 接收测量结果
    ipcMain.on('ruler-measurement', (event, data) => {
        if (mainWindow) {
            mainWindow.webContents.send('ruler-result', data);
        }
        // 关闭尺子窗口
        if (rulerWindow) {
            rulerWindow.close();
            rulerWindow = null;
        }
    });

    // 取消测量
    ipcMain.on('ruler-cancel', () => {
        if (rulerWindow) {
            rulerWindow.close();
            rulerWindow = null;
        }
    });

    // ========== 屏幕吸色器 ==========

    // 启动吸色器
    ipcMain.handle('start-screen-picker', async () => {
        try {
            if (pickerWindow) {
                pickerWindow.close();
                pickerWindow = null;
            }

            const { screen } = await import('electron');
            const primaryDisplay = screen.getPrimaryDisplay();
            const { width, height } = primaryDisplay.size;

            pickerWindow = new BrowserWindow({
                width,
                height,
                x: 0,
                y: 0,
                transparent: true,
                frame: false,
                alwaysOnTop: true,
                skipTaskbar: true,
                resizable: false,
                movable: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    preload: path.join(__dirname, 'picker-preload.cjs')
                }
            });

            // 加载吸色器页面
            if (isDev) {
                await pickerWindow.loadURL(
                    'http://localhost:5173/picker-overlay.html'
                );
            } else {
                await pickerWindow.loadFile(
                    path.join(__dirname, '../dist/picker-overlay.html')
                );
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // 捕获屏幕
    ipcMain.handle('capture-screen', async () => {
        try {
            const { screen, desktopCapturer } = await import('electron');
            const primaryDisplay = screen.getPrimaryDisplay();

            const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: primaryDisplay.size
            });

            const screenSource =
                sources.find(
                    (s) => s.display_id === primaryDisplay.id.toString()
                ) || sources[0];

            if (screenSource) {
                return {
                    success: true,
                    imageData: screenSource.thumbnail.toDataURL()
                };
            }

            return { success: false, error: '无法捕获屏幕' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // 接收吸取的颜色
    ipcMain.on('picker-color', (event, color) => {
        if (mainWindow) {
            mainWindow.webContents.send('picker-result', color);
        }
        // 关闭吸色器窗口
        if (pickerWindow) {
            pickerWindow.close();
            pickerWindow = null;
        }
    });

    // 取消吸色
    ipcMain.on('picker-cancel', () => {
        if (pickerWindow) {
            pickerWindow.close();
            pickerWindow = null;
        }
    });

    // ========== 用户数据存储（按账号分文件夹）==========

    // 获取当前登录用户
    ipcMain.handle('get-current-user', () => {
        return { username: currentUser };
    });

    // 保存用户数据
    ipcMain.handle('save-user-data', (event, filename, data) => {
        try {
            if (!currentUser) {
                return { success: false, error: '未登录' };
            }
            const filePath = getUserDataPath(currentUser, filename);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // 读取用户数据
    ipcMain.handle('load-user-data', (event, filename) => {
        try {
            if (!currentUser) {
                return { success: false, error: '未登录' };
            }
            const filePath = getUserDataPath(currentUser, filename);
            if (!fs.existsSync(filePath)) {
                return { success: true, data: null };
            }
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // 删除用户数据
    ipcMain.handle('delete-user-data', (event, filename) => {
        try {
            if (!currentUser) {
                return { success: false, error: '未登录' };
            }
            const filePath = getUserDataPath(currentUser, filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // 清除当前用户所有缓存数据
    ipcMain.handle('clear-user-cache', () => {
        try {
            if (!currentUser) {
                return { success: false, error: '未登录' };
            }
            const userDir = getUserDataDir(currentUser);
            if (fs.existsSync(userDir)) {
                const files = fs.readdirSync(userDir);
                for (const file of files) {
                    fs.unlinkSync(path.join(userDir, file));
                }
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}

// 应用准备就绪
app.whenReady().then(() => {
    ensureConfigFile();
    setupIpcHandlers();

    // 检查是否已登录
    const config = readConfig();
    if (config.isLoggedIn && config.lastUser) {
        // 已登录，设置当前用户并打开主窗口
        currentUser = config.lastUser;
        createMainWindow();
        createTray();
        registerShortcuts();
    } else {
        // 未登录，显示登录窗口
        createLoginWindow();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            const cfg = readConfig();
            if (cfg.isLoggedIn && cfg.lastUser) {
                currentUser = cfg.lastUser;
                createMainWindow();
            } else {
                createLoginWindow();
            }
        }
    });
});

// 所有窗口关闭时退出应用（macOS除外）
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 应用退出前清理
app.on('before-quit', () => {
    app.isQuitting = true;
    globalShortcut.unregisterAll();
});

// 应用激活时（macOS）
app.on('activate', () => {
    if (mainWindow === null && loginWindow === null) {
        const cfg = readConfig();
        if (cfg.isLoggedIn) {
            createMainWindow();
        } else {
            createLoginWindow();
        }
    }
});

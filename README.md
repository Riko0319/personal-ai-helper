# AI 助手桌面版

一个基于 Electron + Vue 3 的 AI 助手桌面应用，集成了多种实用工具。

## 功能特性

### 🤖 AI 对话
- 支持 OpenAI API 配置
- 多轮对话历史记录
- 代码高亮显示

### 🛠️ 实用工具箱
- **UUID 生成器**：支持 v4/v1 版本，批量生成
- **二维码生成器**：自定义尺寸、颜色、容错级别
- **图片压缩**：拖拽上传，调整压缩质量
- **文本对比**：对比两段文本差异，标记增删
- **正则测试**：实时测试正则表达式，显示匹配结果
- **快捷启动**：快速打开常用网站/应用

### 📝 智能笔记
- 富文本编辑
- 笔记分类管理
- 本地数据存储

### 🔍 OCR 识别
- 百度云 OCR 集成
- 支持图片拖拽上传
- 识别结果一键复制

### 🌐 AI 翻译
- 百度翻译 API 集成
- 多语言互译
- 翻译历史记录
- 支持配置 API Key

### 🎨 屏幕工具
- **屏幕尺子**：测量屏幕上任意两点距离（像素）
- **吸色器**：吸取屏幕上任意位置颜色值

## 技术栈

- **前端框架**：Vue 3 + Composition API
- **桌面框架**：Electron 40
- **构建工具**：Vite 5
- **UI 组件库**：Element Plus
- **状态管理**：Pinia

## 安装运行

### 环境要求
- Node.js 22+
- npm 9+

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run electron:dev
```

### 打包构建
```bash
npm run electron:build
```

## 使用说明

### 登录
- 默认账号：`admin` / `admin123`
- 测试账号：`test` / `test123`

### 数据存储
用户数据存储在项目根目录的 `userData/users/<账号>/` 文件夹下，按账号隔离：
- 翻译配置和历史
- OCR 配置
- 笔记数据
- 颜色历史
- 尺子测量记录

### 配置 API Key

#### 百度翻译 API
1. 前往 [百度翻译开放平台](https://fanyi-api.baidu.com/)
2. 注册并创建应用
3. 在设置中配置 `API Key` 和 `Secret Key`

#### 百度云 OCR API
1. 前往 [百度智能云](https://cloud.baidu.com/)
2. 创建 OCR 应用
3. 在 OCR 页面配置 `AppID`、`API Key`、`Secret Key`

## 项目结构

```
.
├── electron/              # Electron 主进程代码
│   ├── main.js           # 主进程入口
│   └── preload.cjs       # 预加载脚本
├── src/                   # 渲染进程代码
│   ├── components/       # 公共组件
│   ├── views/            # 页面组件
│   ├── router/           # 路由配置
│   ├── store/            # 状态管理
│   ├── utils/            # 工具函数
│   └── assets/           # 静态资源
├── userData/             # 用户数据（自动创建）
└── build/                # 构建输出
```

## 快捷键

- `Ctrl + Shift + A`：显示/隐藏窗口
- `Ctrl + Shift + F`：快速搜索

## 注意事项

1. 首次使用需要配置相应的 API Key
2. 用户数据按账号隔离，切换账号数据独立
3. 清除缓存会删除当前账号的所有本地数据

## License

MIT

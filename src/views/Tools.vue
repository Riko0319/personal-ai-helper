<template>
    <div class="tools-container">
        <!-- 返回按钮 -->
        <div class="page-header">
            <el-button text @click="router.push('/home')">
                <el-icon><ArrowLeft /></el-icon>
                返回主页
            </el-button>
        </div>
        <div class="tools-grid">
            <!-- 工具卡片 -->
            <div
                v-for="tool in tools"
                :key="tool.id"
                class="tool-card"
                @click="openTool(tool)"
            >
                <div class="tool-icon" :style="{ background: tool.color }">
                    <el-icon :size="32"><component :is="tool.icon" /></el-icon>
                </div>
                <div class="tool-info">
                    <h4>{{ tool.name }}</h4>
                    <p>{{ tool.desc }}</p>
                </div>
            </div>
        </div>

        <!-- 工具弹窗 -->
        <el-dialog
            v-model="toolDialogVisible"
            :title="currentTool?.name"
            width="600px"
        >
            <div class="tool-content">
                <!-- JSON格式化 -->
                <template v-if="currentTool?.id === 'json'">
                    <el-input
                        v-model="jsonInput"
                        type="textarea"
                        :rows="10"
                        placeholder="粘贴JSON字符串..."
                    />
                    <div class="tool-actions">
                        <el-button type="primary" @click="formatJson"
                            >格式化</el-button
                        >
                        <el-button @click="jsonInput = ''">清空</el-button>
                    </div>
                    <el-input
                        v-if="jsonOutput"
                        v-model="jsonOutput"
                        type="textarea"
                        :rows="10"
                        readonly
                        class="output-area"
                    />
                </template>

                <!-- 时间戳转换 -->
                <template v-if="currentTool?.id === 'timestamp'">
                    <div class="timestamp-tool">
                        <el-input
                            v-model="timestampInput"
                            placeholder="输入时间戳"
                        >
                            <template #append>
                                <el-button @click="convertTimestamp"
                                    >转换</el-button
                                >
                            </template>
                        </el-input>
                        <div v-if="timestampOutput" class="timestamp-result">
                            <p>
                                <strong>本地时间：</strong
                                >{{ timestampOutput.local }}
                            </p>
                            <p>
                                <strong>UTC时间：</strong
                                >{{ timestampOutput.utc }}
                            </p>
                        </div>
                        <el-divider />
                        <p>当前时间戳：{{ currentTimestamp }}</p>
                        <el-button @click="copyTimestamp"
                            >复制当前时间戳</el-button
                        >
                    </div>
                </template>

                <!-- Base64编解码 -->
                <template v-if="currentTool?.id === 'base64'">
                    <el-input
                        v-model="base64Input"
                        type="textarea"
                        :rows="6"
                        placeholder="输入文本..."
                    />
                    <div class="tool-actions">
                        <el-button type="primary" @click="encodeBase64"
                            >编码</el-button
                        >
                        <el-button @click="decodeBase64">解码</el-button>
                    </div>
                    <el-input
                        v-if="base64Output"
                        v-model="base64Output"
                        type="textarea"
                        :rows="6"
                        readonly
                    />
                </template>

                <!-- 颜色选择器 -->
                <template v-if="currentTool?.id === 'color'">
                    <div class="color-tool">
                        <el-color-picker
                            v-model="colorValue"
                            show-alpha
                            :size="'large'"
                            @change="onColorPickerChange"
                        />
                        <div
                            class="color-preview-box"
                            :style="{ background: colorValue }"
                        ></div>
                        <div class="color-inputs">
                            <div class="color-input-row">
                                <span class="color-label">HEX</span>
                                <el-input
                                    v-model="hexInput"
                                    size="small"
                                    placeholder="#667eea"
                                    @blur="onHexBlur"
                                    @keyup.enter="onHexBlur"
                                >
                                    <template #append>
                                        <el-button @click="copyValue(hexInput)">
                                            <el-icon><CopyDocument /></el-icon>
                                        </el-button>
                                    </template>
                                </el-input>
                            </div>
                            <div class="color-input-row">
                                <span class="color-label">RGBA</span>
                                <el-input
                                    v-model="rgbaInput"
                                    size="small"
                                    placeholder="rgba(102, 126, 234, 1)"
                                    @blur="onRgbaBlur"
                                    @keyup.enter="onRgbaBlur"
                                >
                                    <template #append>
                                        <el-button
                                            @click="copyValue(rgbaInput)"
                                        >
                                            <el-icon><CopyDocument /></el-icon>
                                        </el-button>
                                    </template>
                                </el-input>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- UUID生成 -->
                <template v-if="currentTool?.id === 'uuid'">
                    <div class="uuid-tool">
                        <el-form label-width="120px">
                            <el-form-item label="UUID版本">
                                <el-radio-group v-model="uuidVersion">
                                    <el-radio-button label="v4"
                                        >v4 (随机)</el-radio-button
                                    >
                                    <el-radio-button label="v1"
                                        >v1 (时间戳)</el-radio-button
                                    >
                                </el-radio-group>
                            </el-form-item>
                            <el-form-item label="生成数量">
                                <el-slider
                                    v-model="uuidCount"
                                    :min="1"
                                    :max="20"
                                    show-stops
                                />
                                <span class="uuid-count"
                                    >{{ uuidCount }} 个</span
                                >
                            </el-form-item>
                            <el-form-item label="格式选项">
                                <el-checkbox v-model="uuidUppercase"
                                    >大写</el-checkbox
                                >
                                <el-checkbox v-model="uuidNoDash"
                                    >去除横线</el-checkbox
                                >
                            </el-form-item>
                        </el-form>
                        <div class="tool-actions">
                            <el-button type="primary" @click="generateUUID"
                                >生成</el-button
                            >
                            <el-button @click="copyUUID">复制全部</el-button>
                            <el-button @click="clearUUID">清空</el-button>
                        </div>
                        <div v-if="uuidList.length > 0" class="uuid-list">
                            <div
                                v-for="(uuid, index) in uuidList"
                                :key="index"
                                class="uuid-item"
                            >
                                <code>{{ uuid }}</code>
                                <el-button
                                    text
                                    size="small"
                                    @click="copySingleUUID(uuid)"
                                >
                                    <el-icon><CopyDocument /></el-icon>
                                </el-button>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- 二维码生成 -->
                <template v-if="currentTool?.id === 'qr'">
                    <div class="qr-tool">
                        <el-input
                            v-model="qrText"
                            type="textarea"
                            :rows="4"
                            placeholder="输入要生成二维码的文本或URL..."
                        />
                        <el-form label-width="100px" class="qr-options">
                            <el-form-item label="尺寸">
                                <el-slider
                                    v-model="qrSize"
                                    :min="100"
                                    :max="400"
                                    :step="50"
                                />
                                <span>{{ qrSize }}px</span>
                            </el-form-item>
                            <el-form-item label="容错级别">
                                <el-select
                                    v-model="qrLevel"
                                    style="width: 120px"
                                >
                                    <el-option label="低 (L)" value="L" />
                                    <el-option label="中 (M)" value="M" />
                                    <el-option label="高 (Q)" value="Q" />
                                    <el-option label="最高 (H)" value="H" />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="前景色">
                                <el-color-picker
                                    v-model="qrFgColor"
                                    size="small"
                                />
                            </el-form-item>
                            <el-form-item label="背景色">
                                <el-color-picker
                                    v-model="qrBgColor"
                                    size="small"
                                />
                            </el-form-item>
                        </el-form>
                        <div class="tool-actions">
                            <el-button type="primary" @click="generateQR"
                                >生成二维码</el-button
                            >
                            <el-button @click="downloadQR" :disabled="!qrImage"
                                >下载图片</el-button
                            >
                            <el-button @click="clearQR">清空</el-button>
                        </div>
                        <div v-if="qrImage" class="qr-result">
                            <img
                                :src="qrImage"
                                :width="qrSize"
                                :height="qrSize"
                                alt="二维码"
                            />
                        </div>
                    </div>
                </template>

                <!-- 图片压缩 -->
                <template v-if="currentTool?.id === 'image-compress'">
                    <div class="image-compress-tool">
                        <el-upload
                            drag
                            action="#"
                            :auto-upload="false"
                            :on-change="handleImageChange"
                            :show-file-list="false"
                            accept="image/*"
                        >
                            <el-icon :size="48"><Picture /></el-icon>
                            <div class="el-upload__text">
                                拖拽图片到此处或 <em>点击上传</em>
                            </div>
                        </el-upload>

                        <div
                            v-if="compressImage.original"
                            class="compress-result"
                        >
                            <div class="image-preview">
                                <img :src="compressImage.preview" alt="预览" />
                            </div>
                            <div class="compress-info">
                                <p>
                                    原始大小:
                                    {{
                                        formatSize(compressImage.original.size)
                                    }}
                                </p>
                                <p v-if="compressImage.compressed">
                                    压缩后:
                                    {{
                                        formatSize(
                                            compressImage.compressed.size
                                        )
                                    }}
                                    <el-tag type="success" size="small">
                                        节省 {{ compressImage.savedPercent }}%
                                    </el-tag>
                                </p>
                            </div>
                            <el-slider
                                v-model="compressQuality"
                                :min="10"
                                :max="100"
                                :step="5"
                                show-stops
                                @change="recompressImage"
                            />
                            <div class="quality-label">
                                压缩质量: {{ compressQuality }}%
                            </div>
                            <div class="compress-actions">
                                <el-button
                                    type="primary"
                                    @click="downloadCompressed"
                                >
                                    下载压缩后的图片
                                </el-button>
                                <el-button @click="clearCompress"
                                    >清空</el-button
                                >
                            </div>
                        </div>
                    </div>
                </template>

                <!-- 文本对比 -->
                <template v-if="currentTool?.id === 'text-diff'">
                    <div class="text-diff-tool">
                        <div class="diff-inputs">
                            <div class="diff-input-box">
                                <div class="diff-label">原文本</div>
                                <el-input
                                    v-model="diffText1"
                                    type="textarea"
                                    :rows="8"
                                    placeholder="输入第一段文本..."
                                />
                            </div>
                            <div class="diff-input-box">
                                <div class="diff-label">对比文本</div>
                                <el-input
                                    v-model="diffText2"
                                    type="textarea"
                                    :rows="8"
                                    placeholder="输入第二段文本..."
                                />
                            </div>
                        </div>
                        <div class="diff-actions">
                            <el-button type="primary" @click="compareText"
                                >对比差异</el-button
                            >
                            <el-button @click="clearDiff">清空</el-button>
                        </div>
                        <div v-if="diffResult.length > 0" class="diff-result">
                            <div
                                v-for="(item, index) in diffResult"
                                :key="index"
                                class="diff-line"
                                :class="item.type"
                            >
                                <span class="diff-type">{{
                                    item.type === 'added'
                                        ? '+'
                                        : item.type === 'removed'
                                          ? '-'
                                          : ' '
                                }}</span>
                                <span class="diff-content">{{
                                    item.text
                                }}</span>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- 正则测试 -->
                <template v-if="currentTool?.id === 'regex-test'">
                    <div class="regex-test-tool">
                        <div class="regex-input">
                            <el-input
                                v-model="regexPattern"
                                placeholder="输入正则表达式，如: \d+"
                            >
                                <template #prepend>/</template>
                                <template #append>/{{ regexFlags }}</template>
                            </el-input>
                            <el-checkbox-group
                                v-model="regexFlagList"
                                size="small"
                            >
                                <el-checkbox label="g">全局(g)</el-checkbox>
                                <el-checkbox label="i"
                                    >忽略大小写(i)</el-checkbox
                                >
                                <el-checkbox label="m">多行(m)</el-checkbox>
                                <el-checkbox label="s"
                                    >点匹配换行(s)</el-checkbox
                                >
                            </el-checkbox-group>
                        </div>
                        <el-input
                            v-model="regexText"
                            type="textarea"
                            :rows="6"
                            placeholder="输入要测试的文本..."
                        />
                        <div class="regex-actions">
                            <el-button type="primary" @click="testRegex"
                                >测试匹配</el-button
                            >
                            <el-button @click="clearRegex">清空</el-button>
                        </div>
                        <div v-if="regexResult" class="regex-result">
                            <div v-if="regexResult.error" class="regex-error">
                                {{ regexResult.error }}
                            </div>
                            <div
                                v-else-if="regexResult.matches.length === 0"
                                class="regex-no-match"
                            >
                                没有匹配结果
                            </div>
                            <div v-else>
                                <div class="regex-match-count">
                                    找到 {{ regexResult.matches.length }} 个匹配
                                </div>
                                <div
                                    v-for="(
                                        match, index
                                    ) in regexResult.matches"
                                    :key="index"
                                    class="regex-match-item"
                                >
                                    <div class="match-text">
                                        {{ match.text }}
                                    </div>
                                    <div class="match-info">
                                        位置: {{ match.index }}
                                    </div>
                                    <div
                                        v-if="match.groups.length > 0"
                                        class="match-groups"
                                    >
                                        <div
                                            v-for="(
                                                group, gIndex
                                            ) in match.groups"
                                            :key="gIndex"
                                            class="match-group"
                                        >
                                            组 {{ gIndex }}: {{ group }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- 快捷启动 -->
                <template v-if="currentTool?.id === 'quick-launch'">
                    <div class="quick-launch-tool">
                        <div class="launch-shortcuts">
                            <div
                                v-for="item in quickLaunchItems"
                                :key="item.id"
                                class="launch-item"
                                @click="launchItem(item)"
                            >
                                <div
                                    class="launch-icon"
                                    :style="{ background: item.color }"
                                >
                                    <el-icon :size="24"
                                        ><component :is="item.icon"
                                    /></el-icon>
                                </div>
                                <div class="launch-name">{{ item.name }}</div>
                            </div>
                            <div
                                class="launch-item add-item"
                                @click="showAddLaunch = true"
                            >
                                <div
                                    class="launch-icon"
                                    style="background: #e0e0e0"
                                >
                                    <el-icon :size="24"><Plus /></el-icon>
                                </div>
                                <div class="launch-name">添加</div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </el-dialog>

        <!-- 添加快捷启动项弹窗 -->
        <el-dialog v-model="showAddLaunch" title="添加快捷启动" width="400px">
            <el-form label-width="80px">
                <el-form-item label="名称">
                    <el-input
                        v-model="newLaunchItem.name"
                        placeholder="如: 百度"
                    />
                </el-form-item>
                <el-form-item label="类型">
                    <el-radio-group v-model="newLaunchItem.type">
                        <el-radio label="url">网址</el-radio>
                        <el-radio label="app">应用</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item
                    :label="newLaunchItem.type === 'url' ? '网址' : '路径'"
                >
                    <el-input
                        v-model="newLaunchItem.path"
                        :placeholder="
                            newLaunchItem.type === 'url'
                                ? 'https://www.baidu.com'
                                : 'C:\\Program Files\\...'
                        "
                    />
                </el-form-item>
                <el-form-item label="图标颜色">
                    <el-color-picker v-model="newLaunchItem.color" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showAddLaunch = false">取消</el-button>
                <el-button type="primary" @click="addLaunchItem"
                    >添加</el-button
                >
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
    ArrowLeft,
    CopyDocument,
    FullScreen,
    Brush,
    Picture,
    DocumentCopy,
    Search,
    Promotion,
    Plus,
    Link,
    Reading,
    FolderOpened
} from '@element-plus/icons-vue';

const router = useRouter();

const tools = [
    {
        id: 'json',
        name: 'JSON格式化',
        desc: 'JSON字符串格式化美化',
        icon: 'Document',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
        id: 'timestamp',
        name: '时间戳转换',
        desc: '时间戳与日期互转',
        icon: 'Clock',
        color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
        id: 'base64',
        name: 'Base64编解码',
        desc: '文本Base64编码解码',
        icon: 'Key',
        color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
        id: 'color',
        name: '颜色选择器',
        desc: '颜色值转换工具',
        icon: 'Brush',
        color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
        id: 'uuid',
        name: 'UUID生成',
        desc: '生成唯一标识符',
        icon: 'Link',
        color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
        id: 'qr',
        name: '二维码生成',
        desc: '文本转二维码',
        icon: 'Grid',
        color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    },
    {
        id: 'ruler',
        name: '屏幕尺子',
        desc: '测量两点间像素距离',
        icon: 'FullScreen',
        color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    },
    {
        id: 'color-picker',
        name: '吸色器',
        desc: '颜色选择与转换工具',
        icon: 'Brush',
        color: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)'
    },
    {
        id: 'image-compress',
        name: '图片压缩',
        desc: '压缩图片文件大小',
        icon: 'Picture',
        color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    },
    {
        id: 'text-diff',
        name: '文本对比',
        desc: '对比两段文本差异',
        icon: 'DocumentCopy',
        color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    },
    {
        id: 'regex-test',
        name: '正则测试',
        desc: '测试正则表达式',
        icon: 'Search',
        color: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)'
    },
    {
        id: 'quick-launch',
        name: '快捷启动',
        desc: '快速打开应用和网站',
        icon: 'Promotion',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
];

const toolDialogVisible = ref(false);
const currentTool = ref(null);
const showAddLaunch = ref(false);

// 图片压缩工具
const compressImage = ref({
    original: null,
    compressed: null,
    preview: '',
    savedPercent: 0
});
const compressQuality = ref(80);

const handleImageChange = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            compressImage.value.original = {
                name: file.name,
                size: file.size,
                width: img.width,
                height: img.height
            };
            compressImage.value.preview = e.target.result;
            compressImageWithQuality();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file.raw);
};

const compressImageWithQuality = () => {
    if (!compressImage.value.preview) return;

    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const compressedDataUrl = canvas.toDataURL(
            'image/jpeg',
            compressQuality.value / 100
        );
        const compressedSize = Math.round((compressedDataUrl.length * 3) / 4);

        const saved = Math.round(
            ((compressImage.value.original.size - compressedSize) /
                compressImage.value.original.size) *
                100
        );

        compressImage.value.compressed = {
            dataUrl: compressedDataUrl,
            size: compressedSize
        };
        compressImage.value.savedPercent = saved;
    };
    img.src = compressImage.value.preview;
};

const recompressImage = () => {
    compressImageWithQuality();
};

const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

const downloadCompressed = () => {
    if (!compressImage.value.compressed) return;

    const link = document.createElement('a');
    link.href = compressImage.value.compressed.dataUrl;
    link.download = 'compressed_' + compressImage.value.original.name;
    link.click();
    ElMessage.success('已下载');
};

const clearCompress = () => {
    compressImage.value = {
        original: null,
        compressed: null,
        preview: '',
        savedPercent: 0
    };
    compressQuality.value = 80;
};

// 文本对比工具
const diffText1 = ref('');
const diffText2 = ref('');
const diffResult = ref([]);

const compareText = () => {
    const lines1 = diffText1.value.split('\n');
    const lines2 = diffText2.value.split('\n');
    const result = [];

    const maxLen = Math.max(lines1.length, lines2.length);

    for (let i = 0; i < maxLen; i++) {
        const line1 = lines1[i] || '';
        const line2 = lines2[i] || '';

        if (line1 === line2) {
            result.push({ type: 'same', text: line1 });
        } else {
            if (line1) result.push({ type: 'removed', text: line1 });
            if (line2) result.push({ type: 'added', text: line2 });
        }
    }

    diffResult.value = result;
};

const clearDiff = () => {
    diffText1.value = '';
    diffText2.value = '';
    diffResult.value = [];
};

// 正则测试工具
const regexPattern = ref('');
const regexFlags = ref('g');
const regexFlagList = ref(['g']);
const regexText = ref('');
const regexResult = ref(null);

const testRegex = () => {
    try {
        const flags = regexFlagList.value.join('');
        const regex = new RegExp(regexPattern.value, flags);
        const matches = [];
        let match;

        if (flags.includes('g')) {
            while ((match = regex.exec(regexText.value)) !== null) {
                matches.push({
                    text: match[0],
                    index: match.index,
                    groups: match.slice(1)
                });
                if (match.index === regex.lastIndex) regex.lastIndex++;
            }
        } else {
            match = regex.exec(regexText.value);
            if (match) {
                matches.push({
                    text: match[0],
                    index: match.index,
                    groups: match.slice(1)
                });
            }
        }

        regexResult.value = { matches, error: null };
    } catch (e) {
        regexResult.value = { matches: [], error: e.message };
    }
};

const clearRegex = () => {
    regexPattern.value = '';
    regexText.value = '';
    regexResult.value = null;
    regexFlagList.value = ['g'];
};

// 快捷启动工具
const quickLaunchItems = ref([
    {
        id: 1,
        name: '百度',
        type: 'url',
        path: 'https://www.baidu.com',
        color: '#2932e1',
        icon: 'Search'
    },
    {
        id: 2,
        name: 'GitHub',
        type: 'url',
        path: 'https://github.com',
        color: '#333',
        icon: 'Link'
    },
    {
        id: 3,
        name: '掘金',
        type: 'url',
        path: 'https://juejin.cn',
        color: '#1e80ff',
        icon: 'Reading'
    }
]);

const newLaunchItem = ref({
    name: '',
    type: 'url',
    path: '',
    color: '#409EFF',
    icon: 'Link'
});

const launchItem = (item) => {
    if (item.type === 'url') {
        window.open(item.path, '_blank');
    } else {
        // 打开应用需要 Electron 支持
        if (window.electronAPI && window.electronAPI.openExternal) {
            window.electronAPI.openExternal(item.path);
        } else {
            ElMessage.info('打开应用功能需要在 Electron 环境中使用');
        }
    }
};

const addLaunchItem = () => {
    if (!newLaunchItem.value.name || !newLaunchItem.value.path) {
        ElMessage.warning('请填写完整信息');
        return;
    }

    quickLaunchItems.value.push({
        id: Date.now(),
        ...newLaunchItem.value,
        icon: newLaunchItem.value.type === 'url' ? 'Link' : 'FolderOpened'
    });

    newLaunchItem.value = {
        name: '',
        type: 'url',
        path: '',
        color: '#409EFF',
        icon: 'Link'
    };
    showAddLaunch.value = false;
    ElMessage.success('已添加');
};

// JSON工具
const jsonInput = ref('');
const jsonOutput = ref('');

const formatJson = () => {
    try {
        const obj = JSON.parse(jsonInput.value);
        jsonOutput.value = JSON.stringify(obj, null, 2);
    } catch (e) {
        ElMessage.error('JSON格式不正确');
    }
};

// 时间戳工具
const timestampInput = ref('');
const timestampOutput = ref(null);
const currentTimestamp = ref(Date.now());

let timestampTimer = null;

const convertTimestamp = () => {
    const ts = parseInt(timestampInput.value);
    if (isNaN(ts)) {
        ElMessage.error('请输入有效的时间戳');
        return;
    }
    const date = new Date(ts);
    timestampOutput.value = {
        local: date.toLocaleString(),
        utc: date.toUTCString()
    };
};

const copyTimestamp = async () => {
    await navigator.clipboard.writeText(currentTimestamp.value.toString());
    ElMessage.success('已复制');
};

// Base64工具
const base64Input = ref('');
const base64Output = ref('');

const encodeBase64 = () => {
    try {
        base64Output.value = btoa(
            unescape(encodeURIComponent(base64Input.value))
        );
    } catch (e) {
        ElMessage.error('编码失败');
    }
};

const decodeBase64 = () => {
    try {
        base64Output.value = decodeURIComponent(
            escape(atob(base64Input.value))
        );
    } catch (e) {
        ElMessage.error('解码失败，请检查输入是否为有效的Base64字符串');
    }
};

// 颜色工具
const colorValue = ref('rgba(102, 126, 234, 1)');
const hexInput = ref('#667eea');
const rgbaInput = ref('rgba(102, 126, 234, 1)');

// 颜色选择器变化
const onColorPickerChange = (val) => {
    colorValue.value = val;
    updateInputsFromColor(val);
};

// 从颜色值更新输入框
const updateInputsFromColor = (color) => {
    const rgba = parseColor(color);
    if (rgba) {
        hexInput.value = rgbToHex(rgba.r, rgba.g, rgba.b);
        rgbaInput.value = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
    }
};

// 解析颜色值为 RGBA
const parseColor = (color) => {
    if (!color) return null;

    // 处理 hex
    if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        if (hex.length === 6) {
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16),
                a: 1
            };
        } else if (hex.length === 8) {
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16),
                a: Math.round((parseInt(hex.slice(6, 8), 16) / 255) * 100) / 100
            };
        }
    }

    // 处理 rgb/rgba
    const rgbMatch = color.match(
        /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
    );
    if (rgbMatch) {
        return {
            r: parseInt(rgbMatch[1]),
            g: parseInt(rgbMatch[2]),
            b: parseInt(rgbMatch[3]),
            a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1
        };
    }

    return null;
};

// RGB 转 HEX
const rgbToHex = (r, g, b) => {
    return (
        '#' +
        [r, g, b]
            .map((x) => {
                const hex = Math.max(0, Math.min(255, x)).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            })
            .join('')
    );
};

// HEX 输入框失焦
const onHexBlur = () => {
    let hex = hexInput.value.trim();
    if (!hex.startsWith('#')) {
        hex = '#' + hex;
    }

    const rgba = parseColor(hex);
    if (rgba) {
        colorValue.value = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
        rgbaInput.value = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
    } else {
        // 恢复原来的值
        updateInputsFromColor(colorValue.value);
        ElMessage.error('无效的 HEX 颜色值');
    }
};

// RGBA 输入框失焦
const onRgbaBlur = () => {
    const rgba = parseColor(rgbaInput.value);
    if (rgba) {
        colorValue.value = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
        hexInput.value = rgbToHex(rgba.r, rgba.g, rgba.b);
    } else {
        // 恢复原来的值
        updateInputsFromColor(colorValue.value);
        ElMessage.error('无效的 RGBA 颜色值');
    }
};

// 复制值
const copyValue = async (value) => {
    await navigator.clipboard.writeText(value);
    ElMessage.success('已复制');
};

// UUID工具
const uuidVersion = ref('v4');
const uuidCount = ref(5);
const uuidUppercase = ref(false);
const uuidNoDash = ref(false);
const uuidList = ref([]);

// 生成UUID v4
const generateUUIDv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
};

// 生成UUID v1 (简化版)
const generateUUIDv1 = () => {
    const now = new Date().getTime();
    const uuid = 'xxxxxxxx-xxxx-1xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
    return uuid;
};

const formatUUID = (uuid) => {
    let result = uuid;
    if (uuidUppercase.value) {
        result = result.toUpperCase();
    }
    if (uuidNoDash.value) {
        result = result.replace(/-/g, '');
    }
    return result;
};

const generateUUID = () => {
    uuidList.value = [];
    for (let i = 0; i < uuidCount.value; i++) {
        const raw =
            uuidVersion.value === 'v4' ? generateUUIDv4() : generateUUIDv1();
        uuidList.value.push(formatUUID(raw));
    }
    ElMessage.success(`已生成 ${uuidCount.value} 个 UUID`);
};

const copyUUID = async () => {
    if (uuidList.value.length === 0) {
        ElMessage.warning('请先生成UUID');
        return;
    }
    await navigator.clipboard.writeText(uuidList.value.join('\n'));
    ElMessage.success('已复制到剪贴板');
};

const copySingleUUID = async (uuid) => {
    await navigator.clipboard.writeText(uuid);
    ElMessage.success('已复制');
};

const clearUUID = () => {
    uuidList.value = [];
};

// 二维码工具
const qrText = ref('');
const qrSize = ref(200);
const qrLevel = ref('M');
const qrFgColor = ref('#000000');
const qrBgColor = ref('#FFFFFF');
const qrImage = ref('');

// 简化的二维码生成（使用 QRCode.js 的简化实现）
const generateQR = () => {
    if (!qrText.value.trim()) {
        ElMessage.warning('请输入文本内容');
        return;
    }
    // 使用 Google Chart API 生成二维码
    const encodedText = encodeURIComponent(qrText.value);
    qrImage.value = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize.value}x${qrSize.value}&data=${encodedText}&ecc=${qrLevel.value}&color=${qrFgColor.value.replace('#', '')}&bgcolor=${qrBgColor.value.replace('#', '')}`;
};

const downloadQR = () => {
    if (!qrImage.value) return;
    const link = document.createElement('a');
    link.href = qrImage.value;
    link.download = `qrcode-${Date.now()}.png`;
    link.click();
    ElMessage.success('已下载');
};

const clearQR = () => {
    qrText.value = '';
    qrImage.value = '';
};

// 打开工具
const openTool = (tool) => {
    // 屏幕尺子和吸色器是独立页面
    if (tool.id === 'ruler') {
        router.push('/tools/ruler');
        return;
    }
    if (tool.id === 'color-picker') {
        router.push('/tools/color-picker');
        return;
    }
    currentTool.value = tool;
    toolDialogVisible.value = true;
};

onMounted(() => {
    timestampTimer = setInterval(() => {
        currentTimestamp.value = Date.now();
    }, 1000);
});

onUnmounted(() => {
    if (timestampTimer) clearInterval(timestampTimer);
});
</script>

<style scoped>
.tools-container {
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

.tools-grid {
    padding: 20px;
}

.tools-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}

.tool-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tool-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.tool-icon {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
}

.tool-info h4 {
    margin: 0 0 8px;
    font-size: 16px;
    color: #333;
}

.tool-info p {
    margin: 0;
    font-size: 13px;
    color: #909399;
}

.tool-content {
    min-height: 200px;
}

.tool-actions {
    margin: 16px 0;
    display: flex;
    gap: 8px;
}

.output-area {
    margin-top: 16px;
}

.timestamp-tool {
    text-align: center;
}

.timestamp-result {
    margin-top: 20px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    text-align: left;
}

.color-tool {
    text-align: center;
}

.color-preview-box {
    width: 100%;
    height: 60px;
    border-radius: 8px;
    margin-top: 16px;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.color-inputs {
    width: 100%;
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.color-input-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.color-label {
    width: 50px;
    font-size: 14px;
    color: #666;
    font-weight: 500;
    text-align: left;
}

.color-input-row .el-input {
    flex: 1;
}

/* UUID工具样式 */
.uuid-tool {
    padding: 10px;
}

.uuid-count {
    margin-left: 10px;
    color: #606266;
}

.uuid-list {
    margin-top: 16px;
    max-height: 300px;
    overflow-y: auto;
}

.uuid-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    margin-bottom: 8px;
    background: #f5f7fa;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
}

.uuid-item code {
    font-size: 14px;
    color: #303133;
}

/* 二维码工具样式 */
.qr-tool {
    padding: 10px;
}

.qr-options {
    margin-top: 16px;
}

.qr-result {
    margin-top: 20px;
    text-align: center;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 8px;
}

.qr-result img {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
}

/* 图片压缩工具样式 */
.image-compress-tool {
    padding: 10px;
}

.compress-result {
    margin-top: 20px;
}

.image-preview {
    text-align: center;
    margin-bottom: 16px;
}

.image-preview img {
    max-width: 100%;
    max-height: 200px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.compress-info {
    margin-bottom: 16px;
    font-size: 14px;
}

.compress-info p {
    margin: 8px 0;
}

.quality-label {
    text-align: center;
    margin-top: 8px;
    font-size: 14px;
    color: #606266;
}

.compress-actions {
    margin-top: 16px;
    text-align: center;
}

/* 文本对比工具样式 */
.text-diff-tool {
    padding: 10px;
}

.diff-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
}

.diff-input-box {
    display: flex;
    flex-direction: column;
}

.diff-label {
    font-weight: 500;
    margin-bottom: 8px;
    color: #303133;
}

.diff-actions {
    margin-bottom: 16px;
}

.diff-result {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    padding: 12px;
    background: #f5f7fa;
    font-family: 'Courier New', monospace;
    font-size: 13px;
}

.diff-line {
    padding: 2px 8px;
    white-space: pre-wrap;
    word-break: break-all;
}

.diff-line.added {
    background: #f0f9ff;
    color: #409eff;
}

.diff-line.removed {
    background: #fff0f0;
    color: #f56c6c;
}

.diff-type {
    display: inline-block;
    width: 20px;
    font-weight: bold;
}

/* 正则测试工具样式 */
.regex-test-tool {
    padding: 10px;
}

.regex-input {
    margin-bottom: 16px;
}

.regex-input .el-checkbox-group {
    margin-top: 8px;
}

.regex-actions {
    margin: 16px 0;
}

.regex-result {
    max-height: 300px;
    overflow-y: auto;
}

.regex-error {
    color: #f56c6c;
    padding: 12px;
    background: #fff0f0;
    border-radius: 4px;
}

.regex-no-match {
    color: #909399;
    text-align: center;
    padding: 20px;
}

.regex-match-count {
    font-weight: 500;
    margin-bottom: 12px;
    color: #67c23a;
}

.regex-match-item {
    padding: 12px;
    margin-bottom: 8px;
    background: #f5f7fa;
    border-radius: 4px;
    border-left: 3px solid #409eff;
}

.match-text {
    font-family: 'Courier New', monospace;
    font-weight: 500;
    margin-bottom: 4px;
}

.match-info {
    font-size: 12px;
    color: #909399;
}

.match-groups {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed #dcdfe6;
}

.match-group {
    font-size: 12px;
    color: #606266;
    font-family: 'Courier New', monospace;
}

/* 快捷启动工具样式 */
.quick-launch-tool {
    padding: 10px;
}

.launch-shortcuts {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
}

.launch-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s;
}

.launch-item:hover {
    background: #f5f7fa;
    transform: translateY(-2px);
}

.launch-item.add-item {
    border: 2px dashed #dcdfe6;
}

.launch-item.add-item:hover {
    border-color: #409eff;
}

.launch-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    margin-bottom: 8px;
}

.launch-name {
    font-size: 13px;
    color: #303133;
    text-align: center;
}

@media (max-width: 900px) {
    .tools-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .launch-shortcuts {
        grid-template-columns: repeat(3, 1fr);
    }
}
</style>

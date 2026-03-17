<template>
    <div class="ocr-container">
        <!-- 返回按钮 -->
        <div class="page-header">
            <el-button text @click="router.push('/home')">
                <el-icon><ArrowLeft /></el-icon>
                返回主页
            </el-button>
        </div>

        <!-- 引擎配置 -->
        <div class="engine-bar">
            <div class="engine-title">
                <el-icon><Cloudy /></el-icon>
                百度云 OCR
            </div>
            <el-button text size="small" @click="showBaiduConfig = true">
                <el-icon><Setting /></el-icon>
                配置密钥
            </el-button>
        </div>

        <div class="ocr-layout">
            <!-- 图片上传区 -->
            <div class="upload-section">
                <div
                    class="upload-area"
                    :class="{ 'has-image': imageUrl }"
                    @click="selectImage"
                    @dragover.prevent
                    @drop.prevent="handleDrop"
                >
                    <template v-if="!imageUrl">
                        <el-icon :size="48"><Picture /></el-icon>
                        <p>点击或拖拽图片到此处</p>
                        <p class="tip">支持 JPG、PNG、BMP 格式</p>
                    </template>
                    <img v-else :src="imageUrl" alt="预览图片" />
                </div>
                <div class="upload-actions">
                    <el-button @click="selectImage">
                        <el-icon><FolderOpened /></el-icon>
                        选择图片
                    </el-button>
                    <el-button
                        v-if="imageUrl"
                        type="danger"
                        @click="clearImage"
                    >
                        <el-icon><Delete /></el-icon>
                        清除
                    </el-button>
                </div>
            </div>

            <!-- 识别结果 -->
            <div class="result-section">
                <div class="result-header">
                    <h4>识别结果</h4>
                    <div class="result-actions">
                        <el-button text @click="copyResult">
                            <el-icon><CopyDocument /></el-icon>
                            复制
                        </el-button>
                        <el-button text @click="clearResult">
                            <el-icon><Delete /></el-icon>
                            清空
                        </el-button>
                    </div>
                </div>
                <el-input
                    v-model="resultText"
                    type="textarea"
                    :rows="15"
                    placeholder="识别结果将显示在这里..."
                    readonly
                />
                <div class="result-footer">
                    <span v-if="resultText">
                        识别字数: {{ resultText.length }} | 引擎: 百度云OCR
                    </span>
                </div>
            </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-bar">
            <el-button
                type="primary"
                size="large"
                :loading="loading"
                :disabled="!imageUrl"
                @click="recognize"
            >
                <el-icon><Camera /></el-icon>
                开始识别
            </el-button>
        </div>

        <!-- 百度云配置弹窗 -->
        <el-dialog
            v-model="showBaiduConfig"
            title="百度云 OCR 配置"
            width="450px"
        >
            <el-form label-width="100px">
                <el-form-item label="AppID">
                    <el-input
                        v-model="baiduConfig.appId"
                        placeholder="请输入百度云 AppID"
                    />
                </el-form-item>
                <el-form-item label="API Key">
                    <el-input
                        v-model="baiduConfig.apiKey"
                        placeholder="请输入百度云 API Key"
                    />
                </el-form-item>
                <el-form-item label="Secret Key">
                    <el-input
                        v-model="baiduConfig.secretKey"
                        type="password"
                        placeholder="请输入百度云 Secret Key"
                        show-password
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showBaiduConfig = false">取消</el-button>
                <el-button type="primary" @click="saveBaiduConfig"
                    >保存</el-button
                >
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Cloudy, Setting } from '@element-plus/icons-vue';
import {
    saveUserData,
    loadUserData,
    STORAGE_KEYS
} from '@/utils/userStorage.js';

const router = useRouter();

const imageUrl = ref('');
const resultText = ref('');
const loading = ref(false);
const showBaiduConfig = ref(false);

// 百度云配置
const baiduConfig = reactive({
    appId: '',
    apiKey: '',
    secretKey: ''
});

// 加载保存的配置
onMounted(async () => {
    const saved = await loadUserData(STORAGE_KEYS.OCR_CONFIG, null);
    if (saved) {
        Object.assign(baiduConfig, saved);
    }
});

// 选择图片
const selectImage = async () => {
    if (window.electronAPI && window.electronAPI.selectFile) {
        const result = await window.electronAPI.selectFile();
        if (!result.canceled && result.filePaths.length > 0) {
            // 通过 IPC 读取图片文件为 base64
            const readResult = await window.electronAPI.readImageFile(
                result.filePaths[0]
            );
            if (readResult.success) {
                imageUrl.value = readResult.data;
            } else {
                ElMessage.error('读取图片失败: ' + readResult.error);
            }
        }
    } else {
        // 创建隐藏的文件输入
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imageUrl.value = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }
};

// 拖拽上传
const handleDrop = (e) => {
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imageUrl.value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

// 清除图片
const clearImage = () => {
    imageUrl.value = '';
    resultText.value = '';
};

// 清除结果
const clearResult = () => {
    resultText.value = '';
};

// 复制结果
const copyResult = async () => {
    if (!resultText.value) {
        ElMessage.warning('没有可复制的内容');
        return;
    }
    try {
        await navigator.clipboard.writeText(resultText.value);
        ElMessage.success('已复制到剪贴板');
    } catch (error) {
        ElMessage.error('复制失败');
    }
};

// 保存百度云配置
const saveBaiduConfig = async () => {
    if (!baiduConfig.appId || !baiduConfig.apiKey || !baiduConfig.secretKey) {
        ElMessage.warning('请填写完整的百度云配置信息');
        return;
    }
    await saveUserData(STORAGE_KEYS.OCR_CONFIG, baiduConfig);
    ElMessage.success('配置已保存');
    showBaiduConfig.value = false;
};

// 百度云 OCR 识别（通过主进程）
const recognizeBaidu = async (imageBase64) => {
    console.log('window.electronAPI', window.electronAPI);
    // Electron 环境：通过 IPC 调用主进程
    const result = await window.electronAPI.baiduOCR(imageBase64, {
        apiKey: baiduConfig.apiKey,
        secretKey: baiduConfig.secretKey
    });

    if (!result.success) {
        throw new Error(result.error || '识别失败');
    }

    const data = result.data;
    if (data.words_result && data.words_result.length > 0) {
        return data.words_result.map((item) => item.words).join('\n');
    }
    return '未识别到文字';
};

// OCR识别
const recognize = async () => {
    if (!imageUrl.value) {
        ElMessage.warning('请先选择图片');
        return;
    }

    loading.value = true;
    resultText.value = '';

    try {
        // 检查百度云配置
        if (!baiduConfig.apiKey || !baiduConfig.secretKey) {
            ElMessage.warning('请先配置百度云 OCR 密钥');
            showBaiduConfig.value = true;
            loading.value = false;
            return;
        }

        // 图片已经是 base64 格式，直接使用
        ElMessage.info('正在识别...');
        resultText.value = await recognizeBaidu(imageUrl.value);
        ElMessage.success('识别完成');
    } catch (error) {
        ElMessage.error('识别失败: ' + error.message);
        console.error(error);
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.ocr-container {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.page-header {
    padding: 12px 20px;
    background: #fff;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    align-items: center;
}

.ocr-layout {
    flex: 1;
    display: flex;
    gap: 20px;
    padding: 20px;
}

.upload-section {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.upload-area {
    flex: 1;
    background: #f5f7fa;
    border: 2px dashed #dcdfe6;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s;
    color: #909399;
    min-height: 300px;
}

.upload-area:hover {
    border-color: #667eea;
    color: #667eea;
}

.upload-area.has-image {
    border-style: solid;
    padding: 10px;
}

.upload-area img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 4px;
}

.upload-area .tip {
    font-size: 12px;
    margin-top: 8px;
}

.upload-actions {
    margin-top: 12px;
    display: flex;
    gap: 8px;
}

.result-section {
    flex: 1;
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
}

.result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.result-header h4 {
    margin: 0;
    color: #333;
}

.result-actions {
    display: flex;
    gap: 8px;
}

.result-footer {
    margin-top: 8px;
    font-size: 12px;
    color: #999;
}

.action-bar {
    display: flex;
    justify-content: center;
}

.engine-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 12px 20px;
    background: #f5f7fa;
    border-bottom: 1px solid #e4e7ed;
}

.engine-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    color: #303133;
}
</style>

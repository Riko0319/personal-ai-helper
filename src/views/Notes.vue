<template>
    <div class="notes-container">
        <!-- 返回按钮 -->
        <div class="page-header">
            <el-button text @click="router.push('/home')">
                <el-icon><ArrowLeft /></el-icon>
                返回主页
            </el-button>
        </div>
        <div class="notes-layout">
            <!-- 笔记列表 -->
            <div class="notes-sidebar">
                <div class="sidebar-header">
                    <el-input
                        v-model="searchKeyword"
                        placeholder="搜索笔记..."
                        :prefix-icon="Search"
                        clearable
                    />
                    <el-button type="primary" @click="createNote">
                        <el-icon><Plus /></el-icon>
                    </el-button>
                </div>
                <div class="notes-list">
                    <div
                        v-for="note in filteredNotes"
                        :key="note.id"
                        :class="[
                            'note-item',
                            { active: currentNote?.id === note.id }
                        ]"
                        @click="selectNote(note)"
                    >
                        <div class="note-title">
                            {{ note.title || '无标题' }}
                        </div>
                        <div class="note-preview">
                            {{ note.content.slice(0, 50) }}...
                        </div>
                        <div class="note-meta">
                            <span>{{ note.updatedAt }}</span>
                            <el-button
                                text
                                size="small"
                                @click.stop="deleteNote(note.id)"
                            >
                                <el-icon><Delete /></el-icon>
                            </el-button>
                        </div>
                    </div>
                    <el-empty
                        v-if="filteredNotes.length === 0"
                        description="暂无笔记"
                    />
                </div>
            </div>

            <!-- 编辑区域 -->
            <div class="notes-editor">
                <template v-if="currentNote">
                    <div class="editor-header">
                        <el-input
                            v-model="currentNote.title"
                            placeholder="笔记标题"
                            size="large"
                            borderless
                        />
                        <div class="editor-actions">
                            <el-button
                                @click="aiSummarize"
                                :loading="aiLoading"
                            >
                                <el-icon><MagicStick /></el-icon>
                                AI摘要
                            </el-button>
                            <el-button type="primary" @click="saveNote">
                                <el-icon><Check /></el-icon>
                                保存
                            </el-button>
                        </div>
                    </div>
                    <el-input
                        v-model="currentNote.content"
                        type="textarea"
                        :rows="20"
                        placeholder="开始记录你的想法..."
                        @input="autoSave"
                    />
                    <div class="editor-footer">
                        <span>字数: {{ currentNote.content.length }}</span>
                        <span v-if="saveStatus">{{ saveStatus }}</span>
                    </div>
                </template>
                <el-empty v-else description="选择或创建一个笔记" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, ArrowLeft } from '@element-plus/icons-vue';
import {
    saveUserData,
    loadUserData,
    STORAGE_KEYS
} from '@/utils/userStorage.js';

const router = useRouter();

const searchKeyword = ref('');
const notes = ref([]);
const currentNote = ref(null);
const saveStatus = ref('');
const aiLoading = ref(false);
let autoSaveTimer = null;

// 过滤笔记
const filteredNotes = computed(() => {
    if (!searchKeyword.value) return notes.value;
    const keyword = searchKeyword.value.toLowerCase();
    return notes.value.filter(
        (note) =>
            note.title.toLowerCase().includes(keyword) ||
            note.content.toLowerCase().includes(keyword)
    );
});

// 创建笔记
const createNote = () => {
    const note = {
        id: Date.now().toString(),
        title: '',
        content: '',
        createdAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString()
    };
    notes.value.unshift(note);
    currentNote.value = note;
    saveNotes();
};

// 选择笔记
const selectNote = (note) => {
    currentNote.value = note;
};

// 删除笔记
const deleteNote = async (id) => {
    try {
        await ElMessageBox.confirm('确定要删除这个笔记吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });
        const index = notes.value.findIndex((n) => n.id === id);
        if (index > -1) {
            notes.value.splice(index, 1);
            if (currentNote.value?.id === id) {
                currentNote.value = null;
            }
            saveNotes();
            ElMessage.success('删除成功');
        }
    } catch (e) {
        // 取消删除
    }
};

// 保存笔记
const saveNote = () => {
    if (!currentNote.value) return;
    currentNote.value.updatedAt = new Date().toLocaleString();
    saveNotes();
    saveStatus.value = '已保存';
    setTimeout(() => {
        saveStatus.value = '';
    }, 2000);
};

// 自动保存
const autoSave = () => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        saveNote();
    }, 1000);
};

// 保存到用户数据目录
const saveNotes = async () => {
    await saveUserData(STORAGE_KEYS.NOTES_DATA, notes.value);
};

// AI摘要（模拟）
const aiSummarize = async () => {
    if (!currentNote.value?.content) {
        ElMessage.warning('请先输入笔记内容');
        return;
    }

    aiLoading.value = true;

    try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const summary = `【AI摘要】\n\n这篇笔记主要包含以下内容：\n\n${currentNote.value.content.slice(0, 100)}...\n\n关键词：笔记、记录、想法\n\n建议：可以进一步补充具体细节。`;

        currentNote.value.content += `\n\n---\n${summary}`;
        saveNote();
        ElMessage.success('AI摘要已生成');
    } catch (error) {
        ElMessage.error('生成失败');
    } finally {
        aiLoading.value = false;
    }
};

// 初始化
onMounted(async () => {
    const savedNotes = await loadUserData(STORAGE_KEYS.NOTES_DATA, []);
    notes.value = savedNotes;
});
</script>

<style scoped>
.notes-container {
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

.notes-layout {
    flex: 1;
    display: flex;
    gap: 20px;
    padding: 20px;
}

.notes-sidebar {
    width: 280px;
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
}

.sidebar-header {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
}

.notes-list {
    flex: 1;
    overflow-y: auto;
}

.note-item {
    padding: 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
    margin-bottom: 8px;
    border: 1px solid #e4e7ed;
}

.note-item:hover {
    background: #f5f7fa;
}

.note-item.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border-color: transparent;
}

.note-title {
    font-weight: 600;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.note-preview {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.note-item.active .note-preview {
    color: rgba(255, 255, 255, 0.7);
}

.note-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #c0c4cc;
}

.note-item.active .note-meta {
    color: rgba(255, 255, 255, 0.7);
}

.notes-editor {
    flex: 1;
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
}

.editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.editor-header :deep(.el-input__wrapper) {
    box-shadow: none;
    font-size: 18px;
    font-weight: 600;
}

.editor-actions {
    display: flex;
    gap: 8px;
}

.editor-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
}
</style>

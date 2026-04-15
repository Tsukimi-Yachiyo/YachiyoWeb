<script setup lang="ts">
  import { onBeforeUnmount } from 'vue'
  import { useColumnEditor } from '../composables/useColumnEditor'

  const {
    categoryOptions,
    backIconUrl,
    saveIconUrl,
    uploadIconUrl,
    columnTitle,
    category,
    summary,
    content,
    imageAssets,
    attachmentAssets,
    imageCountText,
    attachmentCountText,
    selectedCategoryLabel,
    summaryLength,
    contentLength,
    isSaving,
    isPublishing,
    formError,
    formSuccess,
    imageInputRef,
    attachmentInputRef,
    drafts,
    goBack,
    openImagePicker,
    openAttachmentPicker,
    handleImageChange,
    handleAttachmentChange,
    removeImageById,
    removeAttachmentById,
    saveDraft,
    publishColumnDoc,
    clearObjectUrls,
  } = useColumnEditor()

  onBeforeUnmount(() => {
    clearObjectUrls()
  })
</script>

<template>
  <div class="column-editor">
    <div class="editor-shell">
      <aside class="left-panel">
        <button class="back-btn" @click="goBack">
          <img v-if="backIconUrl" :src="backIconUrl" alt="返回" style="width: 16px; height: 16px" />
          <span>返回专栏</span>
        </button>

        <div class="left-card">
          <h2>专栏内容编辑</h2>
          <p>发布的是专栏内容本身，Word / PDF 会作为正文附件插入。</p>

          <label class="label">专栏标题</label>
          <input
            v-model="columnTitle"
            class="input"
            type="text"
            maxlength="80"
            placeholder="输入专栏标题"
          />

          <label class="label">专栏类型</label>
          <select v-model="category" class="input select">
            <option v-for="item in categoryOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>

          <label class="label">内容简介</label>
          <textarea
            v-model="summary"
            class="textarea"
            rows="5"
            maxlength="600"
            placeholder="输入简介，建议包含亮点和阅读收获"
          ></textarea>
          <p class="counter">{{ summaryLength }}/600</p>

          <div class="type-chip-row">
            <span class="type-chip">{{ selectedCategoryLabel }}</span>
          </div>
        </div>
      </aside>

      <main class="right-panel">
        <section class="editor-card">
          <div class="editor-header">
            <h3>正文内容</h3>
            <span class="length-chip">{{ contentLength }} 字</span>
          </div>
          <textarea
            v-model="content"
            class="content-textarea"
            rows="13"
            maxlength="20000"
            placeholder="输入专栏正文，可在下方批量插入图片或 Word/PDF 附件"
          ></textarea>
        </section>

        <section class="upload-card">
          <div class="upload-header">
            <h3>内容素材管理</h3>
          </div>

          <div class="asset-grid">
            <div class="asset-panel">
              <div class="asset-panel-head">
                <h4>图片素材（支持多张）</h4>
                <button class="mini-btn" @click="openImagePicker">选择图片</button>
              </div>

              <div class="file-box" @click="openImagePicker">
                <img
                  v-if="uploadIconUrl"
                  :src="uploadIconUrl"
                  alt="上传图片"
                  style="width: 24px; height: 24px; opacity: 0.9"
                />
                <p class="file-name">{{ imageCountText }}</p>
                <p class="hint">支持 jpg / png / gif / webp，多图会自动追加到正文占位</p>
              </div>

              <input
                ref="imageInputRef"
                type="file"
                accept="image/*"
                multiple
                style="display: none"
                @change="handleImageChange"
              />

              <ul v-if="imageAssets.length > 0" class="asset-list image-list">
                <li v-for="item in imageAssets" :key="item.id" class="asset-item image-item">
                  <img :src="item.previewUrl" :alt="item.file.name" />
                  <div class="asset-info">
                    <p>{{ item.file.name }}</p>
                    <button class="remove-btn small" @click="removeImageById(item.id)">移除</button>
                  </div>
                </li>
              </ul>
            </div>

            <div class="asset-panel">
              <div class="asset-panel-head">
                <h4>文档附件（Word/PDF）</h4>
                <button class="mini-btn" @click="openAttachmentPicker">选择文件</button>
              </div>

              <div class="file-box" @click="openAttachmentPicker">
                <img
                  v-if="uploadIconUrl"
                  :src="uploadIconUrl"
                  alt="上传附件"
                  style="width: 24px; height: 24px; opacity: 0.9"
                />
                <p class="file-name">{{ attachmentCountText }}</p>
                <p class="hint">支持 .pdf / .doc / .docx，会插入正文附件占位</p>
              </div>

              <input
                ref="attachmentInputRef"
                type="file"
                accept=".pdf,.doc,.docx"
                multiple
                style="display: none"
                @change="handleAttachmentChange"
              />

              <ul v-if="attachmentAssets.length > 0" class="asset-list">
                <li v-for="item in attachmentAssets" :key="item.id" class="asset-item">
                  <div class="asset-info">
                    <p>{{ item.file.name }}</p>
                    <button class="remove-btn small" @click="removeAttachmentById(item.id)">
                      移除
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div class="action-row">
            <button class="action-btn draft" :disabled="isSaving" @click="saveDraft">
              <img
                v-if="saveIconUrl"
                :src="saveIconUrl"
                alt="保存"
                style="width: 16px; height: 16px"
              />
              <span>{{ isSaving ? '保存中...' : '保存草稿' }}</span>
            </button>
            <button class="action-btn publish" :disabled="isPublishing" @click="publishColumnDoc">
              <span>{{ isPublishing ? '提交中...' : '发布专栏' }}</span>
            </button>
          </div>

          <p v-if="formError" class="msg error">{{ formError }}</p>
          <p v-if="formSuccess" class="msg success">{{ formSuccess }}</p>
        </section>

        <section class="draft-card">
          <h3>最近草稿</h3>
          <ul v-if="drafts.length > 0" class="draft-list">
            <li v-for="item in drafts" :key="item.id" class="draft-item">
              <div class="draft-main">
                <p class="draft-title">{{ item.title }}</p>
                <p class="draft-meta">
                  {{ item.categoryLabel }} · {{ item.imageCount }} 图 ·
                  {{ item.attachmentCount }} 附件
                </p>
              </div>
              <span class="draft-time">{{ item.updatedAt }}</span>
            </li>
          </ul>
          <p v-else class="hint">暂无草稿，保存后会展示在这里。</p>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
  .column-editor {
    min-height: 100%;
    padding: 20px;
    color: rgba(255, 255, 255, 0.92);
    background: linear-gradient(135deg, #152a72 0%, #0a1438 100%);
  }

  .editor-shell {
    max-width: 1360px;
    margin: 0 auto;
    display: grid;
    gap: 20px;
    grid-template-columns: 320px 1fr;
  }

  .left-panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .back-btn {
    width: fit-content;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.85);
    padding: 8px 14px;
    cursor: pointer;
    transition: all 0.25s ease;
  }

  .back-btn:hover {
    transform: translateX(-2px);
    border-color: rgba(100, 181, 246, 0.45);
    color: #90caf9;
  }

  .left-card,
  .editor-card,
  .upload-card,
  .draft-card {
    border-radius: 14px;
    padding: 18px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(8px);
  }

  .left-card h2 {
    margin: 0;
    font-size: 24px;
    background: linear-gradient(135deg, #fff 0%, #8fd3ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .left-card > p {
    margin: 8px 0 14px;
    color: rgba(255, 255, 255, 0.74);
    font-size: 13px;
    line-height: 1.6;
  }

  .label {
    display: block;
    margin: 10px 0 6px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
  }

  .input,
  .textarea,
  .content-textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    padding: 10px 12px;
    outline: none;
    transition: all 0.25s ease;
  }

  .input:focus,
  .textarea:focus,
  .content-textarea:focus {
    border-color: rgba(100, 181, 246, 0.65);
    box-shadow: 0 0 0 3px rgba(100, 181, 246, 0.18);
  }

  .select option {
    background: #1d2963;
  }

  .textarea,
  .content-textarea {
    resize: vertical;
    line-height: 1.65;
  }

  .counter {
    margin: 6px 0 0;
    text-align: right;
    color: rgba(255, 255, 255, 0.56);
    font-size: 12px;
  }

  .type-chip-row {
    margin-top: 8px;
    display: flex;
    justify-content: flex-end;
  }

  .right-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .editor-header,
  .upload-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  h3 {
    margin: 0;
    font-size: 18px;
  }

  .type-chip {
    font-size: 12px;
    border-radius: 999px;
    padding: 4px 10px;
    border: 1px solid rgba(144, 202, 249, 0.45);
    background: rgba(33, 150, 243, 0.24);
  }

  .length-chip {
    font-size: 12px;
    border-radius: 999px;
    padding: 4px 10px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    color: rgba(255, 255, 255, 0.72);
    background: rgba(255, 255, 255, 0.08);
  }

  .asset-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }

  .asset-panel {
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.04);
  }

  .asset-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    gap: 8px;
  }

  .asset-panel-head h4 {
    margin: 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.86);
  }

  .mini-btn {
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.08);
    color: #e7f5ff;
    border-radius: 8px;
    font-size: 12px;
    padding: 5px 10px;
    cursor: pointer;
  }

  .file-box {
    min-height: 130px;
    border: 2px dashed rgba(255, 255, 255, 0.26);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.25s ease;
    background: rgba(255, 255, 255, 0.03);
  }

  .file-box:hover {
    border-color: rgba(100, 181, 246, 0.65);
    background: rgba(100, 181, 246, 0.09);
  }

  .asset-list {
    margin: 10px 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 220px;
    overflow-y: auto;
  }

  .image-list {
    max-height: 260px;
  }

  .asset-item {
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.03);
    padding: 8px;
  }

  .image-item {
    display: flex;
    gap: 8px;
  }

  .image-item img {
    width: 54px;
    height: 54px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .asset-info {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .asset-info p {
    margin: 0;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.78);
    word-break: break-all;
  }

  .file-name {
    margin: 0;
    font-size: 14px;
    color: #dceeff;
  }

  .hint {
    margin: 0;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.62);
  }

  .remove-btn {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid rgba(244, 67, 54, 0.42);
    color: #ff9ea0;
    background: rgba(244, 67, 54, 0.12);
    cursor: pointer;
  }

  .remove-btn.small {
    padding: 4px 8px;
    font-size: 12px;
  }

  .action-row {
    margin-top: 14px;
    display: flex;
    gap: 10px;
  }

  .action-btn {
    flex: 1;
    border: none;
    border-radius: 10px;
    padding: 10px;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.25s ease;
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .action-btn.draft {
    background: rgba(255, 193, 7, 0.18);
    border: 1px solid rgba(255, 193, 7, 0.3);
    color: #ffe28a;
  }

  .action-btn.publish {
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  }

  .action-btn.publish:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(33, 150, 243, 0.34);
  }

  .msg {
    margin-top: 10px;
    font-size: 13px;
  }

  .msg.error {
    color: #ff8b8b;
  }

  .msg.success {
    color: #8ce8a8;
  }

  .draft-list {
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .draft-item {
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.04);
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .draft-title {
    margin: 0;
    font-size: 14px;
    color: #eff8ff;
  }

  .draft-meta {
    margin: 4px 0 0;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.64);
  }

  .draft-time {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.56);
    white-space: nowrap;
  }

  @media (max-width: 960px) {
    .editor-shell {
      grid-template-columns: 1fr;
    }

    .action-row {
      flex-direction: column;
    }
  }
</style>

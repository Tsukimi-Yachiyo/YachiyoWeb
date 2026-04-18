<script setup lang="ts">
  import { useColumnView } from '../../../composables/useColumnView'

  const {
    documents,
    campaignCover,
    isColumnLoading,
    columnLoadError,
    editIconUrl,
    getTypeLabel,
    getFileTypeClass,
    getInteractionStats,
    getInteractionLoading,
    getCampaignStatusLabel,
    goToColumnEditor,
    openActivityLanding,
    submitColumnInteraction,
    previewDocument,
    downloadDocument,
  } = useColumnView()
</script>

<template>
  <div class="w-full min-h-full p-4 md:p-7 text-white/90">
    <section
      class="mx-auto max-w-[1160px] rounded-[20px] border border-white/20 p-4 md:p-6 backdrop-blur-[8px] bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.04)_45%),linear-gradient(145deg,rgba(8,40,84,0.42)_0%,rgba(24,93,171,0.24)_100%)]"
    >
      <header class="mb-5 flex flex-col items-start justify-between gap-4 md:flex-row">
        <div>
          <h2
            class="m-0 bg-gradient-to-br from-white to-[#8fd3ff] bg-clip-text text-2xl md:text-[28px] text-transparent"
          >
            专栏文档区
          </h2>
          <p class="mt-2.5 text-sm leading-6 text-white/75">
            集中管理与浏览专栏资料，支持 Word 与 PDF 类型文档。
          </p>
        </div>
        <span
          class="whitespace-nowrap rounded-full border border-[#8fd3ff]/45 bg-[#2196f3]/28 px-3 py-1.5 text-xs text-[#e6f6ff]/95"
        >
          Word / PDF
        </span>
      </header>

      <article
        class="mb-4 overflow-hidden rounded-[16px] border border-[#8fd3ff]/40 bg-[linear-gradient(135deg,rgba(18,67,134,0.5)_0%,rgba(11,34,70,0.84)_100%)] shadow-[0_10px_28px_rgba(2,26,55,0.28)]"
      >
        <button
          type="button"
          class="group flex w-full cursor-pointer border-none bg-transparent p-0 text-left"
          @click="openActivityLanding"
        >
          <div
            class="h-[148px] w-[32%] min-w-[210px] bg-[radial-gradient(circle_at_20%_10%,rgba(122,198,255,0.45)_0%,rgba(30,106,186,0.4)_38%,rgba(8,35,72,0.92)_100%)]"
            :style="
              campaignCover.coverUrl
                ? { backgroundImage: `url(${campaignCover.coverUrl})`, backgroundSize: 'cover' }
                : undefined
            "
          ></div>
          <div class="flex min-h-[148px] flex-1 flex-col justify-between gap-3 p-4 md:p-5">
            <div>
              <p class="m-0 text-xs tracking-[0.8px] text-[#9bd8ff]/88">八千杯活动页入口</p>
              <h3 class="mt-1.5 text-xl leading-[1.4] text-[#f4fbff]">{{ campaignCover.title }}</h3>
              <p class="mb-0 mt-2 text-[13px] leading-6 text-[#dbefff]/76">
                {{ campaignCover.subtitle }}
              </p>
            </div>
            <div class="flex items-center justify-between">
              <span
                class="rounded-full border border-white/28 bg-white/10 px-3 py-1 text-xs text-[#edf7ff]/88"
              >
                {{ getCampaignStatusLabel(campaignCover.status) }}
              </span>
              <span
                class="text-sm text-[#9fdcff] transition-transform duration-200 group-hover:translate-x-1"
              >
                点击查看活动页 ->
              </span>
            </div>
          </div>
        </button>
      </article>

      <div
        v-if="isColumnLoading"
        class="mb-4 rounded-[14px] border border-white/12 bg-white/6 px-4 py-3 text-sm text-[#d8edff]/85"
      >
        正在同步专栏数据与互动信息...
      </div>

      <div
        v-else-if="columnLoadError"
        class="mb-4 rounded-[14px] border border-[#ffb4b4]/22 bg-[rgba(255,107,107,0.12)] px-4 py-3 text-sm text-[#ffd8d8]"
      >
        {{ columnLoadError }}
      </div>

      <div class="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
        <article
          v-for="doc in documents"
          :key="doc.id"
          class="flex min-h-[220px] flex-col justify-between rounded-[14px] border border-white/16 bg-white/8 p-4 shadow-[0_8px_24px_rgba(2,26,55,0.2)] transition-all duration-200 hover:-translate-y-[3px] hover:border-[#8fd3ff]/45 hover:shadow-[0_12px_28px_rgba(2,26,55,0.28)]"
        >
          <div class="mb-3 flex items-center justify-between">
            <span
              :class="getFileTypeClass(doc.type)"
              class="rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.6px]"
            >
              {{ getTypeLabel(doc.type) }}
            </span>
            <span class="text-xs text-white/62">{{ doc.size }}</span>
          </div>

          <h3 class="m-0 text-[17px] leading-[1.45] text-[#f4faff]">{{ doc.title }}</h3>
          <p class="mb-3.5 mt-2.5 text-[13px] leading-6 text-[#e9f5ff]/78">{{ doc.description }}</p>

          <div class="mb-3 flex items-center gap-2 text-xs text-[#d8edff]/84">
            <span class="rounded-full border border-white/22 bg-white/8 px-2 py-1">
              点赞 {{ getInteractionStats(doc.id).like }}
            </span>
            <span class="rounded-full border border-white/22 bg-white/8 px-2 py-1">
              投币 {{ getInteractionStats(doc.id).coin }}
            </span>
          </div>

          <div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <span class="text-xs text-white/62">更新于 {{ doc.updatedAt }}</span>
            <div class="flex gap-2">
              <button
                type="button"
                class="cursor-pointer rounded-lg border border-[#ffd5bf]/40 bg-[rgba(255,167,38,0.16)] px-3 py-1.5 text-xs text-[#ffe9d7] transition-colors duration-200 hover:bg-[rgba(255,167,38,0.26)] disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="getInteractionLoading(doc.id, 'COIN')"
                @click="submitColumnInteraction(doc.id, 'COIN')"
              >
                投币
              </button>
              <button
                type="button"
                class="cursor-pointer rounded-lg border border-[#ffd7ea]/40 bg-[rgba(244,114,182,0.14)] px-3 py-1.5 text-xs text-[#ffeaf4] transition-colors duration-200 hover:bg-[rgba(244,114,182,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="getInteractionLoading(doc.id, 'LIKE')"
                @click="submitColumnInteraction(doc.id, 'LIKE')"
              >
                点赞
              </button>
              <button
                type="button"
                class="cursor-pointer rounded-lg border border-white/22 bg-white/16 px-3 py-1.5 text-xs text-white transition-colors duration-200 hover:bg-white/24"
                @click="previewDocument(doc)"
              >
                预览
              </button>
              <button
                type="button"
                class="cursor-pointer rounded-lg bg-gradient-to-br from-[#2196f3] to-[#1976d2] px-3 py-1.5 text-xs text-white transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_14px_rgba(33,150,243,0.32)]"
                @click="downloadDocument(doc)"
              >
                下载
              </button>
            </div>
          </div>
        </article>

        <article
          v-if="!documents.length"
          class="flex min-h-[220px] flex-col items-start justify-center gap-2.5 rounded-[14px] border border-dashed border-[#8fd3ff]/45 bg-white/8 p-4 shadow-[0_8px_24px_rgba(2,26,55,0.2)]"
        >
          <p class="m-0 text-base font-semibold">新增文档位</p>
          <p class="m-0 text-[13px] leading-6 text-[#e9f5ff]/74">
            后续可接入上传、预览、权限控制等能力。
          </p>
          <button
            type="button"
            class="cursor-pointer rounded-lg bg-gradient-to-br from-[#2196f3] to-[#1976d2] px-3 py-1.5 text-xs text-white transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_14px_rgba(33,150,243,0.32)]"
          >
            创建入口
          </button>
        </article>
      </div>
    </section>

    <button
      class="fixed right-5 bottom-5 z-100 flex h-50px w-50px cursor-pointer items-center justify-center rounded-full border-none bg-gradient-to-br from-[#2196f3] to-[#1976d2] text-white shadow-[0_4px_15px_rgba(33,150,243,0.3)] transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:from-[#1976d2] hover:to-[#0d47a1] hover:shadow-[0_6px_20px_rgba(33,150,243,0.4)] active:scale-95 active:translate-y-0 active:shadow-[0_2px_10px_rgba(33,150,243,0.3)] md:top-[150px] md:right-[30px] md:bottom-auto md:h-[60px] md:w-[60px]"
      title="编辑专栏"
      @click="goToColumnEditor"
    >
      <img v-if="editIconUrl" :src="editIconUrl" alt="编辑专栏" style="width: 24px; height: 24px" />
      <span v-else>编辑</span>
    </button>
  </div>
</template>

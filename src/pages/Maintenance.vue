<script setup lang="ts">
  const retryConnection = () => {
    window.location.href = '/'
  }
</script>

<template>
  <section
    class="relative min-h-screen overflow-hidden bg-linear-to-br from-slate-50 via-white to-cyan-50 text-slate-900"
  >
    <div
      class="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl"
    ></div>
    <div
      class="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-emerald-300/25 blur-3xl"
    ></div>

    <div class="relative mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-20">
      <div
        class="w-full rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur-xl"
      >
        <p
          class="mb-4 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs text-cyan-700"
        >
          SYSTEM NOTICE
        </p>
        <h1 class="text-3xl font-semibold tracking-wide text-slate-900 md:text-4xl">
          服务器正在维护中
        </h1>
        <p class="mt-5 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
          服务暂时不可用，我们正在进行系统升级与稳定性优化。维护完成后页面将恢复正常访问。
        </p>

        <div class="mt-10 flex flex-wrap items-center gap-4">
          <button
            type="button"
            class="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
            @click="retryConnection"
          >
            重新连接
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

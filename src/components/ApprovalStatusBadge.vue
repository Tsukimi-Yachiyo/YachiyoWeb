<script setup lang="ts">
  export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

  const props = defineProps<{
    status: ApprovalStatus
  }>()

  const statusTextMap: Record<ApprovalStatus, string> = {
    pending: '审核中',
    approved: '已通过',
    rejected: '已拒绝',
  }

  const statusClassMap: Record<ApprovalStatus, string> = {
    pending: 'reviewing-badge',
    approved: 'approved-badge',
    rejected: 'rejected-badge',
  }

  const getStatusText = (status: ApprovalStatus): string => statusTextMap[status]
  const getStatusClass = (status: ApprovalStatus): string => statusClassMap[status]
</script>

<template>
  <span class="status-badge" :class="getStatusClass(props.status)">
    {{ getStatusText(props.status) }}
  </span>
</template>

<style scoped>
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 12px;
    line-height: 1.4;
    font-weight: 500;
  }

  .reviewing-badge {
    color: #ffb74d;
    background: rgba(255, 183, 77, 0.2);
    border: 1px solid rgba(255, 183, 77, 0.35);
  }

  .approved-badge {
    color: #81c784;
    background: rgba(129, 199, 132, 0.2);
    border: 1px solid rgba(129, 199, 132, 0.35);
  }

  .rejected-badge {
    color: #e57373;
    background: rgba(229, 115, 115, 0.2);
    border: 1px solid rgba(229, 115, 115, 0.35);
  }
</style>

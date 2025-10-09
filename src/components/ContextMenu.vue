<!-- 右键菜单 -->
<template>
  <div 
    v-if="visible" 
    class="context-menu"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
    @click.stop
  >
    <div 
      v-for="item in menuItems" 
      :key="item.key"
      class="context-item" 
      @click="handleItemClick(item)"
    >
      <span class="context-icon">{{ item.icon }}</span>
      {{ item.label }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'ContextMenu',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    position: {
      type: Object,
      default: () => ({ x: 0, y: 0 })
    },
    menuItems: {
      type: Array,
      default: () => []
    }
  },
  emits: ['item-click'],
  methods: {
    handleItemClick(item) {
      this.$emit('item-click', item)
    }
  }
}
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px var(--shadow-medium);
  z-index: 1001;
  min-width: 150px;
  overflow: hidden;
  transition: background-color 0.3s ease;
}

.context-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.context-item:hover {
  background: var(--bg-tertiary);
}

.context-icon {
  font-size: 1rem;
}
</style>

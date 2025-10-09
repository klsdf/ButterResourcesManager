<!-- 表单输入框 -->
<template>
  <div class="form-group">
    <label v-if="label">{{ label }}</label>
    <input
      v-if="type === 'text' || type === 'email' || type === 'password' || type === 'number'"
      :type="type"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      :class="inputClass"
      :readonly="readonly"
      :disabled="disabled"
    >
    <textarea
      v-else-if="type === 'textarea'"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      :class="inputClass"
      :rows="rows"
      :readonly="readonly"
      :disabled="disabled"
    ></textarea>
    <select
      v-else-if="type === 'select'"
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
      :class="inputClass"
      :disabled="disabled"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <div v-else-if="type === 'file'" class="file-input-group">
      <input
        type="text"
        :value="modelValue"
        :placeholder="placeholder"
        :class="inputClass"
        readonly
      >
      <button class="btn-browse" @click="$emit('browse')">浏览</button>
    </div>
    <div v-else-if="type === 'tags'" class="tags-input-container">
      <div class="tags-display">
        <span
          v-for="(tag, index) in modelValue"
          :key="index"
          class="tag-item"
        >
          {{ tag }}
          <button
            type="button"
            class="tag-remove"
            @click="$emit('removeTag', index)"
          >×</button>
        </span>
      </div>
      <input
        type="text"
        :value="tagInput"
        @input="$emit('update:tagInput', $event.target.value)"
        @keydown.enter.prevent="$emit('addTag')"
        @keydown.comma.prevent="$emit('addTag')"
        :placeholder="tagPlaceholder"
        class="tag-input"
      >
    </div>
  </div>
</template>

<script>
export default {
  name: 'FormField',
  props: {
    modelValue: {
      type: [String, Number, Array],
      default: ''
    },
    label: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'text',
      validator: (value) => ['text', 'email', 'password', 'number', 'textarea', 'select', 'file', 'tags'].includes(value)
    },
    placeholder: {
      type: String,
      default: ''
    },
    rows: {
      type: Number,
      default: 3
    },
    readonly: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    options: {
      type: Array,
      default: () => []
    },
    tagInput: {
      type: String,
      default: ''
    },
    tagPlaceholder: {
      type: String,
      default: '输入标签后按回车或逗号添加'
    },
    inputClass: {
      type: String,
      default: 'form-input'
    }
  },
  emits: [
    'update:modelValue',
    'update:tagInput',
    'addTag',
    'removeTag',
    'browse'
  ]
}
</script>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-input,
.form-textarea,
select ,
.tags-input-container {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-input:focus,
.form-textarea:focus,
select:focus,
.tags-input-container:focus-within {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled,
.form-textarea:disabled,
select:disabled {
  background-color: #f9fafb;
  color: #333436;
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 2.5rem;
}

.file-input-group {
  display: flex;
  gap: 0.5rem;
}

.file-path-input {
  flex: 1;
}

.btn-browse {
  padding: 10px 16px;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  min-width: 80px;
  transition: background-color 0.3s ease-in-out;
}

.btn-browse:hover {
  background-color: var(--accent-hover);
}

/* { */
  /* border: px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem;
  background-color: white;
} */

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  background-color: var(--accent-color);
  color: #ffffff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  gap: 0.25rem;
  transition: background-color 0.3s ease;
}

.tag-remove {
  background: none;
  border: none;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.875rem;
  line-height: 1;
  padding: 0;
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-remove:hover {
  color: #ef4444;
}

.tag-input {
  border: none;
  outline: none;
  width: 100%;
  padding: 0.25rem 0;
  font-size: 0.875rem;
  background: transparent;
}

.tag-input::placeholder {
  color: var(--text-primary);
}
</style>

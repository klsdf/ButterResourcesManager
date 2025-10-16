<template>
        <BaseView
          ref="baseView"
          :items="videos"
          :filtered-items="filteredVideos"
          :empty-state-config="videoEmptyStateConfig"
          :toolbar-config="videoToolbarConfig"
          :context-menu-items="videoContextMenuItems"
          :pagination-config="videoPaginationConfig"
          :sort-by="sortBy"
          :search-query="searchQuery"
          @empty-state-action="handleEmptyStateAction"
          @add-item="showAddVideoDialog"
          @sort-changed="handleSortChanged"
          @search-query-changed="handleSearchQueryChanged"
          @sort-by-changed="handleSortByChanged"
          @context-menu-click="handleContextMenuClick"
          @page-change="handleVideoPageChange"
        >
    <!-- 主内容区域 -->
    <div 
      class="video-content"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      :class="{ 'drag-over': isDragOver }"
    >

      <!-- 视频网格 -->
      <div class="videos-grid" v-if="paginatedVideos.length > 0">
        <MediaCard
          v-for="video in paginatedVideos" 
          :key="video.id"
          :item="video"
          type="video"
          :isElectronEnvironment="true"
          :file-exists="video.fileExists"
          @click="showVideoDetail"
          @contextmenu="(event) => ($refs.baseView as any).showContextMenuHandler(event, video)"
          @action="playVideo"
        />
      </div>
    </div>

    <!-- 添加视频对话框 -->
    <div v-if="showAddDialog" class="modal-overlay" @click="closeAddVideoDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加视频</h3>
          <button class="modal-close" @click="closeAddVideoDialog">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="addVideo">
            <FormField
              label="视频名称"
              type="text"
              v-model="newVideo.name"
              placeholder="未填写将自动使用文件名"
            />
            
            <FormField
              label="系列名"
              type="text"
              v-model="newVideo.series"
              placeholder="如：复仇者联盟"
            />

            <FormField
              label="演员"
              type="text"
              v-model="actorsInput"
              placeholder="用逗号分隔多个演员"
              @blur="parseActors"
            />

            <FormField
              label="标签"
              type="tags"
              v-model="newVideo.tags"
              v-model:tagInput="tagsInput"
              @add-tag="addTag"
              @remove-tag="removeTag"
            />

            <FormField
              label="描述"
              type="textarea"
              v-model="newVideo.description"
              placeholder="视频描述..."
              :rows="3"
            />

            <FormField
              label="视频文件"
              type="file"
              v-model="newVideo.filePath"
              placeholder="选择视频文件..."
              @browse="selectVideoFile"
            />

            <FormField
              label="缩略图"
              type="file"
              v-model="newVideo.thumbnail"
              placeholder="选择缩略图..."
              @browse="selectThumbnailFile"
            />

            <FormField
              label="时长 (分钟)"
              type="number"
              v-model="newVideo.duration"
              placeholder="120"
            />
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" @click="closeAddVideoDialog" class="btn-cancel">
            取消
          </button>
          <button type="button" @click="addVideo" class="btn-confirm">
            添加视频
          </button>
        </div>
      </div>
    </div>

    <!-- 视频详情对话框 -->
    <DetailPanel
      :visible="showDetailDialog && !!selectedVideo"
      :item="selectedVideo"
      type="video"
      :stats="videoStats"
      :actions="videoActions"
      @close="closeVideoDetail"
      @action="handleDetailAction"
    />

    <!-- 编辑视频对话框 -->
    <div v-if="showEditDialog" class="modal-overlay" @click="closeEditDialog">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>编辑视频</h3>
        <button class="modal-close" @click="closeEditDialog">✕</button>
      </div>
      <div class="modal-body">
        <FormField
          label="名称"
          type="text"
          v-model="editVideoForm.name"
        />
        <FormField
          label="系列"
          type="text"
          v-model="editVideoForm.series"
        />
        <FormField
          label="演员"
          type="text"
          v-model="editActorsInput"
          placeholder="用逗号分隔多个演员"
          @blur="parseEditActors"
        />
        <FormField
          label="标签"
          type="tags"
          v-model="editVideoForm.tags"
          v-model:tagInput="editTagsInput"
          @add-tag="addEditTag"
          @remove-tag="removeEditTag"
        />
        <FormField
          label="描述"
          type="textarea"
          v-model="editVideoForm.description"
          :rows="3"
        />
        <FormField
          label="视频文件"
          type="file"
          v-model="editVideoForm.filePath"
          @browse="browseEditVideoFile"
        />
        <div class="form-group">
          <label>缩略图</label>
          <div class="file-input-group">
            <input type="text" v-model="editVideoForm.thumbnail" readonly>
            <button type="button" class="btn-select-file" @click="browseEditThumbnailFile">选择图片</button>
            <button type="button" class="btn-select-file" @click="randomizeThumbnail">随机封面</button>
          </div>
          <div class="thumb-preview-wrapper">
            <img 
              v-if="editVideoForm.thumbnail"
              class="thumb-preview"
              :src="getThumbnailUrl(editVideoForm.thumbnail)"
              :alt="editVideoForm.name || 'thumbnail'"
              @error="handleThumbnailPreviewError"
              @load="handleThumbnailPreviewLoad"
            >
            <div v-else class="thumb-placeholder">无缩略图</div>
          </div>
        </div>
        <div class="form-group">
          <label>时长 (分钟)</label>
          <input type="number" v-model.number="editVideoForm.duration" min="0">
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn-cancel" @click="closeEditDialog">取消</button>
        <button type="button" class="btn-confirm" @click="saveEditedVideo">保存</button>
      </div>
    </div>
    </div>

    <!-- 路径更新确认对话框 -->
    <PathUpdateDialog
      :visible="showPathUpdateDialog"
      title="更新视频路径"
      description="发现同名但路径不同的视频文件："
      item-name-label="视频名称"
      :item-name="pathUpdateInfo.existingVideo?.name || ''"
      :old-path="pathUpdateInfo.existingVideo?.filePath || ''"
      :new-path="pathUpdateInfo.newPath || ''"
      missing-label="文件丢失"
      found-label="文件存在"
      question="是否要更新视频路径？"
      @confirm="confirmPathUpdate"
      @cancel="closePathUpdateDialog"
    />
  </BaseView>
</template>

<script lang="ts">
import VideoManager from '../utils/VideoManager.ts'
import BaseView from '../components/BaseView.vue'
import FormField from '../components/FormField.vue'
import MediaCard from '../components/MediaCard.vue'
import DetailPanel from '../components/DetailPanel.vue'
import PathUpdateDialog from '../components/PathUpdateDialog.vue'

import saveManager from '../utils/SaveManager.ts'
import notify from '../utils/NotificationService.ts'
// 通过 preload 暴露的 electronAPI 进行调用

export default {
  name: 'VideoView',
  components: {
    BaseView,
    FormField,
    MediaCard,
    DetailPanel,
    PathUpdateDialog,
  },
  emits: ['filter-data-updated'],
  data() {
    return {
      videoManager: null,
      videos: [],
      searchQuery: '',
      sortBy: 'name',
      showAddDialog: false,
      isDragOver: false,
      // 伪装模式相关
      disguiseImageCache: {},
      disguiseTextCache: {},
      // 路径更新确认对话框
      showPathUpdateDialog: false,
      pathUpdateInfo: {
        existingVideo: null,
        newPath: '',
        newFileName: ''
      },
      showDetailDialog: false,
      selectedVideo: null,
      newVideo: {
        name: '',
        description: '',
        tags: [],
        actors: [],
        series: '',
        duration: 0,
        filePath: '',
        thumbnail: ''
      },
      actorsInput: '',
      tagsInput: '',
      // 编辑相关
      showEditDialog: false,
      editVideoForm: {
        id: '',
        name: '',
        description: '',
        tags: [],
        actors: [],
        series: '',
        duration: 0,
        filePath: '',
        thumbnail: ''
      },
      editActorsInput: '',
      editTagsInput: '',
      // 缩略图 URL 缓存
      thumbnailUrlCache: new Map(),
      // 排序选项
      videoSortOptions: [
        { value: 'name', label: '按名称排序' },
        { value: 'lastWatched', label: '按最后观看时间' },
        { value: 'watchCount', label: '按观看次数' },
        { value: 'added', label: '按添加时间' }
      ],
      // 右键菜单配置
      videoContextMenuItems: [
        { key: 'detail', icon: '👁️', label: '查看详情' },
        { key: 'play', icon: '▶️', label: '播放视频' },
        { key: 'folder', icon: '📁', label: '打开文件夹' },
        { key: 'edit', icon: '✏️', label: '编辑信息' },
        { key: 'remove', icon: '🗑️', label: '删除视频' }
      ],
      // 标签筛选相关
      allTags: [],
      selectedTags: [],
      excludedTags: [],
      // 演员筛选相关
      allActors: [],
      selectedActors: [],
      excludedActors: [],
      // 系列筛选相关
      allSeries: [],
      selectedSeries: null,
      excludedSeries: null,
      // 视频列表分页相关
      currentVideoPage: 1,
      videoPageSize: 20, // 默认每页显示20个视频
      totalVideoPages: 0,
      // 空状态配置
      videoEmptyStateConfig: {
        emptyIcon: '🎬',
        emptyTitle: '你的视频库是空的',
        emptyDescription: '点击"添加视频"按钮来添加你的第一个视频，或直接拖拽视频文件到此处',
        emptyButtonText: '添加第一个视频',
        emptyButtonAction: 'showAddVideoDialog',
        noResultsIcon: '🔍',
        noResultsTitle: '没有找到匹配的视频',
        noResultsDescription: '尝试使用不同的搜索词',
        noPageDataIcon: '📄',
        noPageDataTitle: '当前页没有视频',
        noPageDataDescription: '请尝试切换到其他页面'
      },
      // 工具栏配置
      videoToolbarConfig: {
        addButtonText: '添加视频',
        searchPlaceholder: '搜索视频...',
        sortOptions: [
          { value: 'name', label: '按名称排序' },
          { value: 'lastWatched', label: '按最后观看时间' },
          { value: 'watchCount', label: '按观看次数' },
          { value: 'added', label: '按添加时间' }
        ],
        pageType: 'videos'
      },
    }
  },
  computed: {
    filteredVideos() {
      let filtered = this.videos.filter(video => {
        // 搜索筛选
        const matchesSearch = !this.searchQuery || (
          video.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          video.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          video.series.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          video.actors.some(actor => actor.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
          video.tags.some(tag => tag.toLowerCase().includes(this.searchQuery.toLowerCase()))
        )
        
        // 标签筛选 - 必须包含所有选中的标签（AND逻辑）
        const matchesTag = this.selectedTags.length === 0 || (video.tags && this.selectedTags.every(tag => video.tags.includes(tag)))
        const notExcludedTag = this.excludedTags.length === 0 || !(video.tags && this.excludedTags.some(tag => video.tags.includes(tag)))
        
        // 演员筛选 - 演员是"或"逻辑（一个视频可以有多个演员）
        const matchesActor = this.selectedActors.length === 0 || (video.actors && this.selectedActors.some(actor => video.actors.includes(actor)))
        const notExcludedActor = this.excludedActors.length === 0 || !(video.actors && this.excludedActors.some(actor => video.actors.includes(actor)))
        
        // 系列筛选
        const matchesSeries = !this.selectedSeries || video.series === this.selectedSeries
        const notExcludedSeries = !this.excludedSeries || video.series !== this.excludedSeries
        
        return matchesSearch && matchesTag && notExcludedTag && matchesActor && notExcludedActor && matchesSeries && notExcludedSeries
      })

      // 排序
      filtered.sort((a, b) => {
        switch (this.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name)
          case 'lastWatched':
            return new Date(b.lastWatched || 0).getTime() - new Date(a.lastWatched || 0).getTime()
          case 'watchCount':
            return b.watchCount - a.watchCount
          case 'added':
            return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
          default:
            return 0
        }
      })

      return filtered
    },
    // 分页显示的视频列表
    paginatedVideos() {
      if (!this.filteredVideos || this.filteredVideos.length === 0) return []
      const start = (this.currentVideoPage - 1) * this.videoPageSize
      const end = start + this.videoPageSize
      return this.filteredVideos.slice(start, end)
    },
    // 当前视频页的起始索引
    currentVideoPageStartIndex() {
      return (this.currentVideoPage - 1) * this.videoPageSize
    },
    videoStats() {
      if (!this.selectedVideo) return []
      
      return [
        { label: '系列', value: this.selectedVideo.series || '未知' },
        { label: '时长', value: this.formatDuration(this.selectedVideo.duration) },
        { label: '观看次数', value: `${this.selectedVideo.watchCount || 0} 次` },
        { label: '观看进度', value: `${this.selectedVideo.watchProgress || 0}%` },
        { label: '添加时间', value: this.formatAddedDate(this.selectedVideo.addedDate) },
        { label: '首次观看', value: this.formatFirstWatched(this.selectedVideo.firstWatched) },
        { label: '最后观看', value: this.formatLastWatched(this.selectedVideo.lastWatched) }
      ]
    },
    videoActions() {
      const actions = [
        { key: 'play', icon: '▶️', label: '播放', class: 'btn-play-game' },
        { key: 'folder', icon: '📁', label: '打开文件夹', class: 'btn-open-folder' },
        { key: 'edit', icon: '✏️', label: '编辑信息', class: 'btn-edit-game' },
        { key: 'remove', icon: '🗑️', label: '删除视频', class: 'btn-remove-game' }
      ]
      
      // 如果没有时长，添加更新时长按钮
      if (!this.selectedVideo?.duration || this.selectedVideo.duration === 0) {
        actions.splice(1, 0, { key: 'updateDuration', icon: '⏱️', label: '更新时长', class: 'btn-update-duration' })
      }
      
      return actions
    },
    // 动态更新分页配置
    videoPaginationConfig() {
      return {
        currentPage: this.currentVideoPage,
        totalPages: this.totalVideoPages,
        pageSize: this.videoPageSize,
        totalItems: this.filteredVideos.length,
        itemType: '视频'
      }
    },
    
    // 伪装模式相关方法
    /**
     * 检查伪装模式是否启用
     * @returns {boolean} 是否启用伪装模式
     */
    isDisguiseModeEnabled() {
      try {
        const settings = localStorage.getItem('butter-manager-settings')
        if (settings) {
          const parsedSettings = JSON.parse(settings)
          const isEnabled = parsedSettings.disguiseMode === true
          console.log('VideoView: 检查伪装模式设置:', isEnabled, '设置数据:', parsedSettings.disguiseMode)
          return isEnabled
        }
        console.log('VideoView: 没有找到设置数据，伪装模式默认关闭')
        return false
      } catch (error) {
        console.error('VideoView: 检查伪装模式设置失败:', error)
        return false
      }
    },
    
    /**
     * 异步加载伪装图片
     * @param {string} imagePath - 原始图片路径
     */
    async loadDisguiseImage(imagePath) {
      console.log('VideoView: 开始加载伪装图片，原始路径:', imagePath)
      try {
        const disguiseManager = await import('../utils/DisguiseManager.js')
        const disguiseImage = await disguiseManager.default.getRandomDisguiseImage(imagePath)
        console.log('VideoView: 获取到伪装图片路径:', disguiseImage)
        // 使用Vue的响应式更新
        this.$set ? this.$set(this.disguiseImageCache, imagePath, disguiseImage) : (this.disguiseImageCache[imagePath] = disguiseImage)
        // 强制更新组件
        this.$forceUpdate()
        console.log('VideoView: 伪装图片已更新到缓存')
      } catch (error) {
        console.error('VideoView: 加载伪装图片失败:', error)
      }
    },
    
    /**
     * 异步加载伪装文字
     * @param {string} itemId - 项目ID
     */
    async loadDisguiseText(itemId) {
      console.log('VideoView: 开始加载伪装文字，项目ID:', itemId)
      try {
        const disguiseManager = await import('../utils/DisguiseManager.js')
        const disguiseText = disguiseManager.default.getRandomDisguiseText()
        console.log('VideoView: 获取到伪装文字:', disguiseText)
        // 使用Vue的响应式更新
        this.$set ? this.$set(this.disguiseTextCache, itemId, disguiseText) : (this.disguiseTextCache[itemId] = disguiseText)
        // 强制更新组件
        this.$forceUpdate()
        console.log('VideoView: 伪装文字已更新到缓存')
      } catch (error) {
        console.error('VideoView: 加载伪装文字失败:', error)
      }
    },
    
    /**
     * 获取显示的名称（支持伪装模式）
     * @param {Object} video - 视频对象
     * @returns {string} 显示的名称
     */
    getDisplayName(video) {
      if (this.isDisguiseModeEnabled()) {
        // 检查伪装文字缓存
        if (this.disguiseTextCache[video.id]) {
          return this.disguiseTextCache[video.id]
        }
        
        // 异步获取伪装文字
        this.loadDisguiseText(video.id)
        return video.name // 先返回原始名称，等异步加载完成
      }
      return video.name
    },
    
    /**
     * 获取显示的图片（支持伪装模式）
     * @param {string} imagePath - 原始图片路径
     * @returns {string} 显示的图片路径
     */
    getDisplayImage(imagePath) {
      if (this.isDisguiseModeEnabled()) {
        // 检查伪装图片缓存
        if (this.disguiseImageCache[imagePath]) {
          return this.disguiseImageCache[imagePath]
        }
        
        // 异步获取伪装图片
        this.loadDisguiseImage(imagePath)
        return this.getThumbnailUrl(imagePath) // 先返回原始图片，等异步加载完成
      }
      return this.getThumbnailUrl(imagePath)
    }
  },
  async mounted() {
    this.videoManager = new VideoManager()
    await this.loadVideos()
    
    // 加载视频分页设置
    await this.loadVideoPaginationSettings()
    
    // 加载排序设置
    await this.loadSortSetting()
    
    // 初始化筛选器数据
    this.updateFilterData()
    
  },
  watch: {
    // 监听筛选结果变化，更新分页信息
    filteredVideos: {
      handler() {
        this.updateVideoPagination()
      },
      immediate: false
    },
    // 监听搜索查询变化，重置到第一页
    searchQuery() {
      this.currentVideoPage = 1
    },
    // 监听排序变化，重置到第一页
    sortBy() {
      this.currentVideoPage = 1
    }
  },
  methods: {
    async loadVideos() {
      if (this.videoManager) {
        await this.videoManager.loadVideos()
        this.videos = this.videoManager.getVideos()
        this.extractAllFilters()
        
        // 检测文件存在性
        await this.checkFileExistence()
        
        // 自动更新未知时长的视频
        await this.autoUpdateUnknownDurations()
        
        // 计算视频列表总页数
        this.updateVideoPagination()
      }
    },

    async checkFileExistence() {
      console.log('🔍 开始检测视频文件存在性...')
      
      if (!window.electronAPI || !window.electronAPI.checkFileExists) {
        console.log('⚠️ Electron API 不可用，跳过文件存在性检测')
        // 如果API不可用，默认设置为存在
        this.videos.forEach(video => {
          video.fileExists = true
        })
        return
      }
      
      let checkedCount = 0
      let missingCount = 0
      
      for (const video of this.videos) {
        if (!video.filePath) {
          video.fileExists = false
          missingCount++
          continue
        }
        
        try {
          const result = await window.electronAPI.checkFileExists(video.filePath)
          video.fileExists = result
          
          if (!result) {
            missingCount++
            console.log(`❌ 视频文件不存在: ${video.name} - ${video.filePath}`)
          } 
        } catch (error) {
          console.error(`❌ 检测视频文件存在性失败: ${video.name}`, error)
          video.fileExists = false
          missingCount++
        }
        
        checkedCount++
      }
      
      console.log(`📊 文件存在性检测完成: 检查了 ${checkedCount} 个视频，${missingCount} 个文件不存在`)
      
      // 强制更新视图
      this.$forceUpdate()
    },

    // 自动更新未知时长的视频
    async autoUpdateUnknownDurations() {
      console.log('🔄 开始自动更新未知时长的视频...')
      
      // 检查设置，看是否启用自动更新
      try {
        const settings = await this.loadSettings()
        if (settings.autoUpdateVideoDuration === false) {
          console.log('⏭️ 自动更新视频时长已禁用，跳过')
          return
        }
      } catch (error) {
        console.warn('⚠️ 无法加载设置，继续执行自动更新:', error)
      }
      
      // 筛选出需要更新时长的视频
      const videosToUpdate = this.videos.filter(video => {
        return video.filePath && 
               video.fileExists !== false && 
               (!video.duration || video.duration === 0)
      })
      
      if (videosToUpdate.length === 0) {
        console.log('✅ 所有视频都有时长信息，无需更新')
        return
      }
      
      console.log(`📊 发现 ${videosToUpdate.length} 个视频需要更新时长`)
      
      // 如果视频数量较多，询问用户是否要批量更新
      if (videosToUpdate.length > 10) {
        const shouldUpdate = confirm(
          `发现 ${videosToUpdate.length} 个视频需要更新时长。\n\n` +
          `这可能需要一些时间，是否要现在更新？\n\n` +
          `点击"确定"开始更新，点击"取消"稍后手动更新。`
        )
        
        if (!shouldUpdate) {
          console.log('⏭️ 用户取消了批量更新')
          this.showToastNotification(
            '已取消更新', 
            `发现 ${videosToUpdate.length} 个视频需要更新时长，您可以稍后手动更新`
          )
          return
        }
      }
      
      let updatedCount = 0
      let failedCount = 0
      
      // 显示更新进度通知
      this.showToastNotification(
        '正在更新视频时长', 
        `发现 ${videosToUpdate.length} 个视频需要更新时长，正在处理中...`
      )
      
      // 批量更新视频时长
      for (const video of videosToUpdate) {
        try {
          console.log(`🔄 正在更新视频时长: ${video.name}`)
          
          const duration = await this.getVideoDuration(video.filePath)
          if (duration > 0) {
            // 更新视频数据
            await this.videoManager.updateVideo(video.id, {
              ...video,
              duration: duration
            })
            
            // 更新本地数据
            video.duration = duration
            updatedCount++
            
            console.log(`✅ 视频时长更新成功: ${video.name} - ${duration} 分钟`)
          } else {
            console.warn(`⚠️ 无法获取视频时长: ${video.name}`)
            failedCount++
          }
        } catch (error) {
          console.error(`❌ 更新视频时长失败: ${video.name}`, error)
          failedCount++
        }
        
        // 添加小延迟，避免过于频繁的操作
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // 重新加载视频列表以保存更改
      await this.videoManager.loadVideos()
      this.videos = this.videoManager.getVideos()
      
      // 显示更新结果
      if (updatedCount > 0) {
        this.showToastNotification(
          '时长更新完成', 
          `成功更新 ${updatedCount} 个视频的时长${failedCount > 0 ? `，${failedCount} 个视频更新失败` : ''}`
        )
      } else if (failedCount > 0) {
        this.showToastNotification(
          '时长更新失败', 
          `所有 ${failedCount} 个视频的时长更新失败，请检查视频文件是否有效`
        )
      }
      
      console.log(`📊 视频时长更新完成: 成功 ${updatedCount} 个，失败 ${failedCount} 个`)
    },

    // 拖拽处理方法
    handleDragOver(event) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    },
    
    handleDragEnter(event) {
      event.preventDefault()
      // 防止子元素触发 dragenter 时重复设置状态
      if (!this.isDragOver) {
        this.isDragOver = true
      }
    },
    
    handleDragLeave(event) {
      event.preventDefault()
      // 只有当离开整个拖拽区域时才取消高亮
      // 检查 relatedTarget 是否存在且不在当前元素内
      if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget)) {
        this.isDragOver = false
      }
    },
    
    async handleDrop(event) {
      event.preventDefault()
      this.isDragOver = false
      
      try {
        const files = Array.from(event.dataTransfer.files)
        
        console.log('=== 拖拽调试信息 ===')
        console.log('拖拽文件数量:', files.length)
        console.log('拖拽文件详细信息:', files.map((f: any) => ({
          name: f.name,
          path: f.path,
          type: f.type,
          size: f.size
        })))
        console.log('当前视频库状态:')
        this.videos.forEach((video, index) => {
          console.log(`  ${index + 1}. ${video.name}`)
          console.log(`     路径: ${video.filePath}`)
          console.log(`     文件存在: ${video.fileExists}`)
        })
        
        if (files.length === 0) {
          this.showNotification('拖拽失败', '请拖拽视频文件到此处')
          return
        }
        
        // 筛选出视频文件
        const videoFiles = files.filter((file:File) => {
          const videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp', '.ogv']
          const fileName = file.name.toLowerCase()
          return videoExtensions.some(ext => fileName.endsWith(ext))
        })
        
        if (videoFiles.length === 0) {
          this.showNotification('拖拽失败', '没有检测到视频文件，请拖拽视频文件（mp4, avi, mkv, mov, wmv, flv, webm, m4v, 3gp, ogv）')
          return
        }
        
        console.log('检测到视频文件数量:', videoFiles.length)
        
        // 批量添加视频文件
        const results = await this.processMultipleVideoFiles(videoFiles)
        
        // 统计结果
        const addedCount = results.filter(r => r.success).length
        const failedCount = results.filter(r => !r.success).length
        
        // 重新加载视频列表
        await this.loadVideos()
        
        // 显示结果通知
        if (addedCount > 0) {
          // 使用通知服务的批量结果处理，会自动显示详细的成功和失败信息
          console.log('显示批量操作结果通知')
          this.showToastNotification('批量添加完成', '', results)
        } else {
          console.log('所有视频文件添加失败，显示失败通知')
          // 收集所有失败原因，添加序号和换行
          const failureReasons = results
            .filter(r => !r.success)
            .map((r, index) => `${index + 1}. "${r.fileName}": ${r.error || '未知错误'}`)
            .join('\n')
          
          this.showToastNotification('添加失败', `所有视频文件添加失败:\n${failureReasons}`, results)
        }
        
      } catch (error) {
        console.error('拖拽添加视频失败:', error)
        
        // 根据错误类型提供更详细的错误信息
        let errorMessage = ''
        if (error.name === 'SecurityError') {
          errorMessage = '安全错误：浏览器阻止了文件访问\n请尝试使用"添加视频"按钮手动选择文件'
        } else if (error.name === 'NotAllowedError') {
          errorMessage = '权限错误：无法访问拖拽的文件\n请检查文件权限或尝试重新拖拽'
        } else if (error.message.includes('path')) {
          errorMessage = `文件路径错误：${error.message}\n请确保文件路径有效且可访问`
        } else if (error.message.includes('size')) {
          errorMessage = `文件大小错误：${error.message}\n请检查文件是否损坏或过大`
        } else if (error.message.includes('format') || error.message.includes('codec')) {
          errorMessage = `视频格式错误：${error.message}\n请检查视频文件是否完整且格式正确`
        } else {
          errorMessage = `未知错误：${error.message}\n请尝试重新拖拽文件或使用"添加视频"按钮`
        }
        
        this.showToastNotification(
          '添加失败', 
          `拖拽添加视频时发生错误\n\n${errorMessage}\n`
        )
      }
    },
    
    // 从文件名提取视频名称（去掉扩展名）
    extractVideoName(fileName) {
      const lastDotIndex = fileName.lastIndexOf('.')
      return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName
    },

    // 批量处理多个视频文件
    async processMultipleVideoFiles(videoFiles) {
      console.log('=== 开始批量处理视频文件 ===')
      console.log('待处理视频文件数量:', videoFiles.length)
      
      const results = []
      
      for (let i = 0; i < videoFiles.length; i++) {
        const videoFile = videoFiles[i]
        console.log(`\n--- 处理视频文件 ${i + 1}/${videoFiles.length} ---`)
        console.log('视频文件信息:', {
          name: videoFile.name,
          path: videoFile.path,
          size: videoFile.size
        })
        
        try {
          // 检查是否已经存在相同的文件路径
          const existingVideoByPath = this.videos.find(video => video.filePath === videoFile.path)
          if (existingVideoByPath) {
            console.log(`视频文件已存在: ${videoFile.name}`)
            results.push({
              success: false,
              fileName: videoFile.name,
              error: `视频文件 "${videoFile.name}" 已经存在`,
              filePath: videoFile.path,
              existingVideoId: existingVideoByPath.id
            })
            continue
          }
          
          // 检查是否存在同名但路径不同的丢失文件
          const existingVideoByName = this.videos.find(video => {
            const videoFileName = video.filePath.split(/[\\/]/).pop().toLowerCase()
            const newFileName = videoFile.name.toLowerCase()
            const isSameName = videoFileName === newFileName
            const isFileMissing = !video.fileExists
            
            console.log(`检查视频: ${video.name}`)
            console.log(`  文件名: ${videoFileName} vs ${newFileName}`)
            console.log(`  是否同名: ${isSameName}`)
            console.log(`  文件存在: ${video.fileExists}`)
            console.log(`  是否丢失: ${isFileMissing}`)
            console.log(`  匹配条件: ${isSameName && isFileMissing}`)
            
            return isSameName && isFileMissing
          })
          
          if (existingVideoByName) {
            console.log(`发现同名丢失文件: ${videoFile.name}`)
            console.log(`现有视频路径: ${existingVideoByName.filePath}`)
            console.log(`新文件路径: ${videoFile.path}`)
            // 显示路径更新确认对话框
            this.pathUpdateInfo = {
              existingVideo: existingVideoByName,
              newPath: videoFile.path,
              newFileName: videoFile.name
            }
            this.showPathUpdateDialog = true
            // 暂停处理，等待用户确认
            return
          }
          
          // 创建新的视频对象
          const video = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: this.extractVideoName(videoFile.name),
            description: '',
            tags: [],
            actors: [],
            series: '',
            duration: 0,
            filePath: videoFile.path,
            thumbnail: '',
            watchCount: 0,
            lastWatched: null,
            addedDate: new Date().toISOString()
          }
          
          console.log('创建视频对象:', video)
          
          // 添加到视频管理器
          if (this.videoManager) {
            await this.videoManager.addVideo(video)
            results.push({
              success: true,
              fileName: videoFile.name,
              video: video
            })
            console.log('视频文件处理成功:', videoFile.name)
          } else {
            results.push({
              success: false,
              fileName: videoFile.name,
              error: '视频管理器不可用',
              filePath: videoFile.path
            })
          }
          
        } catch (error) {
          console.error(`处理视频文件 "${videoFile.name}" 失败:`, error)
          console.error('错误堆栈:', error.stack)
          
          // 根据错误类型提供更具体的错误信息
          let errorMessage = error.message
          if (error.message.includes('ENOENT')) {
            errorMessage = '视频文件不存在或无法访问'
          } else if (error.message.includes('EACCES')) {
            errorMessage = '没有访问权限'
          } else if (error.message.includes('EMFILE') || error.message.includes('ENFILE')) {
            errorMessage = '打开文件过多，请稍后重试'
          } else if (error.message.includes('timeout')) {
            errorMessage = '操作超时'
          } else if (error.message.includes('Invalid path')) {
            errorMessage = '无效的视频文件路径'
          }
          
          results.push({
            success: false,
            fileName: videoFile.name,
            error: errorMessage,
            filePath: videoFile.path,
            originalError: error.message
          })
        }
      }
      
      console.log('\n=== 批量处理完成 ===')
      console.log('处理结果统计:', {
        总数: results.length,
        成功: results.filter(r => r.success).length,
        失败: results.filter(r => !r.success).length
      })
      
      return results
    },

    showAddVideoDialog() {
      this.resetNewVideo()
      this.showAddDialog = true
    },

    closeAddVideoDialog() {
      this.showAddDialog = false
      this.resetNewVideo()
    },

    resetNewVideo() {
      this.newVideo = {
        name: '',
        description: '',
        tags: [],
        actors: [],
        series: '',
        duration: 0,
        filePath: '',
        thumbnail: ''
      }
      this.actorsInput = ''
      this.tagsInput = ''
    },

    parseActors() {
      if (this.actorsInput.trim()) {
        this.newVideo.actors = this.actorsInput.split(',').map(actor => actor.trim()).filter(actor => actor)
      }
    },

    addTag() {
      const tag = this.tagsInput.trim()
      if (tag && !this.newVideo.tags.includes(tag)) {
        this.newVideo.tags.push(tag)
        this.tagsInput = ''
      }
    },
    removeTag(index) {
      this.newVideo.tags.splice(index, 1)
    },

    async selectVideoFile() {
      try {
        const filePath = await window.electronAPI.selectVideoFile()
        if (filePath) {
          this.newVideo.filePath = filePath
          if (!this.newVideo.name || !this.newVideo.name.trim()) {
            this.newVideo.name = this.extractNameFromPath(filePath)
          }
          
          // 自动获取视频时长
          try {
            console.log('🔄 开始获取视频时长...')
            const duration = await this.getVideoDuration(filePath)
            if (duration > 0) {
              this.newVideo.duration = duration
              console.log('✅ 视频时长获取成功:', duration, '分钟')
            }
          } catch (e) {
            console.warn('获取视频时长失败:', e)
          }
          
          // 自动生成缩略图（若未手动设置）
          if (!this.newVideo.thumbnail || !this.newVideo.thumbnail.trim()) {
            try {
              console.log('🔄 开始自动生成缩略图...')
              const thumb = await this.generateThumbnail(filePath, this.newVideo.name)
              console.log('🔄 缩略图生成结果:', thumb)
              if (thumb) {
                this.newVideo.thumbnail = thumb
                console.log('✅ 缩略图已设置到表单:', this.newVideo.thumbnail)
              }
            } catch (e) {
              console.warn('自动生成缩略图失败:', e)
            }
          }
        }
      } catch (error) {
        console.error('选择视频文件失败:', error)
      }
    },

    async selectThumbnailFile() {
      try {
        const filePath = await window.electronAPI.selectImageFile()
        if (filePath) {
          this.newVideo.thumbnail = filePath
        }
      } catch (error) {
        console.error('选择缩略图失败:', error)
      }
    },

    async addVideo() {
      if (!this.newVideo.name || !this.newVideo.name.trim()) {
        if (this.newVideo.filePath) {
          this.newVideo.name = this.extractNameFromPath(this.newVideo.filePath)
        }
      }
      if (!this.newVideo.name || !this.newVideo.name.trim()) {
        alert('请至少选择一个视频文件或填写名称')
        return
      }

      this.parseActors()

      try {
        // 若未设置缩略图且存在视频文件，尝试生成一张
        if ((!this.newVideo.thumbnail || !this.newVideo.thumbnail.trim()) && this.newVideo.filePath) {
          try {
            const thumb = await this.generateThumbnail(this.newVideo.filePath, this.newVideo.name)
            if (thumb) this.newVideo.thumbnail = thumb
          } catch (e) {
            console.warn('生成缩略图失败，跳过:', e)
          }
        }
        await this.videoManager.addVideo(this.newVideo)
        await this.loadVideos()
        this.closeAddVideoDialog()
        
        // 成功时使用 toast 通知
        this.showToastNotification('添加成功', `视频 "${this.newVideo.name}" 已成功添加`)
      } catch (error) {
        console.error('添加视频失败:', error)
        this.showToastNotification('添加失败', `添加视频失败: ${error.message}`)
      }
    },

    showVideoDetail(video) {
      this.selectedVideo = video
      this.showDetailDialog = true
    },

    closeVideoDetail() {
      this.showDetailDialog = false
      this.selectedVideo = null
    },
    handleDetailAction(actionKey, video) {
      switch (actionKey) {
        case 'play':
          this.playVideo(video)
          break
        case 'updateDuration':
          this.updateVideoDuration(video)
          break
        case 'folder':
          this.openVideoFolder(video)
          break
        case 'edit':
          this.editVideo(video)
          break
        case 'remove':
          this.deleteVideo(video)
          break
      }
    },

    async playVideo(video) {
      if (!video.filePath) {
        this.showToastNotification('播放失败', '视频文件路径不存在')
        return
      }

      // 检查视频文件是否存在
      if (video.fileExists === false) {
        this.showToastNotification('播放失败', `视频文件不存在: ${video.name}`)
        return
      }

      try {
        // 获取当前设置
        const settings = await this.loadSettings()
        console.log('当前视频播放设置:', settings)
        console.log('videoPlayMode:', settings.videoPlayMode)
        
        if (settings.videoPlayMode === 'internal') {
          console.log('使用内部播放器播放视频')
          // 在本应用新窗口中播放
          await this.playVideoInternal(video)
        } else {
          console.log('使用外部播放器播放视频')
          // 使用外部默认播放器
          await this.playVideoExternal(video)
        }
        
        await this.videoManager.incrementWatchCount(video.id)
        await this.loadVideos()
      } catch (error) {
        console.error('播放视频失败:', error)
        this.showToastNotification('播放失败', `播放视频失败: ${error.message}`)
      }
    },

    editVideo(video) {
      if (!video) return
      this.showDetailDialog = false
      this.editVideoForm = {
        id: video.id,
        name: video.name || '',
        description: video.description || '',
        tags: Array.isArray(video.tags) ? [...video.tags] : [],
        actors: Array.isArray(video.actors) ? [...video.actors] : [],
        series: video.series || '',
        duration: Number(video.duration) || 0,
        filePath: video.filePath || '',
        thumbnail: video.thumbnail || ''
      }
      this.editActorsInput = (this.editVideoForm.actors || []).join(', ')
      this.editTagsInput = ''
      this.showEditDialog = true
    },
    closeEditDialog() {
      this.showEditDialog = false
    },
    parseEditActors() {
      if (this.editActorsInput && this.editActorsInput.trim()) {
        this.editVideoForm.actors = this.editActorsInput.split(',').map(s => s.trim()).filter(Boolean)
      } else {
        this.editVideoForm.actors = []
      }
    },
    addEditTag() {
      const tag = this.editTagsInput.trim()
      if (tag && !this.editVideoForm.tags.includes(tag)) {
        this.editVideoForm.tags.push(tag)
        this.editTagsInput = ''
      }
    },
    removeEditTag(index) {
      this.editVideoForm.tags.splice(index, 1)
    },
    async browseEditVideoFile() {
      try {
        const filePath = await window.electronAPI.selectVideoFile()
        if (filePath) {
          this.editVideoForm.filePath = filePath
        }
      } catch (e) {
        console.error('选择视频文件失败:', e)
      }
    },
    async browseEditThumbnailFile() {
      try {
        const filePath = await window.electronAPI.selectImageFile()
        if (filePath) {
          this.editVideoForm.thumbnail = filePath
        }
      } catch (e) {
        console.error('选择缩略图失败:', e)
      }
    },
     async randomizeThumbnail() {
       try {
         if (!this.editVideoForm.filePath) {
           alert('请先选择视频文件')
           return
         }
         
         console.log('=== 开始生成随机封面 ===')
         console.log('视频文件路径:', this.editVideoForm.filePath)
         console.log('视频名称:', this.editVideoForm.name)
         console.log('当前缩略图:', this.editVideoForm.thumbnail)
         console.log('路径类型:', typeof this.editVideoForm.filePath)
         console.log('路径长度:', this.editVideoForm.filePath.length)
         
         const thumb = await this.generateThumbnail(
           this.editVideoForm.filePath, 
           this.editVideoForm.name, 
           this.editVideoForm.thumbnail
         )
         console.log('🔄 随机封面生成结果:', thumb)
         if (thumb) {
           console.log('✅ 缩略图生成成功，路径:', thumb)
           console.log('🔄 设置前 editVideoForm.thumbnail:', this.editVideoForm.thumbnail)
           this.editVideoForm.thumbnail = thumb
           console.log('🔄 设置后 editVideoForm.thumbnail:', this.editVideoForm.thumbnail)
           
           // 强制清除缓存，确保新生成的缩略图能正确显示
           this.thumbnailUrlCache.delete(thumb)
           
           // 强制更新视图
           this.$nextTick(() => {
             this.$forceUpdate()
           })
           
           // 缩略图生成成功时不显示通知，只在控制台记录
           console.log('缩略图生成成功，已更新预览')
         } else {
           console.warn('⚠️ 缩略图生成失败')
           // 检查文件扩展名，给出更友好的提示
           const extension = this.editVideoForm.filePath.toLowerCase().split('.').pop()
           const supportedFormats = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'flv', 'wmv']
           
           let errorMessage = ''
           if (!supportedFormats.includes(extension)) {
             errorMessage = `不支持的视频格式 "${extension}"。支持的格式：${supportedFormats.join(', ')}`
           } else {
             errorMessage = '可能的原因：视频编码格式不被浏览器支持、视频文件损坏或无法访问、文件路径包含特殊字符。建议尝试使用其他视频文件或手动选择缩略图图片。'
           }
           
           // 使用 toast 通知显示错误
           this.showToastNotification('缩略图生成失败', errorMessage)
         }
       } catch (e) {
         console.error('❌ 随机封面失败:', e)
         console.error('错误堆栈:', e.stack)
         console.error('错误类型:', e.constructor.name)
         
         // 使用 toast 通知显示错误
         this.showToastNotification('缩略图生成失败', `生成过程中发生错误: ${e.message}`)
       }
     },
    async saveEditedVideo() {
      try {
        this.parseEditActors()
        const payload = {
          name: (this.editVideoForm.name || '').trim(),
          description: (this.editVideoForm.description || '').trim(),
          tags: this.editVideoForm.tags,
          actors: this.editVideoForm.actors,
          series: (this.editVideoForm.series || '').trim(),
          duration: Number(this.editVideoForm.duration) || 0,
          filePath: (this.editVideoForm.filePath || '').trim(),
          thumbnail: (this.editVideoForm.thumbnail || '').trim()
        }
        await this.videoManager.updateVideo(this.editVideoForm.id, payload)
        await this.loadVideos()
        this.showEditDialog = false
      } catch (e) {
        console.error('保存编辑失败:', e)
        alert('保存编辑失败: ' + e.message)
      }
    },

    async deleteVideo(video) {
      if (!confirm(`确定要删除视频 "${video.name}" 吗？`)) return
      
      try {
        await this.videoManager.deleteVideo(video.id)
        await this.loadVideos()
        
        // 显示删除成功通知
        this.showToastNotification('删除成功', `已成功删除视频 "${video.name}"`)
        console.log('视频删除成功:', video.name)
        
        this.closeVideoDetail()
      } catch (error) {
        console.error('删除视频失败:', error)
        // 显示删除失败通知
        this.showToastNotification('删除失败', `无法删除视频 "${video.name}": ${error.message}`)
      }
    },

    /**
     * 右键菜单点击事件处理
     * @param {*} data - 包含 item 和 selectedItem
     */
    handleContextMenuClick(data) {
      const { item, selectedItem } = data
      if (!selectedItem) return
      
      switch (item.key) {
        case 'detail':
          this.showVideoDetail(selectedItem)
          break
        case 'play':
          this.playVideo(selectedItem)
          break
        case 'folder':
          this.openVideoFolder(selectedItem)
          break
        case 'edit':
          this.editVideo(selectedItem)
          break
        case 'remove':
          this.deleteVideo(selectedItem)
          break
      }
    },
    
    // 处理空状态按钮点击事件
    handleEmptyStateAction(actionName) {
      if (actionName === 'showAddVideoDialog') {
        this.showAddVideoDialog()
      }
    },
    
    // 处理搜索查询变化
    handleSearchQueryChanged(newValue) {
      this.searchQuery = newValue
    },
    
    // 处理排序变化
    handleSortByChanged(newValue) {
      this.sortBy = newValue
      console.log('✅ VideoView 排序方式已更新:', newValue)
    },

    /**
     * 获取缩略图的显示URL
     * 支持多种格式：base64 dataURL、本地文件路径、HTTP URL
     * 
     * @param {string} thumbnail - 缩略图数据，可能是：
     *   - base64 dataURL: "data:image/jpeg;base64,/9j/4AAQ..."
     *   - 相对路径: "SaveData/Video/Covers/video_123.jpg"
     *   - 绝对路径: "E:/app/SaveData/Video/Covers/video_123.jpg"
     *   - HTTP URL: "https://example.com/image.jpg"
     * @returns {string} 可用于img标签src属性的URL
     */
    getThumbnailUrl(thumbnail) {
      // 1. 空值检查：如果没有缩略图，返回默认图标
      if (!thumbnail) {
        return './default-video.svg' // 使用相对路径的默认图标
      }
      
      // 2. 缓存检查：如果已经处理过这个缩略图，直接返回缓存结果
      if (this.thumbnailUrlCache.has(thumbnail)) {
        return this.thumbnailUrlCache.get(thumbnail)
      }
      
      // 3. 格式判断：只处理本地文件路径，其他格式直接返回
      // 这里使用排除法：
      // - !thumbnail.startsWith('data:') 排除 base64 dataURL
      // - !thumbnail.startsWith('/') 排除绝对路径（以/开头）
      // - !thumbnail.startsWith('http') 排除 HTTP/HTTPS URL
      // 这样只有本地文件路径（如 SaveData/... 或 E:/...）会进入处理逻辑
      if (thumbnail && !thumbnail.startsWith('data:') && !thumbnail.startsWith('/') && !thumbnail.startsWith('http')) {
        // 本地文件路径，需要转换为浏览器可访问的 file:// URL
        try {
          let url = ''
          
          // 4. 路径类型判断：区分相对路径和绝对路径
          if (thumbnail.startsWith('SaveData/')) {
            // 4.1 相对路径处理（以 SaveData 开头）
            // 在 Electron 应用中，相对路径是相对于应用的工作目录
            // 例如：SaveData/Video/Covers/video_123.jpg
            
            // 统一路径分隔符：将 Windows 的反斜杠转换为正斜杠
            const absolutePath = thumbnail.replace(/\\/g, '/')
            console.log('处理相对路径:', absolutePath)
            
            // 构建 file:// URL
            // 对路径的每个部分进行 URL 编码，处理特殊字符
            const encoded = absolutePath.split('/').map(seg => {
              return encodeURIComponent(seg)
            }).join('/')
            
            // 构建 file:// URL 格式
            // 格式：file:///SaveData/Video/Covers/video_123.jpg
            url = 'file:///' + encoded
            // console.log('尝试路径格式1:', url)
          } else {
            // 4.2 绝对路径处理（如 E:/app/SaveData/...）
            // 将 Windows 路径格式转换为 file:// URL 格式
            
            // 标准化路径：统一使用正斜杠，并处理盘符
            // 例如：E:\app\SaveData\... -> /E/app/SaveData/...
            const normalized = thumbnail.replace(/\\/g, '/').replace(/^([A-Za-z]:)/, '/$1')
            
            // URL 编码每个路径段
            const encoded = normalized.split('/').map(seg => {
              if (seg.includes(':')) return seg // 保留盘符部分（如 /E:）
              return encodeURIComponent(seg)
            }).join('/')
            
            // 构建 file:// URL
            // 格式：file:///E/app/SaveData/Video/Covers/video_123.jpg
            url = 'file://' + encoded
          }
          
          // 5. 缓存结果：将处理后的 URL 缓存起来，避免重复计算
          this.thumbnailUrlCache.set(thumbnail, url)
          console.log('缩略图 URL:', url)
          return url
        } catch (error) {
          console.error('转换缩略图路径失败:', error)
          return './default-video.svg'
        }
      }
      
      // 6. 直接返回：对于 base64 dataURL、HTTP URL 等格式，直接返回原值
      // 这些格式浏览器可以直接使用，无需转换
      return thumbnail
    },

    /**
     * 异步获取缩略图的显示URL（增强版）
     * 优先使用 Electron API 来正确处理文件路径，提供更好的兼容性
     * 
     * @param {string} thumbnail - 缩略图数据
     * @returns {Promise<string>} 可用于img标签src属性的URL
     */
    async getThumbnailUrlAsync(thumbnail) {
      // 1. 空值检查
      if (!thumbnail) {
        return './default-video.svg' // 默认图标
      }
      
      // 2. 缓存检查：避免重复的异步操作
      if (this.thumbnailUrlCache.has(thumbnail)) {
        return this.thumbnailUrlCache.get(thumbnail)
      }
      
      // 3. 格式判断：只处理本地文件路径
      if (thumbnail && !thumbnail.startsWith('data:') && !thumbnail.startsWith('/') && !thumbnail.startsWith('http')) {
        // 本地文件路径，使用 Electron API 进行异步处理
        try {
          // 4. 优先方案：使用 readFileAsDataUrl API
          // 将本地文件读取为 base64 dataURL，这是最可靠的方式
          if (window.electronAPI && window.electronAPI.readFileAsDataUrl) {
            const dataUrl = await window.electronAPI.readFileAsDataUrl(thumbnail)
            if (dataUrl) {
              console.log('通过 readFileAsDataUrl 获取缩略图:', dataUrl.substring(0, 50) + '...')
              this.thumbnailUrlCache.set(thumbnail, dataUrl)
              return dataUrl
            }
          }
          
          // 5. 降级方案1：使用 getFileUrl API
          // 获取正确的 file:// URL，由 Electron 主进程处理路径转换
          if (window.electronAPI && window.electronAPI.getFileUrl) {
            const result = await window.electronAPI.getFileUrl(thumbnail)
            if (result.success) {
              console.log('通过 Electron API 获取文件 URL:', result.url)
              this.thumbnailUrlCache.set(thumbnail, result.url)
              return result.url
            } else {
              console.warn('Electron API 获取文件 URL 失败:', result.error)
            }
          }
          
          // 6. 降级方案2：使用同步方法
          // 如果 Electron API 不可用，回退到同步的路径转换方法
          const url = this.getThumbnailUrl(thumbnail)
          this.thumbnailUrlCache.set(thumbnail, url)
          return url
        } catch (error) {
          console.error('转换缩略图路径失败:', error)
          return './default-video.svg'
        }
      }
      
      // 7. 直接返回：对于 base64 dataURL、HTTP URL 等格式，直接返回原值
      return thumbnail
    },

    resolveThumbnail(thumbnail) {
      // 保持向后兼容，直接返回缩略图路径
      return thumbnail || '/icon.svg'
    },

    /**
     * 处理缩略图加载失败的情况
     * 当同步方法生成的 file:// URL 无法访问时，尝试使用异步方法重新获取
     * 
     * @param {Event} event - 图片加载错误事件
     */
    async handleThumbnailError(event) {
      console.log('缩略图加载失败，尝试使用异步方法')
      
      // 1. 获取原始缩略图路径
      // 从 data-original-src 属性中获取未处理的原始路径
      const originalSrc = event.target.getAttribute('data-original-src')
      
      // 2. 检查是否为本地文件路径
      // 只对本地文件路径进行异步重试，其他格式（base64、HTTP）直接使用默认图标
      if (originalSrc && !originalSrc.startsWith('data:') && !originalSrc.startsWith('/') && !originalSrc.startsWith('http')) {
        try {
          // 3. 使用异步方法重新获取正确的 URL
          // 异步方法会尝试使用 Electron API 来正确处理文件路径
          const asyncUrl = await this.getThumbnailUrlAsync(originalSrc)
          
          // 4. 检查异步方法是否成功获取到有效的 URL
          if (asyncUrl && asyncUrl !== '/icon.svg') {
            console.log('异步方法获取到缩略图 URL:', asyncUrl)
            // 更新图片的 src 属性，触发重新加载
            event.target.src = asyncUrl
            return
          }
        } catch (error) {
          console.error('异步获取缩略图失败:', error)
        }
      }
      
      // 5. 降级处理：如果异步方法也失败，使用默认图标
      console.log('使用默认图标')
      event.target.src = './default-video.svg'
    },

    async onThumbnailLoad(event) {
      // 缩略图加载成功时的处理
      console.log('缩略图加载成功')
    },

    formatLastWatched(dateString) {
      if (!dateString) return '从未观看'
      
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) return '昨天'
      if (diffDays < 7) return `${diffDays}天前`
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)}周前`
      if (diffDays < 365) return `${Math.ceil(diffDays / 30)}个月前`
      return `${Math.ceil(diffDays / 365)}年前`
    },

    formatAddedDate(dateString) {
      if (!dateString) return ''
      
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return '今天'
      if (diffDays === 1) return '昨天'
      if (diffDays < 7) return `${diffDays}天前`
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)}周前`
      if (diffDays < 365) return `${Math.ceil(diffDays / 30)}个月前`
      return `${Math.ceil(diffDays / 365)}年前`
    },

    formatFirstWatched(dateString) {
      if (!dateString) return '从未观看'
      
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return '今天'
      if (diffDays === 1) return '昨天'
      if (diffDays < 7) return `${diffDays}天前`
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)}周前`
      if (diffDays < 365) return `${Math.ceil(diffDays / 30)}个月前`
      return `${Math.ceil(diffDays / 365)}年前`
    },

    formatDuration(minutes) {
      if (!minutes || minutes === 0) return '未知时长'
      
      // 将分钟转换为秒
      const totalSeconds = Math.floor(minutes * 60)
      const hours = Math.floor(totalSeconds / 3600)
      const mins = Math.floor((totalSeconds % 3600) / 60)
      const secs = totalSeconds % 60
      
      if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      } else {
        return `${mins}:${secs.toString().padStart(2, '0')}`
      }
    },

    // 从路径提取不带扩展名的文件名
    extractNameFromPath(filePath) {
      if (!filePath) return ''
      const normalized = filePath.replace(/\\/g, '/')
      const filename = normalized.substring(normalized.lastIndexOf('/') + 1)
      const dotIndex = filename.lastIndexOf('.')
      return dotIndex > 0 ? filename.substring(0, dotIndex) : filename
    },

    // 打开视频文件夹
    async openVideoFolder(video) {
      try {
        if (!video.filePath) {
          alert('视频文件路径不存在')
          return
        }
        
        if (window.electronAPI && window.electronAPI.openFileFolder) {
          const result = await window.electronAPI.openFileFolder(video.filePath)
          if (result.success) {
            console.log('已打开视频文件夹:', result.folderPath)
          } else {
            console.error('打开文件夹失败:', result.error)
            alert(`打开文件夹失败: ${result.error}`)
          }
        } else {
          // 降级处理：在浏览器中显示路径
          alert(`视频文件位置:\n${video.filePath}`)
        }
      } catch (error) {
        console.error('打开视频文件夹失败:', error)
        alert(`打开文件夹失败: ${error.message}`)
      }
    },

    // 更新视频时长
    async updateVideoDuration(video) {
      try {
        if (!video.filePath) {
          this.showToastNotification('更新失败', '视频文件路径不存在')
          return
        }

        console.log('🔄 开始更新视频时长:', video.name)

        const duration = await this.getVideoDuration(video.filePath)
        if (duration > 0) {
          // 更新视频数据
          await this.videoManager.updateVideo(video.id, {
            ...video,
            duration: duration
          })
          
          // 重新加载视频列表
          await this.loadVideos()
          
          console.log('✅ 视频时长更新成功:', duration, '分钟')
          // 成功时不显示通知，只在控制台记录
        } else {
          console.warn('⚠️ 无法获取视频时长')
          this.showToastNotification('更新失败', '无法获取视频时长，请检查视频文件是否有效')
        }
      } catch (error) {
        console.error('更新视频时长失败:', error)
        this.showToastNotification('更新失败', `更新视频时长失败: ${error.message}`)
      }
    },

    // 手动批量更新所有未知时长的视频
    async batchUpdateAllDurations() {
      console.log('🔄 开始手动批量更新所有视频时长...')
      
      // 筛选出需要更新时长的视频
      const videosToUpdate = this.videos.filter(video => {
        return video.filePath && 
               video.fileExists !== false && 
               (!video.duration || video.duration === 0)
      })
      
      if (videosToUpdate.length === 0) {
        this.showToastNotification('无需更新', '所有视频都有时长信息')
        return
      }
      
      const shouldUpdate = confirm(
        `发现 ${videosToUpdate.length} 个视频需要更新时长。\n\n` +
        `这可能需要一些时间，是否要开始更新？\n\n` +
        `点击"确定"开始更新，点击"取消"取消操作。`
      )
      
      if (!shouldUpdate) {
        console.log('⏭️ 用户取消了批量更新')
        return
      }
      
      let updatedCount = 0
      let failedCount = 0
      
      // 显示更新进度通知
      this.showToastNotification(
        '正在批量更新视频时长', 
        `正在更新 ${videosToUpdate.length} 个视频的时长，请稍候...`
      )
      
      // 批量更新视频时长
      for (const video of videosToUpdate) {
        try {
          console.log(`🔄 正在更新视频时长: ${video.name}`)
          
          const duration = await this.getVideoDuration(video.filePath)
          if (duration > 0) {
            // 更新视频数据
            await this.videoManager.updateVideo(video.id, {
              ...video,
              duration: duration
            })
            
            // 更新本地数据
            video.duration = duration
            updatedCount++
            
            console.log(`✅ 视频时长更新成功: ${video.name} - ${duration} 分钟`)
          } else {
            console.warn(`⚠️ 无法获取视频时长: ${video.name}`)
            failedCount++
          }
        } catch (error) {
          console.error(`❌ 更新视频时长失败: ${video.name}`, error)
          failedCount++
        }
        
        // 添加小延迟，避免过于频繁的操作
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // 重新加载视频列表以保存更改
      await this.videoManager.loadVideos()
      this.videos = this.videoManager.getVideos()
      
      // 显示更新结果
      if (updatedCount > 0) {
        this.showToastNotification(
          '批量更新完成', 
          `成功更新 ${updatedCount} 个视频的时长${failedCount > 0 ? `，${failedCount} 个视频更新失败` : ''}`
        )
      } else if (failedCount > 0) {
        this.showToastNotification(
          '批量更新失败', 
          `所有 ${failedCount} 个视频的时长更新失败，请检查视频文件是否有效`
        )
      }
      
      console.log(`📊 批量视频时长更新完成: 成功 ${updatedCount} 个，失败 ${failedCount} 个`)
    },

     // 获取视频时长
     async getVideoDuration(filePath) {
       return new Promise(async (resolve, reject) => {
         try {
           if (!filePath) {
             console.warn('⚠️ getVideoDuration: 文件路径为空')
             return resolve(0)
           }
           
           console.log('🔍 getVideoDuration 开始处理:', filePath)
           
           let src = filePath
           // 优先通过 getFileUrl 生成可加载的 file:// 或安全映射 URL
           if (window.electronAPI && window.electronAPI.getFileUrl) {
             try {
               console.log('📡 调用 getFileUrl API...')
               const result = await window.electronAPI.getFileUrl(filePath)
               if (result && result.success && result.url && result.url.startsWith('file://')) {
                 src = result.url
                 console.log('✅ 使用 getFileUrl 生成的 URL:', src)
               } else {
                 console.warn('⚠️ getFileUrl 返回格式不正确:', result)
                 src = this.buildFileUrl(filePath)
               }
             } catch (e) {
               console.warn('⚠️ getFileUrl 调用失败:', e)
               src = this.buildFileUrl(filePath)
             }
           } else {
             console.warn('⚠️ getFileUrl API 不可用，使用降级方案')
             src = this.buildFileUrl(filePath)
           }

           console.log('🎬 创建 video 元素获取时长，src:', src)
           const video = document.createElement('video')
           video.style.position = 'fixed'
           video.style.left = '-9999px'
           video.style.top = '-9999px'
           video.muted = true
           video.preload = 'metadata'
           video.crossOrigin = 'anonymous'
           video.src = src

           // 设置超时，避免长时间等待
           const timeout = setTimeout(() => {
             console.warn('⏰ 视频时长获取超时')
             cleanup()
             resolve(0)
           }, 5000) // 5秒超时

           const onError = (e) => {
             console.error('❌ 视频加载错误:', e)
             cleanup()
             resolve(0)
           }

           const cleanup = () => {
             clearTimeout(timeout)
             console.log('🧹 清理 video 元素和事件监听器')
             video.removeEventListener('error', onError)
             video.removeEventListener('loadedmetadata', onLoadedMeta)
             try { 
               video.pause() 
               if (video.parentNode) {
                 video.parentNode.removeChild(video)
               }
             } catch (e) {
               console.warn('清理 video 元素时出错:', e)
             }
           }

           const onLoadedMeta = () => {
             try {
               console.log('📊 视频元数据加载完成')
               console.log('⏱️ 视频时长:', video.duration)
               
               const duration = Math.max(0, Number(video.duration) || 0)
               const durationMinutes = duration / 60 // 保持小数精度
               
               console.log('✅ 视频时长获取成功:', durationMinutes, '分钟')
               cleanup()
               resolve(durationMinutes)
             } catch (err) {
               console.error('❌ 获取视频时长时出错:', err)
               cleanup()
               resolve(0)
             }
           }

           video.addEventListener('error', onError)
           video.addEventListener('loadedmetadata', onLoadedMeta, { once: true })

           // 将元素附加到文档，确保某些浏览器能正确触发事件
           document.body.appendChild(video)
           console.log('📎 Video 元素已添加到文档')
         } catch (e) {
           console.error('❌ getVideoDuration 外层错误:', e)
           resolve(0)
         }
       })
     },

     // 生成视频缩略图：从视频随机时间截取一帧，保存为本地文件并返回文件路径
     async generateThumbnail(filePath, videoName = null, existingThumbnail = null) {
       return new Promise(async (resolve, reject) => {
         try {
           if (!filePath) {
             console.warn('⚠️ generateThumbnail: 文件路径为空')
             return resolve(null)
           }
           
           console.log('🔍 generateThumbnail 开始处理:', filePath)
           
           // 检查文件扩展名，跳过可能不支持的格式
           const extension = filePath.toLowerCase().split('.').pop()
           const supportedFormats = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'flv', 'wmv']
           if (!supportedFormats.includes(extension)) {
             console.warn('⚠️ 不支持的视频格式:', extension)
             return resolve(null)
           }
           
           let src = filePath
           // 优先通过 getFileUrl 生成可加载的 file:// 或安全映射 URL
           if (window.electronAPI && window.electronAPI.getFileUrl) {
             try {
               console.log('📡 调用 getFileUrl API...')
               const result = await window.electronAPI.getFileUrl(filePath)
               console.log('📡 getFileUrl 返回:', result)
               if (result && result.success && result.url && result.url.startsWith('file://')) {
                 src = result.url
                 console.log('✅ 使用 getFileUrl 生成的 URL:', src)
               } else {
                 console.warn('⚠️ getFileUrl 返回格式不正确:', result)
                 // 手动构建 file:// URL
                 src = this.buildFileUrl(filePath)
               }
             } catch (e) {
               console.warn('⚠️ getFileUrl 调用失败:', e)
               // 降级：手动构建 file:// URL
               src = this.buildFileUrl(filePath)
             }
           } else {
             console.warn('⚠️ getFileUrl API 不可用，使用降级方案')
             src = this.buildFileUrl(filePath)
           }

           console.log('🎬 创建 video 元素，src:', src)
           const video = document.createElement('video')
           video.style.position = 'fixed'
           video.style.left = '-9999px'
           video.style.top = '-9999px'
           video.muted = true
           video.preload = 'metadata'
           video.crossOrigin = 'anonymous'
           video.src = src

           // 设置超时，避免长时间等待
           const timeout = setTimeout(() => {
             console.warn('⏰ 视频加载超时')
             cleanup()
             resolve(null) // 超时返回 null 而不是 reject
           }, 10000) // 10秒超时

           const onError = (e) => {
             console.error('❌ 视频加载错误:', e)
             console.error('❌ 错误详情:', {
               error: e,
               code: video.error?.code,
               message: video.error?.message,
               src: video.src,
               networkState: video.networkState,
               readyState: video.readyState
             })
             
             // 检查是否是解码器不支持的错误
             if (video.error?.code === 4 || video.error?.message?.includes('DECODER_ERROR_NOT_SUPPORTED')) {
               console.warn('⚠️ 视频格式不被浏览器支持，跳过缩略图生成')
               cleanup()
               resolve(null) // 返回 null 而不是 reject，让调用方知道生成失败但不影响整体流程
             } else {
               cleanup()
               resolve(null) // 其他错误也返回 null
             }
           }

           const cleanup = () => {
             clearTimeout(timeout)
             console.log('🧹 清理 video 元素和事件监听器')
             video.removeEventListener('error', onError)
             video.removeEventListener('loadedmetadata', onLoadedMeta)
             video.removeEventListener('seeked', onSeeked)
             try { 
               video.pause() 
               if (video.parentNode) {
                 video.parentNode.removeChild(video)
               }
             } catch (e) {
               console.warn('清理 video 元素时出错:', e)
             }
           }

           const onSeeked = () => {
             try {
               console.log('🎯 视频定位完成，开始截取帧...')
               console.log('📐 视频尺寸:', video.videoWidth, 'x', video.videoHeight)
               console.log('⏰ 当前时间:', video.currentTime)
               
               const canvas = document.createElement('canvas')
               const width = Math.min(800, video.videoWidth || 800)
               const height = Math.floor((video.videoHeight || 450) * (width / (video.videoWidth || 800)))
               canvas.width = width
               canvas.height = height
               console.log('🖼️ Canvas 尺寸:', width, 'x', height)
               
               const ctx = canvas.getContext('2d')
               ctx.drawImage(video, 0, 0, width, height)
               const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
               console.log('✅ 缩略图生成成功，dataURL 长度:', dataUrl.length)
               
               // 保存为本地文件
               const saveThumbnailFile = async () => {
                 try {
                   // 生成新的缩略图文件名
                   const filename = await this.generateThumbnailFilename(videoName, filePath)
                   
                   // 删除旧的缩略图文件
                   if (existingThumbnail && existingThumbnail.trim()) {
                     await this.deleteOldThumbnail(existingThumbnail)
                   }
                  
                   const savedPath = await saveManager.saveThumbnail('videos', filename, dataUrl)
                   
                   if (savedPath) {
                     console.log('✅ 缩略图保存为本地文件:', savedPath)
                     cleanup()
                     resolve(savedPath)
                   } else {
                     console.warn('⚠️ 缩略图保存失败，返回 dataURL')
                     cleanup()
                     resolve(dataUrl)
                   }
                 } catch (saveError) {
                   console.error('❌ 保存缩略图文件失败:', saveError)
                   console.warn('⚠️ 降级返回 dataURL')
                   cleanup()
                   resolve(dataUrl)
                 }
               }
               
               // 异步保存文件
               saveThumbnailFile()
               
             } catch (err) {
               console.error('❌ 截取帧时出错:', err)
               cleanup()
               resolve(null) // 截取失败也返回 null
             }
           }

           const onLoadedMeta = () => {
             try {
               console.log('📊 视频元数据加载完成')
               console.log('⏱️ 视频时长:', video.duration)
               console.log('📐 视频尺寸:', video.videoWidth, 'x', video.videoHeight)
               
               const duration = Math.max(0, Number(video.duration) || 0)
               // 在 5% - 80% 之间取一帧，避免黑屏开头或片尾
               const start = duration * 0.05
               const end = duration * 0.8
               const target = isFinite(duration) && duration > 0 ? (start + Math.random() * (end - start)) : 1.0
               
               console.log('🎯 目标时间:', target, '(范围:', start, '-', end, ')')
               video.currentTime = target
             } catch (err) {
               console.error('❌ 设置视频时间时出错:', err)
               cleanup()
               resolve(null) // 设置时间失败也返回 null
             }
           }

           video.addEventListener('error', onError)
           video.addEventListener('loadedmetadata', onLoadedMeta, { once: true })
           video.addEventListener('seeked', onSeeked, { once: true })

           // 将元素附加到文档，确保某些浏览器能正确触发事件
           document.body.appendChild(video)
           console.log('📎 Video 元素已添加到文档')
         } catch (e) {
           console.error('❌ generateThumbnail 外层错误:', e)
           resolve(null) // 外层错误也返回 null
         }
       })
     },

    // 构建文件URL的辅助方法
    buildFileUrl(filePath) {
      try {
        // 将反斜杠转换为正斜杠，并确保路径以 / 开头
        const normalized = filePath.replace(/\\/g, '/').replace(/^([A-Za-z]:)/, '/$1')
        // 对路径进行编码，处理中文和特殊字符
        const encoded = normalized.split('/').map(seg => {
          if (seg.includes(':')) {
            // 处理 Windows 盘符（如 C:）
            return seg
          }
          return encodeURIComponent(seg)
        }).join('/')
        const fileUrl = 'file://' + encoded
        console.log('🔧 手动构建的 file:// URL:', fileUrl)
        return fileUrl
      } catch (e) {
        console.error('构建文件URL失败:', e)
        return filePath // 降级返回原始路径
      }
    },

    // 生成缩略图文件名：视频名+cover+_序号
    async generateThumbnailFilename(videoName, filePath) {
      try {
        // 如果没有提供视频名，从文件路径提取
        let name = videoName
        if (!name || !name.trim()) {
          name = this.extractNameFromPath(filePath)
        }
        
        // 清理文件名，移除特殊字符，只保留字母、数字、中文、下划线和连字符
        const cleanName = name.replace(/[^\w\u4e00-\u9fa5\-_]/g, '_')
        
        // 获取当前最大的序号
        const maxNumber = await this.getMaxThumbnailNumber(cleanName)
        const nextNumber = maxNumber + 1
        
        const filename = `${cleanName}cover_${nextNumber}.jpg`
        console.log('📝 生成缩略图文件名:', filename)
        return filename
      } catch (error) {
        console.error('生成缩略图文件名失败:', error)
        // 降级方案：使用时间戳
        return `video_${Date.now()}.jpg`
      }
    },

    // 获取指定视频名的最大缩略图序号
    async getMaxThumbnailNumber(videoName) {
      try {
        if (!window.electronAPI || !window.electronAPI.listFiles) {
          console.warn('Electron API 不可用，使用默认序号')
          return 0
        }

        // 获取视频缩略图目录
        const thumbnailDir = saveManager.thumbnailDirectories?.videos || 'SaveData/Video/Covers'
        
        // 列出目录中的所有文件
        const result = await window.electronAPI.listFiles(thumbnailDir)
        if (!result.success) {
          console.warn('无法列出缩略图目录:', result.error)
          return 0
        }

        const files = result.files || []
        let maxNumber = 0
        
        // 查找匹配的文件名模式：视频名cover_数字.jpg
        const pattern = new RegExp(`^${videoName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}cover_(\\d+)\\.jpg$`)
        
        for (const file of files) {
          const match = file.match(pattern)
          if (match) {
            const number = parseInt(match[1], 10)
            if (number > maxNumber) {
              maxNumber = number
            }
          }
        }
        
        console.log(`📊 视频 "${videoName}" 的最大缩略图序号: ${maxNumber}`)
        return maxNumber
      } catch (error) {
        console.error('获取最大缩略图序号失败:', error)
        return 0
      }
    },

    // 删除旧的缩略图文件
    async deleteOldThumbnail(thumbnailPath) {
      try {
        if (!thumbnailPath || !thumbnailPath.trim()) {
          return
        }

        // 如果是base64数据，不需要删除
        if (thumbnailPath.startsWith('data:')) {
          return
        }

        console.log('🗑️ 准备删除旧缩略图:', thumbnailPath)
        
        const success = await saveManager.deleteThumbnail(thumbnailPath)
        
        if (success) {
          console.log('✅ 旧缩略图删除成功:', thumbnailPath)
        } else {
          console.warn('⚠️ 旧缩略图删除失败:', thumbnailPath)
        }
      } catch (error) {
        console.error('删除旧缩略图失败:', error)
      }
    },

    // 检查视频文件是否可访问
    async checkVideoFileAccess(filePath) {
      try {
        if (window.electronAPI && window.electronAPI.getFileUrl) {
          const result = await window.electronAPI.getFileUrl(filePath)
          if (result.success) {
            console.log('✅ 视频文件可访问:', result.url)
            return { accessible: true, url: result.url }
          } else {
            console.warn('⚠️ 视频文件不可访问:', result.error)
            return { accessible: false, error: result.error }
          }
        }
        return { accessible: true, url: this.buildFileUrl(filePath) }
      } catch (error) {
        console.error('检查视频文件访问失败:', error)
        return { accessible: false, error: error.message }
      }
    },

    // 加载设置
    async loadSettings() {
      try {
        return await saveManager.loadSettings()
      } catch (error) {
        console.error('加载设置失败:', error)
        // 返回默认设置
        return {
          videoPlayMode: 'external'
        }
      }
    },

    // 在本应用新窗口中播放视频
    async playVideoInternal(video) {
      try {
        console.log('=== 开始内部播放视频 ===')
        console.log('视频名称:', video.name)
        console.log('视频路径:', video.filePath)
        console.log('当前环境:', typeof window.electronAPI !== 'undefined' ? 'Electron' : '浏览器')
        
        // 首先检查视频文件是否可访问
        const accessCheck = await this.checkVideoFileAccess(video.filePath)
        if (!accessCheck.accessible) {
          console.error('❌ 视频文件不可访问:', accessCheck.error)
          this.showToastNotification('播放失败', `视频文件不可访问: ${accessCheck.error}`)
          return
        }
        
        if (window.electronAPI && window.electronAPI.openVideoWindow) {
          console.log('✅ Electron API 可用，调用 openVideoWindow')
          
          const result = await window.electronAPI.openVideoWindow(video.filePath, {
            title: video.name,
            width: 1200,
            height: 800,
            resizable: true,
            minimizable: true,
            maximizable: true
          })
          
          console.log('openVideoWindow 返回结果:', result)
          
          if (result.success) {
            console.log('✅ 视频窗口已成功打开')
            // 播放成功时不显示通知，只在控制台记录
          } else {
            console.error('❌ 打开视频窗口失败:', result.error)
            
            // 检查是否是路径编码问题
            if (result.error && (result.error.includes('ERR_FILE_NOT_FOUND') || result.error.includes('路径'))) {
              console.log('🔄 检测到路径问题')
              this.showToastNotification('播放失败', `视频文件路径问题: ${result.error}`)
            } else {
              this.showToastNotification('播放失败', `打开视频窗口失败: ${result.error}`)
            }
          }
        } else {
          // 降级处理：使用外部播放器
          console.warn('❌ Electron API 不可用，降级到外部播放器')
          console.warn('electronAPI 可用性:', !!window.electronAPI)
          console.warn('openVideoWindow 可用性:', !!window.electronAPI?.openVideoWindow)
          this.showToastNotification('播放失败', '内部播放器不可用')
        }
      } catch (error) {
        console.error('❌ 内部播放视频失败:', error)
        
        // 检查是否是特定类型的错误
        let errorMessage = error.message
        if (error.message.includes('ERR_FILE_NOT_FOUND')) {
          errorMessage = '视频文件未找到，可能是路径包含特殊字符或文件不存在'
        } else if (error.message.includes('ERR_ACCESS_DENIED')) {
          errorMessage = '无法访问视频文件，请检查文件权限'
        }
        
        this.showToastNotification('播放失败', `内部播放视频失败: ${errorMessage}`)
      }
    },

    // 使用外部默认播放器播放视频
    async playVideoExternal(video) {
      try {
        if (window.electronAPI && window.electronAPI.openExternal) {
          await window.electronAPI.openExternal(video.filePath)
          // 播放成功时不显示通知，只在控制台记录
          console.log('✅ 已使用外部播放器播放视频:', video.name)
        } else {
          // 降级处理：在浏览器中显示路径
          this.showToastNotification('播放失败', '在浏览器环境中无法直接打开视频文件')
        }
      } catch (error) {
        console.error('外部播放视频失败:', error)
        this.showToastNotification('播放失败', `外部播放视频失败: ${error.message}`)
      }
    },


    // 显示通知
    showNotification(title, message) {
      if (window.electronAPI && window.electronAPI.showNotification) {
        window.electronAPI.showNotification(title, message)
      } else {
        // 降级处理：使用浏览器通知
        if (Notification.permission === 'granted') {
          new Notification(title, { body: message })
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(title, { body: message })
            }
          })
        }
      }
    },

    // 显示 Toast 通知
    async showToastNotification(title, message, results = null) {
      try {

        
        if (results && results.length > 0) {
          // 批量操作结果通知
          notify.batchResult(title, results)
        } else {
          // 普通通知
          const type = title.includes('失败') || title.includes('错误') ? 'error' : 'success'
          notify[type](title, message)
        }
      } catch (error) {
        console.error('显示 Toast 通知失败:', error)
        // 降级到原来的通知方式
        this.showNotification(title, message)
      }
    },

    // 处理缩略图预览加载错误
    async handleThumbnailPreviewError(event) {
      console.log('缩略图预览加载失败，尝试使用异步方法')
      
      const originalSrc = event.target.getAttribute('src')
      const thumbnailPath = this.editVideoForm.thumbnail
      
      if (thumbnailPath && !thumbnailPath.startsWith('data:') && !thumbnailPath.startsWith('/') && !thumbnailPath.startsWith('http')) {
        try {
          // 使用异步方法重新获取正确的 URL
          const asyncUrl = await this.getThumbnailUrlAsync(thumbnailPath)
          
          if (asyncUrl && asyncUrl !== '/icon.svg') {
            console.log('异步方法获取到缩略图 URL:', asyncUrl)
            // 更新图片的 src 属性，触发重新加载
            event.target.src = asyncUrl
            return
          }
        } catch (error) {
          console.error('异步获取缩略图失败:', error)
        }
      }
      
      // 降级处理：隐藏图片
      console.log('使用默认处理')
      event.target.style.display = 'none'
    },

    // 处理缩略图预览加载成功
    handleThumbnailPreviewLoad(event) {
      console.log('缩略图预览加载成功')
      event.target.style.display = 'block'
    },

    // 关闭路径更新对话框
    closePathUpdateDialog() {
      this.showPathUpdateDialog = false
      this.pathUpdateInfo = {
        existingVideo: null,
        newPath: '',
        newFileName: ''
      }
    },

    // 确认路径更新
    async confirmPathUpdate() {
      try {
        const { existingVideo, newPath } = this.pathUpdateInfo
        
        if (!existingVideo || !newPath) {
          console.error('路径更新信息不完整')
          this.showToastNotification('更新失败', '路径更新信息不完整')
          return
        }
        
        console.log('开始更新视频路径:', existingVideo.name)
        console.log('从:', existingVideo.filePath)
        console.log('到:', newPath)
        
        // 更新视频路径
        existingVideo.filePath = newPath
        existingVideo.fileExists = true
        
        // 重新获取视频时长（如果之前没有）
        if (!existingVideo.duration || existingVideo.duration === 0) {
          try {
            console.log('🔄 重新获取视频时长...')
            const duration = await this.getVideoDuration(newPath)
            if (duration > 0) {
              existingVideo.duration = duration
              console.log('✅ 视频时长更新成功:', duration, '分钟')
            }
          } catch (e) {
            console.warn('获取视频时长失败:', e)
          }
        }
        
        // 重新生成缩略图（如果之前没有）
        if (!existingVideo.thumbnail || !existingVideo.thumbnail.trim()) {
          try {
            console.log('🔄 重新生成缩略图...')
            const thumbnail = await this.generateThumbnail(newPath, existingVideo.name)
            if (thumbnail) {
              existingVideo.thumbnail = thumbnail
              console.log('✅ 缩略图生成成功')
            }
          } catch (e) {
            console.warn('生成缩略图失败:', e)
          }
        }
        
        // 保存视频数据
        await this.videoManager.updateVideo(existingVideo.id, existingVideo)
        
        // 重新加载视频列表
        await this.loadVideos()
        
        // 关闭对话框
        this.closePathUpdateDialog()
        
        // 成功时不显示通知，只在控制台记录
        console.log('✅ 视频路径更新成功:', existingVideo.name)
        
        this.showToastNotification('路径更新成功', `视频 "${existingVideo.name}" 的路径已更新`)
        
      } catch (error) {
        console.error('更新视频路径失败:', error)
        this.showToastNotification('更新失败', `更新视频路径失败: ${error.message}`)
      }
    },


    // 提取标签、演员、系列信息
    extractAllFilters() {
      const tagCount = {}
      const actorCount = {}
      const seriesCount = {}
      
      this.videos.forEach(video => {
        // 提取标签
        if (video.tags && Array.isArray(video.tags)) {
          video.tags.forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1
          })
        }
        
        // 提取演员
        if (video.actors && Array.isArray(video.actors)) {
          video.actors.forEach(actor => {
            actorCount[actor] = (actorCount[actor] || 0) + 1
          })
        }
        
        // 提取系列
        if (video.series) {
          seriesCount[video.series] = (seriesCount[video.series] || 0) + 1
        }
      })
      
      // 转换为数组并按名称排序
      this.allTags = Object.entries(tagCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name))
        
      this.allActors = Object.entries(actorCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name))
        
      this.allSeries = Object.entries(seriesCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name))
      
      // 提取完标签后更新筛选器数据
      this.updateFilterData()
    },
    
    // 筛选方法
    filterByTag(tagName) {
      if (this.selectedTags.indexOf(tagName) !== -1) {
        // 如果当前是选中状态，则取消选择
        this.selectedTags = this.selectedTags.filter(tag => tag !== tagName)
      } else if (this.excludedTags.indexOf(tagName) !== -1) {
        // 如果当前是排除状态，则切换为选中状态
        this.excludedTags = this.excludedTags.filter(tag => tag !== tagName)
        this.selectedTags = [...this.selectedTags, tagName]
      } else {
        // 否则直接设置为选中状态
        this.selectedTags = [...this.selectedTags, tagName]
      }
      this.updateFilterData()
    },
    
    clearTagFilter() {
      this.selectedTags = []
      this.excludedTags = []
      this.updateFilterData()
    },
    
    filterByActor(actorName) {
      if (this.selectedActors.indexOf(actorName) !== -1) {
        // 如果当前是选中状态，则取消选择
        this.selectedActors = this.selectedActors.filter(actor => actor !== actorName)
      } else if (this.excludedActors.indexOf(actorName) !== -1) {
        // 如果当前是排除状态，则切换为选中状态
        this.excludedActors = this.excludedActors.filter(actor => actor !== actorName)
        this.selectedActors = [...this.selectedActors, actorName]
      } else {
        // 否则直接设置为选中状态
        this.selectedActors = [...this.selectedActors, actorName]
      }
      this.updateFilterData()
    },
    
    clearActorFilter() {
      this.selectedActors = []
      this.excludedActors = []
      this.updateFilterData()
    },
    
    filterBySeries(seriesName) {
      if (this.selectedSeries === seriesName) {
        // 如果当前是选中状态，则取消选择
        this.selectedSeries = null
      } else if (this.excludedSeries === seriesName) {
        // 如果当前是排除状态，则切换为选中状态
        this.excludedSeries = null
        this.selectedSeries = seriesName
      } else {
        // 否则直接设置为选中状态
        this.selectedSeries = seriesName
      }
      this.updateFilterData()
    },
    
    clearSeriesFilter() {
      this.selectedSeries = null
      this.excludedSeries = null
      this.updateFilterData()
    },
    
    // 排除方法
    excludeByTag(tagName) {
      if (this.excludedTags.indexOf(tagName) !== -1) {
        // 如果已经是排除状态，则取消排除
        this.excludedTags = this.excludedTags.filter(tag => tag !== tagName)
      } else if (this.selectedTags.indexOf(tagName) !== -1) {
        // 如果当前是选中状态，则切换为排除状态
        this.selectedTags = this.selectedTags.filter(tag => tag !== tagName)
        this.excludedTags = [...this.excludedTags, tagName]
      } else {
        // 否则直接设置为排除状态
        this.excludedTags = [...this.excludedTags, tagName]
      }
      this.updateFilterData()
    },
    
    excludeByActor(actorName) {
      if (this.excludedActors.indexOf(actorName) !== -1) {
        // 如果已经是排除状态，则取消排除
        this.excludedActors = this.excludedActors.filter(actor => actor !== actorName)
      } else if (this.selectedActors.indexOf(actorName) !== -1) {
        // 如果当前是选中状态，则切换为排除状态
        this.selectedActors = this.selectedActors.filter(actor => actor !== actorName)
        this.excludedActors = [...this.excludedActors, actorName]
      } else {
        // 否则直接设置为排除状态
        this.excludedActors = [...this.excludedActors, actorName]
      }
      this.updateFilterData()
    },
    
    excludeBySeries(seriesName) {
      if (this.excludedSeries === seriesName) {
        // 如果已经是排除状态，则取消排除
        this.excludedSeries = null
      } else if (this.selectedSeries === seriesName) {
        // 如果当前是选中状态，则切换为排除状态
        this.selectedSeries = null
        this.excludedSeries = seriesName
      } else {
        // 否则直接设置为排除状态
        this.excludedSeries = seriesName
      }
      this.updateFilterData()
    },
    
    // 处理来自 App.vue 的筛选器事件
    handleFilterEvent(event, data) {
      switch (event) {
        case 'filter-select':
          if (data.filterKey === 'tags') {
            this.filterByTag(data.itemName)
          } else if (data.filterKey === 'actors') {
            this.filterByActor(data.itemName)
          } else if (data.filterKey === 'series') {
            this.filterBySeries(data.itemName)
          }
          break
        case 'filter-exclude':
          if (data.filterKey === 'tags') {
            this.excludeByTag(data.itemName)
          } else if (data.filterKey === 'actors') {
            this.excludeByActor(data.itemName)
          } else if (data.filterKey === 'series') {
            this.excludeBySeries(data.itemName)
          }
          break
        case 'filter-clear':
          if (data === 'tags') {
            this.clearTagFilter()
          } else if (data === 'actors') {
            this.clearActorFilter()
          } else if (data === 'series') {
            this.clearSeriesFilter()
          }
          break
      }
    },
    
    // 更新筛选器数据到 App.vue
    updateFilterData() {
      this.$emit('filter-data-updated', {
        filters: [
          {
            key: 'tags',
            title: '标签筛选',
            items: this.allTags,
            selected: this.selectedTags,
            excluded: this.excludedTags
          },
          {
            key: 'actors',
            title: '演员筛选',
            items: this.allActors,
            selected: this.selectedActors,
            excluded: this.excludedActors
          },
          {
            key: 'series',
            title: '系列筛选',
            items: this.allSeries,
            selected: this.selectedSeries,
            excluded: this.excludedSeries
          }
        ]
      })
    },
    async handleSortChanged({ pageType, sortBy }) {
      try {
        await saveManager.saveSortSetting(pageType, sortBy)
        console.log(`✅ 已保存${pageType}页面排序方式:`, sortBy)
      } catch (error) {
        console.warn('保存排序方式失败:', error)
      }
    },
    async loadSortSetting() {
      try {
        const savedSortBy = await saveManager.getSortSetting('videos')
        if (savedSortBy && savedSortBy !== this.sortBy) {
          this.sortBy = savedSortBy
          console.log('✅ 已加载视频页面排序方式:', savedSortBy)
        }
      } catch (error) {
        console.warn('加载排序方式失败:', error)
      }
    },
    
    // 处理分页组件的事件
    handleVideoPageChange(pageNum) {
      this.currentVideoPage = pageNum
    },
    
    // 更新视频列表分页信息
    updateVideoPagination() {
      this.totalVideoPages = Math.ceil(this.filteredVideos.length / this.videoPageSize)
      // 确保当前页不超过总页数
      if (this.currentVideoPage > this.totalVideoPages && this.totalVideoPages > 0) {
        this.currentVideoPage = this.totalVideoPages
      }
      // 如果当前页为0且没有数据，重置为1
      if (this.currentVideoPage === 0 && this.filteredVideos.length > 0) {
        this.currentVideoPage = 1
      }
    },
    
    // 从设置中加载视频分页配置
    async loadVideoPaginationSettings() {
      try {
        const settings = await this.loadSettings()
        
        if (settings && settings.video) {
          const newVideoPageSize = parseInt(settings.video.listPageSize) || 20
          
          // 更新视频列表分页大小
          if (this.videoPageSize !== newVideoPageSize) {
            this.videoPageSize = newVideoPageSize
            
            // 重新计算视频列表分页
            this.updateVideoPagination()
            
            console.log('视频列表分页设置已更新:', {
              listPageSize: this.videoPageSize,
              totalVideoPages: this.totalVideoPages,
              currentVideoPage: this.currentVideoPage
            })
          }
        }
      } catch (error) {
        console.error('加载视频分页设置失败:', error)
        // 使用默认值
        this.videoPageSize = 20
      }
    }
  }
}
</script>

<style scoped>
.video-view {
  display: flex;
  height: 100%;
  overflow: hidden;
}


/* 视频主内容区域 */
.video-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}

/* 工具栏样式 */

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  padding: 10px 40px 10px 15px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  width: 300px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px var(--accent-color-20);
}

.search-icon {
  position: absolute;
  right: 12px;
  color: var(--text-secondary);
  pointer-events: none;
}

.sort-select {
  padding: 10px 15px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-select:focus {
  outline: none;
  border-color: var(--accent-color);
}

/* 视频网格样式 */
.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
}

.video-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  cursor: pointer;
}

.video-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px var(--shadow-medium);
  border-color: var(--accent-color);
}

.video-thumbnail {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.duration-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  font-family: 'Courier New', monospace;
  z-index: 10;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-card:hover .video-thumbnail img {
  transform: scale(1.05);
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-card:hover .video-overlay {
  opacity: 1;
}

.play-button {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.3s ease;
}

.play-button:hover {
  background: white;
  transform: scale(1.1);
}

.watch-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
}

.progress-bar {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
}

.progress-fill {
  height: 100%;
  background: var(--accent-color);
  transition: width 0.3s ease;
}

.video-info {
  padding: 20px;
}

.video-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.video-series {
  font-size: 14px;
  color: var(--accent-color);
  margin: 0 0 5px 0;
  font-weight: 500;
}


.video-description {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 10px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.video-tag {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  border: 1px solid var(--border-color);
}

.video-tag-more {
  background: var(--accent-color-20);
  color: var(--accent-color);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.video-actors {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.actors-label {
  font-weight: 500;
  margin-right: 5px;
}

.video-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.stats-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.watch-count {
  font-weight: 500;
  color: var(--text-primary);
}


.added-date {
  font-size: 11px;
  color: var(--text-tertiary);
}


/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 24px;
  margin-bottom: 10px;
  color: var(--text-primary);
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 30px;
}

.btn-add-first-video {
  padding: 12px 24px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add-first-video:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px var(--shadow-dark);
}

.video-detail-modal {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 20px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

/* 表单样式 */
.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 14px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px var(--accent-color-20);
}

.file-input-group {
  display: flex;
  gap: 10px;
}

.file-input-group input {
  flex: 1;
}

.btn-select-file {
  padding: 12px 20px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-select-file:hover {
  background: var(--bg-secondary);
  border-color: var(--accent-color);
}

.thumb-preview-wrapper {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.thumb-preview {
  width: 200px;
  height: 120px;
  object-fit: cover;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
}

.thumb-placeholder {
  color: var(--text-secondary);
  font-size: 12px;
}

/* 按钮样式 */
.btn-cancel {
  padding: 10px 20px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
}

.btn-confirm {
  padding: 10px 20px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-confirm:hover {
  background: var(--accent-hover);
}

.btn-play {
  padding: 10px 20px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-play:hover {
  background: var(--accent-hover);
}

.btn-edit {
  padding: 10px 20px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-edit:hover {
  background: var(--bg-tertiary);
}

.btn-delete {
  padding: 10px 20px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-delete:hover {
  background: #c82333;
}

.btn-open-folder {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.btn-open-folder:hover {
  background: var(--bg-secondary);
}

.btn-update-duration {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.btn-update-duration:hover {
  background: #138496;
  transform: translateY(-1px);
}

/* 视频详情样式 */
.video-detail-content {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 30px;
}

.video-detail-thumbnail img {
  width: 100%;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.video-detail-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section h4 {
  color: var(--text-primary);
  font-size: 16px;
  margin: 0 0 10px 0;
  font-weight: 600;
}

.detail-section p {
  color: var(--text-secondary);
  margin: 0 0 8px 0;
  font-size: 14px;
  line-height: 1.5;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  border: 1px solid var(--border-color);
}

/* 标签输入样式 */
.tags-input-container {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  padding: 8px;
  transition: all 0.3s ease;
}

.tags-input-container:focus-within {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px var(--accent-color-20);
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
  min-height: 20px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  background: var(--accent-color);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  gap: 4px;
  transition: background 0.3s ease;
}

.tag-item:hover {
  background: var(--accent-hover);
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  margin-left: 4px;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.tag-remove:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tag-input {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.9rem;
  padding: 4px 0;
  outline: none;
}

.tag-input::placeholder {
  color: var(--text-tertiary);
}

.tag-hint {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  margin-top: 6px;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  
  .videos-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .video-detail-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
}


/* 拖拽样式 */
.video-content {
  position: relative;
  transition: all 0.3s ease;
}

.video-content.drag-over {
  background: rgba(59, 130, 246, 0.1);
  border: 2px dashed var(--accent-color);
  border-radius: 12px;
}

.video-content.drag-over::before {
  content: '拖拽视频文件到这里添加视频';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--accent-color);
  color: white;
  padding: 20px 40px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  z-index: 1000;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

</style>

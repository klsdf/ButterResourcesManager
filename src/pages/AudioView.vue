<template>
  <BaseView
    ref="baseView"
    :items="audios"
    :filtered-items="filteredAudios"
    :empty-state-config="audioEmptyStateConfig"
    :toolbar-config="audioToolbarConfig"
    :context-menu-items="audioContextMenuItems"
    @empty-state-action="handleEmptyStateAction"
    @add-item="showAddDialog = true"
    @sort-changed="handleSortChanged"
    @search-query-changed="handleSearchQueryChanged"
    @sort-by-changed="handleSortByChanged"
    @context-menu-click="handleContextMenuClick"
  >
    <!-- 音频主内容区域 -->
    <div 
      class="audio-content"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      :class="{ 'drag-over': isDragOver }"
    >
      <!-- 音频列表分页导航 -->
      <PaginationNav
        :current-page="currentAudioPage"
        :total-pages="totalAudioPages"
        :page-size="audioPageSize"
        :total-items="filteredAudios.length"
        item-type="音频"
        @page-change="handleAudioPageChange"
      />
      
      <!-- 主要内容区域 -->
      <div class="audio-main-content">
        <!-- 音频列表 -->
        <div class="audios-grid" v-if="paginatedAudios.length > 0">
          <MediaCard
            v-for="audio in paginatedAudios" 
            :key="audio.id"
            :item="audio"
            type="audio"
            :isElectronEnvironment="true"
            :file-exists="audio.fileExists"
            @click="showAudioDetail"
            @contextmenu="(event) => $refs.baseView.showContextMenuHandler(event, audio)"
            @action="playAudio"
          />
        </div>
      </div>
    </div>

    <!-- 添加音频对话框 -->
    <div v-if="showAddDialog" class="modal-overlay" @click="closeAddDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加音频文件</h3>
          <button class="btn-close" @click="closeAddDialog">×</button>
        </div>
        
        <div class="modal-body">
          <FormField
            label="音频文件"
            type="file"
            v-model="newAudio.filePath"
            placeholder="选择音频文件..."
            @browse="selectAudioFile"
          />
          
          <FormField
            label="音频名称"
            type="text"
            v-model="newAudio.name"
            placeholder="音频名称（可选，将自动从文件名获取）"
          />
          
          <FormField
            label="艺术家"
            type="text"
            v-model="newAudio.artist"
            placeholder="艺术家"
          />
          
          <FormField
            label="演员（用逗号分隔）"
            type="text"
            v-model="newAudio.actorsInput"
            placeholder="例如: 张三, 李四, 王五"
          />
          
          <FormField
            label="标签（用逗号分隔）"
            type="text"
            v-model="newAudio.tagsInput"
            placeholder="例如: 流行, 经典, 摇滚"
          />
          
          <FormField
            label="备注"
            type="textarea"
            v-model="newAudio.notes"
            placeholder="音频备注..."
            :rows="3"
          />
        </div>
        
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeAddDialog">取消</button>
          <button class="btn-confirm" @click="addAudio">添加</button>
        </div>
      </div>
    </div>

    <!-- 音频详情对话框 -->
    <DetailPanel
      :visible="!!selectedAudio"
      :item="selectedAudio"
      type="audio"
      :stats="audioStats"
      :actions="audioActions"
      @close="closeAudioDetail"
      @action="handleDetailAction"
    />

    <!-- 编辑音频对话框 -->
    <div v-if="showEditDialog" class="modal-overlay" @click="closeEditDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑音频信息</h3>
          <button class="btn-close" @click="closeEditDialog">×</button>
        </div>
        
        <div class="modal-body">
          <FormField
            label="音频文件"
            type="file"
            v-model="editAudioForm.filePath"
            placeholder="选择音频文件..."
            @browse="selectEditAudioFile"
          />
          
          <FormField
            label="音频名称"
            type="text"
            v-model="editAudioForm.name"
            placeholder="音频名称"
          />
          
          <FormField
            label="艺术家"
            type="text"
            v-model="editAudioForm.artist"
            placeholder="艺术家"
          />
          
          <FormField
            label="演员"
            type="tags"
            v-model="editAudioForm.actors"
            v-model:tagInput="editActorInput"
            @add-tag="addEditActor"
            @remove-tag="removeEditActor"
            tagPlaceholder="输入演员名称，按回车或逗号添加"
          />
          
          <FormField
            label="标签"
            type="tags"
            v-model="editAudioForm.tags"
            v-model:tagInput="editTagInput"
            @add-tag="addEditTag"
            @remove-tag="removeEditTag"
            tagPlaceholder="输入标签，按回车或逗号添加"
          />
          
          <FormField
            label="缩略图"
            type="file"
            v-model="editAudioForm.thumbnailPath"
            placeholder="选择缩略图文件..."
            @browse="selectEditThumbnailFile"
          />
          <div v-if="editAudioForm.thumbnailPath" class="thumbnail-preview">
            <img :src="getThumbnailUrl(editAudioForm.thumbnailPath)" alt="缩略图预览" class="preview-image">
          </div>
          
          <FormField
            label="备注"
            type="textarea"
            v-model="editAudioForm.notes"
            placeholder="音频备注..."
            :rows="3"
          />
        </div>
        
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeEditDialog">取消</button>
          <button class="btn-confirm" @click="saveEditedAudio">保存</button>
        </div>
      </div>
    </div>


    <!-- 路径更新确认对话框 -->
    <PathUpdateDialog
      :visible="showPathUpdateDialog"
      title="更新音频路径"
      description="发现同名但路径不同的音频文件："
      item-name-label="音频名称"
      :item-name="pathUpdateInfo.existingAudio?.name || ''"
      :old-path="pathUpdateInfo.existingAudio?.filePath || ''"
      :new-path="pathUpdateInfo.newPath || ''"
      missing-label="文件丢失"
      found-label="文件存在"
      question="是否要更新音频路径？"
      @confirm="confirmPathUpdate"
      @cancel="closePathUpdateDialog"
    />
  </BaseView>
</template>

<script>
import audioManager from '../utils/AudioManager.js'
import BaseView from '../components/BaseView.vue'
import FormField from '../components/FormField.vue'
import MediaCard from '../components/MediaCard.vue'
import DetailPanel from '../components/DetailPanel.vue'
import PathUpdateDialog from '../components/PathUpdateDialog.vue'
import PaginationNav from '../components/PaginationNav.vue'

export default {
  name: 'AudioView',
  components: {
    BaseView,
    FormField,
    MediaCard,
    DetailPanel,
    PathUpdateDialog,
    PaginationNav
  },
  emits: ['filter-data-updated'],
  data() {
    return {
      audios: [],
      searchQuery: '',
      sortBy: 'name',
      // 筛选器相关数据
      selectedTags: [],
      selectedArtists: [],
      excludedTags: [],
      excludedArtists: [],
      allTags: [],
      allArtists: [],
      showAddDialog: false,
      isDragOver: false,
      // 路径更新确认对话框
      showPathUpdateDialog: false,
      pathUpdateInfo: {
        existingAudio: null,
        newPath: '',
        newFileName: ''
      },
      // 音频列表分页相关
      currentAudioPage: 1,
      audioPageSize: 20, // 默认每页显示20个音频
      totalAudioPages: 0,
      selectedAudio: null,
      newAudio: {
        name: '',
        artist: '',
        filePath: '',
        actorsInput: '',
        tagsInput: '',
        notes: ''
      },
      // 编辑相关状态
      showEditDialog: false,
      editAudioForm: {
        id: '',
        name: '',
        artist: '',
        filePath: '',
        thumbnailPath: '',
        actors: [],
        tags: [],
        notes: ''
      },
      editActorInput: '',
      editTagInput: '',
      // 排序选项
      audioSortOptions: [
        { value: 'name', label: '按名称' },
        { value: 'artist', label: '按艺术家' },
        { value: 'playCount', label: '按播放次数' },
        { value: 'addedDate', label: '按添加时间' }
      ],
      // 空状态配置
      audioEmptyStateConfig: {
        emptyIcon: '🎵',
        emptyTitle: '你的音频库是空的',
        emptyDescription: '点击"添加音频"按钮来添加你的第一个音频',
        emptyButtonText: '添加第一个音频',
        emptyButtonAction: 'showAddDialog',
        noResultsIcon: '🔍',
        noResultsTitle: '没有找到匹配的音频',
        noResultsDescription: '尝试使用不同的搜索词',
        noPageDataIcon: '📄',
        noPageDataTitle: '当前页没有音频',
        noPageDataDescription: '请切换到其他页面查看音频'
      },
      // 工具栏配置
      audioToolbarConfig: {
        addButtonText: '添加音频',
        searchPlaceholder: '搜索音频...',
        sortOptions: [
          { value: 'name', label: '按名称' },
          { value: 'artist', label: '按艺术家' },
          { value: 'playCount', label: '按播放次数' },
          { value: 'addedDate', label: '按添加时间' }
        ],
        pageType: 'audio'
      },
      // 右键菜单配置
      audioContextMenuItems: [
        { key: 'detail', icon: '👁️', label: '查看详情' },
        { key: 'play', icon: '▶️', label: '播放' },
        { key: 'addToPlaylist', icon: '➕', label: '添加到播放列表' },
        { key: 'folder', icon: '📁', label: '打开文件夹' },
        { key: 'edit', icon: '✏️', label: '编辑信息' },
        { key: 'delete', icon: '🗑️', label: '删除音频' }
      ]
    }
  },
  computed: {
    filteredAudios() {
      // 使用组件内部的 audios 数据，而不是直接调用 audioManager
      let filtered = this.audios
      
      // 标签筛选 - 必须包含所有选中的标签（AND逻辑）
      if (this.selectedTags.length > 0) {
        filtered = filtered.filter(audio => 
          audio.tags && this.selectedTags.every(tag => audio.tags.includes(tag))
        )
      }
      if (this.excludedTags.length > 0) {
        filtered = filtered.filter(audio => 
          !(audio.tags && this.excludedTags.some(tag => audio.tags.includes(tag)))
        )
      }
      
      // 艺术家筛选
      if (this.selectedArtists.length > 0) {
        filtered = filtered.filter(audio => 
          this.selectedArtists.includes(audio.artist)
        )
      }
      if (this.excludedArtists.length > 0) {
        filtered = filtered.filter(audio => 
          !this.excludedArtists.includes(audio.artist)
        )
      }
      
      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(audio => 
          audio.name.toLowerCase().includes(query) ||
          (audio.artist && audio.artist.toLowerCase().includes(query)) ||
          (audio.album && audio.album.toLowerCase().includes(query)) ||
          (audio.genre && audio.genre.toLowerCase().includes(query))
        )
      }
      
      // 排序
      switch (this.sortBy) {
        case 'name':
          return filtered.sort((a, b) => a.name.localeCompare(b.name))
        case 'artist':
          return filtered.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''))
        case 'playCount':
          return filtered.sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
        case 'addedDate':
          return filtered.sort((a, b) => new Date(b.addedDate || 0) - new Date(a.addedDate || 0))
        default:
          return filtered
      }
    },
    // 分页显示的音频列表
    paginatedAudios() {
      if (!this.filteredAudios || this.filteredAudios.length === 0) return []
      const start = (this.currentAudioPage - 1) * this.audioPageSize
      const end = start + this.audioPageSize
      return this.filteredAudios.slice(start, end)
    },
    // 当前音频页的起始索引
    currentAudioPageStartIndex() {
      return (this.currentAudioPage - 1) * this.audioPageSize
    },
    audioStats() {
      if (!this.selectedAudio) return []
      
      return [
        { label: '艺术家', value: this.selectedAudio.artist || '未知' },
        { label: '时长', value: this.formatDuration(this.selectedAudio.duration) },
        { label: '播放次数', value: `${this.selectedAudio.playCount || 0} 次` },
        { label: '添加时间', value: this.formatDate(this.selectedAudio.addedDate) }
      ]
    },
    audioActions() {
      const actions = [
        { key: 'play', icon: '▶️', label: '播放', class: 'btn-play-game' },
        { key: 'addToPlaylist', icon: '➕', label: '添加到播放列表', class: 'btn-add-to-playlist' },
        { key: 'folder', icon: '📁', label: '打开文件夹', class: 'btn-open-folder' },
        { key: 'edit', icon: '✏️', label: '编辑信息', class: 'btn-edit-game' },
        { key: 'remove', icon: '🗑️', label: '删除音频', class: 'btn-remove-game' }
      ]
      
      // 如果没有时长，添加更新时长按钮
      if (!this.selectedAudio?.duration || this.selectedAudio.duration === 0) {
        actions.splice(2, 0, { key: 'updateDuration', icon: '⏱️', label: '更新时长', class: 'btn-update-duration' })
      }
      
      return actions
    }
  },
  methods: {
    async loadAudios() {
      try {
        this.audios = await audioManager.loadAudios()
        console.log('音频数据加载完成:', this.audios.length, '个音频')
        
        // 检测文件存在性
        await this.checkFileExistence()
        
        // 更新筛选器数据
        this.updateFilterOptions()
        this.updateFilterData()
        
        // 计算音频列表总页数
        this.updateAudioPagination()
      } catch (error) {
        console.error('加载音频数据失败:', error)
        alert('加载音频数据失败: ' + error.message)
      }
    },
    
    async checkFileExistence() {
      console.log('🔍 开始检测音频文件存在性...')
      
      if (!window.electronAPI || !window.electronAPI.checkFileExists) {
        console.log('⚠️ Electron API 不可用，跳过文件存在性检测')
        // 如果API不可用，默认设置为存在
        this.audios.forEach(audio => {
          audio.fileExists = true
        })
        return
      }
      
      let checkedCount = 0
      let missingCount = 0
      
      for (const audio of this.audios) {
        if (!audio.filePath) {
          audio.fileExists = false
          missingCount++
          continue
        }
        
        try {
          const result = await window.electronAPI.checkFileExists(audio.filePath)
          audio.fileExists = result.exists
          console.log(`🔍 检测结果: ${audio.name} - fileExists=${audio.fileExists}`)
          
          if (!result.exists) {
            missingCount++
            console.log(`❌ 音频文件不存在: ${audio.name} - ${audio.filePath}`)
          } else {
            console.log(`✅ 音频文件存在: ${audio.name}`)
          }
        } catch (error) {
          console.error(`❌ 检测音频文件存在性失败: ${audio.name}`, error)
          audio.fileExists = false
          missingCount++
        }
        
        checkedCount++
      }
      
      console.log(`📊 文件存在性检测完成: 检查了 ${checkedCount} 个音频，${missingCount} 个文件不存在`)
      
      // 强制更新视图
      this.$forceUpdate()
    },
    
    // 更新筛选器选项
    updateFilterOptions() {
      // 收集所有标签
      const tagCount = {}
      const artistCount = {}
      
      this.audios.forEach(audio => {
        // 统计标签
        if (audio.tags && Array.isArray(audio.tags)) {
          audio.tags.forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1
          })
        }
        
        // 统计艺术家
        if (audio.artist) {
          artistCount[audio.artist] = (artistCount[audio.artist] || 0) + 1
        }
      })
      
      this.allTags = Object.entries(tagCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name))
        
      this.allArtists = Object.entries(artistCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name))
    },
    
    // 筛选方法
    filterByTag(tagName) {
      console.log('AudioView filterByTag:', tagName, 'selectedTags:', this.selectedTags, 'excludedTags:', this.excludedTags)
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
      console.log('AudioView filterByTag after:', 'selectedTags:', this.selectedTags, 'excludedTags:', this.excludedTags)
      this.updateFilterData()
    },
    
    clearTagFilter() {
      this.selectedTags = []
      this.excludedTags = []
      this.updateFilterData()
    },
    
    filterByArtist(artistName) {
      if (this.selectedArtists.indexOf(artistName) !== -1) {
        // 如果当前是选中状态，则取消选择
        this.selectedArtists = this.selectedArtists.filter(artist => artist !== artistName)
      } else if (this.excludedArtists.indexOf(artistName) !== -1) {
        // 如果当前是排除状态，则切换为选中状态
        this.excludedArtists = this.excludedArtists.filter(artist => artist !== artistName)
        this.selectedArtists = [...this.selectedArtists, artistName]
      } else {
        // 否则直接设置为选中状态
        this.selectedArtists = [...this.selectedArtists, artistName]
      }
      this.updateFilterData()
    },
    
    clearArtistFilter() {
      this.selectedArtists = []
      this.excludedArtists = []
      this.updateFilterData()
    },
    
    // 排除方法
    excludeByTag(tagName) {
      console.log('AudioView excludeByTag:', tagName, 'selectedTags:', this.selectedTags, 'excludedTags:', this.excludedTags)
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
      console.log('AudioView excludeByTag after:', 'selectedTags:', this.selectedTags, 'excludedTags:', this.excludedTags)
      this.updateFilterData()
    },
    
    excludeByArtist(artistName) {
      if (this.excludedArtists.indexOf(artistName) !== -1) {
        // 如果已经是排除状态，则取消排除
        this.excludedArtists = this.excludedArtists.filter(artist => artist !== artistName)
      } else if (this.selectedArtists.indexOf(artistName) !== -1) {
        // 如果当前是选中状态，则切换为排除状态
        this.selectedArtists = this.selectedArtists.filter(artist => artist !== artistName)
        this.excludedArtists = [...this.excludedArtists, artistName]
      } else {
        // 否则直接设置为排除状态
        this.excludedArtists = [...this.excludedArtists, artistName]
      }
      this.updateFilterData()
    },
    
    // 处理来自 App.vue 的筛选器事件
    handleFilterEvent(event, data) {
      switch (event) {
        case 'filter-select':
          if (data.filterKey === 'tags') {
            this.filterByTag(data.itemName)
          } else if (data.filterKey === 'artists') {
            this.filterByArtist(data.itemName)
          }
          break
        case 'filter-exclude':
          if (data.filterKey === 'tags') {
            this.excludeByTag(data.itemName)
          } else if (data.filterKey === 'artists') {
            this.excludeByArtist(data.itemName)
          }
          break
        case 'filter-clear':
          if (data === 'tags') {
            this.clearTagFilter()
          } else if (data === 'artists') {
            this.clearArtistFilter()
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
            key: 'artists',
            title: '艺术家筛选',
            items: this.allArtists,
            selected: this.selectedArtists,
            excluded: this.excludedArtists
          }
        ]
      })
    },
    
    async selectAudioFile() {
      try {
        if (window.electronAPI && window.electronAPI.selectAudioFile) {
          const filePath = await window.electronAPI.selectAudioFile()
          if (filePath) {
            this.newAudio.filePath = filePath
            // 自动提取文件名
            this.newAudio.name = this.extractNameFromPath(filePath)
            // 自动获取音频时长
            this.newAudio.duration = await this.getAudioDuration(filePath)
          }
        } else {
          this.showToastNotification('当前环境不支持文件选择功能')
        }
      } catch (error) {
        console.error('选择音频文件失败:', error)
        this.showToastNotification('选择音频文件失败: ' + error.message)
      }
    },
    
    async addAudio() {
      try {
        if (!this.newAudio.filePath) {
          this.showToastNotification('请选择音频文件')
          return
        }
        
        const audioData = {
          ...this.newAudio,
          actors: this.newAudio.actorsInput ? this.newAudio.actorsInput.split(',').map(actor => actor.trim()).filter(actor => actor) : [],
          tags: this.newAudio.tagsInput ? this.newAudio.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : []
        }
        
        const audio = await audioManager.addAudio(audioData)
        // 重新加载音频列表，确保数据同步
        await this.loadAudios()
        this.closeAddDialog()
        this.showNotification('音频添加成功', `已添加音频: ${audio.name}`)
      } catch (error) {
        console.error('添加音频失败:', error)
        this.showToastNotification('添加音频失败: ' + error.message)
      }
    },
    
    async playAudio(audio) {
      try {
        // 增加播放次数
        await audioManager.incrementPlayCount(audio.id)
        
        // 更新本地数据
        const index = this.audios.findIndex(a => a.id === audio.id)
        if (index !== -1) {
          this.audios[index] = await audioManager.audios.find(a => a.id === audio.id)
        }
        
        // 使用全局音频播放器播放
        console.log('🎵 通过全局播放器播放音频:', audio.name)
        window.dispatchEvent(new CustomEvent('global-play-audio', { detail: audio }))
        
        this.showNotification('开始播放', `正在播放: ${audio.name}`)
        
      } catch (error) {
        console.error('播放音频失败:', error)
        this.showToastNotification('播放音频失败: ' + error.message)
      }
    },
    
    addToPlaylist(audio) {
      console.log('➕ 添加音频到播放列表:', audio.name)
      window.dispatchEvent(new CustomEvent('global-add-to-playlist', { detail: audio }))
      this.showNotification('已添加', `已将 "${audio.name}" 添加到播放列表`)
    },
    
    async openAudioFolder(audio) {
      try {
        if (!audio.filePath) {
          this.showToastNotification('音频文件路径不存在')
          return
        }
        
        if (window.electronAPI && window.electronAPI.openFileFolder) {
          const result = await window.electronAPI.openFileFolder(audio.filePath)
          if (result.success) {
            console.log('已打开音频文件夹:', result.folderPath)
            this.showToastNotification(`已打开音频文件夹: ${result.folderPath}`)
          } else {
            console.error('打开文件夹失败:', result.error)
            this.showToastNotification(`打开文件夹失败: ${result.error}`)
          }
        } else {
          // 降级处理：在浏览器中显示路径
          this.showToastNotification(`音频文件位置:\n${audio.filePath}`)
        }
      } catch (error) {
        console.error('打开音频文件夹失败:', error)
        this.showToastNotification(`打开文件夹失败: ${error.message}`)
      }
    },
    
    async deleteAudio(audio) {
      if (!confirm(`确定要删除音频 "${audio.name}" 吗？`)) return
      
      try {
        await audioManager.deleteAudio(audio.id)
        this.audios = this.audios.filter(a => a.id !== audio.id)
        
        // 显示删除成功通知
        this.showToastNotification('删除成功', `已成功删除音频 "${audio.name}"`)
        console.log('音频删除成功:', audio.name)
        
        this.closeAudioDetail()
      } catch (error) {
        console.error('删除音频失败:', error)
        // 显示删除失败通知
        this.showToastNotification('删除失败', `无法删除音频 "${audio.name}": ${error.message}`)
      }
    },
    
    showAudioDetail(audio) {
      this.selectedAudio = audio
      this.contextMenu.visible = false
    },
    
    closeAudioDetail() {
      this.selectedAudio = null
    },
    handleDetailAction(actionKey, audio) {
      switch (actionKey) {
        case 'play':
          this.playAudio(audio)
          break
        case 'addToPlaylist':
          this.addToPlaylist(audio)
          break
        case 'updateDuration':
          this.updateAudioDuration(audio)
          break
        case 'folder':
          this.openAudioFolder(audio)
          break
        case 'edit':
          this.editAudio(audio)
          break
        case 'remove':
          this.deleteAudio(audio)
          break
      }
    },
    
    closeAddDialog() {
      this.showAddDialog = false
      this.newAudio = {
        name: '',
        artist: '',
        filePath: '',
        actorsInput: '',
        tagsInput: '',
        notes: ''
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
          this.showAudioDetail(selectedItem)
          break
        case 'play':
          this.playAudio(selectedItem)
          break
        case 'addToPlaylist':
          this.addToPlaylist(selectedItem)
          break
        case 'folder':
          this.openAudioFolder(selectedItem)
          break
        case 'edit':
          this.editAudio(selectedItem)
          break
        case 'delete':
          this.deleteAudio(selectedItem)
          break
      }
    },
    
    // 处理空状态按钮点击事件
    handleEmptyStateAction(actionName) {
      if (actionName === 'showAddDialog') {
        this.showAddDialog = true
      }
    },
    
    // 处理搜索查询变化
    handleSearchQueryChanged(newValue) {
      this.searchQuery = newValue
    },
    
    // 处理排序变化
    handleSortByChanged(newValue) {
      this.sortBy = newValue
    },
    
    editAudio(audio) {
      this.editAudioForm = {
        id: audio.id,
        name: audio.name || '',
        artist: audio.artist || '',
        filePath: audio.filePath || '',
        thumbnailPath: audio.thumbnailPath || '',
        actors: audio.actors || [],
        tags: audio.tags || [],
        notes: audio.notes || ''
      }
      this.editActorInput = ''
      this.editTagInput = ''
      this.showEditDialog = true
      this.contextMenu.visible = false
      
      // 关闭详情页面
      this.closeAudioDetail()
    },
    
    closeEditDialog() {
      this.showEditDialog = false
      this.editAudioForm = {
        id: '',
        name: '',
        artist: '',
        filePath: '',
        thumbnailPath: '',
        actors: [],
        tags: [],
        notes: ''
      }
      this.editActorInput = ''
      this.editTagInput = ''
    },
    
    // 演员管理
    addEditActor() {
      const actor = this.editActorInput.trim()
      if (actor && !this.editAudioForm.actors.includes(actor)) {
        this.editAudioForm.actors.push(actor)
        this.editActorInput = ''
      }
    },
    
    removeEditActor(index) {
      this.editAudioForm.actors.splice(index, 1)
    },
    
    // 标签管理
    addEditTag() {
      const tag = this.editTagInput.trim()
      if (tag && !this.editAudioForm.tags.includes(tag)) {
        this.editAudioForm.tags.push(tag)
        this.editTagInput = ''
      }
    },
    
    removeEditTag(index) {
      this.editAudioForm.tags.splice(index, 1)
    },
    
    // 文件选择
    async selectEditAudioFile() {
      try {
        if (window.electronAPI && window.electronAPI.selectAudioFile) {
          const filePath = await window.electronAPI.selectAudioFile()
          if (filePath) {
            this.editAudioForm.filePath = filePath
            // 如果名称为空，自动提取文件名
            if (!this.editAudioForm.name) {
              this.editAudioForm.name = this.extractNameFromPath(filePath)
            }
            // 自动获取音频时长
            this.editAudioForm.duration = await this.getAudioDuration(filePath)
          }
        } else {
          this.showToastNotification('当前环境不支持文件选择功能')
        }
      } catch (error) {
        console.error('选择音频文件失败:', error)
        this.showToastNotification('选择音频文件失败: ' + error.message)
      }
    },
    
    async selectEditThumbnailFile() {
      try {
        if (window.electronAPI && window.electronAPI.selectImageFile) {
          const filePath = await window.electronAPI.selectImageFile()
          if (filePath) {
            this.editAudioForm.thumbnailPath = filePath
          }
        } else {
          alert('当前环境不支持文件选择功能')
        }
      } catch (error) {
        console.error('选择缩略图文件失败:', error)
        alert('选择缩略图文件失败: ' + error.message)
      }
    },
    
    // 获取缩略图URL
    getThumbnailUrl(thumbnailPath) {
      if (!thumbnailPath) return ''
      if (window.electronAPI && window.electronAPI.getFileUrl) {
        return window.electronAPI.getFileUrl(thumbnailPath)
      }
      return thumbnailPath.startsWith('file://') ? thumbnailPath : `file://${thumbnailPath}`
    },
    
    // 保存编辑
    async saveEditedAudio() {
      try {
        if (!this.editAudioForm.name.trim()) {
          alert('请输入音频名称')
          return
        }
        
        if (!this.editAudioForm.filePath.trim()) {
          alert('请选择音频文件')
          return
        }
        
        const audioData = {
          name: this.editAudioForm.name.trim(),
          artist: this.editAudioForm.artist.trim(),
          filePath: this.editAudioForm.filePath,
          thumbnailPath: this.editAudioForm.thumbnailPath,
          actors: this.editAudioForm.actors,
          tags: this.editAudioForm.tags,
          notes: this.editAudioForm.notes.trim()
        }
        
        await audioManager.updateAudio(this.editAudioForm.id, audioData)
        
        // 重新加载音频列表
        await this.loadAudios()
        
        // 关闭编辑对话框
        this.closeEditDialog()
        
        this.showNotification('音频更新成功', `已更新音频: ${audioData.name}`)
      } catch (error) {
        console.error('更新音频失败:', error)
        alert('更新音频失败: ' + error.message)
      }
    },
    
    formatDuration(seconds) {
      if (!seconds || seconds === 0) return '未知时长'
      const hours = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = Math.floor(seconds % 60)
      
      if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      }
      return `${mins}:${secs.toString().padStart(2, '0')}`
    },
    formatDate(dateString) {
      if (!dateString) return '未知'
      try {
        return new Date(dateString).toLocaleDateString('zh-CN')
      } catch {
        return '未知'
      }
    },

    // 更新音频时长
    async updateAudioDuration(audio) {
      try {
        if (!audio.filePath) {
          alert('音频文件路径不存在')
          return
        }
        
        console.log('🔄 开始更新音频时长:', audio.name)
        const duration = await this.getAudioDuration(audio.filePath)
        
        if (duration > 0) {
          // 更新音频数据
          await audioManager.updateAudio(audio.id, { duration })
          
          // 更新本地数据
          const index = this.audios.findIndex(a => a.id === audio.id)
          if (index !== -1) {
            this.audios[index].duration = duration
          }
          
          // 更新选中的音频数据
          if (this.selectedAudio && this.selectedAudio.id === audio.id) {
            this.selectedAudio.duration = duration
          }
          
          console.log('✅ 音频时长更新成功:', duration, '秒')
          this.showNotification('时长更新成功', `音频时长已更新为: ${this.formatDuration(duration)}`)
        } else {
          alert('无法获取音频时长，请检查文件是否有效')
        }
      } catch (error) {
        console.error('更新音频时长失败:', error)
        alert('更新音频时长失败: ' + error.message)
      }
    },

    // 获取音频时长
    async getAudioDuration(filePath) {
      return new Promise(async (resolve) => {
        try {
          console.log('🎵 开始获取音频时长:', filePath)
          
          // 创建音频元素
          const audio = document.createElement('audio')
          audio.preload = 'metadata'
          audio.crossOrigin = 'anonymous'
          
          let audioSrc = ''
          
          // 优先尝试使用 readFileAsDataUrl 方法
          if (window.electronAPI && window.electronAPI.readFileAsDataUrl) {
            try {
              console.log('🔄 尝试使用 readFileAsDataUrl 方法...')
              const result = await window.electronAPI.readFileAsDataUrl(filePath)
              if (result.success) {
                audioSrc = result.dataUrl
                console.log('✅ 使用 readFileAsDataUrl 成功')
                audio.src = audioSrc
              } else {
                throw new Error(result.error || 'readFileAsDataUrl 失败')
              }
            } catch (error) {
              console.warn('⚠️ readFileAsDataUrl 失败，尝试 getFileUrl:', error)
              
              // 降级到 getFileUrl 方法
              if (window.electronAPI && window.electronAPI.getFileUrl) {
                try {
                  const urlResult = await window.electronAPI.getFileUrl(filePath)
                  if (urlResult.success) {
                    audioSrc = urlResult.url
                    console.log('✅ 使用 getFileUrl 成功:', audioSrc)
                    audio.src = audioSrc
                  } else {
                    throw new Error(urlResult.error || 'getFileUrl 失败')
                  }
                } catch (urlError) {
                  console.warn('⚠️ getFileUrl 也失败，使用降级处理:', urlError)
                  audioSrc = filePath.startsWith('file://') ? filePath : `file://${filePath}`
                  console.log('🔗 使用降级 URL:', audioSrc)
                  audio.src = audioSrc
                }
              } else {
                audioSrc = filePath.startsWith('file://') ? filePath : `file://${filePath}`
                console.log('🔗 使用降级 URL:', audioSrc)
                audio.src = audioSrc
              }
            }
          } else {
            // 降级处理：直接使用文件路径
            audioSrc = filePath.startsWith('file://') ? filePath : `file://${filePath}`
            console.log('🔗 使用降级 URL:', audioSrc)
            audio.src = audioSrc
          }
          
          const cleanup = () => {
            try {
              audio.removeEventListener('error', onError)
              audio.removeEventListener('loadedmetadata', onLoadedMeta)
              if (document.body.contains(audio)) {
                document.body.removeChild(audio)
              }
            } catch (e) {
              console.warn('清理 audio 元素时出错:', e)
            }
          }
          
          const onError = (event) => {
            console.warn('❌ 音频加载失败，无法获取时长')
            console.warn('❌ 错误详情:', {
              error: event,
              src: audioSrc,
              networkState: audio.networkState,
              readyState: audio.readyState,
              errorCode: audio.error ? audio.error.code : 'unknown'
            })
            cleanup()
            resolve(0)
          }
          
          const onLoadedMeta = () => {
            try {
              console.log('📊 音频元数据加载完成')
              console.log('⏱️ 音频时长:', audio.duration)
              
              const duration = Math.max(0, Number(audio.duration) || 0)
              
              console.log('✅ 音频时长获取成功:', duration, '秒')
              cleanup()
              resolve(duration)
            } catch (err) {
              console.error('❌ 获取音频时长时出错:', err)
              cleanup()
              resolve(0)
            }
          }
          
          audio.addEventListener('error', onError)
          audio.addEventListener('loadedmetadata', onLoadedMeta, { once: true })
          
          // 将元素附加到文档，确保某些浏览器能正确触发事件
          audio.style.display = 'none'
          document.body.appendChild(audio)
          
          // 设置超时，避免无限等待
          setTimeout(() => {
            if (audio.readyState === 0) {
              console.warn('⏰ 音频加载超时')
              console.warn('⏰ 超时详情:', {
                src: audioSrc,
                networkState: audio.networkState,
                readyState: audio.readyState
              })
              cleanup()
              resolve(0)
            }
          }, 10000) // 10秒超时
          
        } catch (error) {
          console.error('❌ 创建音频元素失败:', error)
          resolve(0)
        }
      })
    },
    
    extractNameFromPath(filePath) {
      if (!filePath) return ''
      const normalized = filePath.replace(/\\/g, '/')
      const filename = normalized.substring(normalized.lastIndexOf('/') + 1)
      const dotIndex = filename.lastIndexOf('.')
      return dotIndex > 0 ? filename.substring(0, dotIndex) : filename
    },
    
    showNotification(title, message) {
      // 简单的通知实现
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
        const { notify } = await import('../utils/NotificationService.js')
        
        if (results && results.length > 0) {
          // 批量操作结果通知
          notify.batch(title, results)
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

    // 拖拽处理方法
    handleDragOver(event) {
      event.preventDefault()
    },
    
    handleDragEnter(event) {
      event.preventDefault()
      this.isDragOver = true
    },
    
    handleDragLeave(event) {
      event.preventDefault()
      this.isDragOver = false
    },
    
    async handleDrop(event) {
      event.preventDefault()
      this.isDragOver = false
      
      try {
        const files = Array.from(event.dataTransfer.files)
        
        console.log('=== 拖拽调试信息 ===')
        console.log('拖拽文件数量:', files.length)
        console.log('拖拽文件详细信息:', files.map(f => ({
          name: f.name,
          path: f.path,
          type: f.type,
          size: f.size
        })))
        console.log('当前音频库状态:')
        this.audios.forEach((audio, index) => {
          console.log(`  ${index + 1}. ${audio.name}`)
          console.log(`     路径: ${audio.filePath}`)
          console.log(`     文件存在: ${audio.fileExists}`)
        })
        
        if (files.length === 0) {
          this.showToastNotification('拖拽失败', '请拖拽音频文件到此处')
          return
        }
        
        // 过滤出支持的音频文件
        const supportedExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma']
        const audioFiles = files.filter(file => {
          const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
          return supportedExtensions.includes(ext)
        })
        
        if (audioFiles.length === 0) {
          this.showToastNotification('文件类型不支持', '请拖拽音频文件（.mp3、.wav、.flac等）')
          return
        }
        
        console.log('检测到音频文件数量:', audioFiles.length)
        
        let addedCount = 0
        let failedCount = 0
        let failedReasons = []
        
        for (const audioFile of audioFiles) {
          try {
            // 检查是否已经存在相同的文件路径
            const existingAudioByPath = this.audios.find(audio => audio.filePath === audioFile.path)
            if (existingAudioByPath) {
              console.log(`音频文件已存在: ${audioFile.name}`)
              failedReasons.push(`"${audioFile.name}" 已存在于库中`)
              failedCount++
              continue
            }
            
            // 检查是否存在同名但路径不同的丢失文件
            const existingAudioByName = this.audios.find(audio => {
              const audioFileName = audio.filePath.split(/[\\/]/).pop().toLowerCase()
              const newFileName = audioFile.name.toLowerCase()
              const isSameName = audioFileName === newFileName
              const isFileMissing = !audio.fileExists
              
              console.log(`检查音频: ${audio.name}`)
              console.log(`  文件名: ${audioFileName} vs ${newFileName}`)
              console.log(`  是否同名: ${isSameName}`)
              console.log(`  文件存在: ${audio.fileExists}`)
              console.log(`  是否丢失: ${isFileMissing}`)
              console.log(`  匹配条件: ${isSameName && isFileMissing}`)
              
              return isSameName && isFileMissing
            })
            
            if (existingAudioByName) {
              console.log(`发现同名丢失文件: ${audioFile.name}`)
              console.log(`现有音频路径: ${existingAudioByName.filePath}`)
              console.log(`新文件路径: ${audioFile.path}`)
              // 显示路径更新确认对话框
              this.pathUpdateInfo = {
                existingAudio: existingAudioByName,
                newPath: audioFile.path,
                newFileName: audioFile.name
              }
              this.showPathUpdateDialog = true
              // 暂停处理，等待用户确认
              return
            }
            
            // 创建新的音频对象
            const audioData = {
              name: this.extractNameFromPath(audioFile.name),
              artist: '未知艺术家',
              filePath: audioFile.path,
              thumbnailPath: '',
              actors: [],
              tags: [],
              notes: '',
              duration: 0,
              addedDate: new Date().toISOString()
            }
            
            console.log('创建音频对象:', audioData)
            
            // 添加到音频管理器
            const audio = await audioManager.addAudio(audioData)
            this.audios.push(audio)
            addedCount++
            
          } catch (error) {
            console.error(`添加音频文件失败: ${audioFile.name}`, error)
            failedReasons.push(`"${audioFile.name}" 添加失败: ${error.message}`)
            failedCount++
          }
        }
        
        // 重新加载音频列表
        await this.loadAudios()
        
        // 显示结果通知
        if (addedCount > 0 && failedCount === 0) {
          this.showToastNotification('添加成功', `成功添加 ${addedCount} 个音频`)
        } else if (addedCount > 0 && failedCount > 0) {
          this.showToastNotification('部分成功', `成功添加 ${addedCount} 个音频，${failedCount} 个文件添加失败：${failedReasons.join('；')}`)
        } else if (addedCount === 0 && failedCount > 0) {
          this.showToastNotification('添加失败', `${failedCount} 个文件添加失败：${failedReasons.join('；')}`)
        }
        
        console.log(`拖拽处理完成: 成功 ${addedCount} 个，失败 ${failedCount} 个`)
        
      } catch (error) {
        console.error('处理拖拽文件失败:', error)
        this.showToastNotification('处理失败', `处理拖拽文件失败: ${error.message}`)
      }
    },

    // 路径更新相关方法
    closePathUpdateDialog() {
      this.showPathUpdateDialog = false
      this.pathUpdateInfo = {
        existingAudio: null,
        newPath: '',
        newFileName: ''
      }
    },
    
    async confirmPathUpdate() {
      try {
        const { existingAudio, newPath } = this.pathUpdateInfo
        
        if (!existingAudio || !newPath) {
          console.error('路径更新信息不完整')
          this.showToastNotification('更新失败', '路径更新信息不完整')
          return
        }
        
        console.log(`更新音频 "${existingAudio.name}" 的路径:`)
        console.log(`旧路径: ${existingAudio.filePath}`)
        console.log(`新路径: ${newPath}`)
        
        // 更新音频路径
        existingAudio.filePath = newPath
        existingAudio.fileExists = true
        
        // 重新获取音频时长（如果之前没有）
        if (!existingAudio.duration || existingAudio.duration === 0) {
          try {
            console.log('🔄 重新获取音频时长...')
            const duration = await this.getAudioDuration(newPath)
            if (duration > 0) {
              existingAudio.duration = duration
              console.log('✅ 音频时长更新成功:', duration, '秒')
            }
          } catch (e) {
            console.warn('获取音频时长失败:', e)
          }
        }
        
        // 保存更新后的数据
        await audioManager.updateAudio(existingAudio.id, {
          filePath: newPath,
          fileExists: true,
          duration: existingAudio.duration
        })
        
        // 重新加载音频列表
        await this.loadAudios()
        
        // 关闭对话框
        this.closePathUpdateDialog()
        
        // 显示成功通知
        this.showToastNotification(
          '路径更新成功', 
          `音频 "${existingAudio.name}" 的路径已更新`
        )
        
        console.log(`音频 "${existingAudio.name}" 路径更新完成`)
        
      } catch (error) {
        console.error('更新音频路径失败:', error)
        this.showToastNotification('更新失败', `更新音频路径失败: ${error.message}`)
      }
    },
    async handleSortChanged({ pageType, sortBy }) {
      try {
        const saveManager = (await import('../utils/SaveManager.js')).default
        await saveManager.saveSortSetting(pageType, sortBy)
        console.log(`✅ 已保存${pageType}页面排序方式:`, sortBy)
      } catch (error) {
        console.warn('保存排序方式失败:', error)
      }
    },
    async loadSortSetting() {
      try {
        const saveManager = (await import('../utils/SaveManager.js')).default
        const savedSortBy = await saveManager.getSortSetting('audio')
        if (savedSortBy && savedSortBy !== this.sortBy) {
          this.sortBy = savedSortBy
          console.log('✅ 已加载音频页面排序方式:', savedSortBy)
        }
      } catch (error) {
        console.warn('加载排序方式失败:', error)
      }
    },
    
    // 处理分页组件的事件
    handleAudioPageChange(pageNum) {
      this.currentAudioPage = pageNum
    },
    
    // 更新音频列表分页信息
    updateAudioPagination() {
      this.totalAudioPages = Math.ceil(this.filteredAudios.length / this.audioPageSize)
      // 确保当前页不超过总页数
      if (this.currentAudioPage > this.totalAudioPages && this.totalAudioPages > 0) {
        this.currentAudioPage = this.totalAudioPages
      }
      // 如果当前页为0且没有数据，重置为1
      if (this.currentAudioPage === 0 && this.filteredAudios.length > 0) {
        this.currentAudioPage = 1
      }
    },
    
    // 从设置中加载音频分页配置
    async loadAudioPaginationSettings() {
      try {
        const saveManager = (await import('../utils/SaveManager.js')).default
        const settings = await saveManager.loadSettings()
        
        if (settings && settings.audio) {
          const newAudioPageSize = parseInt(settings.audio.listPageSize) || 20
          
          // 更新音频列表分页大小
          if (this.audioPageSize !== newAudioPageSize) {
            this.audioPageSize = newAudioPageSize
            
            // 重新计算音频列表分页
            this.updateAudioPagination()
            
            console.log('音频列表分页设置已更新:', {
              listPageSize: this.audioPageSize,
              totalAudioPages: this.totalAudioPages,
              currentAudioPage: this.currentAudioPage
            })
          }
        }
      } catch (error) {
        console.error('加载音频分页设置失败:', error)
        // 使用默认值
        this.audioPageSize = 20
      }
    }
  },
  watch: {
    // 监听筛选结果变化，更新分页信息
    filteredAudios: {
      handler() {
        this.updateAudioPagination()
      },
      immediate: false
    },
    // 监听搜索查询变化，重置到第一页
    searchQuery() {
      this.currentAudioPage = 1
    },
    // 监听排序变化，重置到第一页
    sortBy() {
      this.currentAudioPage = 1
    }
  },
  async mounted() {
    await this.loadAudios()
    
    // 加载音频分页设置
    await this.loadAudioPaginationSettings()
    
    // 加载排序设置
    await this.loadSortSetting()
    
    // 初始化筛选器数据
    this.updateFilterData()
  }
}
</script>

<style scoped>
/* 音频主内容区域 */
.audio-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  height: 100%;
  overflow-y: auto;
}

/* 主要内容区域 */
.audio-main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: calc(100vh - 120px);
  padding: 20px;
  box-sizing: border-box;
}

/* 音频网格样式 */
.audios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  padding: 20px;
}

/* 拖拽状态样式 */
.audio-content.drag-over {
  background-color: rgba(102, 192, 244, 0.1);
  border: 2px dashed var(--accent-color);
}

/* 工具栏样式 */

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  padding: 10px 40px 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  width: 300px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 192, 244, 0.1);
}

.search-icon {
  position: absolute;
  right: 12px;
  color: var(--text-secondary);
  pointer-events: none;
}

.sort-select {
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-select:focus {
  outline: none;
  border-color: var(--accent-color);
}


/* 音频网格样式 */
.audios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
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
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: background-color 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  color: var(--text-primary);
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 5px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.btn-close:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
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
  gap: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: var(--text-primary);
  font-weight: 500;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 192, 244, 0.1);
}

.file-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.file-path-input {
  flex: 1;
}

.btn-browse {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-browse:hover {
  background: var(--accent-hover);
}

/* 按钮样式 */
.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
}

.btn-confirm {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-confirm:hover {
  background: var(--accent-hover);
}

/* 音频详情样式 */
.audio-detail-modal {
  max-width: 800px;
}

.audio-detail-content {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 30px;
}

.audio-detail-thumbnail {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  height: 200px;
  overflow: hidden;
}

.audio-detail-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

.audio-detail-icon {
  font-size: 4rem;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.audio-detail-info {
  flex: 1;
}

.detail-section {
  margin-bottom: 25px;
}

.detail-section h4 {
  color: var(--text-primary);
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.detail-value {
  color: var(--text-primary);
  font-size: 1rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  background: var(--accent-color);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.notes-text {
  color: var(--text-primary);
  line-height: 1.5;
  background: var(--bg-secondary);
  padding: 15px;
  border-radius: 8px;
  margin: 0;
}

/* 详情按钮样式 */
.btn-play {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-play:hover {
  background: var(--accent-hover);
}

.btn-open-folder {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-open-folder:hover {
  background: #059669;
}

.btn-edit {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-edit:hover {
  background: #d97706;
}

.btn-delete {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-delete:hover {
  background: #dc2626;
}

.btn-add-to-playlist {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-add-to-playlist:hover {
  background: #7c3aed;
}

.btn-update-duration {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 10px 20px;
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

/* 标签输入样式 */
.tags-input-container {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 8px;
  background: var(--bg-secondary);
  transition: all 0.3s ease;
}

.tags-input-container:focus-within {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 192, 244, 0.1);
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  background: var(--accent-color);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  gap: 4px;
}

.tag-text {
  font-weight: 500;
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.tag-remove:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tag-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.9rem;
  padding: 4px 0;
}

.tag-input::placeholder {
  color: var(--text-tertiary);
}

.tag-hint {
  font-size: 0.7rem;
  color: var(--text-tertiary);
  margin-top: 4px;
}

/* 演员标签样式 */
.actor-tag {
  background: #8b5cf6 !important;
}

/* 缩略图预览样式 */
.thumbnail-preview {
  margin-top: 15px;
  text-align: center;
  padding: 10px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.preview-image {
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--shadow-light);
  object-fit: cover;
  transition: transform 0.3s ease;
}

.preview-image:hover {
  transform: scale(1.05);
}

/* 拖拽样式 */
.audio-content {
  position: relative;
  transition: all 0.3s ease;
}

.audio-content.drag-over {
  background: rgba(59, 130, 246, 0.1);
  border: 2px dashed var(--accent-color);
  border-radius: 12px;
}

.audio-content.drag-over::before {
  content: '拖拽音频文件到这里添加音频（支持多选）';
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

/* 响应式设计 */
@media (max-width: 768px) {
  .audios-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
  
  
  .audio-detail-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
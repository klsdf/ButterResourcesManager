<template>
  <div class="audio-view">
    <!-- 工具栏 -->
    <Toolbar 
      v-model:searchQuery="searchQuery"
      v-model:sortBy="sortBy"
      add-button-text="添加音频"
      search-placeholder="搜索音频..."
      :sort-options="audioSortOptions"
      @add-item="showAddDialog = true"
    />
    
    <!-- 刷新按钮 -->
    <div class="audio-actions" style="margin-bottom: 20px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
      <button class="btn-refresh" @click="loadAudios" style="padding: 8px 12px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
        <span class="btn-icon">🔄</span>
        刷新
      </button>
    </div>


    <!-- 音频列表 -->
    <div class="audios-grid" v-if="filteredAudios.length > 0">
      <MediaCard
        v-for="audio in filteredAudios" 
        :key="audio.id"
        :item="audio"
        type="audio"
        :isElectronEnvironment="true"
        @click="showAudioDetail"
        @contextmenu="showContextMenu"
        @action="playAudio"
      />
    </div>

    <!-- 空状态 -->
    <EmptyState 
      v-else-if="audios.length === 0"
      icon="🎵"
      title="你的音频库是空的"
      description="点击&quot;添加音频&quot;按钮来添加你的第一个音频"
      :show-button="true"
      button-text="添加第一个音频"
      @action="showAddDialog = true"
    />

    <!-- 无搜索结果 -->
    <EmptyState 
      v-else
      icon="🔍"
      title="没有找到匹配的音频"
      description="尝试使用不同的搜索词"
    />

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
    <div v-if="selectedAudio" class="modal-overlay" @click="closeAudioDetail">
      <div class="modal-content audio-detail-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedAudio.name }}</h3>
          <button class="btn-close" @click="closeAudioDetail">×</button>
        </div>
        
        <div class="modal-body">
          <div class="audio-detail-content">
            <div class="audio-detail-thumbnail">
              <img v-if="selectedAudio.thumbnailPath" :src="getThumbnailUrl(selectedAudio.thumbnailPath)" :alt="selectedAudio.name" class="audio-detail-img">
              <div v-else class="audio-detail-icon">🎵</div>
            </div>
            
            <div class="audio-detail-info">
              <div class="detail-section">
                <h4>基本信息</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">艺术家:</span>
                    <span class="detail-value">{{ selectedAudio.artist || '未知' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">时长:</span>
                    <span class="detail-value">{{ formatDuration(selectedAudio.duration) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">播放次数:</span>
                    <span class="detail-value">{{ selectedAudio.playCount || 0 }} 次</span>
                  </div>
                </div>
              </div>
              
              <div class="detail-section" v-if="selectedAudio.actors && selectedAudio.actors.length > 0">
                <h4>演员</h4>
                <div class="tags-list">
                  <span v-for="actor in selectedAudio.actors" :key="actor" class="tag actor-tag">{{ actor }}</span>
                </div>
              </div>
              
              <div class="detail-section" v-if="selectedAudio.tags && selectedAudio.tags.length > 0">
                <h4>标签</h4>
                <div class="tags-list">
                  <span v-for="tag in selectedAudio.tags" :key="tag" class="tag">{{ tag }}</span>
                </div>
              </div>
              
              <div class="detail-section" v-if="selectedAudio.notes">
                <h4>备注</h4>
                <p class="notes-text">{{ selectedAudio.notes }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" @click="playAudio(selectedAudio)" class="btn-play">
            ▶️ 播放
          </button>
          <button type="button" @click="addToPlaylist(selectedAudio)" class="btn-add-to-playlist">
            ➕ 添加到播放列表
          </button>
          <button type="button" @click="updateAudioDuration(selectedAudio)" class="btn-update-duration" v-if="!selectedAudio.duration || selectedAudio.duration === 0">
            ⏱️ 更新时长
          </button>
          <button type="button" @click="openAudioFolder(selectedAudio)" class="btn-open-folder">
            📁 打开文件夹
          </button>
          <button type="button" @click="editAudio(selectedAudio)" class="btn-edit">
            编辑
          </button>
          <button type="button" @click="deleteAudio(selectedAudio)" class="btn-delete">
            删除
          </button>
        </div>
      </div>
    </div>

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

    <!-- 右键菜单 -->
    <ContextMenu
      :visible="contextMenu.visible"
      :position="{ x: contextMenu.x, y: contextMenu.y }"
      :menu-items="audioContextMenuItems"
      @item-click="handleContextMenuClick"
    />
  </div>
</template>

<script>
import audioManager from '../utils/AudioManager.js'
import Toolbar from '../components/Toolbar.vue'
import EmptyState from '../components/EmptyState.vue'
import ContextMenu from '../components/ContextMenu.vue'
import FormField from '../components/FormField.vue'
import MediaCard from '../components/MediaCard.vue'

export default {
  name: 'AudioView',
  components: {
    Toolbar,
    EmptyState,
    ContextMenu,
    FormField,
    MediaCard
  },
  emits: ['filter-data-updated'],
  data() {
    return {
      audios: [],
      searchQuery: '',
      sortBy: 'name',
      // 筛选器相关数据
      selectedTag: null,
      selectedArtist: null,
      excludedTag: null,
      excludedArtist: null,
      allTags: [],
      allArtists: [],
      showAddDialog: false,
      selectedAudio: null,
      contextMenu: {
        visible: false,
        x: 0,
        y: 0
      },
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
      
      // 标签筛选
      if (this.selectedTag) {
        filtered = filtered.filter(audio => 
          audio.tags && audio.tags.includes(this.selectedTag)
        )
      }
      if (this.excludedTag) {
        filtered = filtered.filter(audio => 
          !(audio.tags && audio.tags.includes(this.excludedTag))
        )
      }
      
      // 艺术家筛选
      if (this.selectedArtist) {
        filtered = filtered.filter(audio => 
          audio.artist === this.selectedArtist
        )
      }
      if (this.excludedArtist) {
        filtered = filtered.filter(audio => 
          audio.artist !== this.excludedArtist
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
  },
  methods: {
    async loadAudios() {
      try {
        this.audios = await audioManager.loadAudios()
        console.log('音频数据加载完成:', this.audios.length, '个音频')
        // 更新筛选器数据
        this.updateFilterOptions()
        this.updateFilterData()
      } catch (error) {
        console.error('加载音频数据失败:', error)
        alert('加载音频数据失败: ' + error.message)
      }
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
      if (this.selectedTag === tagName) {
        // 如果当前是选中状态，则取消选择
        this.selectedTag = null
      } else if (this.excludedTag === tagName) {
        // 如果当前是排除状态，则切换为选中状态
        this.excludedTag = null
        this.selectedTag = tagName
      } else {
        // 否则直接设置为选中状态
        this.selectedTag = tagName
      }
      this.updateFilterData()
    },
    
    clearTagFilter() {
      this.selectedTag = null
      this.excludedTag = null
      this.updateFilterData()
    },
    
    filterByArtist(artistName) {
      if (this.selectedArtist === artistName) {
        // 如果当前是选中状态，则取消选择
        this.selectedArtist = null
      } else if (this.excludedArtist === artistName) {
        // 如果当前是排除状态，则切换为选中状态
        this.excludedArtist = null
        this.selectedArtist = artistName
      } else {
        // 否则直接设置为选中状态
        this.selectedArtist = artistName
      }
      this.updateFilterData()
    },
    
    clearArtistFilter() {
      this.selectedArtist = null
      this.excludedArtist = null
      this.updateFilterData()
    },
    
    // 排除方法
    excludeByTag(tagName) {
      if (this.excludedTag === tagName) {
        // 如果已经是排除状态，则取消排除
        this.excludedTag = null
      } else if (this.selectedTag === tagName) {
        // 如果当前是选中状态，则切换为排除状态
        this.selectedTag = null
        this.excludedTag = tagName
      } else {
        // 否则直接设置为排除状态
        this.excludedTag = tagName
      }
      this.updateFilterData()
    },
    
    excludeByArtist(artistName) {
      if (this.excludedArtist === artistName) {
        // 如果已经是排除状态，则取消排除
        this.excludedArtist = null
      } else if (this.selectedArtist === artistName) {
        // 如果当前是选中状态，则切换为排除状态
        this.selectedArtist = null
        this.excludedArtist = artistName
      } else {
        // 否则直接设置为排除状态
        this.excludedArtist = artistName
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
            this.excludedTag = null
          } else if (data === 'artists') {
            this.clearArtistFilter()
            this.excludedArtist = null
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
            selected: this.selectedTag,
            excluded: this.excludedTag
          },
          {
            key: 'artists',
            title: '艺术家筛选',
            items: this.allArtists,
            selected: this.selectedArtist,
            excluded: this.excludedArtist
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
          alert('当前环境不支持文件选择功能')
        }
      } catch (error) {
        console.error('选择音频文件失败:', error)
        alert('选择音频文件失败: ' + error.message)
      }
    },
    
    async addAudio() {
      try {
        if (!this.newAudio.filePath) {
          alert('请选择音频文件')
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
        alert('添加音频失败: ' + error.message)
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
        alert('播放音频失败: ' + error.message)
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
          alert('音频文件路径不存在')
          return
        }
        
        if (window.electronAPI && window.electronAPI.openFileFolder) {
          const result = await window.electronAPI.openFileFolder(audio.filePath)
          if (result.success) {
            console.log('已打开音频文件夹:', result.folderPath)
            alert(`已打开音频文件夹: ${result.folderPath}`)
          } else {
            console.error('打开文件夹失败:', result.error)
            alert(`打开文件夹失败: ${result.error}`)
          }
        } else {
          // 降级处理：在浏览器中显示路径
          alert(`音频文件位置:\n${audio.filePath}`)
        }
      } catch (error) {
        console.error('打开音频文件夹失败:', error)
        alert(`打开文件夹失败: ${error.message}`)
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
    
    showContextMenu(event, audio) {
      event.preventDefault()
      this.contextMenu = {
        visible: true,
        x: event.clientX,
        y: event.clientY
      }
      // 临时存储选中的音频，用于右键菜单操作
      this.contextMenu.selectedAudio = audio
    },
    handleContextMenuClick(item) {
      this.contextMenu.visible = false
      const audio = this.contextMenu.selectedAudio
      if (!audio) return
      
      switch (item.key) {
        case 'detail':
          this.showAudioDetail(audio)
          break
        case 'play':
          this.playAudio(audio)
          break
        case 'addToPlaylist':
          this.addToPlaylist(audio)
          break
        case 'folder':
          this.openAudioFolder(audio)
          break
        case 'edit':
          this.editAudio(audio)
          break
        case 'delete':
          this.deleteAudio(audio)
          break
      }
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
          alert('当前环境不支持文件选择功能')
        }
      } catch (error) {
        console.error('选择音频文件失败:', error)
        alert('选择音频文件失败: ' + error.message)
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
    }
  },
  async mounted() {
    await this.loadAudios()
    
    // 点击其他地方关闭右键菜单
    document.addEventListener('click', () => {
      this.contextMenu.visible = false
    })
  }
}
</script>

<style scoped>
.audio-view {
  padding: 20px;
  max-width: 1400px;
  /* margin: 0 auto; */
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
<template>
  <div class="link-management">
    <t-card title="链接管理">
      <!-- 第一行：操作栏 -->
      <div class="operation-bar">
        <div class="left">
          <t-button theme="primary" @click="showCreateDialog">添加链接</t-button>
        </div>
        <div class="right">
          <t-form :data="searchForm" layout="inline">
            <t-form-item label="链接类型">
              <t-select v-model="searchForm.type" placeholder="请选择链接类型" clearable @change="searchLinks" @clear="searchLinks">
                <t-option v-for="item in typeOptions" :key="item.value" :value="item.value" :label="item.label" />
              </t-select>
            </t-form-item>
            <t-form-item label="备案域名">
              <t-input v-model="searchForm.domain" clearable placeholder="请输入备案域名" @change="searchLinks" @clear="searchLinks" />
            </t-form-item>
            <t-form-item label="ICP备案企业名称">
              <t-input v-model="searchForm.icp_enterprise_name" clearable placeholder="请输入ICP备案企业名称" @change="searchLinks" @clear="searchLinks" />
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" @click="searchLinks">查询</t-button>
            </t-form-item>
          </t-form>
        </div>
      </div>

      <!-- 第二行：数据表格 -->
      <t-table
        :data="linkList"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @page-change="onPageChange"
        stripe
        row-key="id"
        class="link-table"
      >
        <template #icp_screenshot="{ row }">
          <img v-if="row.icp_screenshot" :src="row.icp_screenshot" alt="ICP备案截图" style="width: 100px; height: auto;" />
        </template>
        <template #operation="{ row }">
          <t-space size="small">
            <t-button theme="primary" size="small" @click="editLink(row)">编辑</t-button>
            <t-button theme="danger" size="small" @click="deleteLink(row)">删除</t-button>
          </t-space>
        </template>
      </t-table>

      <!-- 创建/编辑链接弹窗 -->
      <t-dialog
        v-model:visible="dialogVisible"
        :header="isEdit ? '编辑链接' : '添加链接'"
        width="600px"
        :footer="false"
      >
        <t-form
          ref="linkForm"
          :data="formData"
          :rules="rules"
          label-width="150px"
          @submit="submitForm"
        >
          <t-form-item label="链接类型" name="type">
            <t-select v-model="formData.type" placeholder="请选择链接类型">
              <t-option v-for="item in typeOptions" :key="item.value" :value="item.value" :label="item.label" />
            </t-select>
          </t-form-item>
          <t-form-item label="短信链接" name="short_url">
            <t-input v-model="formData.short_url" placeholder="短信内容中的完整链接案例，填写一个案例即可" />
          </t-form-item>
          <t-form-item label="长链接" name="long_url">
            <t-input v-model="formData.long_url" placeholder="短信内容中的完整链接案例（若该链接为短链，此处填写跳转后的最终网址）" />
          </t-form-item>
          <t-form-item label="备案域名" name="domain">
            <t-input v-model="formData.domain" placeholder="请填写备案域名，IP请填写完整IP" />
          </t-form-item>
          <template v-if="formData.type === '2'">
            <t-form-item label="网址页面是否备案" name="is_domain_registered">
              <t-switch v-model="formData.is_domain_registered" :label="['是', '否']" />
            </t-form-item>
            <t-form-item label="ICP备案号" name="icp_number">
              <t-input v-model="formData.icp_number" placeholder="请输入ICP备案号" />
            </t-form-item>
            <t-form-item label="ICP备案截图" name="icp_screenshot">
              <t-input v-model="formData.icp_screenshot" placeholder="请上传ICP备案截图" readonly />
              <t-button type="button" @click="triggerUpload">上传图片</t-button>
              <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*" style="display: none;" />
              <img v-if="formData.icp_screenshot" :src="formData.icp_screenshot" alt="ICP备案截图预览" style="max-width: 200px; margin-top: 10px;" />
            </t-form-item>
            <t-form-item label="ICP备案企业名称" name="icp_enterprise_name">
              <t-input v-model="formData.icp_enterprise_name" placeholder="请输入ICP备案企业名称" />
            </t-form-item>
            <t-form-item label="ICP备案企业社会统一信用代码" name="icp_enterprise_credit_code">
              <t-input v-model="formData.icp_enterprise_credit_code" placeholder="请输入ICP备案企业社会统一信用代码" />
            </t-form-item>
          </template>
          <t-form-item>
            <t-space>
              <t-button theme="primary" type="submit">确定</t-button>
              <t-button theme="default" variant="base" @click="dialogVisible = false">取消</t-button>
            </t-space>
          </t-form-item>
        </t-form>
      </t-dialog>

      <!-- 删除确认弹窗 -->
      <t-dialog
        v-model:visible="deleteDialogVisible"
        header="删除确认"
        body="确定要删除该链接吗？"
        :on-confirm="confirmDelete"
        :on-cancel="() => (deleteDialogVisible = false)"
      />
    </t-card>
  </div>
</template>

<script>
import dayjs from 'dayjs';
import { dbService } from '@/utils/db';

export default {
  name: 'LinkManagement',
  data() {
    return {
      // 表格数据
      linkList: [],
      loading: false,
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        showJumper: true,
        showPageSize: true,
        pageSizeOptions: [10, 20, 50],
      },
      columns: [
        { colKey: 'id', title: 'ID', width: 80 },
        { colKey: 'type', title: '链接类型', width: 120 },
        { colKey: 'short_url', title: '短信链接', width: 200 },
        { colKey: 'long_url', title: '长链接', width: 200 },
        { colKey: 'domain', title: '备案域名', width: 150 },
        { colKey: 'is_domain_registered', title: '网址页面是否备案', width: 150 },
        { colKey: 'icp_number', title: 'ICP备案号', width: 150 },
        { colKey: 'icp_screenshot', title: 'ICP备案截图', width: 150 },
        { colKey: 'icp_enterprise_name', title: 'ICP备案企业名称', width: 200 },
        { colKey: 'icp_enterprise_credit_code', title: 'ICP备案企业社会统一信用代码', width: 200 },
        { colKey: 'created_at', title: '创建时间', width: 160, cell: (h, { row }) => this.$formatDate(row.created_at) },
        { colKey: 'updated_at', title: '更新时间', width: 160, cell: (h, { row }) => this.$formatDate(row.updated_at) },
        { colKey: 'operation', title: '操作', fixed: 'right', width: 120 },
      ],

      // 搜索表单
      searchForm: {
        type: '',
        domain: '',
        icp_enterprise_name: '',
      },

      // 创建/编辑表单
      dialogVisible: false,
      isEdit: false,
      formData: {
        type: '2', // 默认选择域名类型链接
        short_url: '',
        long_url: '',
        domain: '',
        is_domain_registered: false,
        icp_number: '',
        icp_screenshot: '',
        icp_enterprise_name: '',
        icp_enterprise_credit_code: '',
      },

      // 表单验证规则
      rules: {
        type: [{ required: true, message: '请选择链接类型', type: 'error' }],
        short_url: [{ required: true, message: '请输入短信链接', type: 'error' }],
        long_url: [{ required: true, message: '请输入长链接', type: 'error' }],
        domain: [{ required: true, message: '请输入备案域名', type: 'error' }],
        is_domain_registered: [{ required: true, message: '请选择是否备案', type: 'error' }],
        icp_number: [{ required: true, message: '请输入ICP备案号', type: 'error' }],
        icp_screenshot: [{ required: true, message: '请上传ICP备案截图', type: 'error' }],
        icp_enterprise_name: [{ required: true, message: '请输入ICP备案企业名称', type: 'error' }],
        icp_enterprise_credit_code: [{ required: true, message: '请输入ICP备案企业社会统一信用代码', type: 'error' }],
      },

      // 链接类型选项
      typeOptions: [
        { value: '1', label: 'IP类型链接' },
        { value: '2', label: '域名类型链接' },
      ],

      // 删除确认
      deleteDialogVisible: false,
      currentDeleteId: null,

      
    };
  },
  mounted() {
    this.loadLinks();
  },
  methods: {
    
    
    // 加载链接数据
    async loadLinks() {
      this.loading = true;
      try {
        const allLinks = await dbService.getAll('links');
        
        // 根据搜索条件过滤
        let filteredLinks = allLinks;
        if (this.searchForm.type) {
          filteredLinks = filteredLinks.filter(item => 
            item.type === this.searchForm.type
          );
        }
        if (this.searchForm.domain) {
          filteredLinks = filteredLinks.filter(item => 
            item.domain.includes(this.searchForm.domain)
          );
        }
        if (this.searchForm.icp_enterprise_name) {
          filteredLinks = filteredLinks.filter(item => 
            item.icp_enterprise_name && item.icp_enterprise_name.includes(this.searchForm.icp_enterprise_name)
          );
        }
        
        // 分页处理
        const start = (this.pagination.current - 1) * this.pagination.pageSize;
        const end = start + this.pagination.pageSize;
        this.linkList = filteredLinks.slice(start, end);
        this.pagination.total = filteredLinks.length;
        
        this.loading = false;
      } catch (error) {
        console.error('加载链接数据失败:', error);
        this.loading = false;
      }
    },
    
    // 搜索链接
    searchLinks() {
      this.pagination.current = 1;
      this.loadLinks();
    },
    
    // 分页变化
    onPageChange(pageInfo) {
      this.pagination.current = pageInfo.current;
      this.pagination.pageSize = pageInfo.pageSize;
      this.loadLinks();
    },
    
    // 显示创建链接弹窗
    showCreateDialog() {
      this.isEdit = false;
      this.formData = {
        type: '2', // 默认选择域名类型链接
        short_url: '',
        long_url: '',
        domain: '',
        is_domain_registered: false,
        icp_number: '',
        icp_screenshot: '',
        icp_enterprise_name: '',
        icp_enterprise_credit_code: '',
      };
      this.dialogVisible = true;
    },
    
    // 编辑链接
    editLink(row) {
      this.isEdit = true;
      this.formData = { ...row };
      this.dialogVisible = true;
    },
    
    // 删除链接
    deleteLink(row) {
      this.currentDeleteId = row.id;
      this.deleteDialogVisible = true;
    },
    
    // 确认删除
    async confirmDelete() {
      if (this.currentDeleteId === null) return;

      try {
        await dbService.remove('links', this.currentDeleteId);
        this.$message.success('删除成功');
        this.deleteDialogVisible = false;
        this.currentDeleteId = null;
        this.loadLinks();
      } catch (error) {
        console.error('删除链接失败:', error);
        this.$message.error('删除失败');
      }
    },
    
    // 触发文件上传
    triggerUpload() {
      this.$refs.fileInput.click();
    },

    // 处理文件选择
    handleFileChange(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.formData.icp_screenshot = e.target.result;
      };
      reader.onerror = () => {
        this.$message.error('图片读取失败');
      };
      reader.readAsDataURL(file);
    },
    
    // 提交表单
    async submitForm({ validateResult, firstError }) {
      if (!validateResult) {
        this.$message.error(firstError);
        return;
      }
      
      const now = dayjs().format('YYYY/MM/DD HH:mm:ss');
      const data = { ...this.formData };
      
      // 如果是IP类型链接，清空域名类型相关字段
      if (data.type === '1') {
        data.is_domain_registered = false;
        data.icp_number = '';
        data.icp_screenshot = '';
        data.icp_enterprise_name = '';
        data.icp_enterprise_credit_code = '';
      }
      
      try {
        if (this.isEdit) {
          // 更新
          data.updated_at = now;
          await dbService.put('links', data);
          this.$message.success('更新成功');
        } else {
          // 创建
          data.created_at = now;
          data.updated_at = now;
          await dbService.add('links', data);
          this.$message.success('创建成功');
        }
        this.dialogVisible = false;
        this.loadLinks();
      } catch (error) {
        console.error('提交链接失败:', error);
        this.$message.error('提交失败');
      }
    },
  },
};
</script>

<style scoped>
.link-management {
  padding: 2px;
}

.operation-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.link-table {
  margin-top: 20px;
}
</style>
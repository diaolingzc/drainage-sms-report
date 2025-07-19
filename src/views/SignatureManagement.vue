<template>
  <div class="signature-management">
    <t-card title="签名管理">
      <!-- 第一行：操作栏 -->
      <div class="operation-bar">
        <div class="left">
          <t-button theme="primary" @click="showCreateDialog">创建签名</t-button>
        </div>
        <div class="right">
          <t-form :data="searchForm" layout="inline">
            <t-form-item label="签名内容">
              <t-input v-model="searchForm.content" clearable placeholder="请输入签名内容" @change="searchSignatures" @clear="searchSignatures" />
            </t-form-item>
            <t-form-item label="签名来源">
              <t-select v-model="searchForm.source" placeholder="请选择签名来源" clearable @change="searchSignatures" @clear="searchSignatures">
                <t-option v-for="item in sourceOptions" :key="item.value" :value="item.value" :label="item.label" />
              </t-select>
            </t-form-item>
            <t-form-item label="企业名称">
              <t-input v-model="searchForm.enterprise_name" clearable placeholder="请输入企业名称" @change="searchSignatures" @clear="searchSignatures" />
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" @click="searchSignatures">查询</t-button>
            </t-form-item>
          </t-form>
        </div>
      </div>

      <!-- 第二行：数据表格 -->
      <t-table
        :data="signatureList"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @page-change="onPageChange"
        stripe
        row-key="id"
        class="signature-table"
      >
        <template #operation="{ row }">
          <t-space size="small">
            <t-button theme="primary" size="small" @click="editSignature(row)">编辑</t-button>
            <t-button theme="danger" size="small" @click="deleteSignature(row)">删除</t-button>
          </t-space>
        </template>
      </t-table>

      <!-- 创建/编辑签名弹窗 -->
      <t-dialog
        v-model:visible="dialogVisible"
        :header="isEdit ? '编辑签名' : '创建签名'"
        width="600px"
        :footer="false"
      >
        <t-form
          ref="signatureForm"
          :data="formData"
          :rules="rules"
          label-width="150px"
          @submit="submitForm"
        >
          <t-form-item label="签名内容" name="content">
            <t-input v-model="formData.content" placeholder="请输入签名内容" />
          </t-form-item>
          <t-form-item label="签名来源" name="source">
            <t-select v-model="formData.source" placeholder="请选择签名来源">
              <t-option v-for="item in sourceOptions" :key="item.value" :value="item.value" :label="item.label" />
            </t-select>
          </t-form-item>
          <t-form-item label="企业名称" name="enterprise_name">
            <t-input v-model="formData.enterprise_name" placeholder="请输入企业名称" />
          </t-form-item>
          <t-form-item label="企业统一社会信用代码" name="enterprise_credit_code">
            <t-input v-model="formData.enterprise_credit_code" placeholder="请输入企业统一社会信用代码" />
          </t-form-item>
          <t-form-item label="管理员名称" name="responsible_person">
            <t-input v-model="formData.responsible_person" placeholder="请输入管理员名称" />
          </t-form-item>
          <t-form-item label="管理员证件类型" name="responsible_person_id_type">
            <t-input v-model="formData.responsible_person_id_type" placeholder="身份证" disabled />
          </t-form-item>
          <t-form-item label="管理员证件号码" name="responsible_person_id_number">
            <t-input v-model="formData.responsible_person_id_number" placeholder="请输入管理员证件号码" />
          </t-form-item>
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
        body="确定要删除该签名吗？"
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
  name: 'SignatureManagement',
  data() {
    return {
      // 表格数据
      signatureList: [],
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
        { colKey: 'content', title: '签名内容', width: 120 },
        { colKey: 'source', title: '签名来源', width: 120 },
        { colKey: 'enterprise_name', title: '企业名称', width: 200 },
        { colKey: 'enterprise_credit_code', title: '企业统一社会信用代码', width: 200 },
        { colKey: 'responsible_person', title: '管理员名称' },
        { colKey: 'responsible_person_id_type', title: '管理员证件类型' },
        { colKey: 'responsible_person_id_number', title: '管理员证件号码' },
        { colKey: 'created_at', title: '创建时间', width: 120, cell: (h, { row }) => this.$formatDate(row.created_at) },
        { colKey: 'updated_at', title: '更新时间', width: 120, cell: (h, { row }) => this.$formatDate(row.updated_at) },
        { colKey: 'operation', title: '操作', fixed: 'right', width: 120 },
      ],

      // 搜索表单
      searchForm: {
        content: '',
        source: '',
        enterprise_name: '',
      },

      // 创建/编辑表单
      dialogVisible: false,
      isEdit: false,
      formData: {
        content: '',
        source: '',
        enterprise_name: '',
        enterprise_credit_code: '',
        responsible_person: '',
        responsible_person_id_type: '身份证',
        responsible_person_id_number: '',
      },
      rules: {
        content: [{ required: true, message: '请输入签名内容', type: 'error' }],
        source: [{ required: true, message: '请选择签名来源', type: 'error' }],
        enterprise_name: [{ required: true, message: '请输入企业名称', type: 'error' }],
        enterprise_credit_code: [{ required: true, message: '请输入企业统一社会信用代码', type: 'error' }],
        responsible_person: [{ required: true, message: '请输入管理员名称', type: 'error' }],
        responsible_person_id_type: [{ required: true, message: '请选择管理员证件类型', type: 'error' }],
        responsible_person_id_number: [{ required: true, message: '请输入管理员证件号码', type: 'error' }],
      },

      // 签名来源选项
      sourceOptions: [
        { value: '公司全称', label: '公司全称' },
        { value: '公司简称', label: '公司简称' },
        { value: 'APP', label: 'APP' },
        { value: '商标', label: '商标' },
      ],

      // 删除确认
      deleteDialogVisible: false,
      currentDeleteId: null,

      
    };
  },
  mounted() {
    this.loadSignatures();
  },
  methods: {
    
    
    // 加载签名数据
    async loadSignatures() {
      this.loading = true;
      try {
        const allSignatures = await dbService.getAll('signatures');
        
        // 根据搜索条件过滤
        let filteredSignatures = allSignatures;
        if (this.searchForm.content) {
          filteredSignatures = filteredSignatures.filter(item => 
            item.content.includes(this.searchForm.content)
          );
        }
        if (this.searchForm.source) {
          filteredSignatures = filteredSignatures.filter(item => 
            item.source === this.searchForm.source
          );
        }
        if (this.searchForm.enterprise_name) {
          filteredSignatures = filteredSignatures.filter(item => 
            item.enterprise_name.includes(this.searchForm.enterprise_name)
          );
        }
        
        // 分页处理
        const start = (this.pagination.current - 1) * this.pagination.pageSize;
        const end = start + this.pagination.pageSize;
        this.signatureList = filteredSignatures.slice(start, end);
        this.pagination.total = filteredSignatures.length;
        
        this.loading = false;
      } catch (error) {
        console.error('加载签名数据失败:', error);
        this.loading = false;
      }
    },
    
    // 搜索签名
    searchSignatures() {
      this.pagination.current = 1;
      this.loadSignatures();
    },
    
    // 分页变化
    onPageChange(pageInfo) {
      this.pagination.current = pageInfo.current;
      this.pagination.pageSize = pageInfo.pageSize;
      this.loadSignatures();
    },
    
    // 显示创建签名弹窗
    showCreateDialog() {
      this.isEdit = false;
      this.formData = {
        content: '',
        source: '',
        enterprise_name: '',
        enterprise_credit_code: '',
        responsible_person: '',
        responsible_person_id_type: '身份证',
        responsible_person_id_number: '',
      };
      this.dialogVisible = true;
    },
    
    // 编辑签名
    editSignature(row) {
      this.isEdit = true;
      this.formData = { ...row };
      this.dialogVisible = true;
    },
    
    // 删除签名
    deleteSignature(row) {
      this.currentDeleteId = row.id;
      this.deleteDialogVisible = true;
    },
    
    // 确认删除
    async confirmDelete() {
      if (this.currentDeleteId === null) return;
      
      try {
        await dbService.remove('signatures', this.currentDeleteId);
        this.$message.success('删除成功');
        this.deleteDialogVisible = false;
        this.currentDeleteId = null;
        this.loadSignatures();
      } catch (error) {
        console.error('删除签名失败:', error);
        this.$message.error('删除失败');
      }
    },
    
    // 提交表单
    async submitForm({ validateResult, firstError }) {
      if (!validateResult) {
        this.$message.error(firstError);
        return;
      }
      
      const now = dayjs().format('YYYY/MM/DD HH:mm:ss');
      const data = { ...this.formData };
      
      try {
        if (this.isEdit) {
          // 更新
          data.updated_at = now;
          await dbService.put('signatures', data);
          this.$message.success('更新成功');
        } else {
          // 创建
          data.created_at = now;
          data.updated_at = now;
          await dbService.add('signatures', data);
          this.$message.success('创建成功');
        }
        this.dialogVisible = false;
        this.loadSignatures();
      } catch (error) {
        console.error('提交签名失败:', error);
        this.$message.error('提交失败');
      }
    },

    formatDate(isoString) {
      return Date.parse(isoString).toString('yyyy/MM/dd HH:mm:ss');
    },
  },
};
</script>

<style scoped>
.signature-management {
  padding: 2px;
}

.operation-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.signature-table {
  margin-top: 20px;
}
</style>
<template>
  <div class="number-management">
    <t-card title="号码管理">
      <!-- 第一行：操作栏 -->
      <div class="operation-bar">
        <div class="left">
          <t-button theme="primary" @click="showCreateDialog">添加号码</t-button>
        </div>
        <div class="right">
          <t-form :data="searchForm" layout="inline">
            <t-form-item label="号码类型">
              <t-select v-model="searchForm.type" placeholder="请选择号码类型" clearable @change="searchNumbers" @clear="searchNumbers">
                <t-option v-for="item in typeOptions" :key="item.value" :value="item.value" :label="item.label" />
              </t-select>
            </t-form-item>
            <t-form-item label="具体号码">
              <t-input v-model="searchForm.number" clearable placeholder="请输入具体号码" @change="searchNumbers" @clear="searchNumbers" />
            </t-form-item>
            <t-form-item label="所属单位">
              <t-input v-model="searchForm.organization" clearable placeholder="请输入所属单位" @change="searchNumbers" @clear="searchNumbers" />
            </t-form-item>
            <t-form-item label="所属人姓名">
              <t-input v-model="searchForm.owner_name" clearable placeholder="请输入所属人姓名" @change="searchNumbers" @clear="searchNumbers" />
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" @click="searchNumbers">查询</t-button>
            </t-form-item>
          </t-form>
        </div>
      </div>

      <!-- 第二行：数据表格 -->
      <t-table
        :data="numberList"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @page-change="onPageChange"
        stripe
        row-key="id"
        class="number-table"
      >
        <template #operation="{ row }">
          <t-space size="small">
            <t-button theme="primary" size="small" @click="editNumber(row)">编辑</t-button>
            <t-button theme="danger" size="small" @click="deleteNumber(row)">删除</t-button>
          </t-space>
        </template>
      </t-table>

      <!-- 创建/编辑号码弹窗 -->
      <t-dialog
        v-model:visible="dialogVisible"
        :header="isEdit ? '编辑号码' : '添加号码'"
        width="600px"
        :footer="false"
      >
        <t-form
          ref="numberForm"
          :data="formData"
          :rules="rules"
          label-width="150px"
          @submit="submitForm"
        >
          <t-form-item label="号码类型" name="type">
            <t-select v-model="formData.type" placeholder="请选择号码类型" @change="handleTypeChange">
              <t-option v-for="item in typeOptions" :key="item.value" :value="item.value" :label="item.label" />
            </t-select>
          </t-form-item>
          <t-form-item label="具体号码" name="number">
            <t-input v-model="formData.number" placeholder="请输入具体号码" />
          </t-form-item>
          <t-form-item label="所属单位" name="organization" v-show="formData.type !== '1'">
            <t-input v-model="formData.organization" placeholder="请输入所属单位" />
          </t-form-item>
          <t-form-item label="所属人姓名" name="owner_name" v-show="formData.type === '1'">
            <t-input v-model="formData.owner_name" placeholder="请输入所属人姓名" />
          </t-form-item>
          <t-form-item label="所属人证件类型" name="owner_id_type" v-show="formData.type === '1'">
            <t-input v-model="formData.owner_id_type" placeholder="身份证" disabled />
          </t-form-item>
          <t-form-item label="所属人证件号码" name="owner_id_number" v-show="formData.type === '1'">
            <t-input v-model="formData.owner_id_number" placeholder="请输入所属人证件号码" />
          </t-form-item>
          <t-form-item label="拨测时间" name="test_time">
            <t-date-picker
              v-model="formData.test_time"
              mode="date"
              enable-time-picker
              format="YYYY/MM/DD HH:mm:ss"
              placeholder="请选择拨测时间"
            />
          </t-form-item>
          <t-form-item label="电话拨测是否录音" name="is_recorded">
            <t-switch v-model="formData.is_recorded" :custom-value="[true, false]" :label="['是', '否']" />
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
        body="确定要删除该号码吗？"
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
  name: 'NumberManagement',
  data() {
    return {
      // 表格数据
      numberList: [],
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
        { colKey: 'type', title: '号码类型', width: 120 },
        { colKey: 'number', title: '具体号码', width: 150 },
        { colKey: 'organization', title: '所属单位', width: 200 },
        { colKey: 'owner_name', title: '所属人姓名' },
        { colKey: 'owner_id_type', title: '所属人证件类型' },
        { colKey: 'owner_id_number', title: '所属人证件号码' },
        { colKey: 'test_time', title: '拨测时间', width: 180 },
        { colKey: 'is_recorded', title: '是否录音', cell: (h, { row }) => row.is_recorded ? '是' : '否' },
        { colKey: 'created_at', title: '创建时间', width: 180, cell: (h, { row }) => this.$formatDate(row.created_at) },
        { colKey: 'updated_at', title: '更新时间', width: 180, cell: (h, { row }) => this.$formatDate(row.updated_at) },
        { colKey: 'operation', title: '操作', fixed: 'right', width: 120 },
      ],

      // 搜索表单
      searchForm: {
        type: '',
        number: '',
        organization: '',
        owner_name: '',
      },

      // 创建/编辑表单
      dialogVisible: false,
      isEdit: false,
      formData: {
        type: '',
        number: '',
        organization: '',
        owner_name: '',
        owner_id_type: '身份证',
        owner_id_number: '',
        test_time: '',
        is_recorded: false,
      },
      rules: {
        type: [{ required: true, message: '请选择号码类型', type: 'error' }],
        number: [{ required: true, message: '请输入具体号码', type: 'error' }],
        organization: [{ required: true, message: '请输入所属单位', type: 'error' }],
        owner_name: [{ required: true, message: '请输入所属人姓名', type: 'error' }],
        owner_id_type: [{ required: true, message: '请选择所属人证件类型', type: 'error' }],
        owner_id_number: [{ required: true, message: '请输入所属人证件号码', type: 'error' }],
        test_time: [{ required: true, message: '请选择拨测时间', type: 'error' }],
      },

      // 号码类型选项
      typeOptions: [
        { value: '1', label: '手机号' },
        { value: '2', label: '固话' },
        { value: '3', label: '400电话' },
        { value: '4', label: '800电话' },
        { value: '5', label: '95开头号码' },
        { value: '6', label: '96开头号码' },
        { value: '7', label: '1开头号码（非手机号码）' },
      ],

      // 删除确认
      deleteDialogVisible: false,
      currentDeleteId: null,

      
    };
  },
  mounted() {
    this.loadNumbers();
  },
  methods: {
    
    
    // 加载号码数据
    async loadNumbers() {
      this.loading = true;
      try {
        const allNumbers = await dbService.getAll('numbers');
        
        // 根据搜索条件过滤
        let filteredNumbers = allNumbers;
        if (this.searchForm.type) {
          filteredNumbers = filteredNumbers.filter(item => 
            item.type === this.searchForm.type
          );
        }
        if (this.searchForm.number) {
          filteredNumbers = filteredNumbers.filter(item => 
            item.number.includes(this.searchForm.number)
          );
        }
        if (this.searchForm.organization) {
          filteredNumbers = filteredNumbers.filter(item => 
            item.organization && item.organization.includes(this.searchForm.organization)
          );
        }
        if (this.searchForm.owner_name) {
          filteredNumbers = filteredNumbers.filter(item => 
            item.owner_name && item.owner_name.includes(this.searchForm.owner_name)
          );
        }
        
        // 分页处理
        const start = (this.pagination.current - 1) * this.pagination.pageSize;
        const end = start + this.pagination.pageSize;
        this.numberList = filteredNumbers.slice(start, end);
        this.pagination.total = filteredNumbers.length;
        
        this.loading = false;
      } catch (error) {
        console.error('加载号码数据失败:', error);
        this.loading = false;
      }
    },
    
    // 搜索号码
    searchNumbers() {
      this.pagination.current = 1;
      this.loadNumbers();
    },
    
    // 分页变化
    onPageChange(pageInfo) {
      this.pagination.current = pageInfo.current;
      this.pagination.pageSize = pageInfo.pageSize;
      this.loadNumbers();
    },
    
    // 显示创建号码弹窗
    showCreateDialog() {
      this.isEdit = false;
      this.formData = {
        type: '',
        number: '',
        organization: '',
        owner_name: '',
        owner_id_type: '身份证',
        owner_id_number: '',
        test_time: '',
        is_recorded: false,
      };
      this.dialogVisible = true;
    },
    
    // 编辑号码
    editNumber(row) {
      this.isEdit = true;
      this.formData = { ...row };
      this.dialogVisible = true;
    },
    
    // 删除号码
    deleteNumber(row) {
      this.currentDeleteId = row.id;
      this.deleteDialogVisible = true;
    },
    
    // 确认删除
    async confirmDelete() {
      if (this.currentDeleteId === null) return;

      try {
        await dbService.remove('numbers', this.currentDeleteId);
        this.$message.success('删除成功');
        this.deleteDialogVisible = false;
        this.currentDeleteId = null;
        this.loadNumbers();
      } catch (error) {
        console.error('删除号码失败:', error);
        this.$message.error('删除失败');
      }
    },
    
    // 处理号码类型变化
    handleTypeChange(value) {
      if (value === '1') {
        this.formData.organization = '';
      } else {
        this.formData.owner_name = '';
        this.formData.owner_id_number = '';
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
      
      // 根据号码类型设置必填字段的验证
      if (data.type === '1') {
        if (!data.owner_name || !data.owner_id_number) {
          this.$message.error('手机号类型必须填写所属人信息');
          return;
        }
      } else {
        if (!data.organization) {
          this.$message.error('非手机号类型必须填写所属单位');
          return;
        }
      }
      
      try {
        if (this.isEdit) {
          // 更新
          data.updated_at = now;
          await dbService.put('numbers', data);
          this.$message.success('更新成功');
        } else {
          // 创建
          data.created_at = now;
          data.updated_at = now;
          await dbService.add('numbers', data);
          this.$message.success('创建成功');
        }
        this.dialogVisible = false;
        this.loadNumbers();
      } catch (error) {
        console.error('提交号码失败:', error);
        this.$message.error('提交失败');
      }
    },
  },
};
</script>

<style scoped>
.number-management {
  padding: 2px;
}

.operation-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.number-table {
  margin-top: 20px;
}
</style>
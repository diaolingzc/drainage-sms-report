<template>
  <div class="template-management">
    <t-card title="模板管理">
      <!-- 操作栏 -->
      <div class="operation-bar">
        <div class="left">
          <t-button theme="primary" size="small" @click="showCreateDialog">添加模板</t-button>
          <t-button theme="success" size="small" @click="handleExport">导出数据</t-button>
          <t-button theme="success" size="small" @click="() => importDialogVisible = true">导入数据</t-button>
          <t-button theme="warning" size="small" @click="exportFiles">导出报备文件</t-button>
        </div>
        <div class="right">
          <t-form :data="searchForm" layout="inline">
            <t-form-item label="签名内容" labelWidth="80px" style="width: 160px; margin-right: 10px;">
              <t-input v-model="searchForm.signature_content" clearable placeholder="请输入签名内容" size="small"
                @change="searchTemplates" @clear="searchTemplates" width="100px" />
            </t-form-item>
            <!-- <t-form-item label="模板类型" labelWidth="80px">
              <t-cascader v-model="searchForm.template_type" :options="templateTypeOptions" clearable
                placeholder="请选择模板类型" size="small" @change="searchTemplates" @clear="searchTemplates" width="100px" />
            </t-form-item> -->
            <t-form-item label="模板内容" labelWidth="80px">
              <t-input v-model="searchForm.content" clearable placeholder="请输入模板内容" size="small"
                @change="searchTemplates" @clear="searchTemplates" width="100px" />
            </t-form-item>
            <t-form-item label="是否含变量" labelWidth="80px">
              <t-select v-model="searchForm.has_variables" placeholder="请选择" size="small" clearable
                @change="searchTemplates" @clear="searchTemplates" width="100px">
                <t-option :value="1" label="是" />
                <t-option :value="0" label="否" />
              </t-select>
            </t-form-item>
            <t-form-item label="状态" labelWidth="80px">
              <t-select v-model="searchForm.status" placeholder="请选择" size="small" clearable
                @change="searchTemplates" @clear="searchTemplates" width="100px">
                <t-option :value="1" label="已导出" />
                <t-option :value="0" label="待导出" />
              </t-select>
            </t-form-item>
            <t-form-item style="width: 80px; min-width: 80px;" labelWidth="0px">
              <t-button theme="primary" size="small" @click="searchTemplates">查询</t-button>
            </t-form-item>
          </t-form>
        </div>
      </div>

      <!-- 数据表格 -->
      <t-table :data="templateList" :columns="columns" :loading="loading" :pagination="pagination"
        @page-change="onPageChange" stripe row-key="id" class="template-table">
        <template #operation="{ row }">
          <t-space size="small">
            <t-button theme="primary" size="small" @click="editTemplate(row)">编辑</t-button>
            <t-button theme="danger" size="small" @click="deleteTemplate(row)">删除</t-button>
          </t-space>
        </template>
        <template #content="{ row }">
          <div style="white-space: pre-wrap;">{{ row.content }}</div>
        </template>
        <template #content_case="{ row }">
          <div style="white-space: pre-wrap;">{{ row.content_case }}</div>
        </template>
        <template #numbers="{ row }">
          <div v-if="row.numbers && row.numbers.length">
            <div v-for="number in row.numbers" :key="number.id">{{ number.content }}</div>
          </div>
          <div v-else>无</div>
        </template>
        <template #link="{ row }">
          <div v-if="row.link">{{ row.link.content }}</div>
          <div v-else>无</div>
        </template>
      </t-table>

      <!-- 创建/编辑模板弹窗 -->
      <t-dialog v-model:visible="dialogVisible" :header="isEdit ? '编辑模板' : '添加模板'" width="800px" :footer="false">
        <t-form ref="templateForm" :data="formData" :rules="rules" label-width="150px" @submit="submitForm">
          <t-form-item label="签名内容" name="signature_id">
            <t-select v-model="formData.signature_id" placeholder="请选择签名内容" filterable @focus="loadSignatures">
              <t-option v-for="item in signatureOptions" :key="item.id" :value="item.id" :label="item.content" />
            </t-select>
            <t-button theme="primary" variant="text" @click="goTo('SignatureManagement')">新增签名</t-button>
          </t-form-item>
          <t-form-item label="模板类型" name="template_type">
            <t-cascader v-model="formData.template_type" :options="templateTypeOptions" placeholder="请选择模板类型" :disabled="!formData.signature_id" />
          </t-form-item>
          <t-form-item label="短信模板" name="content">
            <t-textarea v-model="formData.content" placeholder="短信模板内容，模板内容需符合短信发送规范，变量格式：&*&"
              @change="onTemplateContentChange" :disabled="!formData.signature_id" />
          </t-form-item>

          <t-form-item v-for="(variable, index) in formData.variables" :key="index" :label="`变量${index + 1}配置`"
            v-if="showVariableConfig">
            <t-input :value="`&*&`" :disabled="true" style="width: 80px; margin-right: 10px;" />
            <t-select v-model="variable.type" placeholder="变量类型" style="width: 150px; margin-right: 10px;">
              <t-option v-for="item in variableTypeOptions" :key="item.value" :value="item.value" :label="item.label" />
            </t-select>
            <t-input-number v-model="variable.length" placeholder="长度" :min="1" :max="30" style="width: 150px;" />
          </t-form-item>

          <t-form-item label="完整短信内容" name="content_case">
            <t-textarea v-model="formData.content_case" placeholder="请输入真实下发的完整短信内容案例，不带任何变量参数"
              @change="onContentCaseChange" :disabled="!formData.signature_id" />
          </t-form-item>

          <!-- <t-form-item v-for="(vaild, index) in templateVariableResults" :key="index" :label="`效验结果${index + 1}`"
            v-if="templateVariableResults">
            <p>{{ vaild.message }}</p>
          </t-form-item> -->

          <t-form-item label="号码" name="number_id">
            <t-select v-model="formData.number_id" placeholder="请选择号码" multiple :max="2" filterable :disabled="!formData.signature_id" @focus="loadNumbers">
              <t-option v-for="item in numberOptions" :key="item.id" :value="item.id" :label="item.number" />
            </t-select>
            <t-button theme="primary" variant="text" @click="goTo('NumberManagement')">新增号码</t-button>
          </t-form-item>

          <t-form-item label="链接" name="link_id">
            <t-select v-model="formData.link_id" placeholder="请选择链接" filterable clearable :disabled="!formData.signature_id" @focus="loadLinks">
              <t-option v-for="item in linkOptions" :key="item.id" :value="item.id" :label="item.short_url" />
            </t-select>
            <t-button theme="primary" variant="text" @click="goTo('LinkManagement')">新增链接</t-button>
          </t-form-item>

          <t-form-item label="短信内容是否合规" name="has_issue">
            <t-switch v-model="formData.has_issue" :label="['是', '否']" :disabled="!formData.signature_id" />
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
      <t-dialog v-model:visible="deleteDialogVisible" header="删除确认" body="确定要删除该模板吗？" :on-confirm="confirmDelete"
        :on-cancel="() => (deleteDialogVisible = false)" />

      <!-- 导入确认弹窗 -->
      <t-dialog v-model:visible="importDialogVisible" header="导入数据" :on-confirm="handleImportConfirm"
        :on-cancel="() => importDialogVisible = false">
        <t-space direction="vertical" style="width: 100%">
          <t-upload v-model="importFile" :before-upload="beforeUpload" :show-upload-progress="false"
            :request-method="() => Promise.resolve({ status: 'success', response: {} })" theme="file" accept=".zip" />
          <t-radio-group v-model="importMode">
            <t-radio value="overwrite">覆盖导入</t-radio>
            <t-radio value="incremental">增量导入</t-radio>
          </t-radio-group>
        </t-space>
      </t-dialog>
    </t-card>
  </div>
</template>

<script>
import { MessagePlugin, NotifyPlugin } from 'tdesign-vue-next';
import { dbService } from '@/utils/db';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

export default {
  name: 'TemplateManagement',
  data() {
    return {
      templateList: [],
      loading: false,
      pagination: { current: 1, pageSize: 10, total: 0, showJumper: true, showPageSize: true, pageSizeOptions: [10, 20, 50] },
      columns: [
        { colKey: 'id', title: '模板ID', width: 80 },
        { colKey: 'signature_content', title: '签名内容', width: 120 },
        { colKey: 'template_type', title: '模板类型', width: 200, cell: (h, { row }) => this.getTemplateTypeName(row.business_category, row.business_subcategory) },
        { colKey: 'content', title: '模板内容', width: 250, ellipsis: true },
        { colKey: 'param_type', title: '参数类型' },
        { colKey: 'param_length', title: '参数长度' },
        { colKey: 'content_case', title: '完整短信内容', width: 250, ellipsis: true },
        { colKey: 'numbers', title: '号码', cell: 'numbers' },
        { colKey: 'link', title: '链接', cell: 'link' },
        { colKey: 'has_issue', title: '短信内容是否合规', cell: (h, { row }) => (row.has_issue ? '是' : '否') },
        { colKey: 'status', title: '状态', cell: (h, { row }) => (row.status === 0 ? '待导出' : '已导出') },
        { colKey: 'operation', title: '操作', fixed: 'right', width: 120 },
      ],
      searchForm: { signature_content: '', template_type: null, content: '', has_variables: null, status: 0 },
      dialogVisible: false,
      isEdit: false,
      formData: this.getInitialFormData(),
      rules: {
        signature_id: [{ required: true, message: '请选择签名内容', type: 'error' }],
        template_type: [{ required: true, message: '请选择模板类型', type: 'error' }],
        content: [
          { required: true, message: '请输入短信模板', type: 'error' },
          { validator: this.validateTemplateFormat, message: '变量格式为&*&，请调整', type: 'error' },
          { validator: this.validateTemplateSignature, message: '短信模板必须以“【签名内容】”开头', type: 'error' },
        ],
        content_case: [
          { required: true, message: '请输入完整短信内容', type: 'error' },
          { validator: (val) => !val.includes('&*&'), message: '完整短信内容中不能包含变量参数&*&', type: 'error' },
        ],
        has_issue: [{ required: true, message: '请选择短信内容是否合规', type: 'error' }],
      },
      templateTypeOptions: [
        {
          label: '业务管理和服务类', value: '00', children: [
            { label: '其他用途', value: '00.00' },
            { label: '通知服务', value: '00.01' },
            { label: '验证码', value: '00.02' },
            { label: '业务提醒（非金融类）', value: '00.03' },
            { label: '业务提醒（金融类）', value: '00.04' },
            { label: '还款通知', value: '00.05' },
          ]
        },
        {
          label: '商业性', value: '01', children: [
            { label: '其它营销类别', value: '01.00' },
            { label: '金融推销（贷款理财和保险推销）', value: '01.01' },
            { label: '零售业推销', value: '01.02' },
            { label: '电信业务宣传', value: '01.03' },
            { label: '网络游戏推广', value: '01.04' },
            { label: '教育培训推销', value: '01.05' },
            { label: '房产中介推销', value: '01.06' },
            { label: '股票证券推销', value: '01.07' },
            { label: '医疗卫生推销', value: '01.08' },
            { label: '猎头招聘推广', value: '01.09' },
            { label: '旅游推广', value: '01.10' },
            { label: '未主动更新', value: '01.11' },
          ]
        },
        {
          label: '公益性', value: '02', children: [
            { label: '其他公益信息', value: '02.00' },
            { label: '政务民生信息', value: '02.01' },
            { label: '应急通知', value: '02.02' },
          ]
        },
      ],
      exportTemplateTypeOptions: {
        "00": {
          "label": "业务管理和服务类",
          "ulabel": "B_业务管理和服务类",
          "children": {
            "00.00": { "label": "其他用途", "ulabel": "B06-其他业务管理服务类" },
            "00.01": { "label": "通知服务", "ulabel": "B03-业务提醒（非金融类）" },
            "00.02": { "label": "验证码", "ulabel": "B01-操作验证" },
            "00.03": { "label": "业务提醒（非金融类）", "ulabel": "B03-业务提醒（非金融类）" },
            "00.04": { "label": "业务提醒（金融类）", "ulabel": "B04-业务提醒（金融类）" },
            "00.05": { "label": "还款通知", "ulabel": "B05-还款通知" }
          }
        },
        "01": {
          "label": "商业性",
          "ulabel": "A_商业性",
          "children": {
            "01.00": { "label": "其它营销类别", "ulabel": "A11-其它营销类别" },
            "01.01": { "label": "金融推销（贷款理财和保险推销）", "ulabel": "A01-金融推销（包含贷款理财和保险推销）" },
            "01.02": { "label": "零售业推销", "ulabel": "A02-零售业推销" },
            "01.03": { "label": "电信业务宣传", "ulabel": "A03-电信业务宣传" },
            "01.04": { "label": "网络游戏推广", "ulabel": "A04-网络游戏推广" },
            "01.05": { "label": "教育培训推销", "ulabel": "A05-教育培训推销" },
            "01.06": { "label": "房产中介推销", "ulabel": "A06-房产中介推销" },
            "01.07": { "label": "股票证券推销", "ulabel": "A07-股票证券推销" },
            "01.08": { "label": "医疗卫生推销", "ulabel": "A08-医疗卫生推销" },
            "01.09": { "label": "猎头招聘推广", "ulabel": "A09-猎头招聘推广" },
            "01.10": { "label": "旅游推广", "ulabel": "A10-旅游推广" },
            "01.11": { "label": "未主动更新", "ulabel": "A11-其它营销类别" }
          }
        },
        "02": {
          "label": "公益性",
          "ulabel": "C_公益性",
          "children": {
            "02.00": { "label": "其他公益信息", "ulabel": "C01-非应急公益性" },
            "02.01": { "label": "政务民生信息", "ulabel": "B02-民生服务" },
            "02.02": { "label": "应急通知", "ulabel": "C02-应急公益性" }
          }
        }
      },
      variableTypeOptions: [
        { value: 1, label: '字符型' },
        { value: 2, label: '整数型' },
        { value: 3, label: '小数型' },
        { value: 4, label: '字符数据混合型' },
        { value: 5, label: 'URL链接' },
        { value: 6, label: '联系方式' },
      ],
      templateVariableResults: [],
      signatureOptions: [],
      numberOptions: [],
      linkOptions: [],
      deleteDialogVisible: false,
      currentDeleteId: null,
      importDialogVisible: false,
      importFile: [],
      importMode: 'incremental',
    };
  },
  computed: {
    showVariableConfig() {
      return this.formData.content.includes('&*&');
    }
  },
  watch: {
    'formData.content': 'parseVariables',
    'formData.variables': { handler: 'parseVariables', deep: true },
    'formData.number_id': { handler: 'parseVariables', deep: true },
    'formData.link_id': { handler: 'parseVariables', deep: true },
    'formData.content_case': 'parseVariables',
    'formData.template_type': {
      handler(newVal) {
        if (!newVal) return;
        const businessCategory = newVal[0];
        const content = this.formData.content || '';
        const contentCase = this.formData.content_case || '';

        if (businessCategory === '01') {
          if (!content.endsWith('拒收请回复R') || !contentCase.endsWith('拒收请回复R')) {
            MessagePlugin.warning('商业性模板，短信模板和完整短信内容必须以“拒收请回复R”结尾');
          }
        } else if (businessCategory === '00' || businessCategory === '02') {
          if (content.includes('拒收请回复R') || contentCase.includes('拒收请回复R')) {
            MessagePlugin.warning('短信模板中存在“拒收请回复R”关键字，请确认模板类型选择无误');
          }
        }
      },
      deep: true
    }
  },
  mounted() {
    this.loadInitialData();
  },
  methods: {
    getInitialFormData() {
      return {
        signature_id: '',
        number_id: [],
        link_id: null,
        template_type: "",
        content: '',
        content_case: '',
        has_variables: 1,
        variables: [],
        has_issue: false,
        status: 0,
      };
    },
    async loadInitialData() {
      await dbService.initDB();
      this.loadTemplates();
    },
    async loadSignatures() {
      this.signatureOptions = await dbService.getAll('signatures');
    },
    async loadNumbers() {
      this.numberOptions = await dbService.getAll('numbers');
    },
    async loadLinks() {
      this.linkOptions = await dbService.getAll('links');
    },
    async loadTemplates() {
      this.loading = true;
      try {
        const allTemplates = await dbService.getAll('templates');
        const allSignatures = await dbService.getAll('signatures');
        const allNumbers = await dbService.getAll('numbers');
        const allLinks = await dbService.getAll('links');

        const signatureMap = new Map(allSignatures.map(s => [s.id, s.content]));
        const numberMap = new Map(allNumbers.map(n => [n.id, n.number]));
        const linkMap = new Map(allLinks.map(l => [l.id, l.short_url]));

        let filtered = allTemplates.map(t => {
          // 将number_id字符串转换为数组,如果为空则返回空数组
          let numberIds = t.number_id ? t.number_id.split(',') : [];
          // 将numberIds数组映射为包含id和number的对象数组,并过滤掉无效值
          const numbers = numberIds.map(id => ({
            id,
            content: numberMap.get(parseInt(id))
          })).filter(n => n.content);
          // 检查link_id是否存在,如果存在则映射为包含id和short_url的对象,否则为null
          const link = t.link_id ? { id: t.link_id, content: linkMap.get(t.link_id) } : null;
          return {
            ...t,
            signature_content: signatureMap.get(t.signature_id) || '',
            numbers,
            link
          };
        });

        // Apply search filters
        if (this.searchForm.signature_content) {
          filtered = filtered.filter(t => t.signature_content.includes(this.searchForm.signature_content));
        }
        if (this.searchForm.template_type && this.searchForm.template_type.length > 0) {
          filtered = filtered.filter(t => t.business_category === this.searchForm.template_type[0] && t.business_subcategory === this.searchForm.template_type[1]);
        }
        if (this.searchForm.content) {
          filtered = filtered.filter(t => t.content.includes(this.searchForm.content));
        }
        if (this.searchForm.has_variables !== null) {
          filtered = filtered.filter(t => t.has_variables === this.searchForm.has_variables);
        }
        if (this.searchForm.status !== null) {
          filtered = filtered.filter(t => t.status === this.searchForm.status);
        }

        this.pagination.total = filtered.length;
        const start = (this.pagination.current - 1) * this.pagination.pageSize;
        const end = start + this.pagination.pageSize;
        this.templateList = filtered.slice(start, end);
      } catch (error) {
        console.error('加载模板数据失败:', error);
        MessagePlugin.error('加载数据失败');
      } finally {
        this.loading = false;
      }
    },

    searchTemplates() {
      this.pagination.current = 1;
      this.loadTemplates();
    },

    onPageChange(pageInfo) {
      this.pagination.current = pageInfo.current;
      this.pagination.pageSize = pageInfo.pageSize;
      this.loadTemplates();
    },

    showCreateDialog() {
      this.isEdit = false;
      this.formData = this.getInitialFormData();
      this.$nextTick(() => {
        this.$refs.templateForm.clearValidate();
      });
      this.dialogVisible = true;
    },

    editTemplate(row) {
      this.isEdit = true;
      this.formData = {
        ...row,
        template_type: `${row.business_category}.${row.business_subcategory}`,
        variables: this.reconstructVariables(row),
        number_id: row.number_id.split(','),
      };
      delete this.formData.param_type
      delete this.formData.param_length
      delete this.formData.numbers
      delete this.formData.link
      console.log(this.formData, {
        ...row,
        template_type: `${row.business_category}.${row.business_subcategory}`,
        variables: this.reconstructVariables(row),
        number_id: row.number_id.split(',').map(v => parseInt(v)),
      })
      this.$nextTick(() => {
        this.$refs.templateForm.clearValidate();
      });
      this.dialogVisible = true;
    },

    reconstructVariables(row) {
      if (!row.has_variables) return [];
      const types = (row.param_type || '').split(',');
      const lengths = (row.param_length || '').split(',');
      const count = (row.content.match(/&\*&/g) || []).length;
      const vars = [];
      for (let i = 0; i < count; i++) {
        vars.push({
          type: types[i] ? parseInt(types[i], 10) : 1,
          length: lengths[i] ? parseInt(lengths[i], 10) : 15
        });
      }
      return vars;
    },

    deleteTemplate(row) {
      this.currentDeleteId = row.id;
      this.deleteDialogVisible = true;
    },

    async confirmDelete() {
      if (!this.currentDeleteId) return;
      try {
        await dbService.remove('templates', this.currentDeleteId);
        MessagePlugin.success('删除成功');
        this.deleteDialogVisible = false;
        this.loadTemplates();
      } catch (error) {
        console.error('删除模板失败:', error);
        MessagePlugin.error('删除失败');
      }
    },

    async submitForm() {
      const result = this.templateVariableResults
      let templateTypes = this.formData.template_type.split('.')
      if (result.length === 0) {
        const now = dayjs().format('YYYY/MM/DD HH:mm:ss');
        const dataToSave = {
          ...this.formData,
          business_category: templateTypes[0],
          business_subcategory: templateTypes[1],
          param_type: this.formData.variables.map(v => v.type).join(','),
          param_length: this.formData.variables.map(v => v.length).join(','),
          number_id: this.formData.number_id.join(','),
        };
        delete dataToSave.template_type;
        delete dataToSave.variables;

        try {
          if (this.isEdit) {
            dataToSave.updated_at = now
            await dbService.put('templates', dataToSave);
            this.$message.success('更新成功');
          } else {
            dataToSave.created_at = now;
            dataToSave.updated_at = now;
            await dbService.add('templates', dataToSave);
            this.$message.success('创建成功');
          }
          this.dialogVisible = false;
          this.loadTemplates();
        } catch (error) {
          MessagePlugin.error(this.isEdit ? '更新失败' : '创建失败');
          console.error('Submit error:', error, dataToSave);
        }
      } else {
        this.$message.error('提交失败，请查看右侧报错');
      }
    },

    goTo(routeName) {
      const { href } = this.$router.resolve({ name: routeName });
      window.open(href, '_blank');
    },

    getTemplateTypeName(category, subcategory) {
      const cat = this.templateTypeOptions.find(c => c.value === category);
      if (!cat) return '';
      const sub = cat.children.find(s => s.value === `${category}.${subcategory}`);
      return `${cat.label} - ${sub ? sub.label : ''}`;
    },
    onTemplateContentChange(value) {
      const variableCount = (value.match(/&\*&/g) || []).length;
      this.formData.has_variables = variableCount > 0 ? 1 : 0;

      const currentVars = this.formData.variables.length;
      if (variableCount > currentVars) {
        for (let i = 0; i < variableCount - currentVars; i++) {
          this.formData.variables.push({ type: 1, length: 15 });
        }
      } else if (variableCount < currentVars) {
        this.formData.variables.splice(variableCount);
      }
    },
    onContentCaseChange(value) {
      // Auto-select numbers
      const detectedNumbers = this.numberOptions.filter(n => value.includes(n.content)).map(n => n.id);
      if (detectedNumbers.length > 0) {
        this.formData.number_id = detectedNumbers.slice(0, 2);
      }

      // Auto-select link
      const detectedLink = this.linkOptions.find(l => value.includes(l.content));
      if (detectedLink) {
        this.formData.link_id = detectedLink.id;
      }
    },
    validateTemplateFormat(val) { return !/\{\d+\}/.test(val); },
    validateTemplateSignature(val) {
      if (!this.formData.signature_id) return true; // Pass if no signature selected yet
      const signature = this.signatureOptions.find(s => s.id === this.formData.signature_id);
      return signature ? val.startsWith(`【${signature.content}】`) : false;
    },
    selectedSignatureContent() {
      const signature = this.signatureOptions.find(s => s.id === this.formData.signature_id);
      return signature ? signature.content : '';
    },
    parseVariables() {
      console.log('parseVariables')
      this.templateVariableResults = []
      let detectedPhones = []
      let detectUrls = []
      NotifyPlugin.closeAll();

      // 1.检查完整内容是否为空
      if (!this.formData.content) {
        console.log('检查完整内容是否为空', !this.formData.content, !this.formData.content_case)

        this.templateVariableResults.push({
          valid: false,
          type: 'error',
          message: '短信模板与完整短信内容不能为空'
        })
        NotifyPlugin.error({ title: '短信模板与完整短信内容不能为空', duration: 10000, closeBtn: true });
        return;
      }

      // 2. 检查变量配置是否完整
      for (let i = 0; i < this.formData.variables.length; i++) {
        const varConfig = this.formData.variables[i];
        if (!varConfig.type) {
          this.templateVariableResults.push({
            valid: false,
            type: 'error',
            message: `变量 ${i + 1} 未选择参数类型`
          })
          NotifyPlugin.error({ title: `变量 ${i + 1} 未选择参数类型`, duration: 0, closeBtn: true });
          return;
        }

        if (!varConfig.length || varConfig.length < 1 || varConfig.length > 30) {
          this.templateVariableResults.push({
            valid: false,
            type: 'error',
            message: `变量 ${i + 1} 长度输入无效，长度必须在1-30之间`
          })
          NotifyPlugin.error({ title: `变量 ${i + 1} 长度输入无效，长度必须在1-30之间`, duration: 0, closeBtn: true });
          return;
        }
      }
      // 3.检查完整内容是否包含签名


      // 4. 解析模板病提取变量值
      const templateParts = this.formData.content.split('&*&');
      const regexPattern = templateParts.map(part => this.escapeRegExp(part)).join('(.+?)');
      const regex = new RegExp(`^${regexPattern}$`);
      const match = this.formData.content_case.match(regex);
      if (!match) {
        this.templateVariableResults.push({
          valid: false,
          type: 'error',
          message: `验证失败：完整内容与模板结构不匹配`
        })
        NotifyPlugin.error({ title: `验证失败：完整内容与模板结构不匹配！请检查变量位置和文本内容是否一致`, duration: 0, closeBtn: true });
        return;
      }

      // 5. 提取变量值
      const varValues = match.slice(1);
      let allValid = true;

      // 6. 验证每个变量
      for (let i = 0; i < varValues.length; i++) {
        const value = varValues[i];
        const varConfig = this.formData.variables[i];
        let valid = true;
        let message = `变量 ${i + 1} (${value}) 验证通过`;

        // 长度验证
        if (value.length < 1 || value.length > varConfig.length) {
          valid = false;
          message = `变量 ${i + 1} 长度无效: ${value.length} (要求1-${varConfig.length})`;
        }

        // 类型验证
        if (valid) {
          switch (varConfig.type) {
            case 1: // 字符型
              // 无需额外验证
              if (this.detectLinks(value).length > 0 || this.detectPhoneNumbers(value).length > 0) {
                NotifyPlugin.error({ title: `变量 ${i + 1} 存在链接或号码，参数类型请正确选择`, duration: 0, closeBtn: true });
              }
              break;
            case 2: // 整数型
              valid = /^\d+$/.test(value);
              if (!valid) {
                message = `变量 ${i + 1} 不是有效整数: ${value}`;
              } else if (this.detectLinks(value).length > 0 || this.detectPhoneNumbers(value).length > 0) {
                NotifyPlugin.error({ title: `变量 ${i + 1} 存在链接或号码，参数类型请正确选择`, duration: 0, closeBtn: true });
              }
              break;
            case 3: // 小数型
              valid = /^\d+\.\d+$/.test(value);
              if (!valid) message = `变量 ${i + 1} 不是有效小数: ${value}`;
              break;
            case 4: // 字符数据混合型
              valid = /^[a-zA-Z0-9]+$/.test(value);
              if (!valid) {
                message = `变量 ${i + 1} 不是字母数字混合: ${value}`;
              } else if (this.detectLinks(value).length > 0 || this.detectPhoneNumbers(value).length > 0) {
                NotifyPlugin.error({ title: `变量 ${i + 1} 存在链接或号码，参数类型请正确选择`, duration: 0, closeBtn: true });
              }
              break;
            case 5: // URL链接
              // 修正后的URL正则，确保必须是有效的URL格式
              valid = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
              if (!valid) message = `变量 ${i + 1} 不是有效URL: ${value}`;
              break;
            case 6: // 联系方式
              // 修正后的联系方式正则，确保必须是有效的手机号或固定电话
              valid = /^((((\+86|0086)\s*)?1[3-9]\d{9})|((0\d{2,3}|\(0\d{2,3}\))\s*-?\s*\d{7,8})|([48]00\d?\s*-?\s*\d{3,4}\s*-?\s*\d{3,4}))$/.test(value);
              if (!valid) message = `变量 ${i + 1} 不是有效联系方式: ${value}`;
              break;
          }
        }

        if (!valid) {
          allValid = false;
          this.templateVariableResults.push({
            valid: false,
            type: 'error',
            message: message
          })
          NotifyPlugin.error({ title: message, duration: 0, closeBtn: true });
        }

        // 7. 检测内容中是否含有号码
        detectedPhones = this.detectPhoneNumbers(this.formData.content_case)
        // 检查是否有检测到的号码但未选择号码
        if (detectedPhones.length > 0 && (!this.formData.number_id || this.formData.number_id.length === 0)) {
          this.templateVariableResults.push({
            valid: false,
            type: 'error',
            message: `检测到短信内容包含号码，但未在号码选项中选择，请选择对应号码`
          })
          NotifyPlugin.error({ title: '检测到短信内容包含号码，但未在号码选项中选择，请选择对应号码', duration: 0, closeBtn: true });
          return;
        }
        // 检查选择的号码是否与检测到的号码匹配
        if (this.formData.number_id && this.formData.number_id.length > 0) {
          const selectedNumbers = this.numberOptions
            .filter(n => this.formData.number_id.includes(n.id))
            .map(n => n.number);

          const numbersMatch = detectedPhones.every(phone =>
            selectedNumbers.some(num => phone.replace(/[-.\s]/g, '') === num.replace(/[-.\s]/g, ''))
          );

          if (!numbersMatch) {
            this.templateVariableResults.push({
              valid: false,
              type: 'error',
              message: `选择的号码与短信内容中的号码不匹配，请重新选择`
            })
            NotifyPlugin.error({ title: '选择的号码与短信内容中的号码不匹配，请重新选择', duration: 0, closeBtn: true });
            return;
          }
        }

        // 8. 检测内容中是否含有链接
        detectUrls = this.detectLinks(this.formData.content_case)
        // 检查是否有检测到的链接但未选择链接
        if (detectUrls.length > 0 && (!this.formData.link_id || this.formData.link_id.length === 0)) {
          this.templateVariableResults.push({
            valid: false,
            type: 'error',
            message: `检测到短信内容包含链接，但未在链接选项中选择，请选择对应链接`
          })
          NotifyPlugin.error({ title: '检测到短信内容包含链接，但未在链接选项中选择，请选择对应链接', duration: 0, closeBtn: true });
          return;
        }

        // 检查选择的链接是否与检测到的链接匹配
        if (this.formData.link_id) {
          const selectedUrls = this.linkOptions
            .filter(n => this.formData.link_id === n.id)
            .map(n => n.short_url);

          const urlsMatch = detectUrls.every(url =>
            selectedUrls.some(short_url => {
              return url.replace(/[-.\s]/g, '') === short_url.replace(/[-.\s]/g, ''))
            }
          );

          if (!urlsMatch) {
            this.templateVariableResults.push({
              valid: false,
              type: 'error',
              message: `选择的链接与短信内容中的链接不匹配，请重新选择`
            })
            NotifyPlugin.error({ title: '选择的链接与短信内容中的链接不匹配，请重新选择', duration: 0, closeBtn: true });
            return;
          }
        }
        // 7. 设置验证结果
        // if (allValid) {
        //   this.validationResult = {
        //     valid: true,
        //     message: '验证成功：所有变量符合规则',
        //     details: results
        //   };
        // } else {
        //   this.validationResult = {
        //     valid: false,
        //     message: '验证失败：部分变量不符合规则',
        //     details: results
        //   };
        // }
      }
      // 7. 内容中没有号码但选择了号码
      if (this.detectPhoneNumbers(this.formData.content_case).length === 0 && this.formData.number_id && this.formData.number_id.length > 0) {
        NotifyPlugin.error({ title: '完整短信内容中未检测到号码，但“号码”字段已选择。', duration: 0, closeBtn: true });
      }

      // 8. 内容中没有链接但选择了链接
      if (this.detectLinks(this.formData.content_case).length === 0 && this.formData.link_id) {
        NotifyPlugin.error({ title: '完整短信内容中未检测到链接，但“链接”字段已选择。', duration: 0, closeBtn: true });
      }
    },

    detectPhoneNumbers(content) {
      console.log('detectPhoneNumbers', content)
      if (!content) return [];

      // 支持所有号码类型带分隔符的增强正则表达式
      const phoneRegex = /(1\d{2}[-.\s]?\d{4}[-.\s]?\d{4})|(\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4})|(400[-.\s]?\d{3}[-.\s]?\d{3,4})|(800[-.\s]?\d{3}[-.\s]?\d{3,4})|(95\d{2}[-.\s]?\d+)|(96\d{2}[-.\s]?\d+)/g;
      const matches = content.match(phoneRegex) || [];

      console.log('手机号', content, matches)
      // 过滤出有效的电话号码（长度大于等于7位）
      return matches.filter(phone => {
        // 移除非数字字符
        const digits = phone.replace(/[^\d]/g, '');
        return digits.length >= 7;
      });
    },

    detectLinks(content) {
      if (!content) return [];

      // 匹配各种格式的链接
      const linkRegex = /(?:(https?|ftp):\/\/)?(?:([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+|\d+)\.[a-zA-Z]{2,6}(?:\/[\w\-./?=&#%]*)?/g;
      const matches = content.match(linkRegex) || [];

      // 过滤掉常见非链接文本
      return matches.filter(link => {
        return !link.endsWith('.') && !link.endsWith(',') &&
          link.length > 5;
      });
    },
    validateAllConditions() {
      if (!this.formData.content || !this.formData.content_case) return;

      // Rule: number and link selection
      this.validateNumberAndLinkSelection();

      if (!this.showVariableConfig) return;

      const templateParts = this.formData.content.split('&*&');
      const varCount = templateParts.length - 1;
      if (varCount === 0) return;

      let remainingCase = this.formData.content_case;
      let match = true;

      for (let i = 0; i < varCount; i++) {
        if (!remainingCase.startsWith(templateParts[i])) {
          match = false;
          break;
        }
        remainingCase = remainingCase.substring(templateParts[i].length);

        const nextPartIndex = remainingCase.indexOf(templateParts[i + 1]);
        if (nextPartIndex === -1) {
          match = false;
          break;
        }

        const varValue = remainingCase.substring(0, nextPartIndex);
        const variableConfig = this.formData.variables[i];
        if (!this.validateVariable(varValue, variableConfig)) {
          MessagePlugin.error(`变量 ${i + 1} (${varValue}) 与配置不匹配`);
          match = false; // Or handle more granularly
          break;
        }
        remainingCase = remainingCase.substring(nextPartIndex);
      }

      if (match && remainingCase === templateParts[varCount]) {
        // Optional: success message or status update
      } else {
        MessagePlugin.error('短信模板、变量配置和完整短信内容不匹配');
      }
    },

    validateVariable(value, config) {
      if (value.length > config.length) return false;
      switch (config.type) {
        case 1: // 字符型
          return true; // Any char is fine
        case 2: // 整数型
          return /^\d+$/.test(value);
        case 3: // 小数型
          return /^\d*\.\d+$/.test(value);
        case 4: // 字符数据混合型
          return /^[a-zA-Z0-9]+$/.test(value);
        case 5: // URL链接
          try {
            new URL(value);
            return true;
          } catch (_) {
            return false;
          }
        case 6: // 联系方式
          return /^(\d{11}|\d{3,4}-\d{7,8})$/.test(value);
        default:
          return false;
      }
    },

    validateNumberAndLinkSelection() {
      const contentCase = this.formData.content_case || '';
      const hasNumberInCase = this.numberOptions.some(n => contentCase.includes(n.content));
      const hasLinkInCase = this.linkOptions.some(l => contentCase.includes(l.content));

      if (hasNumberInCase && (!this.formData.number_id || this.formData.number_id.length === 0)) {
        MessagePlugin.warning('完整短信内容中检测到号码，请在“号码”字段中选择。');
      } else if (!hasNumberInCase && this.formData.number_id && this.formData.number_id.length > 0) {
        MessagePlugin.warning('完整短信内容中未检测到号码，但“号码”字段已选择。');
      }

      if (hasLinkInCase && !this.formData.link_id) {
        MessagePlugin.warning('完整短信内容中检测到链接，请在“链接”字段中选择。');
      } else if (!hasLinkInCase && this.formData.link_id) {
        MessagePlugin.warning('完整短信内容中未检测到链接，但“链接”字段已选择。');
      }
    },
    async handleExport() {
      try {
        await dbService.exportDB();
        MessagePlugin.success('导出成功');
      } catch (error) {
        console.error('导出失败:', error);
        MessagePlugin.error('导出失败');
      }
    },
    beforeUpload(file) {
      this.importFile = [file.raw];
      return false; // 阻止自动上传
    },
    async handleImportConfirm() {
      if (this.importFile.length === 0) {
        MessagePlugin.error('请选择要导入的文件');
        return;
      }
      try {
        const file = this.importFile[0];
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target.result;
            await dbService.importDB(arrayBuffer, this.importMode);
            MessagePlugin.success('导入成功');
            this.importDialogVisible = false;
            this.importFile = [];
            this.loadTemplates(); // 重新加载数据
          } catch (error) {
            console.error('导入失败:', error);
            MessagePlugin.error(`导入失败: ${error.message}`);
          }
        };
        reader.onerror = (error) => {
          console.error('文件读取失败:', error);
          MessagePlugin.error('文件读取失败');
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('导入处理启动失败:', error);
        MessagePlugin.error(`导入处理启动失败: ${error.message}`);
      }
    },

    escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },
    async exportFiles() {
      console.log('开始导出报备文件');
      // 1. 查询所有待导出的模板
      const templates = await dbService.getAll('templates');
      const signatures = await dbService.getAll('signatures');
      const numbers = await dbService.getAll('numbers');
      const links = await dbService.getAll('links');

      const signatureMap = new Map(signatures.map(s => [s.id, s]));
      const numberMap = new Map(numbers.map(n => [n.id, n]));
      const linkMap = new Map(links.map(l => [l.id, l]));

      const dataToExport = templates.map(t => {
        const signature = signatureMap.get(t.signature_id) || {};
        const numberIds = t.number_id ? String(t.number_id).split(',') : [];
        const associatedNumbers = numberIds.map(id => numberMap.get(id)).filter(Boolean);
        const link = t.link_id ? linkMap.get(t.link_id) : null;
        return {
          template: t,
          signature,
          numbers: associatedNumbers,
          link,
        };
      });

      const zip = new JSZip();
      const today = dayjs().format('YYYYMMDD');

      console.log(dataToExport)

      // 2. 生成电信文件
      this.createTelecomFile(zip, dataToExport, today);

      // 3. 生成联通文件
      this.createUnicomFile(zip, dataToExport, today);

      // 4. 生成移动链接文件
      this.createMobileLinkFile(zip, dataToExport, today);

      // 5. 生成移动固话文件
      this.createMobileLandlineFile(zip, dataToExport, today);

      // 6. 生成移动手机号文件
      this.createMobilePhoneFile(zip, dataToExport, today);

      // 7. 处理图片
      this.handleImages(zip, dataToExport);

      // 8. 打包下载
      zip.generateAsync({ type: 'blob' }).then(content => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `引流信息报备-${today}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });

      // 9. 更新状态 (此处暂时注释，待确认功能完整后再启用)
      for (const item of dataToExport) {
        await dbService.put('templates', { ...item.template, status: 1 });
      }
      this.loadTemplates();

      MessagePlugin.success('文件已开始下载');
    },

    createTelecomFile(zip, data, date) {
      const telecomData = data.map((item, index) => ({
        '序号': index + 1,
        '省份': '',
        '主端口号': '',
        '主端口企业名称': '',
        '子端口号': '',
        '子端口企业名称': item.signature.enterprise_name,
        '业务大类': item.template.business_category,
        '业务细类': item.template.business_subcategory,
        '签名内容': item.signature.content,
        '模板名称': this.exportTemplateTypeOptions[item.template.business_category]['children'][`${item.template.business_category}.${item.template.business_subcategory}`]['label'],
        '模板内容是否含变量参数': item.template.has_variables ? '是' : '否',
        '短信模板': item.template.content,
        '参数类型': item.template.param_type || '',
        '参数长度': item.template.param_length || '',
        '号码类型': item.numbers.length > 0 ? item.numbers[0].type : '',
        '具体号码': item.numbers.length > 0 ? item.numbers.map(item => item.number).join('\n') : '',
        '链接类型': item.link ? item.link.type : '',
        '备案域名': item.link ? item.link.domain : '',
        'ICP备案截图': '',
        'ICP备案企业名称': item.link ? item.link.icp_enterprise_name : '',
        '签名来源': item.signature.source,
        '实际下发短信内容': item.template.content_case,
      }));

      const worksheet = XLSX.utils.json_to_sheet(telecomData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      zip.file(`电信-引流信息报备-${date}.xlsx`, excelBuffer);
    },

    createUnicomFile(zip, data, date) {
      const unicomData = [];
      data.forEach(item => {
        if (item.link || item.numbers.length > 0) {
          if (item.numbers.length > 0) {
            item.numbers.forEach(number => {
              unicomData.push({
                '短信子端口号': '',
                '接入省': '',
                '接入地市': '',
                '端口类型': item.template.business_category === '02' && item.template.business_subcategory === '01' ? "B_业务管理和服务类" : this.exportTemplateTypeOptions[item.template.business_category]['ulabel'],
                '用途类别': item.template.business_category === '02' && item.template.business_subcategory === '01' ? "B02-民生服务" : this.exportTemplateTypeOptions[item.template.business_category]['children'][`${item.template.business_category}.${item.template.business_subcategory}`]['ulabel'],
                '企业名称': item.signature.enterprise_name,
                '企业统一社会信用代码': item.signature.enterprise_credit_code,
                '责任人名称': item.signature.responsible_person,
                '责任人证件类型': item.signature.responsible_person_id_type,
                '责任人证件号码': item.signature.responsible_person_id_number,
                '具体用途': item.template.business_category === '02' && item.template.business_subcategory === '01' ? "民生服务" : this.exportTemplateTypeOptions[item.template.business_category]['children'][`${item.template.business_category}.${item.template.business_subcategory}`]['label'],
                '签名来源': item.signature.source,
                '短信签名': item.signature.content,
                '短信模板': item.template.content.replace(/&\*&/g, '变量'),
                '联系电话': number.number,
                '域名': this.extractDomain(item.template.content_case),
                '拨测时间': number.test_time,
                '电话拨测是否录音': number.is_recorded ? '是' : '否',
                '网址页面是否备案': item.link ? (item.link.is_domain_registered ? '是' : '否') : '',
                '是否有问题': item.template.has_issue ? '是' : '否',
                'ICP备案截图': '',
                'ICP备案企业名称': item.link ? item.link.icp_enterprise_name : '',
                '实际下发短信内容': item.template.content_case,
              });
            });
          } else if (item.link) {
            // Handle case where there is a link but no numbers
            unicomData.push({
              '短信子端口号': '',
              '接入省': '',
              '接入地市': '',
              '端口类型': item.template.business_category === '02' && item.template.business_subcategory === '01' ? "B_业务管理和服务类" : this.exportTemplateTypeOptions[item.template.business_category]['ulabel'],
              '用途类别': item.template.business_category === '02' && item.template.business_subcategory === '01' ? "B02-民生服务" : this.exportTemplateTypeOptions[item.template.business_category]['children'][`${item.template.business_category}.${item.template.business_subcategory}`]['ulabel'],
              '企业名称': item.signature.enterprise_name,
              '企业统一社会信用代码': item.signature.enterprise_credit_code,
              '责任人名称': item.signature.responsible_person,
              '责任人证件类型': item.signature.responsible_person_id_type,
              '责任人证件号码': item.signature.responsible_person_id_number,
              '具体用途': item.template.business_category === '02' && item.template.business_subcategory === '01' ? "民生服务" : this.exportTemplateTypeOptions[item.template.business_category]['children'][`${item.template.business_category}.${item.template.business_subcategory}`]['ulabel'],
              '签名来源': item.signature.source,
              '短信签名': item.signature.content,
              '短信模板': item.template.content.replace(/&\*&/g, '变量'),
              '联系电话': '',
              '域名': this.extractDomain(item.template.content_case),
              '拨测时间': '',
              '电话拨测是否录音': '',
              '网址页面是否备案': item.link ? (item.link.is_domain_registered ? '是' : '否') : '',
              '是否有问题': item.template.has_issue ? '是' : '否',
              'ICP备案截图': '',
              'ICP备案企业名称': item.link ? item.link.icp_enterprise_name : '',
              '实际下发短信内容': item.template.content_case,
            });
          }
        }
      });

      if (unicomData.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(unicomData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        zip.file(`联通-引流信息报备-${date}.xlsx`, excelBuffer);
      }
    },

    createMobileLinkFile(zip, data, date) {
      const uniqueLinks = new Map();
      data.forEach(item => {
        if (item.link && !uniqueLinks.has(item.link.id)) {
          uniqueLinks.set(item.link.id, {
            signature: item.signature,
            link: item.link,
          });
        }
      });

      const mobileLinkData = Array.from(uniqueLinks.values()).map(item => ({
        '归属省': '',
        '归属市': '',
        '签名': item.signature.content,
        '签名主体': item.signature.enterprise_name,
        '短信链接': item.link.short_url,
        '长链接': item.link.long_url,
        '一级域名': item.link.domain,
        'ICP备案号': item.link.icp_number,
        'ICP备案企业名称': item.link.icp_enterprise_name,
        '企业社会统一信用代码': item.link.icp_enterprise_credit_code,
      }));

      if (mobileLinkData.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(mobileLinkData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        zip.file(`移动-引流信息报备-链接-${date}.xlsx`, excelBuffer);
      }
    },

    createMobileLandlineFile(zip, data, date) {
      const uniqueLandlines = new Map();
      data.forEach(item => {
        item.numbers.forEach(number => {
          if (number.type === '2' && !uniqueLandlines.has(number.id)) {
            uniqueLandlines.set(number.id, {
              signature: item.signature,
              number: number,
            });
          }
        });
      });

      const mobileLandlineData = Array.from(uniqueLandlines.values()).map(item => ({
        '归属省': '',
        '归属市': '',
        '签名': item.signature.content,
        '固话号码': item.number.number,
        '固话号码单位名称': item.number.organization,
      }));

      if (mobileLandlineData.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(mobileLandlineData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        zip.file(`移动-引流信息报备-固话-${date}.xlsx`, excelBuffer);
      }
    },

    createMobilePhoneFile(zip, data, date) {
      const uniquePhones = new Map();
      data.forEach(item => {
        item.numbers.forEach(number => {
          if (number.type === '1' && !uniquePhones.has(number.id)) {
            uniquePhones.set(number.id, {
              signature: item.signature,
              number: number,
            });
          }
        });
      });

      const mobilePhoneData = Array.from(uniquePhones.values()).map(item => ({
        '归属省': '',
        '归属市': '',
        '签名': item.signature.content,
        '手机号': item.number.number,
        '所属人姓名': item.number.owner_name,
        '所属人证件类型': item.number.owner_id_type,
        '所属人证件号码': item.number.owner_id_number,
      }));

      if (mobilePhoneData.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(mobilePhoneData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        zip.file(`移动-引流信息报备-手机号-${date}.xlsx`, excelBuffer);
      }
    },

    handleImages(zip, data) {
      const uniqueLinks = new Map();
      data.forEach(item => {
        if (item.link && item.link.icp_screenshot && !uniqueLinks.has(item.link.id)) {
          uniqueLinks.set(item.link.id, item.link);
        }
      });

      uniqueLinks.forEach(link => {
        if (link.icp_screenshot) {
          const base64String = link.icp_screenshot.split(',')[1];
          const fileExtension = link.icp_screenshot.substring("data:image/".length, link.icp_screenshot.indexOf(";base64"));
          zip.file(`${link.domain}.${fileExtension}`, base64String, { base64: true });
        }
      });
    },

    extractDomain(contentCase) {
      if (!contentCase) return '';
      const urlRegex = /(https?:\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/|\/[\w.-]*\/)?)/;
      const match = contentCase.match(urlRegex);
      if (match) {
        let url = match[0];
        // 确保URL以'/'结尾
        if (!url.endsWith('/')) {
          const parts = url.split('/');
          if (parts.length > 1 && !parts[parts.length - 1].includes('.')) {
            url += '/';
          } else if (parts.length > 1) {
            parts.pop();
            url = parts.join('/') + '/';
          } else {
            url += '/';
          }
        }
        return url;
      }
      return '';
    },
  }
};
</script>

<style scoped>
.template-management {
  padding: 20px;
}

.t-form__label--right {
  width: 80px;
  padding-right: 5px;
}

.operation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.operation-bar .left {
  display: flex;
  gap: 10px;
}

.operation-bar .right {
  display: flex;
  align-items: center;
}

.operation-bar .right .t-form {
  display: flex;
  gap: 16px;
}

.template-table {
  margin-top: 20px;
}
</style>

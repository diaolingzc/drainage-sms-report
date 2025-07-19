<template>
  <t-layout>
    <t-header>
      <t-head-menu theme="dark">
        <template #logo>
          <div class="logo">引流短信报备工具</div>
        </template>
      </t-head-menu>
    </t-header>
    <t-layout>
      <t-aside>
        <t-menu theme="light" :value="activeMenu" @change="onMenuChange">
          <t-menu-item name="template-management" value="template-management">
            <template #icon>
              <t-icon name="file" />
            </template>
            模板管理
          </t-menu-item>
          <t-menu-item name="signature-management" value="signature-management">
            <template #icon>
              <t-icon name="edit" />
            </template>
            签名管理
          </t-menu-item>
          <t-menu-item name="number-management" value="number-management">
            <template #icon>
              <t-icon name="mobile" />
            </template>
            号码管理
          </t-menu-item>
          <t-menu-item name="link-management" value="link-management">
            <template #icon>
              <t-icon name="link" />
            </template>
            链接管理
          </t-menu-item>
          <!-- <t-menu-item value="template-conversion">
              <template #icon>
                <t-icon name="swap" />
              </template>
              模板转换
            </t-menu-item> -->
        </t-menu>
      </t-aside>
      <t-content>
        <div class="content-container">
          <router-view />
        </div>
      </t-content>
    </t-layout>
  </t-layout>
</template>

<script>
export default {
  name: 'MainLayout',
  data() {
    return {
      activeMenu: 'template-management'
    }
  },
  created() {
    // 根据当前路由设置活动菜单
    const path = this.$route.path.split('/').pop()
    if (path) {
      this.activeMenu = path
    }
  },
  methods: {
    onMenuChange(value) {
      this.activeMenu = value
      this.$router.push(`/${value}`)
    }
  }
}
</script>

<style scoped>
.logo {
  padding: 0 16px;
  font-size: 20px;
  font-weight: bold;
  color: white;
}

.content-container {
  padding: 2px;
  height: calc(100vh - 64px);
  overflow-y: auto;
}

:deep(.t-layout) {
  height: 100vh;
}

:deep(.t-aside) {
  width: 232px;
}
</style>
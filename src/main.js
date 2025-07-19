import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import TDesign from 'tdesign-vue-next'
import dayjs from 'dayjs';

// 引入组件库全局样式资源
import 'tdesign-vue-next/es/style/index.css'

const app = createApp(App)

app.use(TDesign)
app.use(createPinia())
app.use(router)

app.mount('#app')

// 添加全局日期格式化过滤器
app.config.globalProperties.$formatDate = (isoString) => {
  return dayjs(isoString).format('YYYY/MM/DD HH:mm:ss');
}

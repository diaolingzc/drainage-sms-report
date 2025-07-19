import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/template-management',
    children: [
      {
        path: 'template-management',
        name: 'TemplateManagement',
        component: () => import('../views/TemplateManagement.vue'),
        meta: { title: '模板管理' }
      },
      {
        path: 'signature-management',
        name: 'SignatureManagement',
        component: () => import('../views/SignatureManagement.vue'),
        meta: { title: '签名管理' }
      },
      {
        path: 'number-management',
        name: 'NumberManagement',
        component: () => import('../views/NumberManagement.vue'),
        meta: { title: '号码管理' }
      },
      {
        path: 'link-management',
        name: 'LinkManagement',
        component: () => import('../views/LinkManagement.vue'),
        meta: { title: '链接管理' }
      },
      {
        path: 'template-conversion',
        name: 'TemplateConversion',
        component: () => import('../views/TemplateConversion.vue'),
        meta: { title: '模板转换' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
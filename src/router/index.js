import { createRouter, createWebHistory } from 'vue-router'
import Login from '../pages/Login/Login.vue'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login,
  },
  {
    path: '/chat/home',
    name: 'Home',
    // 懒加载聊天主页组件
    component: () => import('../pages/ChatHome/ChatHome.vue'),
    // 路由守卫，需要登录才能访问
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/tsukuyomi',
    name: 'Tsukuyomi',
    // 懒加载月读页面组件
    component: () => import('../pages/Tsukuyomi/Tsukuyomi.vue'),
    // 路由守卫，需要登录才能访问
    meta: {
      requiresAuth: true,
    },
    redirect: '/tsukuyomi/home',
    children: [
      {
        path: 'home',
        name: 'TsukuyomiHome',
        component: () => import('../pages/Tsukuyomi/views/HomeView.vue'),
      },
      {
        path: 'follow',
        name: 'TsukuyomiFollow',
        component: () => import('../pages/Tsukuyomi/views/FollowView.vue'),
      },
      {
        path: 'column',
        name: 'TsukuyomiColumn',
        component: () => import('../pages/Tsukuyomi/views/ColumnView.vue'),
      },
      {
        path: 'post/:post_id',
        name: 'PostDetail',
        component: () => import('../pages/Tsukuyomi/views/PostDetailView.vue'),
      },
    ],
  },
  {
    path: '/settings',
    name: 'Settings',
    // 懒加载设置页面组件
    component: () => import('../pages/UserSettings/UserSettings.vue'),
    // 路由守卫，需要登录才能访问
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/icon-test',
    name: 'IconTest',
    // 懒加载图标测试组件
    component: () => import('../components/IconTest/IconTest.vue'),
  },
  {
    path: '/tsukuyomi/post-editor',
    name: 'PostEditor',
    // 懒加载帖子编辑上传界面组件
    component: () => import('../pages/PostEditor/PostEditor.vue'),
    // 路由守卫，需要登录才能访问
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/admin',
    name: 'Admin',
    // 懒加载admin页面组件
    component: () => import('../pages/admin/Admin.vue'),
    // 路由守卫，需要登录才能访问
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/manager',
    name: 'Manager',
    // 懒加载管理中心组件
    component: () => import('../pages/Manager/Manager.vue'),
    // 路由守卫，需要登录才能访问
    meta: {
      requiresAuth: true,
    },
    redirect: '/manager/post',
    children: [
      {
        path: 'post',
        name: 'PostManagement',
        component: () => import('../pages/Manager/views/PostManagementView.vue'),
      },
      {
        path: 'user',
        name: 'UserManagement',
        component: () => import('../pages/Manager/views/UserManagementView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 检查路由是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 检查是否存在token
    const token = localStorage.getItem('token')
    if (!token) {
      // 没有token，重定向到登录页
      next({ name: 'Login' })
    } else {
      // 有token，继续访问
      next()
    }
  } else {
    // 不需要认证的路由，直接访问
    next()
  }
})

export default router

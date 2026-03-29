import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Login from '../pages/Login.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Login',
    component: Login,
  },
  {
    path: '/chat/home',
    name: 'Home',
    // 懒加载聊天主页组件
    component: () => import('../pages/ChatHome.vue') as Promise<any>,
    // 路由守卫，需要登录才能访问
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/tsukuyomi',
    name: 'Tsukuyomi',
    // 懒加载月读页面组件
    component: () => import('../pages/Tsukuyomi/Tsukuyomi.vue') as Promise<any>,
    // 路由守卫，需要登录才能访问
    meta: {
      requiresAuth: true,
    },
    redirect: '/tsukuyomi/home',
    children: [
      {
        path: 'home',
        name: 'TsukuyomiHome',
        component: () => import('../pages/Tsukuyomi/views/HomeView.vue') as Promise<any>,
      },
      {
        path: 'follow',
        name: 'TsukuyomiFollow',
        component: () => import('../pages/Tsukuyomi/views/FollowView.vue') as Promise<any>,
      },
      {
        path: 'column',
        name: 'TsukuyomiColumn',
        component: () => import('../pages/Tsukuyomi/views/ColumnView.vue') as Promise<any>,
      },
      {
        path: 'post/:post_id',
        name: 'PostDetail',
        component: () => import('../pages/Tsukuyomi/views/PostDetailView.vue') as Promise<any>,
      },
    ],
  },
  {
    path: '/settings',
    name: 'Settings',
    // 懒加载设置页面组件
    component: () => import('../pages/UserSettings/UserSettings.vue') as Promise<any>,
    // 路由守卫，需要登录才能访问
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/icon-test',
    name: 'IconTest',
    // 懒加载图标测试组件
    component: () => import('../components/IconTest/IconTest.vue') as Promise<any>,
  },
  {
    path: '/message',
    name: 'MessageCenter',
    // 懒加载消息中心页面组件
    component: () => import('../pages/MessageCenter.vue') as Promise<any>,
    // 路由守卫，需要登录才能访问
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: '/tsukuyomi/post-editor',
    name: 'PostEditor',
    // 懒加载帖子编辑上传界面组件
    component: () => import('../pages/PostEditor/PostEditor.vue') as Promise<any>,
    // 路由守卫，需要登录才能访问
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/admin',
    name: 'Admin',
    // 懒加载admin页面组件
    component: () => import('../pages/Admin.vue') as Promise<any>,
    // 路由守卫，需要管理员登录才能访问
    meta: {
      requiresAdmin: true,
    },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../pages/Admin.vue') as Promise<any>,
      },
      {
        path: 'posts',
        name: 'AdminPosts',
        component: () => import('../pages/Admin.vue') as Promise<any>,
      },
      {
        path: 'upload',
        name: 'AdminUpload',
        component: () => import('../pages/Admin.vue') as Promise<any>,
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('../pages/Admin.vue') as Promise<any>,
      },
    ],
  },
  {
    path: '/manager',
    name: 'Manager',
    // 懒加载管理中心组件
    component: () => import('../pages/Manager/Manager.vue') as Promise<any>,
    // 路由守卫，需要登录才能访问
    meta: {
      requiresAuth: true,
    },
    redirect: '/manager/post',
    children: [
      {
        path: 'post',
        name: 'PostManagement',
        component: () => import('../pages/Manager/views/PostManagementView.vue') as Promise<any>,
      },
      {
        path: 'user',
        name: 'UserManagement',
        component: () => import('../pages/Manager/views/UserManagementView.vue') as Promise<any>,
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
  // 检查路由是否需要管理员认证
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    // 检查是否存在管理员token
    const adminToken = localStorage.getItem('adminToken')

    // 处理/admin根路径
    if (to.path === '/admin' || to.path === '/admin/') {
      if (adminToken) {
        // 已登录，重定向到仪表板
        next({ path: '/admin/dashboard' })
      } else {
        // 未登录，显示登录界面
        next()
      }
      return
    }

    // 处理其他需要管理员认证的路由
    if (!adminToken) {
      // 没有管理员token，重定向到/admin显示登录界面
      next({ path: '/admin' })
    } else {
      // 有管理员token，继续访问
      next()
    }
  }
  // 检查路由是否需要普通用户认证
  else if (to.matched.some(record => record.meta.requiresAuth)) {
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

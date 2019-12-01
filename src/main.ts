// main.js
import Vue from 'vue'
import App from './App.vue'
import { createRouter } from './router';
import { createVueStore } from './store';

// 导出一个工厂函数，用于创建新的
// 应用程序、router 和 store 实例
export function createApp() {
  const router = createRouter();
  const store = createVueStore();
  const app = new Vue({
    store,
    router,
    // 根实例简单的渲染应用程序组件。
    render: h => h(App)
  });
  return { app, router, store }
}

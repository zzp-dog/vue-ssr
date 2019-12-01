import { createApp } from './main'

const { app, router, store } = createApp()
if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__);
  router.onReady(() => {
    if (window && window.document.getElementById('app'))
    app.$mount('#app')
  })
} else { // 服务端渲染失败降级到客户端
  const components = router.getMatchedComponents();
  Promise.all(components.map(component => {
    return component.asyncData && component.asyncData(store)
  })).then(() => {
    if (window && window.document.getElementById('client-app'))
    app.$mount('#client-app')
  })
}

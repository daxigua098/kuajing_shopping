import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles.css'
import { state } from './store'
import { i18nDirective } from './utils/i18n'

document.documentElement.dataset.theme = String(state.theme)
document.title = state.systemSettings.systemName + ' · 跨境开店结算平台'
const app = createApp(App)
app.directive('i18n', i18nDirective)
app.use(router).mount('#app')

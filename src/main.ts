import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles.css'
import { state } from './store'
import { i18nDirective } from './utils/i18n'

document.documentElement.dataset.theme = String(state.theme)
const app = createApp(App)
app.directive('i18n', i18nDirective)
app.use(router).mount('#app')

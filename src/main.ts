import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles.css'
import { state } from './store'

document.documentElement.dataset.theme = String(state.theme)
createApp(App).use(router).mount('#app')

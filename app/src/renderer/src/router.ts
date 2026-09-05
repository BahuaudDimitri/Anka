import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/wiki' },
    {
      path: '/wiki/:slug?',
      name: 'wiki',
      component: () => import('@/pages/WikiPage.vue'),
      props: true,
    },
    { path: '/elevage', name: 'elevage', component: () => import('@/pages/ElevagePage.vue') },
    { path: '/profil', name: 'profil', component: () => import('@/pages/ProfilPage.vue') },
    {
      path: '/parametres',
      name: 'parametres',
      component: () => import('@/pages/ParametresPage.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/wiki' },
  ],
})

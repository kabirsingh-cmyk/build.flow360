import axios from 'axios'
import { getSessionToken } from '../lib/supabase'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
})

client.interceptors.request.use(async (config) => {
  const token = await getSessionToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const api = {
  auth: {
    me: () => client.get('/auth/me')
  },
  sites: {
    list: () => client.get('/sites'),
    create: (data: any) => client.post('/sites', data),
    get: (id: string) => client.get(`/sites/${id}`),
    update: (id: string, data: any) => client.patch(`/sites/${id}`, data),
    delete: (id: string) => client.delete(`/sites/${id}`),
    generate: (id: string, data: any) => client.post(`/sites/${id}/generate`, data),
    publish: (id: string) => client.post(`/sites/${id}/publish`)
  },
  pages: {
    list: (siteId: string) => client.get(`/sites/${siteId}/pages`),
    create: (siteId: string, data: any) => client.post(`/sites/${siteId}/pages`, data),
    update: (siteId: string, pageId: string, data: any) => client.patch(`/sites/${siteId}/pages/${pageId}`, data),
    delete: (siteId: string, pageId: string) => client.delete(`/sites/${siteId}/pages/${pageId}`)
  },
  sections: {
    list: (siteId: string, pageId: string) => client.get(`/sites/${siteId}/pages/${pageId}/sections`),
    create: (siteId: string, pageId: string, data: any) => client.post(`/sites/${siteId}/pages/${pageId}/sections`, data),
    update: (siteId: string, pageId: string, sectionId: string, data: any) => client.patch(`/sites/${siteId}/pages/${pageId}/sections/${sectionId}`, data),
    delete: (siteId: string, pageId: string, sectionId: string) => client.delete(`/sites/${siteId}/pages/${pageId}/sections/${sectionId}`)
  },
  ai: {
    generateSite: (data: any) => client.post('/ai/generate-site', data),
    rewrite: (data: any) => client.post('/ai/rewrite', data),
    generateFaq: (data: any) => client.post('/ai/generate-faq', data)
  },
  aeo: {
    getConfig: (siteId: string) => client.get(`/sites/${siteId}/aeo/config`),
    getScore: (siteId: string) => client.get(`/sites/${siteId}/aeo/score`),
    generateSchema: (siteId: string) => client.post(`/sites/${siteId}/aeo/schema`),
    audit: (siteId: string) => client.post(`/sites/${siteId}/aeo/audit`)
  },
  templates: {
    list: () => client.get('/templates')
  }
}

export default client

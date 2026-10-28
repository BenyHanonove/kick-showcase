/// <reference types="vite/client" />

export const env = {
  // API Configuration
  api: {
    // Dev goes through the Vite proxy so the refresh cookie is same-site
    baseUrl: import.meta.env.DEV ? '/api' : (import.meta.env.VITE_AWS_URL as string),
    timeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000,
  },

  // App Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME,
    env: import.meta.env.VITE_APP_ENV as 'development' | 'staging' | 'production',
    enableLogs: import.meta.env.VITE_ENABLE_LOGS === 'true',
  },

  // Cognito Configuration
  cognito: {
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID as string,
    region: import.meta.env.VITE_COGNITO_REGION as string,
    idpUrl: import.meta.env.VITE_COGNITO_IDP_URL as string,
  },

  // Public contact details shown on the landing and legal pages
  contact: {
    email: (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) || 'contact@example.com',
    // International format without '+', as wa.me expects
    whatsappNumber: (import.meta.env.VITE_CONTACT_WHATSAPP as string | undefined) || '972500000000',
  },

  // WebSocket Configuration
  websocket: {
    url: import.meta.env.VITE_WS_URL as string,
  },
} as const

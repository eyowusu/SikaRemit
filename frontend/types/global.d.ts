declare namespace NodeJS {
  interface ProcessEnv {
    WEBHOOK_SECRET: string
    NODE_ENV: 'development' | 'production'
  }
}

declare global {
  interface Window {
    WEBHOOK_SECRET: string
  }
}

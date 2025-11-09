declare module '*.css';

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ELEVENLABS_BEARER_TOKEN?: string
  readonly VITE_ELEVENLABS_AGENT_ID?: string
  readonly VITE_ELEVENLABS_AGENT_PHONE_NUMBER_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
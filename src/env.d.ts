/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface CloudflareBindings {
  DB: D1Database;
  wevenue: R2Bucket;
  OPENWEBUI_URL: string;
  OPENWEBUI_API_KEY: string;
  OPENWEBUI_MODEL: string;
  LMSTUDIO_URL: string;
  LMSTUDIO_MODEL: string;
}

interface ImportMetaEnv {
  readonly OPENWEBUI_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

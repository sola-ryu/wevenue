/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface CloudflareBindings {
  DB: D1Database;
  wevenue: R2Bucket;
}

interface ImportMetaEnv {
  readonly OPENWEBUI_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

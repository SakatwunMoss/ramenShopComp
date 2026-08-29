interface CloudflareEnv {
  DB: D1Database;
  NEXT_INC_CACHE_KV: KVNamespace;
  ASSETS_R2: R2Bucket;
  ASSETS: Fetcher;
  WORKER_SELF_REFERENCE: Fetcher;
}

export {};

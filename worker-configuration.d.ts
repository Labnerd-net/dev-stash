declare global {
  interface CloudflareEnv {
    dev_stash_files: R2Bucket;
    ANTHROPIC_API_KEY: string;
  }
}

export {};

import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// The current application is fully static and does not require an R2 incremental cache.
export default defineCloudflareConfig()

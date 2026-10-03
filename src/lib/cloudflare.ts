import { getCloudflareContext } from '@opennextjs/cloudflare'

export async function cloudflareEnv(): Promise<CloudflareEnv> {
  const { env } = await getCloudflareContext({ async: true })
  return env
}

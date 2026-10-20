/** Shared configuration forms and their Host describe mirror. */
import type { Context } from '@deepseek-ai/cordis'
// Type-only: the ctx.remote merge and the carrier's `connection/reset`
// lifecycle event, all through the assembly package.
import type {} from '@deepseek-ai/dsh-api-remotes/client'
// The allowlist and event declaration jointly type forwarded settings events.
import type {} from '@deepseek-ai/dsh-api-remotes/types'
import type {} from '@deepseek-ai/dsh-settings/types'
import { ConfigForms } from './config-form.ts'
import { SettingsSchemaService } from './schema.ts'
import { SettingsDescribeMirror } from './settings-mirror.ts'

export type { ConfigForm, ConfigFormSnapshot } from './config-form-types.ts'
export type { ConfigForms } from './config-form.ts'
export type {
  SettingsGeneralItemOwnerProps,
  SettingsHeaderOwnerProps,
  SettingsLauncherOwnerProps,
  SettingsOnboardingOwnerProps,
  SettingsPluginsTabOwnerProps,
  SettingsSectionOwnerProps,
  SettingsTriggerOwnerProps,
} from './contract/slots.ts'
export type { SchemaNode, SettingsSchemaService } from './schema.ts'
export type { SettingsDescribeFace, SettingsDescribeView, SettingsMirrorSnapshot } from './settings-mirror.ts'

/**
 * Required services: the Remote namespace the mirror reads through and the
 * forwarded settings invalidation it refreshes on.
 */
export const inject = ['remote', 'remote.settings']

/** Provide shared forms and refresh them on document changes and reconnects.
 * @param ctx Client provider context.
 */
export function apply(ctx: Context): void {
  const schema = new SettingsSchemaService(ctx)
  // Persistence policy: every authenticated browser persists through the Host document
  // (.agents/notes/implemented/bug-fix/2026-09-15-authenticated-browser-host-preferences.md).
  const mirror = new SettingsDescribeMirror(ctx)
  ctx.effect(() => {
    const disposers = [
      ctx.remote.$on('settings/document-updated', () => {
        void mirror.load()
      }),
      ctx.on('connection/reset', () => {
        void mirror.load()
      }),
    ]
    // The first connection also emits connection/reset, so startup normally
    // costs two reads (budgeted in startup-rpc-budget.e2e.ts). The in-flight
    // fold does not merge them into one; it guarantees at most one pending
    // read at a time and that no invalidation arriving mid-read is lost.
    void mirror.ensure()
    return () => {
      for (const dispose of disposers) dispose()
      return mirror.dispose()
    }
  }, 'ui-settings: describe mirror invalidations')
  new ConfigForms(ctx, { mirror, schema })
}

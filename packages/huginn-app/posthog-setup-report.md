<wizard-report>
# PostHog post-wizard report

The wizard completed a full PostHog analytics integration for the Huginn app. PostHog (`posthog-js`, `posthog-node`) was already installed and the `PostHogProvider` was wrapping the app in `main.tsx`, initialized via the `WebAnalytics` class in `@huginn/shared` with a reverse-proxy host (`https://e.huginn.dev`). Several `posthog.capture()` calls were already present across auth, messaging, and DM flows.

This session added the following:

- **Environment variables** — Updated `.env` with the correct PostHog project token and EU host.
- **User identification** — Added `posthog.identify()` alongside the existing `analytics.identify()` call in `useInitializeClient.ts` so every login/session restore links events to a known user.
- **New event captures** — Seven additional events covering friend activity, message edits/deletes, DM closes, and display name changes.
- **Cleanup** — Removed duplicate commented-out imports in `login.tsx`, `register.tsx`, and `useInitializeClient.ts`.

| Event                                  | Description                                           | File                                                      |
| -------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| `login:login_button_click`             | User clicks the login button                          | `src/routes/_app/_start/login.tsx`                        |
| `register:register_button_click`       | User clicks the register button                       | `src/routes/_app/_start/register.tsx`                     |
| `oauth:abort_button_click`             | User aborts the OAuth confirm step                    | `src/routes/_app/_start/oauth-redirect.tsx`               |
| `oauth:confirm_button_click`           | User confirms OAuth account creation                  | `src/routes/_app/_start/oauth-redirect.tsx`               |
| `friends:*_tab_view`                   | User switches between Friends tabs                    | `src/routes/_app/_main/_home/friends.tsx`                 |
| `dm:channel_find_or_create`            | User creates or opens a DM / group DM                 | `src/components/modal/CreateDMModal.tsx`                  |
| `channel:recipient_added`              | User adds a recipient to a group DM                   | `src/components/modal/AddRecipientModal.tsx`              |
| `message:send`                         | User sends a message (with attachment/reply metadata) | `src/hooks/useMessageBoxActions.ts`                       |
| `message:edited`                       | User commits an edit to an existing message           | `src/hooks/useMessageBoxActions.ts`                       |
| `message:deleted`                      | User deletes a message                                | `src/hooks/mutations/useDeleteMessage.ts`                 |
| `profile:username_changed`             | User successfully changes their username              | `src/components/modal/profile/ChangeUsernameModal.tsx`    |
| `profile:display_name_changed`         | User successfully changes their display name          | `src/components/modal/profile/ChangeDisplayNameModal.tsx` |
| `voice:status_disconnect_button_click` | User disconnects from a voice channel                 | `src/components/voice/VoiceStatus.tsx`                    |
| `friend:request_sent`                  | User submits a friend request by username             | `src/components/friends/AddFriendTab.tsx`                 |
| `friend:removed`                       | User removes a friend via context menu                | `src/components/contextmenu/RelationshipContextMenu.tsx`  |
| `channel:dm_closed`                    | User closes/leaves a DM channel                       | `src/hooks/mutations/useDeleteDMChannel.ts`               |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://eu.posthog.com/project/23843/dashboard/736560)
- [Registrations & Logins over time](https://eu.posthog.com/project/23843/insights/Yq5Uhr7b) — Daily registration vs login button clicks
- [Messages sent over time](https://eu.posthog.com/project/23843/insights/prUpSbW2) — Total messages sent per day
- [Registration to messaging funnel](https://eu.posthog.com/project/23843/insights/t66geBWl) — Conversion from sign-up to sending first message (14-day window)
- [Friend requests sent vs removed](https://eu.posthog.com/project/23843/insights/fGnvORQd) — Social growth vs churn signal
- [DM channel activity](https://eu.posthog.com/project/23843/insights/A428viQr) — DMs opened and group recipients added over time

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>

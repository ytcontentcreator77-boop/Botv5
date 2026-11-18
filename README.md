# Multi-provider SMM Telegram Mini App

A white-label Telegram Mini App and bot for selling social-media services through multiple standard SMM v2 API providers. The admin connects providers, imports services, configures prices and branding, and manages orders from the built-in admin panel.

## Features

- Telegram Mini App customer storefront, wallet, orders and profile.
- Owner-only admin dashboard, user/order management, price rules and branding.
- Multiple standard SMM v2 providers (API URL + key), service import by provider/category/platform, and per-order provider routing.
- Scheduled provider order status checks; provider cancellation and refill where supported.
- Admin configuration for service/category icons, currencies and payment methods.
- Editable bot message templates for welcome, order lifecycle, top-ups, refunds, help and referrals.
- Telegram Stars top-ups (the only fully implemented live payment flow).
- Cloudflare Workers + D1 deployment.

## Requirements

- Node.js 24 or newer
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- A Cloudflare account with Workers and D1 enabled
- One or more providers that implement the common SMM v2 `key` + `action` API

## Local setup

1. Install dependencies with `npm ci`.
2. Copy `.dev.vars.example` to `.dev.vars` and set `APP_ENCRYPTION_KEY` (32+ random characters). The bot token and first admin Telegram ID are entered in the first-run browser setup and encrypted in D1.
3. Run `npm run dev`.
4. Open the local setup page, enter the bot token, and complete the Telegram setup steps, including the first-admin claim.
5. Claim the owner account, open the Admin page in Telegram, and connect providers under **Providers**.
6. Import services by selecting a provider, category, platform and services.

## Cloudflare deployment

1. Deploy the project to Cloudflare Workers.
2. Add `APP_ENCRYPTION_KEY` as a Cloudflare Worker secret (`openssl rand -base64 32`). Do not add the Telegram bot token to source control or Worker vars; enter it in the first-run setup. The first admin is verified through a one-time claim link sent to the bot and must match the Telegram ID entered during setup.
3. Deploy the Worker and open its URL to complete the Telegram setup wizard.
4. Claim the owner account, then connect supplier API endpoints and keys from **Admin → Providers**.
5. Apply migrations with `npm run db:migrate:remote` if your deployment process does not apply them automatically.

Provider keys are stored server-side and masked in admin responses. Never share the `.dev.vars` file or provider credentials.

## Checks

```sh
npm run typecheck
npm test
npm run build
```

See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for what is implemented and what remains intentionally unfinished.


## Payment gateways

See [PAYMENT_GATEWAYS.md](./PAYMENT_GATEWAYS.md) for Khalti, eSewa and Paytm/UPI configuration, secret management, sandbox testing and production safety checks.


## First-run Cloudflare setup (V4)

1. Create the D1 database and deploy the Worker/assets. The Worker applies migrations on first request.
2. Generate a strong encryption secret: `openssl rand -base64 32`.
3. Save it as a Cloudflare Worker secret named `APP_ENCRYPTION_KEY` (or `npx wrangler secret put APP_ENCRYPTION_KEY`). This is the only required bot-setup secret.
4. Open the deployed app URL. Enter the Telegram bot token from @BotFather and the intended administrator's numeric Telegram ID.
5. The server validates the token with Telegram and stores it encrypted in D1 using AES-GCM. The token is not written to browser storage.
6. Complete the setup steps, open the generated claim link from the Telegram account whose ID you entered, and press Start. Other accounts cannot claim first-admin access.
7. Keep `APP_ENCRYPTION_KEY` backed up securely. If it is lost, the encrypted bot token cannot be recovered; repeat token setup with a controlled recovery procedure.

The customer wallet is stored in micro-USD/USDT-equivalent units to avoid rounding loss. Each customer can select an enabled display currency in Profile; currency conversion affects presentation only, not the underlying wallet value. Telegram Stars remain an optional payment method, with the Stars-per-USDT rate controlled by the administrator.

## V5 upgrade status

This source ZIP contains the V4 application plus the first V5 implementation slice: all 36 named theme presets, with the original `cobalt` theme ID and visual values preserved as **Ocean Blue** for backwards compatibility. The full V5 feature specification is not yet complete in this package. See `IMPLEMENTATION_STATUS.md` for implemented work, outstanding features, and required pre-deployment validation.

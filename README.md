# Boutique ERP

A multi-tenant boutique storefront and business portal built with React, Vite, Firebase Authentication, Cloud Firestore, and Cloud Storage.

> **Development status:** This is an early application, not a production-ready ERP. It currently provides product catalogs, customer wishlists, reservation requests, tenant chat, basic business branding, and a portal dashboard. Procurement, sales/POS, accounting, payments, role-based staff administration, audit history, and automated security-rule tests are not implemented. The current Firebase rules also need tenant-isolation work before handling real customer or business data.

## Run locally

1. Create a Firebase project and enable Email/Password and Google Authentication, Firestore, and Storage.
2. Copy `.env.example` to `.env` and set the Firebase web app values.
3. Install dependencies and start Vite:

   ```sh
   npm install
   npm run dev
   ```

4. Build the production bundle with `npm run build`.
5. Run Firebase authorization tests with `npm run test:rules`. The first run downloads the Firestore and Storage emulators and requires a supported local Java runtime.

The app reads Firebase settings from `VITE_FIREBASE_*` variables in [src/firebase.js](src/firebase.js). Never put service-account credentials or other server secrets in Vite environment variables; `VITE_*` values are shipped to browsers.

## Current routes

- `/` — platform landing page
- `/register-business` — business registration and plan selection
- `/login` — customer and business account sign-in
- `/store/:slug` — public tenant storefront
- `/portal/:slug` — tenant operations portal
- `/super-admin` — platform administration

The old `/admin` route redirects to the current user's business portal. Tenant selection and storefront settings are handled by [src/context/TenantContext.jsx](src/context/TenantContext.jsx); Firebase authentication and user/business lookup are handled by [src/context/AuthContext.jsx](src/context/AuthContext.jsx).

## Current capabilities

- Public catalog browsing, category/search filters, and product detail pages
- Customer wishlist, reservation requests, and tenant-specific chat
- Business product management and basic reservation status updates
- Storefront branding and a basic operations overview
- Demo storefront data for the `atelier-22` fallback

The package selection is currently informational. There is no payment processing, accounting ledger, purchase-order workflow, or server-enforced package entitlement system.

## Firebase deployment

After reviewing and testing the rules against the intended authorization model, deploy with Firebase CLI:

```sh
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,storage
```

Hosting is configured to serve the Vite `dist` output and route application paths to `index.html` in [firebase.json](firebase.json). Build first, then deploy hosting with:

```sh
npm run build
firebase deploy --only hosting
```

The rules now scope customer reservations and chats to their customer, restrict tenant operations to approved business members, and scope business image writes. Business documents and storefront product documents are still publicly readable; they include internal identifiers and product fields such as cost and SKU. Split public business/catalog data from private membership and inventory records before storing real business data. Platform administrators must be provisioned through a trusted process; client-side admin bootstrap is intentionally disabled. For development, a project administrator can create a `super_admins/{firebase-auth-uid}` document in the Firebase console.

## ERP delivery sequence

1. Stabilize the current app and keep its documentation/build behavior accurate.
2. Define and test tenant authorization, privacy boundaries, and administrator provisioning.
3. Agree the ERP domain model and safe migration approach.
4. Add inventory movements, stock controls, suppliers, purchasing, and receiving.
5. Add the agreed order/POS, customer service, and fulfillment workflows.
6. Add auditable finance summaries and subscription entitlements; choose payment integration only after provider and reconciliation requirements are settled.
7. Establish automated tests, monitoring, backups/recovery, staging, and release acceptance checks.

## Main code areas

- [src/App.jsx](src/App.jsx) — routes and tenant wrappers
- [src/pages/store/](src/pages/store) — storefront customer flows
- [src/pages/portal/](src/pages/portal) — business portal workflows
- [src/hooks/](src/hooks) — Firebase data subscriptions and mutations
- [src/context/](src/context) — authentication, tenant, shop, and toast state
- [firestore.rules](firestore.rules) and [storage.rules](storage.rules) — Firebase authorization rules

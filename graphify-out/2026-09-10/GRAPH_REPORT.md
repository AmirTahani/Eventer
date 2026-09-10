# Graph Report - Eventer  (2026-09-10)

## Corpus Check
- 191 files · ~60,695 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1416 nodes · 2798 edges · 80 communities (72 shown, 8 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 105 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f4195974`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AuthUser
- nest-cli.json
- api/tsconfig.app.json
- PaymentsService
- DjsService
- vouchers.controller.ts
- rate-limit.guard.ts
- domain.module.ts
- checkin.controller.ts
- events.service.ts
- Backend/package.json
- app.module.ts
- devDependencies
- scripts
- compilerOptions
- LocationsService
- RolesGuard
- DashboardShell.tsx
- domain/src/index.ts
- NotificationsService
- dependencies
- Frontend/package.json
- health.controller.ts
- api/src/main.ts
- invitations/page.tsx
- 10.3 Events
- api.ts
- compilerOptions
- cancel/page.tsx
- auth.controller.ts
- providers.tsx
- dependencies
- devDependencies
- jest
- CreateEventDto
- 3. System & Module Architecture
- @nestjs/common
- events.controller.ts
- UpdateEventDto
- ReplacePricingTiersDto
- djs.controller.ts
- registrations.controller.ts
- .wireHandlers
- event-reminders.service.ts
- 12. Deployment, Docker & Observability
- .createIntent
- ListAuditLogsQueryDto
- Backend/README.md
- CreateRegistrationDto
- ListEventsQueryDto
- CreateRegistrationDto
- 2. Lifecycles & State Machines
- 6. Roadmap & Build Plan
- scripts
- 8. Testing & Automation Strategy
- 7. Design System — Material UI, Luxury Navy Palette
- bot/tsconfig.app.json
- HomeLanding.tsx
- locations.controller.ts
- worker/tsconfig.app.json
- common/tsconfig.lib.json
- db/tsconfig.lib.json
- self-only.guard.ts
- api.d.ts
- domain/tsconfig.lib.json
- Backend/eslint.config.mjs
- app.e2e-spec.ts
- Frontend/eslint.config.mjs
- env.schema.ts
- Private Event Platform — Project Documentation
- prisma
- migrate-and-start.sh
- next-env.d.ts
- 1. Executive Summary & Product Requirements
- 4. Database Schema
- FilesService
- Eventer
- 5. UX Flows
- tsconfig.build.json
- 11-edge-cases.md

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 113 edges
2. `@nestjs/common` - 71 edges
3. `CurrentUser` - 41 edges
4. `PrismaService` - 37 edges
5. `Roles()` - 36 edges
6. `EventsService` - 36 edges
7. `@prisma/client` - 30 edges
8. `scripts` - 27 edges
9. `class-validator` - 23 edges
10. `compilerOptions` - 23 edges

## Surprising Connections (you probably didn't know these)
- `handleCreate()` --calls--> `createInvitation()`  [EXTRACTED]
  Frontend/src/app/dashboard/invitations/page.tsx → Frontend/src/lib/api.ts
- `AuditController` --references--> `Roles()`  [EXTRACTED]
  Backend/apps/api/src/audit/audit.controller.ts → Backend/libs/domain/src/auth/roles.guard.ts
- `CheckinController` --references--> `Roles()`  [EXTRACTED]
  Backend/apps/api/src/checkin/checkin.controller.ts → Backend/libs/domain/src/auth/roles.guard.ts
- `service()` --calls--> `EventVisibilityService`  [EXTRACTED]
  Backend/libs/domain/src/events/event-visibility.service.spec.ts → Backend/libs/domain/src/events/event-visibility.service.ts
- `buildProvider()` --calls--> `OrcaRailPaymentProvider`  [EXTRACTED]
  Backend/libs/domain/src/payments/orcarail.provider.spec.ts → Backend/libs/domain/src/payments/orcarail.provider.ts

## Import Cycles
- None detected.

## Communities (80 total, 8 thin omitted)

### Community 0 - "AuthUser"
Cohesion: 0.07
Nodes (38): Post, EventsController, ApiBearerAuth, ApiTags, Body, Controller, Delete, Get (+30 more)

### Community 1 - "nest-cli.json"
Cohesion: 0.05
Nodes (46): compilerOptions, entryFile, root, sourceRoot, type, compilerOptions, entryFile, root (+38 more)

### Community 2 - "api/tsconfig.app.json"
Cohesion: 0.25
Nodes (7): compilerOptions, declaration, outDir, exclude, extends, include, ../../tsconfig.json

### Community 3 - "PaymentsService"
Cohesion: 0.07
Nodes (20): mapOrcaRailWebhook(), OrcaRailPaymentProvider, OrcaRailProviderConfig, OrcaRailWebhookBody, buildProvider(), CreatePaymentIntentInput, CreatePaymentIntentResult, MockPaymentProvider (+12 more)

### Community 4 - "DjsService"
Cohesion: 0.13
Nodes (13): DjsController, ApiBearerAuth, ApiTags, Body, Controller, Delete, Get, Param (+5 more)

### Community 5 - "vouchers.controller.ts"
Cohesion: 0.07
Nodes (23): AcceptInvitationDto, IsOptional, IsString, MinLength, CreateInvitationDto, IsOptional, IsString, MinLength (+15 more)

### Community 6 - "rate-limit.guard.ts"
Cohesion: 0.09
Nodes (17): BotModule, Module, Module, WorkerModule, CommonModule, Global, Module, DbModule (+9 more)

### Community 7 - "domain.module.ts"
Cohesion: 0.11
Nodes (26): AuditModule, Module, CheckinModule, Module, DjsModule, Module, EventsModule, Module (+18 more)

### Community 8 - "checkin.controller.ts"
Cohesion: 0.08
Nodes (18): CheckinController, ManualDto, ScanDto, ApiBearerAuth, ApiTags, Body, Controller, IsString (+10 more)

### Community 9 - "events.service.ts"
Cohesion: 0.11
Nodes (20): PrismaService, Injectable, AuditAppendInput, AuditService, Injectable, canManageEvent(), hasRole(), isAdmin() (+12 more)

### Community 10 - "Backend/package.json"
Cohesion: 0.06
Nodes (35): description, eslint, @types/node, typescript, license, name, private, version (+27 more)

### Community 11 - "app.module.ts"
Cohesion: 0.14
Nodes (13): CreateIntentDto, PaymentsController, ApiTags, Controller, IsUUID, TicketsController, ApiBearerAuth, ApiTags (+5 more)

### Community 12 - "devDependencies"
Cohesion: 0.07
Nodes (28): devDependencies, eslint, eslint-config-prettier, @eslint/eslintrc, @eslint/js, eslint-plugin-prettier, globals, jest (+20 more)

### Community 13 - "scripts"
Cohesion: 0.07
Nodes (27): scripts, build, build:api, build:bot, build:worker, format, lint, openapi:export (+19 more)

### Community 14 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+18 more)

### Community 15 - "LocationsService"
Cohesion: 0.08
Nodes (21): IsNumber, IsObject, IsOptional, IsString, MinLength, Type, ValidateIf, UpdateLocationDto (+13 more)

### Community 16 - "RolesGuard"
Cohesion: 0.12
Nodes (13): IsOptional, IsString, MinLength, UploadUrlDto, FilesController, ApiBearerAuth, ApiTags, Body (+5 more)

### Community 17 - "DashboardShell.tsx"
Cohesion: 0.17
Nodes (16): DashboardHomePage(), DashboardShell(), DrawerNav(), moreIcons, MoreSheet(), tabIcons, useAuth(), allNav (+8 more)

### Community 18 - "domain/src/index.ts"
Cohesion: 0.22
Nodes (7): DuplicateRegistrationException, InsufficientCapacityException, moneyMultiply(), EnqueueNotificationInput, CapacityDecision, PAYMENT_TTL_MS, WAITLIST_OFFER_TTL_MS

### Community 19 - "NotificationsService"
Cohesion: 0.07
Nodes (20): ApiBearerAuth, ApiTags, Controller, Param, Post, UseGuards, WaitlistController, Injectable (+12 more)

### Community 20 - "dependencies"
Cohesion: 0.09
Nodes (22): dependencies, bcryptjs, class-transformer, class-validator, cookie-parser, grammy, nanoid, @nestjs/common (+14 more)

### Community 21 - "Frontend/package.json"
Cohesion: 0.08
Nodes (22): eslint, @types/node, typescript, name, private, version, rootDir, @emotion/styled (+14 more)

### Community 22 - "health.controller.ts"
Cohesion: 0.14
Nodes (12): ApiOperation, HealthController, ApiOkResponse, ApiTags, Controller, Get, HealthModule, Module (+4 more)

### Community 23 - "api/src/main.ts"
Cohesion: 0.15
Nodes (7): AppModule, Module, bootstrap(), initSentryStub(), StructuredLogger, Injectable, cookie-parser

### Community 24 - "invitations/page.tsx"
Cohesion: 0.11
Nodes (8): steps, InvitationsPage(), handleCreate(), MobileFab(), Props, PageHeader(), Props, react

### Community 25 - "10.3 Events"
Cohesion: 0.06
Nodes (31): 10.1 Auth, 10.2 Vouchers / Invitations, 10.3 Events, 10.4 Registrations, 10.5 Payments, 10.6 Tickets & Check-in, 10.7 Audit logs, 10. API Reference — Detailed Request/Response Contracts (+23 more)

### Community 26 - "api.ts"
Cohesion: 0.14
Nodes (17): LoginPage(), Window, API_BASE_URL, ApiError, apiFetch(), createInvitation(), CreateInvitationInput, CreateInvitationResult (+9 more)

### Community 27 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 28 - "cancel/page.tsx"
Cohesion: 0.18
Nodes (10): CancelContent(), searchParams, PaymentCancelView(), PaymentReturnView(), resolvePaymentIntentId(), ReturnContent(), searchParams, AppProviders() (+2 more)

### Community 29 - "auth.controller.ts"
Cohesion: 0.13
Nodes (13): AuthController, ApiOkResponse, ApiTags, Body, Controller, HttpCode, Post, TelegramLoginDto (+5 more)

### Community 30 - "providers.tsx"
Cohesion: 0.15
Nodes (16): Props, ThemedApp(), Props, ThemeModeSwitch(), ColorModeContext, ColorModeContextValue, ColorModeProvider(), readStoredMode() (+8 more)

### Community 31 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @emotion/cache, @emotion/react, @emotion/styled, @mui/icons-material, @mui/material, @mui/material-nextjs, @mui/x-data-grid (+7 more)

### Community 32 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, eslint, eslint-config-next, jsdom, openapi-typescript, @testing-library/jest-dom, @testing-library/react, @testing-library/user-event (+7 more)

### Community 33 - "jest"
Cohesion: 0.14
Nodes (14): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, moduleNameMapper, rootDir, roots, testEnvironment (+6 more)

### Community 34 - "CreateEventDto"
Cohesion: 0.19
Nodes (13): CreateEventDto, PricingTierDto, IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional (+5 more)

### Community 35 - "3. System & Module Architecture"
Cohesion: 0.15
Nodes (12): 3.10 i18n, 3.11 Security checklist (mitigations), 3.1 High-level shape, 3.2 Module boundaries, 3.3 Representative API design, 3.4 Telegram architecture, 3.5 Background jobs & Redis, 3.6 Authentication & authorization (+4 more)

### Community 36 - "@nestjs/common"
Cohesion: 0.20
Nodes (12): BotContext, SessionData, Env, AuthModule, Module, JwtPayload, Module, VouchersModule (+4 more)

### Community 37 - "events.controller.ts"
Cohesion: 0.17
Nodes (9): CancelEventDto, IsOptional, IsString, CreateAccessGrantDto, IsEnum, IsString, MinLength, class-transformer (+1 more)

### Community 38 - "UpdateEventDto"
Cohesion: 0.17
Nodes (12): IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Min (+4 more)

### Community 39 - "ReplacePricingTiersDto"
Cohesion: 0.20
Nodes (10): PricingTierDto, ReplacePricingTiersDto, IsArray, IsBoolean, IsDateString, IsOptional, IsString, MinLength (+2 more)

### Community 40 - "djs.controller.ts"
Cohesion: 0.20
Nodes (9): CreateDjDto, IsOptional, IsString, MinLength, IsOptional, IsString, MinLength, ValidateIf (+1 more)

### Community 41 - "registrations.controller.ts"
Cohesion: 0.22
Nodes (8): CapacityRequestDto, IsInt, Min, Type, RejectRegistrationDto, IsOptional, IsString, MaxLength

### Community 42 - ".wireHandlers"
Cohesion: 0.06
Nodes (18): ApiBearerAuth, ApiTags, Controller, Get, UseGuards, UsersController, parseInviteStartPayload(), TelegramBotService (+10 more)

### Community 44 - "12. Deployment, Docker & Observability"
Cohesion: 0.18
Nodes (10): 12.1 Processes to deploy, 12.2 Docker, 12.3 Environment variables (representative, not exhaustive), 12.4 Database migrations, 12.5 Backups, 12.6 CI/CD, 12.7 Health checks, 12.8 Observability (+2 more)

### Community 45 - ".createIntent"
Cohesion: 0.24
Nodes (8): ApiBearerAuth, Body, HttpCode, Param, Post, UseGuards, Headers, Req

### Community 46 - "ListAuditLogsQueryDto"
Cohesion: 0.11
Nodes (16): ApiPropertyOptional, AuditController, ApiBearerAuth, ApiTags, Controller, Get, Query, UseGuards (+8 more)

### Community 47 - "Backend/README.md"
Cohesion: 0.20
Nodes (9): Compile and run the project, Deployment, Description, License, Project setup, Resources, Run tests, Stay in touch (+1 more)

### Community 48 - "CreateRegistrationDto"
Cohesion: 0.22
Nodes (9): CreateRegistrationDto, GuestDto, IsArray, IsInt, IsOptional, IsString, Min, Type (+1 more)

### Community 49 - "ListEventsQueryDto"
Cohesion: 0.22
Nodes (9): ListEventsQueryDto, IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min (+1 more)

### Community 50 - "CreateRegistrationDto"
Cohesion: 0.22
Nodes (9): CreateRegistrationDto, GuestDto, IsArray, IsInt, IsOptional, IsString, Min, Type (+1 more)

### Community 51 - "2. Lifecycles & State Machines"
Cohesion: 0.22
Nodes (8): 2.1 Event lifecycle, 2.2 Registration lifecycle, 2.3 Payment lifecycle, 2.4 Waitlist lifecycle, 2.5 Ticket / check-in lifecycle, 2.6 Location privacy lifecycle, 2.7 Voucher / invitation lifecycle, 2. Lifecycles & State Machines

### Community 52 - "6. Roadmap & Build Plan"
Cohesion: 0.22
Nodes (8): 6.1 Stack decision, 6.2 MVP scope, 6.3 Phase 2, 6.4 Phase 3, 6.5 Milestones, 6.6 Risk register, 6.7 Unresolved decisions — needs your input before/around the listed milestone, 6. Roadmap & Build Plan

### Community 53 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, codegen, dev, lint, start, test, test:watch (+1 more)

### Community 54 - "8. Testing & Automation Strategy"
Cohesion: 0.22
Nodes (8): 8.1 Tooling summary, 8.2 Unit tests, 8.3 Snapshot tests, 8.4 Integration tests (Backend), 8.5 E2E tests, 8.6 CI gates, 8.7 Where this lands in the roadmap, 8. Testing & Automation Strategy

### Community 55 - "7. Design System — Material UI, Luxury Navy Palette"
Cohesion: 0.25
Nodes (7): 7.1 Why MUI here (vs the earlier Tailwind/shadcn suggestion), 7.2 Luxury color palette — navy & blue, 7.3 Typography, 7.4 MUI theme object (starting point for M13), 7.5 Component/UX conventions, 7.6 Where this plugs into the roadmap, 7. Design System — Material UI, Luxury Navy Palette

### Community 56 - "bot/tsconfig.app.json"
Cohesion: 0.25
Nodes (7): compilerOptions, declaration, outDir, exclude, extends, include, ../../tsconfig.json

### Community 57 - "HomeLanding.tsx"
Cohesion: 0.14
Nodes (9): nextConfig, metadata, viewport, metadata, features, HomeLanding(), steps, @mui/icons-material (+1 more)

### Community 58 - "locations.controller.ts"
Cohesion: 0.13
Nodes (14): ListQueryDto, IsInt, IsOptional, IsString, Max, Min, Type, CreateLocationDto (+6 more)

### Community 59 - "worker/tsconfig.app.json"
Cohesion: 0.25
Nodes (7): compilerOptions, declaration, outDir, exclude, extends, include, ../../tsconfig.json

### Community 60 - "common/tsconfig.lib.json"
Cohesion: 0.25
Nodes (7): compilerOptions, declaration, outDir, exclude, extends, include, ../../tsconfig.json

### Community 61 - "db/tsconfig.lib.json"
Cohesion: 0.25
Nodes (7): compilerOptions, declaration, outDir, exclude, extends, include, ../../tsconfig.json

### Community 63 - "api.d.ts"
Cohesion: 0.33
Nodes (5): components, $defs, operations, paths, webhooks

### Community 64 - "domain/tsconfig.lib.json"
Cohesion: 0.25
Nodes (7): compilerOptions, declaration, outDir, exclude, extends, include, ../../tsconfig.json

### Community 65 - "Backend/eslint.config.mjs"
Cohesion: 0.50
Nodes (3): @eslint/js, globals, typescript-eslint

### Community 68 - "env.schema.ts"
Cohesion: 0.33
Nodes (5): envSchema, optionalNonEmpty, optionalUrl, validateEnv(), zod

### Community 69 - "Private Event Platform — Project Documentation"
Cohesion: 0.33
Nodes (5): Files, How to hand this to another AI tool, How to use this, Private Event Platform — Project Documentation, Status

### Community 73 - "1. Executive Summary & Product Requirements"
Cohesion: 0.33
Nodes (5): 1.1 What we're building, 1.2 Roles, 1.3 Permission matrix, 1.4 Key architectural decisions & assumptions (please review), 1. Executive Summary & Product Requirements

### Community 74 - "4. Database Schema"
Cohesion: 0.33
Nodes (5): 4.1 Core tables (abbreviated column lists — types/constraints noted), 4.2 Mermaid ERD, 4.3 Capacity concurrency strategy (the critical part), 4.4 Key indexes (beyond PKs/FKs), 4. Database Schema

### Community 75 - "FilesService"
Cohesion: 0.47
Nodes (3): nanoid(), FilesService, Injectable

### Community 76 - "Eventer"
Cohesion: 0.33
Nodes (5): Eventer, Local setup, Payments (OrcaRail), Production checklist, Structure

### Community 77 - "5. UX Flows"
Cohesion: 0.40
Nodes (4): 5.1 Telegram bot flows, 5.2 Web dashboard flows, 5.3 Open UX questions for you, 5. UX Flows

### Community 78 - "tsconfig.build.json"
Cohesion: 0.50
Nodes (3): exclude, extends, ./tsconfig.json

## Knowledge Gaps
- **444 isolated node(s):** `extends`, `../../tsconfig.json`, `declaration`, `outDir`, `include` (+439 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 747 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthUser` connect `AuthUser` to `@nestjs/common`, `events.controller.ts`, `vouchers.controller.ts`, `rate-limit.guard.ts`, `checkin.controller.ts`, `djs.controller.ts`, `registrations.controller.ts`, `app.module.ts`, `.wireHandlers`, `.createIntent`, `ListAuditLogsQueryDto`, `events.service.ts`, `LocationsService`, `domain/src/index.ts`, `NotificationsService`, `DjsService`, `locations.controller.ts`, `self-only.guard.ts`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `@nestjs/common` connect `@nestjs/common` to `PaymentsService`, `vouchers.controller.ts`, `rate-limit.guard.ts`, `domain.module.ts`, `checkin.controller.ts`, `events.service.ts`, `Backend/package.json`, `app.module.ts`, `RolesGuard`, `domain/src/index.ts`, `NotificationsService`, `health.controller.ts`, `api/src/main.ts`, `auth.controller.ts`, `events.controller.ts`, `djs.controller.ts`, `registrations.controller.ts`, `.wireHandlers`, `event-reminders.service.ts`, `locations.controller.ts`, `self-only.guard.ts`, `app.e2e-spec.ts`, `FilesService`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `Backend/package.json`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `extends`, `../../tsconfig.json`, `declaration` to the rest of the system?**
  _444 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AuthUser` be split into smaller, more focused modules?**
  _Cohesion score 0.06562150055991041 - nodes in this community are weakly interconnected._
- **Should `nest-cli.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04810360777058279 - nodes in this community are weakly interconnected._
- **Should `PaymentsService` be split into smaller, more focused modules?**
  _Cohesion score 0.07215541165587419 - nodes in this community are weakly interconnected._
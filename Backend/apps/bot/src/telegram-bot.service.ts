import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, InlineKeyboard, session } from 'grammy';
import type { Context, SessionFlavor } from 'grammy';
import type { Env } from '@eventer/common';
import {
  EventsService,
  InvitationsService,
  RegistrationsService,
  TicketsService,
  UsersService,
  type AuthUser,
} from '@eventer/domain';
import { Locale, UserStatus } from '@prisma/client';
import { PrismaService } from '@eventer/db';
import { parseInviteStartPayload } from './deep-link';

type SessionData = {
  registerEventId?: string;
  peopleCount?: number;
  locale?: 'en' | 'fa';
};

type BotContext = Context & SessionFlavor<SessionData>;

const PRIVATE_MSG =
  'This is a private events platform. You need an invitation to join.';

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot: Bot<BotContext> | null = null;

  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly invitations: InvitationsService,
    private readonly users: UsersService,
    private readonly events: EventsService,
    private readonly registrations: RegistrationsService,
    private readonly tickets: TicketsService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    const token = this.config.get('TELEGRAM_BOT_TOKEN', { infer: true });
    const nodeEnv = this.config.get('NODE_ENV', { infer: true });

    if (!token || token === 'dev-bot-token-for-local-tests') {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN missing or placeholder — bot idle (no long polling)',
      );
      return;
    }

    this.bot = new Bot<BotContext>(token);
    this.bot.use(
      session({
        initial: (): SessionData => ({}),
      }),
    );
    this.wireHandlers(this.bot);

    if (nodeEnv === 'production') {
      this.logger.log(
        'Production mode: bot context ready (webhook mode expected; not starting long polling)',
      );
      return;
    }

    this.logger.log('Starting Telegram long polling');
    void this.bot.start({
      onStart: (info) =>
        this.logger.log(`Bot @${info.username} long-polling started`),
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.bot) {
      await this.bot.stop();
    }
  }

  private mainMenuKeyboard(locale: 'en' | 'fa' = 'en') {
    const labels =
      locale === 'fa'
        ? {
            events: 'رویدادها',
            regs: 'ثبت‌نام‌های من',
            tickets: 'بلیت‌های من',
            waitlist: 'لیست انتظار',
            profile: 'پروفایل',
            language: 'زبان',
          }
        : {
            events: 'Events',
            regs: 'My Registrations',
            tickets: 'My Tickets',
            waitlist: 'Waitlist',
            profile: 'Profile',
            language: 'Language',
          };

    return new InlineKeyboard()
      .text(labels.events, 'menu:events')
      .text(labels.regs, 'menu:registrations')
      .row()
      .text(labels.tickets, 'menu:tickets')
      .text(labels.waitlist, 'menu:waitlist')
      .row()
      .text(labels.profile, 'menu:profile')
      .text(labels.language, 'menu:language');
  }

  private async resolveAuthUser(ctx: BotContext): Promise<AuthUser | null> {
    const from = ctx.from;
    if (!from) return null;
    const user = await this.users.findByTelegramUserId(BigInt(from.id));
    if (!user || user.status !== UserStatus.APPROVED) return null;
    return this.users.toAuthUser(user);
  }

  private wireHandlers(bot: Bot<BotContext>): void {
    bot.command('start', async (ctx) => {
      const payload = ctx.match?.toString() ?? '';
      const inviteToken = parseInviteStartPayload(payload);

      if (inviteToken) {
        const from = ctx.from;
        if (!from) {
          await ctx.reply('Unable to identify your Telegram account.');
          return;
        }
        try {
          const result = await this.invitations.accept(inviteToken, {
            telegramUserId: String(from.id),
            telegramUsername: from.username,
            firstName: from.first_name ?? 'Guest',
          });
          const user = await this.users.findById(result.userId);
          const auth = this.users.toAuthUser(user);
          await ctx.reply(
            `Welcome, ${auth.firstName}! You're in. Use the menu below.`,
            { reply_markup: this.mainMenuKeyboard(auth.locale) },
          );
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Invalid invitation';
          await ctx.reply(
            `Invitation could not be accepted: ${message}. This is a private platform.`,
          );
        }
        return;
      }

      const auth = await this.resolveAuthUser(ctx);
      if (auth) {
        await ctx.reply(`Welcome back, ${auth.firstName}!`, {
          reply_markup: this.mainMenuKeyboard(auth.locale),
        });
        return;
      }

      await ctx.reply(PRIVATE_MSG);
    });

    bot.callbackQuery('menu:events', async (ctx) => {
      await ctx.answerCallbackQuery();
      const auth = await this.requireAuth(ctx);
      if (!auth) return;
      const { items } = await this.events.list(auth, { limit: 10 });
      if (items.length === 0) {
        await ctx.reply('No visible events right now.');
        return;
      }
      const kb = new InlineKeyboard();
      for (const ev of items) {
        kb.text(String(ev.name), `event:${ev.id}`).row();
      }
      await ctx.reply('Events:', { reply_markup: kb });
    });

    bot.callbackQuery(/^event:(.+)$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      const auth = await this.requireAuth(ctx);
      if (!auth) return;
      const eventId = ctx.match![1]!;
      try {
        const detail = await this.events.getById(auth, eventId);
        const loc = detail.location
          ? `${(detail.location as { name?: string }).name ?? 'Venue'}`
          : 'Hidden until released';
        const priceLine = detail.currentPrice
          ? `${detail.currentPrice.amount} ${detail.currentPrice.currency}`
          : `${detail.price} ${detail.currency}`;
        const text = [
          `*${detail.name}*`,
          detail.description ?? '',
          `📍 ${loc}`,
          `💰 ${priceLine}`,
          `👥 Remaining: ${detail.remaining ?? '?'}`,
        ]
          .filter(Boolean)
          .join('\n');
        const kb = new InlineKeyboard()
          .text('Register', `reg:${eventId}`)
          .text('Back', 'menu:events');
        await ctx.reply(text, {
          parse_mode: 'Markdown',
          reply_markup: kb,
        });
      } catch {
        await ctx.reply('Event not found.');
      }
    });

    bot.callbackQuery(/^reg:(.+)$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      const auth = await this.requireAuth(ctx);
      if (!auth) return;
      const eventId = ctx.match![1]!;
      ctx.session.registerEventId = eventId;
      ctx.session.peopleCount = 1;
      const kb = new InlineKeyboard()
        .text('−', 'people:-')
        .text('1', 'people:noop')
        .text('+', 'people:+')
        .row()
        .text('Confirm', `regconfirm:${eventId}`);
      await ctx.reply('How many people?', { reply_markup: kb });
    });

    bot.callbackQuery('people:-', async (ctx) => {
      await ctx.answerCallbackQuery();
      const n = Math.max(1, (ctx.session.peopleCount ?? 1) - 1);
      ctx.session.peopleCount = n;
      await ctx.editMessageReplyMarkup({
        reply_markup: new InlineKeyboard()
          .text('−', 'people:-')
          .text(String(n), 'people:noop')
          .text('+', 'people:+')
          .row()
          .text(
            'Confirm',
            `regconfirm:${ctx.session.registerEventId ?? ''}`,
          ),
      });
    });

    bot.callbackQuery('people:+', async (ctx) => {
      await ctx.answerCallbackQuery();
      const n = Math.min(20, (ctx.session.peopleCount ?? 1) + 1);
      ctx.session.peopleCount = n;
      await ctx.editMessageReplyMarkup({
        reply_markup: new InlineKeyboard()
          .text('−', 'people:-')
          .text(String(n), 'people:noop')
          .text('+', 'people:+')
          .row()
          .text(
            'Confirm',
            `regconfirm:${ctx.session.registerEventId ?? ''}`,
          ),
      });
    });

    bot.callbackQuery('people:noop', async (ctx) => {
      await ctx.answerCallbackQuery();
    });

    bot.callbackQuery(/^regconfirm:(.+)$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      const auth = await this.requireAuth(ctx);
      if (!auth) return;
      const eventId = ctx.match![1]!;
      const peopleCount = ctx.session.peopleCount ?? 1;
      try {
        const reg = await this.registrations.create(auth, eventId, {
          peopleCount,
        });
        await ctx.reply(
          `Registration created: ${reg.status} (${reg.peopleCount} people).`,
          { reply_markup: this.mainMenuKeyboard(auth.locale) },
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Registration failed';
        await ctx.reply(message);
      }
    });

    bot.callbackQuery('menu:registrations', async (ctx) => {
      await ctx.answerCallbackQuery();
      const auth = await this.requireAuth(ctx);
      if (!auth) return;
      const regs = await this.registrations.listMine(auth);
      if (regs.items.length === 0) {
        await ctx.reply('No registrations yet.');
        return;
      }
      const lines = regs.items.map(
        (r) => `• ${r.eventName ?? r.eventId}: ${r.status} (${r.peopleCount})`,
      );
      await ctx.reply(lines.join('\n'));
    });

    bot.callbackQuery('menu:tickets', async (ctx) => {
      await ctx.answerCallbackQuery();
      const auth = await this.requireAuth(ctx);
      if (!auth) return;
      const { items } = await this.tickets.listMine(auth);
      if (items.length === 0) {
        await ctx.reply('No tickets yet.');
        return;
      }
      const lines = items.map(
        (t) => `• ${t.eventName}: ${t.status} (${t.holderType})`,
      );
      await ctx.reply(lines.join('\n'));
    });

    bot.callbackQuery('menu:waitlist', async (ctx) => {
      await ctx.answerCallbackQuery();
      const auth = await this.requireAuth(ctx);
      if (!auth) return;
      const entries = await this.prisma.waitlistEntry.findMany({
        where: {
          userId: auth.id,
          status: { in: ['JOINED', 'OFFERED'] },
        },
        include: { event: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      if (entries.length === 0) {
        await ctx.reply('You are not on any waitlist.');
        return;
      }
      const lines = entries.map(
        (e) =>
          `• ${e.event.name}: #${e.position} (${e.status}${e.offerExpiresAt ? `, expires ${e.offerExpiresAt.toISOString()}` : ''})`,
      );
      await ctx.reply(lines.join('\n'));
    });

    bot.callbackQuery('menu:profile', async (ctx) => {
      await ctx.answerCallbackQuery();
      const auth = await this.requireAuth(ctx);
      if (!auth) return;
      await ctx.reply(
        [
          `Name: ${auth.firstName}${auth.lastName ? ` ${auth.lastName}` : ''}`,
          `Username: @${auth.telegramUsername ?? '—'}`,
          `Locale: ${auth.locale}`,
          `Roles: ${auth.roles.join(', ') || 'none'}`,
        ].join('\n'),
        { reply_markup: this.mainMenuKeyboard(auth.locale) },
      );
    });

    bot.callbackQuery('menu:language', async (ctx) => {
      await ctx.answerCallbackQuery();
      const auth = await this.requireAuth(ctx);
      if (!auth) return;
      const kb = new InlineKeyboard()
        .text('English', 'lang:en')
        .text('فارسی', 'lang:fa');
      await ctx.reply('Choose language / زبان را انتخاب کنید:', {
        reply_markup: kb,
      });
    });

    bot.callbackQuery(/^lang:(en|fa)$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      const auth = await this.requireAuth(ctx);
      if (!auth) return;
      const locale = ctx.match![1] as 'en' | 'fa';
      await this.users.setLocale(auth.id, locale === 'fa' ? Locale.fa : Locale.en);
      await ctx.reply(locale === 'fa' ? 'زبان به فارسی تغییر کرد.' : 'Language set to English.', {
        reply_markup: this.mainMenuKeyboard(locale),
      });
    });

    // Organizer: approve / reject / release location
    bot.callbackQuery(/^approve:(.+)$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      const auth = await this.requireAuth(ctx);
      if (!auth) return;
      const registrationId = ctx.match![1]!;
      try {
        const reg = await this.registrations.approve(auth, registrationId);
        await ctx.reply(`Approved registration ${reg.id} → ${reg.status}`);
      } catch (err) {
        await ctx.reply(err instanceof Error ? err.message : 'Approve failed');
      }
    });

    bot.callbackQuery(/^reject:(.+)$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      const auth = await this.requireAuth(ctx);
      if (!auth) return;
      const registrationId = ctx.match![1]!;
      try {
        const reg = await this.registrations.reject(auth, registrationId);
        await ctx.reply(`Rejected registration ${reg.id}`);
      } catch (err) {
        await ctx.reply(err instanceof Error ? err.message : 'Reject failed');
      }
    });

    bot.callbackQuery(/^release_loc:(.+)$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      const auth = await this.requireAuth(ctx);
      if (!auth) return;
      const eventId = ctx.match![1]!;
      try {
        const result = await this.events.releaseLocation(auth, eventId);
        await ctx.reply(
          `Location released at ${result.locationReleasedAt}`,
        );
      } catch (err) {
        await ctx.reply(
          err instanceof Error ? err.message : 'Release failed',
        );
      }
    });
  }

  private async requireAuth(ctx: BotContext): Promise<AuthUser | null> {
    const auth = await this.resolveAuthUser(ctx);
    if (!auth) {
      await ctx.reply(PRIVATE_MSG);
      return null;
    }
    return auth;
  }
}

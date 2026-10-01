import { boolean, index, integer, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

// Tables required by Better Auth (core schema), followed by the app's own tables.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// App tables

export const habit = pgTable(
  'habit',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color').notNull().default('#facc15'),
    // Days the habit is scheduled, as a string of weekday digits (0 = Sunday), e.g. "12345".
    days: text('days').notNull().default('0123456'),
    sortOrder: integer('sort_order').notNull().default(0),
    // Local date (YYYY-MM-DD) the habit was created on; stats ignore earlier days.
    startDate: text('start_date'),
    // Null means "every scheduled day"; otherwise the habit needs this many completions per week.
    weeklyTarget: integer('weekly_target'),
    // morning, afternoon or evening; null means any time of day.
    timeOfDay: text('time_of_day'),
    // Set when the habit is deleted. Kept briefly so the delete can be undone, then purged.
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('habit_user_idx').on(table.userId)],
);

export const habitCompletion = pgTable(
  'habit_completion',
  {
    id: text('id').primaryKey(),
    habitId: text('habit_id')
      .notNull()
      .references(() => habit.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    // Local calendar date of the user, YYYY-MM-DD.
    date: text('date').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    unique('habit_completion_habit_date_unique').on(table.habitId, table.date),
    index('habit_completion_user_date_idx').on(table.userId, table.date),
  ],
);

export const habitFreeze = pgTable(
  'habit_freeze',
  {
    id: text('id').primaryKey(),
    habitId: text('habit_id')
      .notNull()
      .references(() => habit.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    // The missed local date that a freeze token protects, YYYY-MM-DD.
    date: text('date').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    unique('habit_freeze_habit_date_unique').on(table.habitId, table.date),
    index('habit_freeze_user_idx').on(table.userId),
  ],
);

export const subscription = pgTable('subscription', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  // Stripe subscription status: active, trialing, past_due, canceled, incomplete, ...
  status: text('status'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  // Free access granted by hand, with no Stripe subscription behind it.
  comped: boolean('comped').notNull().default(false),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const userSettings = pgTable('user_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  // Hex colors (#rrggbb); null means the app default.
  accent: text('accent'),
  background: text('background'),
  foreground: text('foreground'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const task = pgTable(
  'task',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    // Local calendar date the task is planned for, YYYY-MM-DD.
    date: text('date').notNull(),
    done: boolean('done').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('task_user_date_idx').on(table.userId, table.date)],
);

export const boardCard = pgTable(
  'board_card',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    notes: text('notes').notNull().default(''),
    // One of the column ids in lib/planner.ts.
    status: text('status').notNull().default('todo'),
    // Order within a column. New cards use a timestamp so they sort last; moves renumber from 0.
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('board_card_user_idx').on(table.userId)],
);

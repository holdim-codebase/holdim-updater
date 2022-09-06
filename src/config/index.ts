export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production'
}

export const config = {
  environment: process.env.NODE_ENV ?? Environment.DEVELOPMENT,
  adminApi: {
    url: process.env.ADMIN_API_URL ?? 'https://admin-api.holdim.to',
  },
  notifier: {
    telegram: {
      adminChannelId: process.env.TELEGRAM_ADMIN_CHANNEL_ID ? +process.env.TELEGRAM_ADMIN_CHANNEL_ID : -1001784835095,
      botToken: process.env.TELEGRAM_BOT_TOKEN ?? '5564589827:AAE6LEqIw6B9Gu7HplOX4nRqd_Eplyfp-cI',
    },
  },
}

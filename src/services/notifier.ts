import { Proposal as DBProposal } from '@prisma/client'
import axios from 'axios'

import { config, Environment } from '../config'

const telegramClient = axios.create({
  baseURL: config.notifier.telegram.botToken,
  headers: {
    'Content-Type': 'application/json',
  },
})

const sendTextToAdminChannel = async (text: string): Promise<void> => {
  await telegramClient.post(`https://api.telegram.org/bot${config.notifier.telegram.botToken}/sendMessage`, {
    chat_id: config.notifier.telegram.adminChannelId,
    text,
    parse_mode: 'markdown',
  })
}

export const notifyAdminAboutNewProposal = async (proposal: DBProposal) => {
  let text = `*New Proposal received from AI*
_DAO:_ ${proposal.daoId}
_ID:_ ${proposal.id}
_Title:_ ${proposal.title}
_Resolve here:_ ${config.adminApi.url}/proposals/${proposal.id}/review`

  if (config.environment === Environment.DEVELOPMENT) {
    text = `⚠️⚠️⚠️⚠️ TEST ⚠️⚠️⚠️⚠️
${text}`
  }

  await sendTextToAdminChannel(text)
}

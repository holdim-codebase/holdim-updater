
import fastifyFactory from 'fastify'
import { logger } from './logging'
import { repositories } from './repositories'
import { Payload } from './services/pubsub'
import { notifyAdminAboutNewProposal } from './services/notifier'
import { Proposal as DBProposal } from '@prisma/client'
import crypto from 'crypto'

export const fastify = fastifyFactory({ logger })

const transformProposalToDbFormat = (payload: Payload): Pick<DBProposal, 'id'|'juniorDescription'|'middleDescription'> => ({
  id: Number(payload.id),
  juniorDescription: payload.juniorDescription,
  middleDescription: payload.juniorDescription,
})

const processPayload = async (payload: Payload) => {
  const proposalUpdate = transformProposalToDbFormat(payload)
  const proposal = await repositories.proposal.update({
    where: { id: proposalUpdate.id },
    data: proposalUpdate,
  })

  if (payload.setIssueNumber) {
    await repositories.$queryRaw`UPDATE "Proposal" SET "issueNumber" = nextval('proposal_issue_counter') WHERE "id" = ${proposal.id}`
  } else {
    await notifyAdminAboutNewProposal(proposal)
  }

  return proposal
}

fastify.post('/', async (request, reply) => {
  const requestId = crypto.randomUUID()
  try {
    logger.info({ message: 'Received request', requestBody: request.body, requestId })
    const proposal: Payload = JSON.parse(
      Buffer.from((request.body as any).message.data, 'base64').toString('utf-8')
    )
    logger.info({ message: 'Parsed proposal', proposal, requestId })

    const dbProposal = await processPayload(proposal)
    if (!dbProposal) {
      logger.info({ message: 'Request successfully finished. Proposal was skipped', requestId })
      return await reply.status(200).send({})
    }

    logger.info({ message: 'Request successfully finished', requestId })
    return await reply.status(200).send({})
  } catch (error: any) {
    logger.error({ message: 'Request failed', err: { message: error?.message, stack: error?.stack }, requestId })
    return reply.status(400).send({ message: (typeof error === 'object' && (error as { message?: string } || null)?.message) ?? 'unknown' })
  }
})

export const server = fastify

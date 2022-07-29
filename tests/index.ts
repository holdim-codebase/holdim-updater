import { Proposal } from '@prisma/client'
import { assert } from 'chai'
import { repositories } from '../src/repositories'
import { server as fastify } from '../src/server'
import { Payload } from '../src/services/pubsub'

const createPubSubMessageMock = (messageBody: Record<string, any>): { message: { data: string } } => ({
  message: {
    data: Buffer.from(JSON.stringify(messageBody)).toString('base64'),
  },
})

describe('updater', () => {
  it('Update existing proposal', async () => {
    const proposal = await repositories.proposal.findFirst()
    if (!proposal) {
      throw new Error('You need to sed your DB')
    }
    const newJuniorDescription = 'updated'
    const payload: Payload = {
      id: proposal?.id.toString(),
      juniorDescription: newJuniorDescription,
    }

    assert.notEqual(proposal.juniorDescription, newJuniorDescription)
    await fastify.inject({
      method: 'POST',
      url: '/',
      payload: createPubSubMessageMock(payload),
    })

    const proposalAfterUpdate = await repositories.proposal.findUnique({ where: { id: proposal.id } })
    assert.equal(proposalAfterUpdate?.juniorDescription, newJuniorDescription)
    await repositories.proposal.update({ where: { id: proposal.id }, data: { juniorDescription: proposal.juniorDescription } })
  })
})

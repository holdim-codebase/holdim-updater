import { assert } from 'chai'
import { repositories } from '../src/repositories'
import { server as fastify } from '../src/server'
import { Payload } from '../src/services/pubsub'

const createPubSubMessageMock = (messageBody: Record<string, any>): { message: { data: string } } => ({
  message: {
    data: Buffer.from(JSON.stringify(messageBody)).toString('base64'),
  },
})

describe('Updater', () => {
  it('Update existing proposal', async () => {
    const dao = await repositories.dao.findFirst()
    if (!dao) {
      throw new Error('You need to sed your DB')
    }

    const newProposal = {
      title: 'Test proposal',
      snapshotId: '12345678',
      seniorDescription: 'Test senior description',
      startAt: new Date(),
      endAt: new Date(),
      author: 'Vitaliano Buterinio',
      snapshotLink: 'https://google.com',
      daoId: dao.id,
      issueNumber: null,
    }
    const proposal = await repositories.proposal.upsert({
      where: { snapshotId: newProposal.snapshotId },
      create: newProposal,
      update: newProposal,
    })

    // Without `setIssueNumber` flag
    let newJuniorDescription = `${proposal.juniorDescription ?? ''}updated`
    let payload: Payload = {
      id: proposal?.id.toString(),
      juniorDescription: newJuniorDescription,
    }

    assert.notEqual(proposal.juniorDescription, newJuniorDescription)
    assert.equal(proposal.issueNumber, null)
    await fastify.inject({
      method: 'POST',
      url: '/',
      payload: createPubSubMessageMock(payload),
    })

    const proposalAfterUpdate = await repositories.proposal.findUnique({ where: { id: proposal.id } })
    assert.equal(proposalAfterUpdate?.juniorDescription, newJuniorDescription)
    assert.equal(proposalAfterUpdate?.issueNumber, null)

    // With `setIssueNumber` flag
    newJuniorDescription = `${proposalAfterUpdate?.juniorDescription ?? ''}updated`
    payload = {
      id: proposal?.id.toString(),
      juniorDescription: newJuniorDescription,
      setIssueNumber: true,
    }

    await fastify.inject({
      method: 'POST',
      url: '/',
      payload: createPubSubMessageMock(payload),
    })

    const proposalAfterSecondUpdate = await repositories.proposal.findUnique({ where: { id: proposal.id } })
    assert.equal(proposalAfterSecondUpdate?.juniorDescription, newJuniorDescription)
    assert.notEqual(proposalAfterSecondUpdate?.issueNumber, null)
  })
})

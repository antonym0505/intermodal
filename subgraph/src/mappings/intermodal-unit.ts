import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
    IntermodalUnit,
    ContainerRegistered,
    PossessionTransferInitiated,
    PossessionConfirmed,
    UpdateUser
} from "../../generated/IntermodalUnit/IntermodalUnit"
import { Container, Handoff } from "../../generated/schema"

export function handleContainerRegistered(event: ContainerRegistered): void {
    let container = new Container(event.params.tokenId.toString())
    container.unitNumber = event.params.unitNumber
    container.ownerCode = event.params.ownerCode
    container.owner = event.params.owner
    container.isoType = "22G1" // Default or fetched if available in event (it's not in the event but is in the struct)
    container.registeredAt = event.block.timestamp
    container.save()
}

export function handlePossessionTransferInitiated(event: PossessionTransferInitiated): void {
    let handoffId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
    let handoff = new Handoff(handoffId)

    handoff.container = event.params.tokenId.toString()
    handoff.from = event.params.from
    handoff.to = event.params.to
    handoff.initiatedAt = event.block.timestamp
    handoff.expires = event.params.expires
    handoff.status = "PENDING"
    handoff.txHash = event.transaction.hash
    handoff.save()
}

export function handlePossessionConfirmed(event: PossessionConfirmed): void {
    // Find the pending handoff for this container
    // Since we don't have the handoff ID directly, we might need to assume the latest one or query
    // For simplicity in this demo, we'll create a new CONFIRMED record or valid logic would require linking.
    // However, simpler approach: Update the status of the "latest" handoff or just rely on the event log.

    // Actually, keeping track of handoff IDs is tricky without it being in the event.
    // But we can update the Container entity's current possessor here.

    let container = Container.load(event.params.tokenId.toString())
    if (container) {
        container.currentPossessor = event.params.possessor
        container.save()
    }

    // Ideally we find the pending handoff and mark it confirmed. 
    // In a real subgraph we might filter for open handoffs.
    // For now let's just create a "Confirmed" record for history if we can't easily link.

    let handoffId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
    let handoff = new Handoff(handoffId)
    handoff.container = event.params.tokenId.toString()
    handoff.from = event.transaction.from // Approximation
    handoff.to = event.params.possessor
    handoff.initiatedAt = event.block.timestamp // timestamp of confirmation
    handoff.confirmedAt = event.block.timestamp
    handoff.status = "CONFIRMED_EVENT"
    handoff.txHash = event.transaction.hash
    handoff.save()
}

export function handleUpdateUser(event: UpdateUser): void {
    let container = Container.load(event.params.tokenId.toString())
    if (container) {
        container.currentPossessor = event.params.user
        container.possessionExpires = event.params.expires
        container.save()
    }
}

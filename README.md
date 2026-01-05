# Intermodal - Decentralized Container Custody Protocol

**Intermodal** is a blockchain-based infrastructure layer designed to bring transparency, trust, and standardized data to the shipping and logistics industry. utilizing the **ERC-4907 (Rentable NFT)** standard, it solves the critical problem of **chain of custody** by cryptographically separating the *Owner* of a container (e.g., the Shipping Line) from the current *User/Possessor* (e.g., Terminal, Trucker, Depot).

## 🚀 Purpose

In modern logistics, "Who has the container?" is a question often answered by fragmented, siloed data systems (EDI, TOS, proprietary APIs). This leads to:
*   **Data Latency**: Information is updated batches, not real-time.
*   **Disputes**: "We delivered it at 2:00 PM" vs "We received it at 4:00 PM".
*   **Liability Gaps**: Damage discovered days after a handoff is hard to attribute.

**Intermodal** acts as a **Single Source of Truth**. By representing each shipping container as a unique digital asset on-chain, we create an immutable ledger of custody transfers.

## 🏗️ Core Architecture

The system acts as a foundational protocol layer that existing systems can plug into.

### 1. The Container as an Asset (NFT)
Each physical container (e.g., `MSCU1234567`) is minted as a unique NFT. This NFT holds static metadata (ISO Type, Tare Weight, Max Weight) that never changes, ensuring data integrity across all parties.

### 2. Dual-State Possession (ERC-4907)
We leverage the **ERC-4907** standard to maintain two distinct roles for every container:
*   **`Owner`**: The legal owner (e.g., Maersk, MSC). This address effectively "owns" the asset.
*   **`User`**: The current physical custodian (e.g., APM Terminals, Trucker Bob). This address has "possession" rights.

### 3. The Digital Handshake
Custody cannot be "dumped" on a facility. It requires a cryptographic handshake:
1.  **Initiate**: The current possessor (or owner) acts to `initiatePossessionTransfer` to a specific target facility.
2.  **Confirm**: The receiving facility must sign a transaction to `confirmPossession` (effectively a digital signature or "Gate-In" event).
    *   *This acts as irrefutable proof of receipt.*

### 4. Facility Registry
A whitelist of authorized entities (`FacilityRegistry.sol`). Only verified Terminals, Ports, Depots, and Trucking Companies can take custody, preventing containers from being "lost" to unknown addresses.

---

## 🔌 Integration into Existing Workflows

Intermodal is designed to run *alongside* your existing Terminal Operating Systems (TOS) or ERPs, acting as the settlement layer for custody.

### For Terminals (TOS Integration)
Instead of relying solely on EDI 315 messages, your TOS can trigger a blockchain transaction upon "Gate In":
*   **Event**: Truck arrives at Gate. OCR reads Container ID.
*   **Action**: TOS calls Intermodal API (or Contract directly) -> `confirmPossession(containerId)`.
*   **Result**: Instant global visibility that the Terminal now has the container.

### For Truckers
*   **Mobile Integration**: Drivers can verify they are picking up the *correct* container by checking its on-chain status before leaving the terminal.
*   **Proof of Delivery**: The "Gate Out" / "Delivery" scan becomes a blockchain transaction, providing immediate proof of performance for payment.

### API Gateway (Backend)
The project includes a **NestJS Backend** that abstracts the blockchain complexity.
*   `POST /handoffs/initiate`: Start a transfer.
*   `POST /handoffs/confirm`: Accept a transfer.
*   **Webhooks**: Subscribe to container events to update your local DB.

---

## 🛠️ Foundation for Custom Applications

Because the state is public and standardized, Intermodal serves as a backend-as-a-service for building specialized logistics applications without needing a centralized database permission.

### Example Use Cases:
1.  **Automated Demurrage & Detention Billing**:
    *   Smart contracts can automatically calculate fees based on exactly how long the `User` held the NFT, eliminating billing disputes.
2.  **Insurance & Claims**:
    *   Insurers can query the immutable history to see exactly who had custody when a shock sensor (IoT) reported damage.
3.  **Customs & Inspection**:
    *   Authorities can flag containers on-chain, preventing valid `initiatePossessionTransfer` calls until cleared.

## 📦 Project Structure

*   `contracts/`: Solidity Smart Contracts (Hardhat).
    *   `IntermodalUnit.sol`: The core Container NFT logic.
    *   `FacilityRegistry.sol`: The participant whitelist.
*   `backend/`: NestJS API acting as a gateway/indexer.
*   `frontend/`: Reference React application for visualizing the ledger.

## 🏁 Getting Started

### Prerequisites
*   Node.js v18+
*   Docker (for local blockchain node)

### Installation
```bash
npm install
```

### Run Local Network
```bash
npm run chain
```

### Deploy Contracts
```bash
npm run deploy:local
```

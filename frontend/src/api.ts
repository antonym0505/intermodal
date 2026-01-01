import axios from 'axios';

const API_URL = 'http://localhost:3000';

export interface Container {
    tokenId: string;
    unitNumber: string;
    isoType: string;
    ownerCode: string;
    tareWeight: string;
    maxGrossWeight: string;
    registeredAt: string;
    owner: string;
    possessor: string | null;
    possessionExpires: string;
}

export interface ContainerSummary {
    id: string; // tokenId
    unitNumber: string;
    ownerCode: string;
    registeredAt: string;
}

export interface CustodyEvent {
    id: string;
    from: string;
    to: string;
    initiatedAt: string;
    confirmedAt: string | null;
    status: string;
    txHash: string;
}

export interface HandoffStatus {
    hasPendingHandoff: boolean;
    tokenId?: string;
    from?: string;
    to?: string;
    expires?: string;
    initiatedAt?: string;
    status?: 'PENDING' | 'CONFIRMED';
    bookingReference?: string;
    message?: string;
}

export const api = {
    getContainer: async (unitNumber: string): Promise<Container> => {
        const response = await axios.get(`${API_URL}/containers/${unitNumber}`);
        return response.data;
    },

    getHandoffStatus: async (unitNumber: string): Promise<HandoffStatus> => {
        const response = await axios.get(`${API_URL}/handoffs/${unitNumber}/status`);
        return response.data;
    },

    initiateHandoff: async (
        unitNumber: string,
        toFacilityAddress: string,
        durationSeconds: number = 86400
    ) => {
        const response = await axios.post(`${API_URL}/handoffs/initiate`, {
            unitNumber,
            toFacilityAddress,
            durationSeconds,
        });
        return response.data;
    },

    confirmHandoff: async (
        unitNumber: string,
        bookingReference: string,
        location: string
    ) => {
        const response = await axios.post(`${API_URL}/handoffs/confirm`, {
            unitNumber,
            bookingReference,
            location,
        });
        return response.data;
    },

    registerContainer: async (
        unitNumber: string,
        ownerCode: string,
        isoType: string,
        tareWeight: number,
        maxGrossWeight: number,
        ownerAddress: string
    ) => {
        const response = await axios.post(`${API_URL}/containers`, {
            unitNumber,
            ownerCode,
            isoType,
            tareWeight,
            maxGrossWeight,
            ownerAddress
        });
        return response.data;
    },

    registerFacility: async (
        facilityAddress: string,
        facilityCode: string,
        facilityType: number,
        name: string,
        location: string
    ) => {
        const response = await axios.post(`${API_URL}/facilities`, {
            facilityAddress,
            facilityCode,
            facilityType,
            name,
            location
        });
        return response.data;
    },

    getContainerHistory: async (tokenId: string): Promise<CustodyEvent[]> => {
        const query = `
        query {
            handoffs(
                where: { container: "${tokenId}" }
                orderBy: initiatedAt
                orderDirection: desc
            ) {
                id
                from
                to
                initiatedAt
                confirmedAt
                status
                txHash
            }
        }`;

        try {
            const response = await fetch('https://api.studio.thegraph.com/query/1721903/intermodal-subgraph/v0.0.3', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            });
            const data = await response.json();

            if (data.errors) {
                console.error('Subgraph errors:', data.errors);
                return [];
            }

            if (!data.data || !data.data.handoffs) {
                console.error('Unexpected subgraph response:', data);
                return [];
            }

            return data.data.handoffs;
        } catch (error) {
            console.error('Failed to fetch history:', error);
            return [];
        }
    },

    getRecentContainers: async (): Promise<ContainerSummary[]> => {
        const query = `
        query {
            containers(first: 10, orderBy: registeredAt, orderDirection: desc) {
                id
                unitNumber
                ownerCode
                registeredAt
            }
        }`;

        try {
            const response = await fetch('https://api.studio.thegraph.com/query/1721903/intermodal-subgraph/v0.0.3', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            });
            const data = await response.json();

            if (data.errors) {
                console.error('Subgraph errors:', data.errors);
                return [];
            }

            if (!data.data || !data.data.containers) {
                console.error('Unexpected subgraph response:', data);
                return [];
            }

            return data.data.containers;
        } catch (error) {
            console.error('Failed to fetch recent containers:', error);
            return [];
        }
    }
};

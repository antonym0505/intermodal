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
};

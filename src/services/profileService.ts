import apiClient from './apiClient';

export interface ChauffeurProfile {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    gender: string;
    dateOfBirth: string;
    rating: number;
    numberOfRides: number;
}

export async function fetchChauffeurProfile(): Promise<ChauffeurProfile> {
    const response = await apiClient.get<ChauffeurProfile>('/users/chauffeurs/profile');
    return response.data;
}

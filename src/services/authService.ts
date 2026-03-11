import apiClient from './apiClient';

export interface VerifyOtpResponse {
    authToken: string;
    user: {
        id: number;
        countryCode: string;
        phone: string;
        email: string | null;
        gender: string | null;
        blocked: boolean;
        name: string | null;
        dob: string | null;
        status: number;
    };
}

export const generateOtp = async (countryCode: string, phone: string): Promise<boolean> => {
    // API returns 204 No Content on success — axios treats 2xx as success, no JSON parsing needed
    await apiClient.post('/users/chauffeurs/auth/otp/generate', { countryCode, phone });
    return true;
};

export const verifyOtp = async (
    countryCode: string,
    phone: string,
    otp: string
): Promise<VerifyOtpResponse> => {
    const response = await apiClient.post<VerifyOtpResponse>('/users/chauffeurs/auth/otp/verify', {
        countryCode,
        phone,
        otp,
    });
    return response.data;
};

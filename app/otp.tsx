import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Alert,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
    Defs,
    LinearGradient as SvgGradient,
    Stop,
    Text as SvgText,
} from 'react-native-svg';
import { bgColors } from '@/src/constants/colors';
import OtpInput from '@/src/components/OtpInput';
import { generateOtp, verifyOtp } from '@/src/services/authService';
import { setAccessToken } from '@/src/services/apiClient';

export default function OtpScreen() {
    const { countryCode, phone } = useLocalSearchParams<{
        countryCode: string;
        phone: string;
    }>();
    const router = useRouter();

    const [otp, setOtp] = useState<string[]>(['', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const firstInputRef = useRef<TextInput | null>(null);

    const isComplete = otp.every((d) => d !== '');
    const maskedPhone = phone
        ? `${phone.slice(0, 2)}*****${phone.slice(-2)}`
        : '';

    const handleResend = async () => {
        try {
            await generateOtp(countryCode!, phone!);
        } catch {
            Alert.alert('Error', 'Failed to resend OTP. Please try again.');
        }
    };

    const handleLogin = async () => {
        if (!isComplete || loading) return;
        setLoading(true);
        setError('');
        try {
            const result = await verifyOtp(countryCode!, phone!, otp.join(''));
            await setAccessToken(result.authToken);
            router.replace('/(driver)/(tabs)/bookings');
        } catch {
            setError('OTP is invalid');
            setOtp(['', '', '', '']);
            setTimeout(() => firstInputRef.current?.focus(), 50);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Brand Heading */}
            <View style={styles.headingContainer}>
                <Svg height="40" width="100%" viewBox="0 0 300 40">
                    <Defs>
                        <SvgGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <Stop offset="0%" stopColor="#EDB96D" />
                            <Stop offset="100%" stopColor="#B5783C" />
                        </SvgGradient>
                    </Defs>
                    <SvgText
                        fill="url(#goldGradient)"
                        fontSize="28"
                        fontWeight="600"
                        x="50%"
                        y="28"
                        textAnchor="middle"
                        letterSpacing="4"
                    >
                        VELVET
                    </SvgText>
                </Svg>
                <Text style={styles.companySecondNameText}>EXPERIENCE</Text>
            </View>

            {/* OTP Section */}
            <View style={styles.otpSection}>
                <Text style={styles.heading}>Verify OTP</Text>

                <Text style={styles.subheading}>
                    A 4 digit OTP has been sent to ({countryCode}*****{phone?.slice(-2)})
                </Text>

                <Pressable onPress={() => router.back()}>
                    <Text style={styles.changePhone}>Change Phone Number</Text>
                </Pressable>

                <View style={styles.inputContainer}>
                    <OtpInput value={otp} onChange={setOtp} firstInputRef={firstInputRef} />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Text style={styles.resendText}>
                    Didn't receive the OTP?{' '}
                    <Text style={styles.resendLink} onPress={handleResend}>
                        Resend?
                    </Text>
                </Text>
            </View>

            {/* Login Button */}
            <Pressable
                disabled={!isComplete || loading}
                onPress={handleLogin}
                style={{ width: '100%' }}
            >
                <LinearGradient
                    colors={['#E5B566', '#B5783C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                        styles.loginButton,
                        (!isComplete || loading) && styles.loginDisabled,
                    ]}
                >
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={styles.loginButtonText}>Login</Text>
                    )}
                </LinearGradient>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: bgColors.mainBG,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    headingContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 40,
    },
    companySecondNameText: {
        fontSize: 14,
        color: '#AAAAAA',
        letterSpacing: 2,
        marginTop: 4,
    },
    otpSection: {
        width: '100%',
        marginBottom: 40,
    },
    heading: {
        fontSize: 30,
        color: '#FFFFFF',
        fontWeight: '500',
        marginBottom: 8,
    },
    subheading: {
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 8,
    },
    changePhone: {
        fontSize: 14,
        color: '#EDB96D',
        marginBottom: 32,
        textDecorationLine: 'underline',
    },
    inputContainer: {
        marginBottom: 16,
    },
    errorText: {
        color: '#FF4444',
        fontSize: 12,
        marginBottom: 12,
    },
    resendText: {
        fontSize: 14,
        color: '#AAAAAA',
    },
    resendLink: {
        color: '#EDB96D',
        fontWeight: '600',
    },
    loginButton: {
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
    },
    loginDisabled: {
        opacity: 0.5,
    },
});

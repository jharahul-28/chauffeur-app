import React, { useRef } from 'react';
import {
    View,
    TextInput,
    StyleSheet,
    NativeSyntheticEvent,
    TextInputKeyPressEventData,
} from 'react-native';
import { BlurView } from 'expo-blur';

const OTP_LENGTH = 4;

interface OtpInputProps {
    value: string[];
    onChange: (otp: string[]) => void;
    firstInputRef?: React.MutableRefObject<TextInput | null>;
}

export default function OtpInput({ value, onChange, firstInputRef }: OtpInputProps) {
    const inputRefs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));

    const handleChange = (text: string, index: number) => {
        const digit = text.replace(/\D/g, '').slice(-1);
        const newOtp = [...value];
        newOtp[index] = digit;
        onChange(newOtp);
        if (digit && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (
        e: NativeSyntheticEvent<TextInputKeyPressEventData>,
        index: number
    ) => {
        if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <View style={styles.container}>
            {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                <BlurView key={`otp-box-${index}`} intensity={40} tint="light" style={styles.box}>
                    <TextInput
                        ref={(ref) => {
                            inputRefs.current[index] = ref;
                            if (index === 0 && firstInputRef) {
                                firstInputRef.current = ref;
                            }
                        }}
                        value={value[index]}
                        onChangeText={(text) => handleChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        style={styles.input}
                        textAlign="center"
                        selectionColor="#EDB96D"
                    />
                </BlurView>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 12,
    },
    box: {
        flex: 1,
        height: 56,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#D69F59',
        shadowOpacity: 0.08,
        shadowRadius: 40,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    input: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '600',
        width: '100%',
        height: '100%',
    },
});

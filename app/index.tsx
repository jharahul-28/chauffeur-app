import { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Href, useRouter } from "expo-router";
import { bgColors } from "@/src/constants/colors";
import { generateOtp } from "@/src/services/authService";
import { getErrorMessage } from "@/src/utils/apiErrorParser";
import BrandLogo from "@/src/components/BrandLogo";

export default function Index() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState("91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidPhone = countryCode.length >= 1 && phoneNumber.length === 10;

  const handleCountryCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    setCountryCode(digits);
  };

  const handleLogin = async () => {
    if (!isValidPhone) {
      Alert.alert("Invalid phone number");
      return;
    }
    setLoading(true);
    const formattedCountryCode = `+${countryCode}`;
    try {
      await generateOtp(formattedCountryCode, phoneNumber);
      router.push({ 
        pathname: "/otp" as any, 
        params: { countryCode: formattedCountryCode, phone: phoneNumber } 
      });
    } catch (err) {
      const message = getErrorMessage(err, "Failed to send OTP. Please try again.");
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Brand Heading */}
        <BrandLogo />

        {/* Login Section */}
        <View style={styles.driverCredentialsInputContainer}>
          <Text style={styles.driverCredentialsInputMainheading}>
            Driver Login
          </Text>

          <Text style={styles.driverCredentialsInputSecondaryheading}>
            Log in to continue setting up your driver account.
          </Text>

          <View style={styles.phoneNumberInputContainer}>
            <Text style={styles.phoneNumberInputHeading}>
              Phone Number
            </Text>

            <View style={styles.phoneRow}>

              {/* Country Code */}
              <View style={styles.countryCodeWrapper}>
                <BlurView intensity={40} tint="light" style={styles.inputBlur}>
                  <Text style={styles.plusSymbol}>+</Text>

                  <TextInput
                    value={countryCode}
                    onChangeText={handleCountryCodeChange}
                    keyboardType="number-pad"
                    maxLength={3}
                    style={styles.countryCodeInput}
                  />
                </BlurView>
              </View>

              {/* Phone Number */}
              <View style={styles.phoneNumberWrapper}>
                <BlurView intensity={40} tint="light" style={styles.inputBlur}>
                  <TextInput
                    value={phoneNumber}
                    onChangeText={(text) =>
                      setPhoneNumber(text.replace(/\D/g, ""))
                    }
                    keyboardType="number-pad"
                    maxLength={10}
                    placeholder="Enter phone number"
                    placeholderTextColor="#777"
                    style={styles.phoneNumberInput}
                  />
                </BlurView>
              </View>

            </View>
          </View>
        </View>

        {/* Login Button */}
        <Pressable
          disabled={!isValidPhone || loading}
          onPress={handleLogin}
          style={{ width: "100%" }}
        >
          <LinearGradient
            colors={["#E5B566", "#B5783C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.loginButton,
              (!isValidPhone || loading) && styles.loginDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.loginButtonText}>Send OTP</Text>
            )}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({

  keyboardView: {
    flex: 1,
    backgroundColor: bgColors.mainBG,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },



  driverCredentialsInputContainer: {
    width: "100%",
    marginBottom: 40,
  },

  driverCredentialsInputMainheading: {
    fontSize: 30,
    color: "#FFFFFF",
    fontWeight: "500",
    marginBottom: 8,
  },

  driverCredentialsInputSecondaryheading: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 24,
  },

  phoneNumberInputContainer: {
    width: "100%",
  },

  phoneNumberInputHeading: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 8,
  },

  phoneRow: {
    flexDirection: "row",
    width: "100%",
  },

  countryCodeWrapper: {
    flex: 3,
    marginRight: 8,
  },

  phoneNumberWrapper: {
    flex: 10,
  },

  inputBlur: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: 12,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",

    shadowColor: "#D69F59",
    shadowOpacity: 0.08,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 4 },

    elevation: 3,
  },

  plusSymbol: {
    color: "#FFF",
    fontSize: 16,
    marginRight: 4,
  },

  countryCodeInput: {
    color: "#FFF",
    flex: 1,
    fontSize: 16,
  },

  phoneNumberInput: {
    color: "#FFF",
    flex: 1,
    fontSize: 16,
  },

  loginButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },

  loginButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },

  loginDisabled: {
    opacity: 0.5,
  },

});

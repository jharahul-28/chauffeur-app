import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Text as SvgText } from 'react-native-svg';

export default function BrandLogo() {
  return (
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
  );
}

const styles = StyleSheet.create({
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
});

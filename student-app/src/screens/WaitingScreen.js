import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function WaitingScreen({ playerName, roomCode }) {
  // Pulsing dots animation
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Pulsing dots sequence
    const animateDot = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );

    animateDot(dot1, 0).start();
    animateDot(dot2, 200).start();
    animateDot(dot3, 400).start();

    // Floating animation for the icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -12,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      <Animated.View style={[styles.content, { opacity: fadeIn }]}>
        {/* Floating emoji */}
        <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
          <Text style={styles.emoji}>⏳</Text>
        </Animated.View>

        <Text style={styles.title}>Get Ready!</Text>
        <Text style={styles.message}>Waiting for the quiz to begin...</Text>

        {/* Pulsing dots */}
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { opacity: dot1, transform: [{ scale: dot1 }] }]} />
          <Animated.View style={[styles.dot, { opacity: dot2, transform: [{ scale: dot2 }] }]} />
          <Animated.View style={[styles.dot, { opacity: dot3, transform: [{ scale: dot3 }] }]} />
        </View>

        {/* Player info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Player</Text>
            <Text style={styles.infoValue}>{playerName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Room</Text>
            <Text style={styles.infoValueCode}>{roomCode}</Text>
          </View>
        </View>

        <Text style={styles.hint}>The teacher will start the quiz shortly</Text>
      </Animated.View>

      {/* Background decorations */}
      <View style={[styles.bgOrb, styles.bgOrb1]} />
      <View style={[styles.bgOrb, styles.bgOrb2]} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 1,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 16,
    display: 'none',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fafafa',
    marginBottom: 8,
    letterSpacing: -1,
  },
  message: {
    fontSize: 16,
    color: '#737373',
    fontWeight: '400',
    marginBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 48,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fafafa',
  },
  infoCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    padding: 32,
    width: Math.min(width - 48, 400),
    borderWidth: 1,
    borderColor: '#262626',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 11,
    color: '#737373',
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 18,
    color: '#fafafa',
    fontWeight: '500',
  },
  infoValueCode: {
    fontSize: 20,
    color: '#fafafa',
    fontWeight: '600',
    letterSpacing: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#262626',
    marginVertical: 12,
  },
  hint: {
    fontSize: 14,
    color: '#737373',
    marginTop: 32,
    fontWeight: '400',
  },
  bgOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  bgOrb1: {
    width: 250,
    height: 250,
    backgroundColor: '#171717',
    top: 60,
    left: -100,
  },
  bgOrb2: {
    width: 200,
    height: 200,
    backgroundColor: '#171717',
    bottom: 40,
    right: -80,
  },
});

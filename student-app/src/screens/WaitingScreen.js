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
    backgroundColor: '#09090e',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 1,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
    display: 'flex',
    textShadowColor: 'rgba(16, 185, 129, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: -1,
    textShadowColor: 'rgba(16, 185, 129, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  message: {
    fontSize: 18,
    color: '#10b981',
    fontWeight: '800',
    marginBottom: 40,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 56,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  infoCard: {
    backgroundColor: 'rgba(20, 20, 30, 0.8)',
    borderRadius: 24,
    padding: 32,
    width: Math.min(width - 48, 400),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '800',
  },
  infoValueCode: {
    fontSize: 24,
    color: '#06b6d4',
    fontWeight: '900',
    letterSpacing: 4,
    textShadowColor: 'rgba(6, 182, 212, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 4,
  },
  hint: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 40,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bgOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  bgOrb1: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    top: 40,
    left: -120,
  },
  bgOrb2: {
    width: 250,
    height: 250,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    bottom: 20,
    right: -100,
  },
});

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import socket from '../socket';

const { width } = Dimensions.get('window');

export default function JoinScreen({ onJoined }) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Animations
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(-30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(titleSlide, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle pulsing animation for the gradient orb
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(gradientAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleJoin = () => {
    const trimmedName = playerName.trim();
    const trimmedCode = roomCode.trim();

    if (!trimmedName) {
      Alert.alert('Oops!', 'Please enter your name.');
      return;
    }
    if (!/^\d{6}$/.test(trimmedCode)) {
      Alert.alert('Oops!', 'Room code must be exactly 6 digits.');
      return;
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    setIsJoining(true);

    socket.connect();

    socket.emit('student:join-room', { roomCode: trimmedCode, playerName: trimmedName }, (response) => {
      setIsJoining(false);
      if (response && response.success) {
        onJoined(trimmedName, trimmedCode);
      } else {
        socket.disconnect();
        Alert.alert(
          'Could not join',
          response?.message || 'Failed to join the room. Check the code and try again.'
        );
      }
    });
  };

  const orbScale = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const orbOpacity = gradientAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.5, 0.3],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Decorative background orbs */}
      <Animated.View
        style={[
          styles.bgOrb,
          styles.bgOrb1,
          { transform: [{ scale: orbScale }], opacity: orbOpacity },
        ]}
      />
      <Animated.View
        style={[
          styles.bgOrb,
          styles.bgOrb2,
          { transform: [{ scale: orbScale }], opacity: orbOpacity },
        ]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Title */}
        <Animated.View style={{ transform: [{ translateY: titleSlide }], opacity: cardOpacity }}>
          <Text style={styles.emoji}>🎮</Text>
          <Text style={styles.title}>LiveQuizz</Text>
          <Text style={styles.subtitle}>Join the game!</Text>
        </Animated.View>

        {/* Card */}
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: cardScale }],
              opacity: cardOpacity,
            },
          ]}
        >
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>YOUR NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#555577"
              value={playerName}
              onChangeText={setPlayerName}
              maxLength={20}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>ROOM CODE</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="000000"
              placeholderTextColor="#555577"
              value={roomCode}
              onChangeText={(text) => setRoomCode(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="go"
              onSubmitEditing={handleJoin}
            />
          </View>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
              onPress={handleJoin}
              disabled={isJoining}
              activeOpacity={0.8}
            >
              <Text style={styles.joinButtonText}>
                {isJoining ? 'Joining...' : '🚀 Join Game'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  bgOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  bgOrb1: {
    width: 300,
    height: 300,
    backgroundColor: '#6c5ce7',
    top: -80,
    right: -100,
  },
  bgOrb2: {
    width: 250,
    height: 250,
    backgroundColor: '#e74c3c',
    bottom: -60,
    left: -80,
  },
  emoji: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#a0a0b8',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 24,
    padding: 28,
    width: Math.min(width - 48, 400),
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.2)',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6c5ce7',
    marginBottom: 8,
    letterSpacing: 2,
  },
  input: {
    backgroundColor: '#0f1a30',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 18,
    color: '#ffffff',
    borderWidth: 1.5,
    borderColor: 'rgba(108, 92, 231, 0.15)',
    fontWeight: '600',
  },
  codeInput: {
    fontSize: 28,
    textAlign: 'center',
    letterSpacing: 12,
    fontWeight: '800',
  },
  joinButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

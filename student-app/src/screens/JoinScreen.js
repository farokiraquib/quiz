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
  Image,
  ScrollView,
} from 'react-native';
import socket from '../socket';

const { width } = Dimensions.get('window');

export default function JoinScreen({ onJoined }) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [password, setPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [activeRooms, setActiveRooms] = useState([]);

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

    // Fetch active rooms on mount
    socket.connect();
    socket.emit('student:get-active-rooms', (response) => {
      if (response && response.success) {
        setActiveRooms(response.rooms);
      }
    });

    return () => {
      // Disconnect if we unmount and haven't joined
      // Note: we don't disconnect if we successfully joined (handled by onJoined)
    };
  }, []);

  const handleJoin = () => {
    const trimmedName = playerName.trim();
    const trimmedCode = roomCode.trim();

    if (!trimmedName) {
      Alert.alert('Oops!', 'Please enter your name.');
      return;
    }
    if (!/^[A-Za-z0-9]+$/.test(trimmedCode)) {
      Alert.alert('Oops!', 'Room code must be alphanumeric.');
      return;
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.98,
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

    socket.emit('student:join-room', { roomCode: trimmedCode, playerName: trimmedName, password }, (response) => {
      setIsJoining(false);
      if (response && response.success) {
        if (response.imageUrls && response.imageUrls.length > 0) {
          response.imageUrls.forEach(url => Image.prefetch(url));
        }
        onJoined(trimmedName, trimmedCode);
      } else {
        socket.disconnect();
        Alert.alert(
          'Could not join',
          response?.error || 'Failed to join the room. Check the code and try again.'
        );
      }
    });
  };

  const handleSelectRoom = (code) => {
    setRoomCode(code);
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
              placeholderTextColor="#737373"
              value={playerName}
              onChangeText={setPlayerName}
              maxLength={20}
              autoCapitalize="words"
              returnKeyType="next"
              selectionColor="#fafafa"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>ROOM CODE</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="CODE"
              placeholderTextColor="#737373"
              value={roomCode}
              onChangeText={(text) => setRoomCode(text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
              maxLength={10}
              returnKeyType="next"
              selectionColor="#fafafa"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>PASSWORD (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password if required"
              placeholderTextColor="#737373"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={handleJoin}
              selectionColor="#fafafa"
            />
          </View>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
              onPress={handleJoin}
              disabled={isJoining}
              activeOpacity={0.9}
            >
              <Text style={styles.joinButtonText}>
                {isJoining ? 'Joining...' : 'Join Game'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Active Rooms List */}
          {activeRooms.length > 0 && (
            <View style={styles.activeRoomsContainer}>
              <Text style={styles.inputLabel}>ACTIVE ROOMS (TAP TO SELECT)</Text>
              <ScrollView style={styles.activeRoomsList} showsVerticalScrollIndicator={false}>
                {activeRooms.map((r, i) => (
                  <TouchableOpacity key={i} style={styles.activeRoomItem} onPress={() => handleSelectRoom(r.code)}>
                    <Text style={styles.activeRoomCode}>{r.code}</Text>
                    <Text style={styles.activeRoomInfo}>{r.playerCount} players • {r.status}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090e',
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
    width: 350,
    height: 350,
    backgroundColor: 'rgba(139, 92, 246, 0.15)', // Vibrant Purple
    top: -100,
    right: -150,
  },
  bgOrb2: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(6, 182, 212, 0.15)', // Cyan
    bottom: -80,
    left: -120,
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 8,
    display: 'flex',
    textShadowColor: 'rgba(139, 92, 246, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -1,
    textShadowColor: 'rgba(6, 182, 212, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#8b5cf6',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  card: {
    backgroundColor: 'rgba(20, 20, 30, 0.8)',
    borderRadius: 24,
    padding: 32,
    width: Math.min(width - 48, 400),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  inputWrapper: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 12,
    letterSpacing: 1.5,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    fontWeight: '600',
  },
  codeInput: {
    fontSize: 28,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: '900',
    color: '#06b6d4',
  },
  joinButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  joinButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#4c1d95',
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  activeRoomsContainer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },
  activeRoomsList: {
    maxHeight: 120,
  },
  activeRoomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeRoomCode: {
    color: '#06b6d4',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  activeRoomInfo: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
});

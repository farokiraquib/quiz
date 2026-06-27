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
    backgroundColor: '#0a0a0a',
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
    backgroundColor: '#171717',
    top: -80,
    right: -100,
  },
  bgOrb2: {
    width: 250,
    height: 250,
    backgroundColor: '#171717',
    bottom: -60,
    left: -80,
  },
  emoji: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: 8,
    display: 'none',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fafafa',
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#737373',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '400',
  },
  card: {
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    padding: 32,
    width: Math.min(width - 48, 400),
    borderWidth: 1,
    borderColor: '#262626',
  },
  inputWrapper: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#737373',
    marginBottom: 12,
    letterSpacing: 1.5,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#fafafa',
    borderWidth: 1,
    borderColor: '#262626',
    fontWeight: '500',
  },
  codeInput: {
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: '500',
  },
  joinButton: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  activeRoomsContainer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#262626',
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
    borderBottomColor: '#1a1a1a',
  },
  activeRoomCode: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
  },
  activeRoomInfo: {
    color: '#737373',
    fontSize: 12,
  },
});

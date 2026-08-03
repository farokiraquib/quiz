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
  Keyboard,
} from 'react-native';
import socket from '../socket';

const { width, height } = Dimensions.get('window');

export default function JoinScreen({ onJoined }) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [password, setPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [activeRooms, setActiveRooms] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  // Animations
  const cardScale = useRef(new Animated.Value(0.95)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(-20)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;
  const passwordHeight = useRef(new Animated.Value(0)).current;
  const passwordOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(titleSlide, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle pulsing animation for the gradient orb
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(gradientAnim, {
          toValue: 0,
          duration: 4000,
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
      // Cleanup if necessary
    };
  }, []);

  const togglePassword = () => {
    const toValue = showPassword ? 0 : 1;
    setShowPassword(!showPassword);
    
    Animated.parallel([
      Animated.timing(passwordHeight, {
        toValue,
        duration: 300,
        useNativeDriver: false, // height cannot use native driver
      }),
      Animated.timing(passwordOpacity, {
        toValue,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleJoin = () => {
    Keyboard.dismiss();
    const trimmedName = playerName.trim();
    const trimmedCode = roomCode.trim();

    if (!trimmedCode) {
      Alert.alert('Missing Info', 'Please enter a room code.');
      return;
    }
    if (!trimmedName) {
      Alert.alert('Missing Info', 'Please enter your name.');
      return;
    }
    if (!/^[A-Za-z0-9]+$/.test(trimmedCode)) {
      Alert.alert('Invalid Code', 'Room code must be alphanumeric.');
      return;
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 4,
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
    outputRange: [1, 1.15],
  });

  const orbOpacity = gradientAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 0.7, 0.4],
  });

  const pwdHeightInterp = passwordHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 80],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B12" />

      {/* Decorative background orbs for a modern feel */}
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
      <Animated.View style={[styles.bgOrb, styles.bgOrb3, { opacity: orbOpacity }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View style={[styles.headerContainer, { transform: [{ translateY: titleSlide }], opacity: cardOpacity }]}>
            <View style={styles.iconContainer}>
              <Text style={styles.headerIcon}>🚀</Text>
            </View>
            <Text style={styles.title}>Ready to Play?</Text>
            <Text style={styles.subtitle}>Enter the room details below to join the quiz.</Text>
          </Animated.View>

          {/* Main Join Card */}
          <Animated.View
            style={[
              styles.card,
              {
                transform: [{ scale: cardScale }],
                opacity: cardOpacity,
              },
            ]}
          >
            {/* Room Code Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>ROOM CODE</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="e.g. MATH101"
                placeholderTextColor="#4B5563"
                value={roomCode}
                onChangeText={(text) => setRoomCode(text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                maxLength={10}
                returnKeyType="next"
                selectionColor="#6366F1"
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            {/* Name Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>YOUR NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your nickname"
                placeholderTextColor="#4B5563"
                value={playerName}
                onChangeText={setPlayerName}
                maxLength={20}
                autoCapitalize="words"
                returnKeyType="done"
                selectionColor="#6366F1"
              />
            </View>

            {/* Optional Password Toggle */}
            <TouchableOpacity 
              style={styles.passwordToggle} 
              onPress={togglePassword}
              activeOpacity={0.7}
            >
              <Text style={styles.passwordToggleText}>
                {showPassword ? '− Hide Password' : '+ Room requires a password?'}
              </Text>
            </TouchableOpacity>

            {/* Expandable Password Input */}
            <Animated.View style={{ height: pwdHeightInterp, opacity: passwordOpacity, overflow: 'hidden' }}>
              <View style={[styles.inputSection, { marginTop: 10 }]}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter room password"
                  placeholderTextColor="#4B5563"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="go"
                  onSubmitEditing={handleJoin}
                  selectionColor="#6366F1"
                />
              </View>
            </Animated.View>

            {/* Join Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
                onPress={handleJoin}
                disabled={isJoining || !roomCode || !playerName}
                activeOpacity={0.8}
              >
                <Text style={styles.joinButtonText}>
                  {isJoining ? 'Connecting...' : 'Join Game'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Active Rooms List */}
          {activeRooms.length > 0 && (
            <Animated.View style={[styles.activeRoomsWrapper, { opacity: cardOpacity }]}>
              <Text style={styles.activeRoomsTitle}>AVAILABLE ROOMS</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.activeRoomsScroll}
              >
                {activeRooms.map((r, i) => (
                  <TouchableOpacity 
                    key={i} 
                    style={[
                      styles.roomChip, 
                      roomCode === r.code && styles.roomChipSelected
                    ]} 
                    onPress={() => handleSelectRoom(r.code)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.roomChipHeader}>
                      <Text style={styles.roomChipCode}>{r.code}</Text>
                      {r.status === 'playing' && (
                        <View style={styles.liveIndicator} />
                      )}
                    </View>
                    <Text style={styles.roomChipInfo}>
                      👥 {r.playerCount} player{r.playerCount !== 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B12',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  // Background Orbs
  bgOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  bgOrb1: {
    width: 400,
    height: 400,
    backgroundColor: 'rgba(99, 102, 241, 0.15)', // Indigo
    top: -150,
    right: -100,
    filter: 'blur(40px)',
  },
  bgOrb2: {
    width: 350,
    height: 350,
    backgroundColor: 'rgba(236, 72, 153, 0.12)', // Pink
    bottom: -100,
    left: -150,
    filter: 'blur(40px)',
  },
  bgOrb3: {
    width: 250,
    height: 250,
    backgroundColor: 'rgba(14, 165, 233, 0.1)', // Sky blue
    top: '40%',
    right: '20%',
    filter: 'blur(30px)',
  },
  // Header
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Card
  card: {
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    borderRadius: 28,
    padding: 24,
    width: Math.min(width - 40, 420),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
    backdropFilter: 'blur(10px)',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
    letterSpacing: 1.2,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 17,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    fontWeight: '600',
  },
  codeInput: {
    fontSize: 26,
    textAlign: 'center',
    letterSpacing: 6,
    fontWeight: '800',
    color: '#38BDF8',
    textTransform: 'uppercase',
  },
  passwordInput: {
    fontSize: 15,
  },
  passwordToggle: {
    alignSelf: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  passwordToggleText: {
    color: '#818CF8',
    fontSize: 14,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  joinButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#4338CA',
    shadowOpacity: 0.2,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // Active Rooms
  activeRoomsWrapper: {
    marginTop: 32,
    width: Math.min(width - 40, 420),
  },
  activeRoomsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 12,
    letterSpacing: 1.2,
    marginLeft: 4,
  },
  activeRoomsScroll: {
    paddingBottom: 20,
  },
  roomChip: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  roomChipSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  roomChipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomChipCode: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981', // Emerald green
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  roomChipInfo: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
});


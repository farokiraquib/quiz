import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const OPTION_COLORS = ['#e74c3c', '#3498db', '#f39c12', '#2ecc71'];
const OPTION_ICONS = ['▲', '◆', '●', '■'];
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function QuestionScreen({
  question,
  roomCode,
  onAnswerSubmitted,
  socket,
}) {
  const { questionIndex, text, options, timeLimit, serverStartTime } = question;

  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const hasAnsweredRef = useRef(false);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const timerWidth = useRef(new Animated.Value(1)).current;
  const questionSlide = useRef(new Animated.Value(40)).current;
  const optionAnims = useRef(options.map(() => new Animated.Value(0))).current;
  const selectedScale = useRef(new Animated.Value(1)).current;
  const waitingPulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Reset state for new question
    hasAnsweredRef.current = false;
    setHasAnswered(false);
    setSelectedIndex(null);

    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(questionSlide, {
        toValue: 0,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
      // Stagger option buttons
      ...optionAnims.map((anim, i) =>
        Animated.sequence([
          Animated.delay(150 + i * 80),
          Animated.spring(anim, {
            toValue: 1,
            friction: 6,
            tension: 50,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Countdown timer
    const elapsed = serverStartTime
      ? Math.max(0, (Date.now() - serverStartTime) / 1000)
      : 0;
    const remaining = Math.max(0, timeLimit - elapsed);
    setTimeLeft(Math.ceil(remaining));

    // Animate timer bar
    Animated.timing(timerWidth, {
      toValue: 0,
      duration: remaining * 1000,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [questionIndex]);

  const handleOptionPress = useCallback(
    (answerIndex) => {
      // CRITICAL: Prevent double-tap
      if (hasAnsweredRef.current) return;
      hasAnsweredRef.current = true;
      setHasAnswered(true);
      setSelectedIndex(answerIndex);

      // Tap feedback animation
      Animated.sequence([
        Animated.timing(selectedScale, {
          toValue: 0.9,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.spring(selectedScale, {
          toValue: 1.05,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();

      // Start waiting pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(waitingPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(waitingPulse, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Emit answer to server
      socket.emit('student:submit-answer', {
        roomCode,
        answerIndex,
      });

      if (onAnswerSubmitted) {
        onAnswerSubmitted(answerIndex);
      }
    },
    [roomCode, socket, onAnswerSubmitted]
  );

  const timerColor =
    timeLeft > timeLimit * 0.5
      ? '#2ecc71'
      : timeLeft > timeLimit * 0.25
      ? '#f39c12'
      : '#e74c3c';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      <Animated.View style={[styles.content, { opacity: fadeIn }]}>
        {/* Timer bar */}
        <View style={styles.timerContainer}>
          <Animated.View
            style={[
              styles.timerBar,
              {
                backgroundColor: timerColor,
                width: timerWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Timer text */}
        <View style={styles.timerTextContainer}>
          <Text style={[styles.timerText, { color: timerColor }]}>
            {timeLeft}s
          </Text>
          <Text style={styles.questionNumber}>
            Q{questionIndex + 1}
          </Text>
        </View>

        {/* Question text */}
        <Animated.View
          style={[
            styles.questionContainer,
            { transform: [{ translateY: questionSlide }] },
          ]}
        >
          <Text style={styles.questionText}>{text}</Text>
        </Animated.View>

        {/* Waiting indicator */}
        {hasAnswered && (
          <Animated.View style={[styles.waitingBadge, { opacity: waitingPulse }]}>
            <Text style={styles.waitingText}>✓ Answer locked in!</Text>
          </Animated.View>
        )}

        {/* Options grid */}
        <View style={styles.optionsGrid}>
          {options.map((option, index) => {
            const isSelected = selectedIndex === index;
            const animValue = optionAnims[index];

            return (
              <Animated.View
                key={index}
                style={[
                  styles.optionWrapper,
                  {
                    opacity: animValue,
                    transform: [
                      {
                        scale: isSelected
                          ? selectedScale
                          : hasAnswered
                          ? 0.92
                          : animValue,
                      },
                      {
                        translateY: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    { backgroundColor: OPTION_COLORS[index] },
                    hasAnswered && !isSelected && styles.optionDimmed,
                    isSelected && styles.optionSelected,
                  ]}
                  onPress={() => handleOptionPress(index)}
                  disabled={hasAnswered}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionIcon}>{OPTION_ICONS[index]}</Text>
                  <Text
                    style={styles.optionText}
                    numberOfLines={3}
                    adjustsFontSizeToFit
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const optionSize = (width - 56) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  timerContainer: {
    height: 6,
    backgroundColor: '#0f1a30',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  timerBar: {
    height: '100%',
    borderRadius: 3,
  },
  timerTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 28,
    fontWeight: '900',
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#a0a0b8',
    backgroundColor: '#16213e',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  questionContainer: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    minHeight: 100,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 30,
  },
  waitingBadge: {
    alignSelf: 'center',
    backgroundColor: '#00b894',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    marginBottom: 12,
  },
  waitingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  optionsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'center',
    gap: 12,
  },
  optionWrapper: {
    width: optionSize,
  },
  optionButton: {
    height: Math.max(optionSize * 0.65, 80),
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  optionDimmed: {
    opacity: 0.35,
  },
  optionSelected: {
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOpacity: 0.5,
  },
  optionIcon: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 6,
  },
  optionText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
});

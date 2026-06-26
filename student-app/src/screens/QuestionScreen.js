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
const OPTION_COLORS = ['#171717', '#171717', '#171717', '#171717'];
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
  const [selectedIndices, setSelectedIndices] = useState([]);
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
    setSelectedIndices([]);

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
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
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
      // Prevent interactions if already answered
      if (hasAnsweredRef.current) return;

      if (question.type === 'multiple') {
        setSelectedIndices((prev) => {
          if (prev.includes(answerIndex)) {
            return prev.filter((i) => i !== answerIndex);
          }
          return [...prev, answerIndex];
        });
      } else {
        // Single choice: auto-submit on tap
        hasAnsweredRef.current = true;
        setHasAnswered(true);
        setSelectedIndices([answerIndex]);

        // Tap feedback animation
        Animated.sequence([
          Animated.timing(selectedScale, {
            toValue: 0.98,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.spring(selectedScale, {
            toValue: 1,
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
          answerIndices: [answerIndex],
        });

        if (onAnswerSubmitted) {
          onAnswerSubmitted([answerIndex]);
        }
      }
    },
    [question.type, roomCode, socket, onAnswerSubmitted, selectedScale, waitingPulse]
  );

  const handleSubmitMultiple = useCallback(() => {
    if (selectedIndices.length === 0 || hasAnsweredRef.current) return;

    hasAnsweredRef.current = true;
    setHasAnswered(true);

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
      answerIndices: selectedIndices,
    });

    if (onAnswerSubmitted) {
      onAnswerSubmitted(selectedIndices);
    }
  }, [selectedIndices, roomCode, socket, onAnswerSubmitted, waitingPulse]);

  const timerColor =
    timeLeft > timeLimit * 0.5
      ? '#fafafa'
      : timeLeft > timeLimit * 0.25
      ? '#a3a3a3'
      : '#525252';

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
            const isSelected = selectedIndices.includes(index);
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

        {/* Submit button for multiple choice */}
        {question.type === 'multiple' && !hasAnswered && (
          <TouchableOpacity
            style={[styles.submitButton, selectedIndices.length === 0 && styles.submitButtonDisabled]}
            onPress={handleSubmitMultiple}
            disabled={selectedIndices.length === 0}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Submit Answer</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const optionSize = (width - 56) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  timerContainer: {
    height: 4,
    backgroundColor: '#171717',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  timerBar: {
    height: '100%',
    borderRadius: 2,
  },
  timerTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#737373',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    letterSpacing: 1,
  },
  questionContainer: {
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
    minHeight: 120,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#262626',
  },
  questionText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#fafafa',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  waitingBadge: {
    alignSelf: 'center',
    backgroundColor: '#171717',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#262626',
  },
  waitingText: {
    color: '#a3a3a3',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  optionsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'center',
    gap: 16,
  },
  optionWrapper: {
    width: optionSize,
  },
  optionButton: {
    height: Math.max(optionSize * 0.7, 90),
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  optionDimmed: {
    opacity: 0.4,
  },
  optionSelected: {
    borderWidth: 1,
    borderColor: '#fafafa',
    backgroundColor: '#262626',
  },
  optionIcon: {
    fontSize: 18,
    color: '#737373',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#e5e5e5',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  submitButton: {
    backgroundColor: '#fafafa',
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 24,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#262626',
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '600',
  },
});

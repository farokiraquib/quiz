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
  Image,
} from 'react-native';

const { width } = Dimensions.get('window');
const OPTION_COLORS = ['rgba(6, 182, 212, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)'];
const OPTION_ICONS = ['▲', '◆', '●', '■'];
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function QuestionScreen({
  question,
  roomCode,
  onAnswerSubmitted,
  socket,
}) {
  const { questionIndex, text, imageUrl, options, timeLimit, serverStartTime } = question;

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
            toValue: 0.95,
            duration: 100,
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
      ? '#10b981'
      : timeLeft > timeLimit * 0.25
      ? '#f59e0b'
      : '#ef4444';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090e" />

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

        {/* Question text & image */}
        <Animated.View
          style={[
            styles.questionContainer,
            { transform: [{ translateY: questionSlide }] },
          ]}
        >
          {imageUrl && (
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.questionImage}
              resizeMode="contain"
            />
          )}
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
                    { backgroundColor: OPTION_COLORS[index % OPTION_COLORS.length] },
                    hasAnswered && !isSelected && styles.optionDimmed,
                    isSelected && styles.optionSelected,
                  ]}
                  onPress={() => handleOptionPress(index)}
                  disabled={hasAnswered}
                  activeOpacity={0.8}
                >
                  <Text style={styles.optionIcon}>{OPTION_ICONS[index % OPTION_ICONS.length]}</Text>
                  {option?.imageUrl && (
                    <Image 
                      source={{ uri: option.imageUrl }} 
                      style={styles.optionImage}
                      resizeMode="contain"
                    />
                  )}
                  <Text
                    style={styles.optionText}
                    numberOfLines={3}
                    adjustsFontSizeToFit
                  >
                    {option?.text || option}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090e',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  timerContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  timerBar: {
    height: '100%',
    borderRadius: 3,
  },
  timerTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#06b6d4',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    letterSpacing: 1,
    overflow: 'hidden',
  },
  questionContainer: {
    backgroundColor: 'rgba(20, 20, 30, 0.8)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  questionImage: {
    width: '100%',
    height: 120,
    marginBottom: 16,
    borderRadius: 8,
  },
  questionText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  waitingBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  waitingText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '800',
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
    width: '47%',
    marginBottom: 16,
  },
  optionButton: {
    height: 120,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  optionDimmed: {
    opacity: 0.4,
  },
  optionSelected: {
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  optionIcon: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  optionImage: {
    width: '100%',
    height: 40,
    marginBottom: 8,
    borderRadius: 4,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  submitButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 12,
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

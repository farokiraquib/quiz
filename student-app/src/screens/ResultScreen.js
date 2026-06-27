import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';

const { width } = Dimensions.get('window');
const OPTION_COLORS = ['#171717', '#171717', '#171717', '#171717'];

export default function ResultScreen({
  questionResult,
  selectedAnswer,
  socketId,
  question,
}) {
  const { correctIndices, correctIndex, leaderboard } = questionResult;
  const actualCorrect = correctIndices || (correctIndex !== undefined ? [correctIndex] : []);

  const isArray = Array.isArray(selectedAnswer);
  const didAnswer = isArray ? selectedAnswer.length > 0 : (selectedAnswer !== null && selectedAnswer !== undefined);

  let isCorrect = false;
  if (didAnswer) {
    if (isArray) {
      isCorrect = selectedAnswer.length === actualCorrect.length && 
                  selectedAnswer.every(val => actualCorrect.includes(val));
    } else {
      isCorrect = actualCorrect.includes(selectedAnswer);
    }
  }

  // Find player in leaderboard
  const playerEntry = leaderboard?.find((entry) => entry.socketId === socketId);
  const playerRank = playerEntry
    ? leaderboard.indexOf(playerEntry) + 1
    : leaderboard?.length || '—';
  const playerScore = playerEntry?.score || 0;

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const scorePop = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(slideUp, {
          toValue: 0,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.spring(scorePop, {
          toValue: 1,
          friction: 5,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    if (isCorrect) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconRotate, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(iconRotate, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, []);

  const rotateInterpolate = iconRotate.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '-5deg', '5deg'],
  });

  const correctAnswerText = actualCorrect
    .map(idx => question?.options?.[idx] || `Option ${idx + 1}`)
    .join(', ');

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: '#0a0a0a' },
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0a"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Result icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [
                { scale: scaleAnim },
                { rotate: isCorrect ? rotateInterpolate : '0deg' },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: '#171717',
                borderColor: '#262626',
              },
            ]}
          >
            <Text style={styles.iconEmoji}>
              {!didAnswer ? '⏰' : isCorrect ? '🎉' : '😔'}
            </Text>
          </View>
        </Animated.View>

        {/* Result text */}
        <Animated.View style={{ opacity: fadeIn }}>
          <Text
            style={[
              styles.resultTitle,
              { color: '#fafafa' },
            ]}
          >
            {!didAnswer ? "Time's Up!" : isCorrect ? 'Correct!' : 'Not Quite!'}
          </Text>

          {!isCorrect && (
            <View style={styles.correctAnswerCard}>
              <Text style={styles.correctLabel}>Correct answer:</Text>
              <View style={styles.correctAnswerBadge}>
                <View
                  style={[
                    styles.correctColorDot,
                    { backgroundColor: '#fafafa' },
                  ]}
                />
                <Text style={styles.correctAnswerText}>{correctAnswerText}</Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Score & Rank */}
        <Animated.View
          style={[
            styles.statsContainer,
            {
              opacity: scorePop,
              transform: [{ translateY: slideUp }, { scale: scorePop }],
            },
          ]}
        >
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>RANK</Text>
            <Text style={styles.statValue}>#{playerRank}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardAccent]}>
            <Text style={styles.statLabel}>SCORE</Text>
            <Text style={[styles.statValue, styles.scoreValue]}>{playerScore}</Text>
          </View>
        </Animated.View>

        {/* Mini leaderboard */}
        {leaderboard && leaderboard.length > 0 && (
          <Animated.View
            style={[
              styles.leaderboardCard,
              {
                opacity: scorePop,
                transform: [{ translateY: slideUp }],
              },
            ]}
          >
            <Text style={styles.leaderboardTitle}>🏆 Leaderboard</Text>
            {leaderboard.slice(0, 5).map((entry, index) => {
              const isMe = entry.socketId === socketId;
              return (
                <View
                  key={entry.socketId || index}
                  style={[styles.leaderboardRow, isMe && styles.leaderboardRowMe]}
                >
                  <Text style={styles.leaderboardRank}>#{index + 1}</Text>
                  <Text
                    style={[styles.leaderboardName, isMe && styles.leaderboardNameMe]}
                    numberOfLines={1}
                  >
                    {entry.playerName}{isMe ? ' (You)' : ''}
                  </Text>
                  <Text style={[styles.leaderboardScore, isMe && styles.leaderboardScoreMe]}>
                    {entry.score}
                  </Text>
                </View>
              );
            })}
          </Animated.View>
        )}

        <Text style={styles.waitingHint}>Next question coming soon...</Text>
      </ScrollView>

      {/* Background decorations */}
      <View
        style={[
          styles.bgGlow,
          { backgroundColor: isCorrect ? '#00b894' : '#e17055' },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 48,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -1,
  },
  correctAnswerCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#262626',
  },
  correctLabel: {
    fontSize: 11,
    color: '#737373',
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  correctAnswerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  correctColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  correctAnswerText: {
    fontSize: 20,
    color: '#fafafa',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
  },
  statCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#262626',
  },
  statCardAccent: {
    backgroundColor: '#0a0a0a',
    borderColor: '#262626',
  },
  statLabel: {
    fontSize: 11,
    color: '#737373',
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fafafa',
  },
  scoreValue: {
    color: '#fafafa',
  },
  leaderboardCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    padding: 24,
    width: Math.min(width - 48, 380),
    borderWidth: 1,
    borderColor: '#262626',
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fafafa',
    marginBottom: 16,
    textAlign: 'center',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 4,
  },
  leaderboardRowMe: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#262626',
  },
  leaderboardRank: {
    fontSize: 14,
    fontWeight: '600',
    color: '#737373',
    width: 36,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fafafa',
    flex: 1,
  },
  leaderboardNameMe: {
    fontWeight: '600',
    color: '#fafafa',
  },
  leaderboardScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a3a3a3',
  },
  leaderboardScoreMe: {
    color: '#fafafa',
  },
  waitingHint: {
    fontSize: 14,
    color: '#737373',
    marginTop: 32,
    fontWeight: '400',
  },
  bgGlow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0,
    zIndex: -1,
  },
});

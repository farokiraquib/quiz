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
const OPTION_COLORS = ['#e74c3c', '#3498db', '#f39c12', '#2ecc71'];

export default function ResultScreen({
  questionResult,
  selectedAnswer,
  socketId,
  question,
}) {
  const { correctIndex, leaderboard } = questionResult;
  const isCorrect = selectedAnswer === correctIndex;
  const didAnswer = selectedAnswer !== null && selectedAnswer !== undefined;

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

  const correctAnswerText = question?.options?.[correctIndex] || `Option ${correctIndex + 1}`;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isCorrect ? '#0a2e1f' : '#2e0a0a' },
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={isCorrect ? '#0a2e1f' : '#2e0a0a'}
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
                backgroundColor: isCorrect
                  ? 'rgba(0, 184, 148, 0.2)'
                  : 'rgba(225, 112, 85, 0.2)',
                borderColor: isCorrect ? '#00b894' : '#e17055',
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
              { color: isCorrect ? '#00b894' : '#e17055' },
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
                    { backgroundColor: OPTION_COLORS[correctIndex] || '#6c5ce7' },
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
    marginBottom: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 56,
  },
  resultTitle: {
    fontSize: 38,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
  },
  correctAnswerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  correctLabel: {
    fontSize: 13,
    color: '#a0a0b8',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  correctAnswerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  correctColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  correctAnswerText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '800',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statCardAccent: {
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    borderColor: 'rgba(108, 92, 231, 0.3)',
  },
  statLabel: {
    fontSize: 12,
    color: '#a0a0b8',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
  },
  scoreValue: {
    color: '#6c5ce7',
  },
  leaderboardCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    padding: 20,
    width: Math.min(width - 48, 380),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  leaderboardRowMe: {
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.4)',
  },
  leaderboardRank: {
    fontSize: 16,
    fontWeight: '800',
    color: '#a0a0b8',
    width: 36,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  leaderboardNameMe: {
    fontWeight: '800',
    color: '#6c5ce7',
  },
  leaderboardScore: {
    fontSize: 16,
    fontWeight: '800',
    color: '#a0a0b8',
  },
  leaderboardScoreMe: {
    color: '#6c5ce7',
  },
  waitingHint: {
    fontSize: 14,
    color: '#555577',
    marginTop: 28,
    fontWeight: '500',
  },
  bgGlow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.08,
    zIndex: -1,
  },
});

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
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconEmoji: {
    fontSize: 60,
  },
  resultTitle: {
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  correctAnswerCard: {
    backgroundColor: 'rgba(20, 20, 30, 0.8)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  correctLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  correctAnswerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  correctColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  correctAnswerText: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: '800',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: 'rgba(20, 20, 30, 0.8)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statCardAccent: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
  },
  scoreValue: {
    color: '#a78bfa',
    textShadowColor: 'rgba(139, 92, 246, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  leaderboardCard: {
    backgroundColor: 'rgba(20, 20, 30, 0.8)',
    borderRadius: 24,
    padding: 24,
    width: Math.min(width - 48, 400),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  leaderboardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 6,
  },
  leaderboardRowMe: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  leaderboardRank: {
    fontSize: 16,
    fontWeight: '800',
    color: '#94a3b8',
    width: 40,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  leaderboardNameMe: {
    fontWeight: '800',
    color: '#22d3ee',
  },
  leaderboardScore: {
    fontSize: 16,
    fontWeight: '800',
    color: '#94a3b8',
  },
  leaderboardScoreMe: {
    color: '#22d3ee',
  },
  waitingHint: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 32,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bgGlow: {
    position: 'absolute',
    top: -150,
    right: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.15,
    zIndex: -1,
  },
});

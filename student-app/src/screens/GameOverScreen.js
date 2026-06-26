import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';

const { width } = Dimensions.get('window');

const PODIUM_COLORS = {
  1: { bg: 'rgba(255, 215, 0, 0.15)', border: '#FFD700', emoji: '🥇', label: 'Gold' },
  2: { bg: 'rgba(192, 192, 192, 0.15)', border: '#C0C0C0', emoji: '🥈', label: 'Silver' },
  3: { bg: 'rgba(205, 127, 50, 0.15)', border: '#CD7F32', emoji: '🥉', label: 'Bronze' },
};

export default function GameOverScreen({
  finalLeaderboard,
  socketId,
  playerName,
  onPlayAgain,
}) {
  // Find player in leaderboard
  const playerEntry = finalLeaderboard?.find((entry) => entry.socketId === socketId);
  const playerRank = playerEntry
    ? finalLeaderboard.indexOf(playerEntry) + 1
    : finalLeaderboard?.length || 0;
  const playerScore = playerEntry?.score || 0;
  const isTopThree = playerRank >= 1 && playerRank <= 3;
  const podiumInfo = PODIUM_COLORS[playerRank];

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const trophyScale = useRef(new Animated.Value(0)).current;
  const rankSlide = useRef(new Animated.Value(60)).current;
  const confettiAnims = useRef(
    Array.from({ length: 8 }, () => ({
      translateY: new Animated.Value(-20),
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(0),
    }))
  ).current;
  const buttonScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Trophy entrance
      Animated.spring(trophyScale, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
      // Fade in content
      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(rankSlide, {
          toValue: 0,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      // Button
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti animation for top 3
    if (isTopThree) {
      confettiAnims.forEach((anim, i) => {
        const xTarget = (Math.random() - 0.5) * width * 0.8;
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 200),
            Animated.parallel([
              Animated.timing(anim.translateY, {
                toValue: 600,
                duration: 2000 + Math.random() * 1000,
                useNativeDriver: true,
              }),
              Animated.timing(anim.opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(anim.translateX, {
                toValue: xTarget,
                duration: 2000 + Math.random() * 1000,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            // Reset
            Animated.parallel([
              Animated.timing(anim.translateY, {
                toValue: -20,
                duration: 0,
                useNativeDriver: true,
              }),
              Animated.timing(anim.translateX, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true,
              }),
            ]),
          ])
        ).start();
      });
    }
  }, []);

  const confettiEmojis = ['🎊', '✨', '🌟', '🎉', '💫', '⭐', '🎆', '🎇'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Confetti particles */}
      {isTopThree &&
        confettiAnims.map((anim, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.confetti,
              {
                opacity: anim.opacity,
                transform: [
                  { translateY: anim.translateY },
                  { translateX: anim.translateX },
                ],
              },
            ]}
          >
            {confettiEmojis[i]}
          </Animated.Text>
        ))}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Trophy / Rank display */}
        <Animated.View
          style={[styles.trophyContainer, { transform: [{ scale: trophyScale }] }]}
        >
          {isTopThree ? (
            <View
              style={[
                styles.podiumCircle,
                {
                  backgroundColor: podiumInfo.bg,
                  borderColor: podiumInfo.border,
                },
              ]}
            >
              <Text style={styles.trophyEmoji}>{podiumInfo.emoji}</Text>
            </View>
          ) : (
            <View style={styles.rankCircle}>
              <Text style={styles.rankBig}>#{playerRank}</Text>
            </View>
          )}
        </Animated.View>

        {/* Title */}
        <Animated.View style={{ opacity: fadeIn }}>
          <Text style={styles.title}>
            {isTopThree ? 'Amazing!' : 'Game Over!'}
          </Text>
          <Text style={styles.subtitle}>
            {playerRank === 1
              ? '🏆 You won the game!'
              : playerRank === 2
              ? '🎉 So close to the top!'
              : playerRank === 3
              ? '🎊 Great performance!'
              : `You finished #${playerRank}. Well played!`}
          </Text>
        </Animated.View>

        {/* Score card */}
        <Animated.View
          style={[
            styles.scoreCard,
            {
              opacity: fadeIn,
              transform: [{ translateY: rankSlide }],
            },
          ]}
        >
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>FINAL RANK</Text>
            <Text
              style={[
                styles.scoreNumber,
                isTopThree && { color: podiumInfo?.border || '#6c5ce7' },
              ]}
            >
              #{playerRank}
            </Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>TOTAL SCORE</Text>
            <Text style={[styles.scoreNumber, styles.scoreAccent]}>
              {playerScore}
            </Text>
          </View>
        </Animated.View>

        {/* Top 5 Leaderboard */}
        {finalLeaderboard && finalLeaderboard.length > 0 && (
          <Animated.View
            style={[
              styles.leaderboardCard,
              {
                opacity: fadeIn,
                transform: [{ translateY: rankSlide }],
              },
            ]}
          >
            <Text style={styles.leaderboardTitle}>🏅 Final Standings</Text>
            {finalLeaderboard.slice(0, 5).map((entry, index) => {
              const isMe = entry.socketId === socketId;
              const rank = index + 1;
              const podium = PODIUM_COLORS[rank];

              return (
                <View
                  key={entry.socketId || index}
                  style={[
                    styles.lbRow,
                    isMe && styles.lbRowMe,
                    podium && { borderLeftWidth: 3, borderLeftColor: podium.border },
                  ]}
                >
                  <Text style={styles.lbRankText}>
                    {podium ? podium.emoji : `#${rank}`}
                  </Text>
                  <Text
                    style={[styles.lbName, isMe && styles.lbNameMe]}
                    numberOfLines={1}
                  >
                    {entry.playerName}
                    {isMe ? ' (You)' : ''}
                  </Text>
                  <Text style={[styles.lbScore, isMe && styles.lbScoreMe]}>
                    {entry.score}
                  </Text>
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* Play Again button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: 28 }}>
          <TouchableOpacity
            style={styles.playAgainButton}
            onPress={onPlayAgain}
            activeOpacity={0.8}
          >
            <Text style={styles.playAgainText}>🔄 Play Again</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Background glow */}
      <View style={styles.bgGlow} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 60,
  },
  confetti: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    fontSize: 28,
    zIndex: 10,
  },
  trophyContainer: {
    marginBottom: 24,
  },
  podiumCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trophyEmoji: {
    fontSize: 64,
  },
  rankCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    borderWidth: 3,
    borderColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBig: {
    fontSize: 48,
    fontWeight: '900',
    color: '#6c5ce7',
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#a0a0b8',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 32,
  },
  scoreCard: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 24,
    width: Math.min(width - 48, 340),
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.2)',
    marginBottom: 24,
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#a0a0b8',
    fontWeight: '700',
    letterSpacing: 2,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
  },
  scoreAccent: {
    color: '#6c5ce7',
  },
  scoreDivider: {
    height: 1,
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    marginVertical: 8,
  },
  leaderboardCard: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 20,
    width: Math.min(width - 48, 380),
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.15)',
  },
  leaderboardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  lbRowMe: {
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.4)',
  },
  lbRankText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#a0a0b8',
    width: 40,
    textAlign: 'center',
  },
  lbName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    marginLeft: 8,
  },
  lbNameMe: {
    fontWeight: '800',
    color: '#6c5ce7',
  },
  lbScore: {
    fontSize: 18,
    fontWeight: '800',
    color: '#a0a0b8',
  },
  lbScoreMe: {
    color: '#6c5ce7',
  },
  playAgainButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 48,
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  playAgainText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  bgGlow: {
    position: 'absolute',
    bottom: -120,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#6c5ce7',
    opacity: 0.08,
    zIndex: -1,
  },
});

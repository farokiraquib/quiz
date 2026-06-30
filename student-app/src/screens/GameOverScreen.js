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
  1: { bg: '#171717', border: '#FFD700', emoji: '🥇', label: 'Gold' },
  2: { bg: '#171717', border: '#C0C0C0', emoji: '🥈', label: 'Silver' },
  3: { bg: '#171717', border: '#CD7F32', emoji: '🥉', label: 'Bronze' },
};

export default function GameOverScreen({
  finalLeaderboard,
  socketId,
  playerName,
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
    ]).start();
  }, [fadeIn, rankSlide, trophyScale]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />



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
                isTopThree && { color: podiumInfo?.border || '#fafafa' },
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


      </ScrollView>

      {/* Background glow */}
      <View style={styles.bgGlow} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090e',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 60,
  },

  trophyContainer: {
    marginBottom: 32,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  podiumCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 30, 0.9)',
  },
  trophyEmoji: {
    fontSize: 72,
    textShadowColor: 'rgba(251, 191, 36, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  rankCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(20, 20, 30, 0.9)',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  rankBig: {
    fontSize: 56,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(139, 92, 246, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -1,
    textShadowColor: 'rgba(251, 191, 36, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#fbbf24',
    textAlign: 'center',
    fontWeight: '800',
    marginBottom: 40,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreCard: {
    backgroundColor: 'rgba(20, 20, 30, 0.8)',
    borderRadius: 24,
    padding: 32,
    width: Math.min(width - 48, 400),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
  },
  scoreAccent: {
    color: '#a78bfa',
    textShadowColor: 'rgba(139, 92, 246, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  scoreDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
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
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  lbRowMe: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  lbRankText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#94a3b8',
    width: 44,
    textAlign: 'center',
  },
  lbName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    marginLeft: 12,
  },
  lbNameMe: {
    fontWeight: '800',
    color: '#22d3ee',
  },
  lbScore: {
    fontSize: 18,
    fontWeight: '800',
    color: '#94a3b8',
  },
  lbScoreMe: {
    color: '#22d3ee',
  },

  bgGlow: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    zIndex: -1,
  },
});

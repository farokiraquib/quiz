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
    backgroundColor: '#0a0a0a',
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
  },
  podiumCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
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
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBig: {
    fontSize: 48,
    fontWeight: '600',
    color: '#fafafa',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fafafa',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#737373',
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 40,
  },
  scoreCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    padding: 32,
    width: Math.min(width - 48, 380),
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 24,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  scoreLabel: {
    fontSize: 11,
    color: '#737373',
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fafafa',
  },
  scoreAccent: {
    color: '#fafafa',
  },
  scoreDivider: {
    height: 1,
    backgroundColor: '#262626',
    marginVertical: 12,
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
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  lbRowMe: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#262626',
  },
  lbRankText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#737373',
    width: 40,
    textAlign: 'center',
  },
  lbName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fafafa',
    flex: 1,
    marginLeft: 8,
  },
  lbNameMe: {
    fontWeight: '600',
    color: '#fafafa',
  },
  lbScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a3a3a3',
  },
  lbScoreMe: {
    color: '#fafafa',
  },

  bgGlow: {
    position: 'absolute',
    bottom: -120,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#fafafa',
    opacity: 0,
    zIndex: -1,
  },
});

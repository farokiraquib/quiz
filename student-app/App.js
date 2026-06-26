import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, Animated, StyleSheet } from 'react-native';
import socket from './src/socket';
import JoinScreen from './src/screens/JoinScreen';
import WaitingScreen from './src/screens/WaitingScreen';
import QuestionScreen from './src/screens/QuestionScreen';
import ResultScreen from './src/screens/ResultScreen';
import GameOverScreen from './src/screens/GameOverScreen';

// Screen states: 'join' | 'waiting' | 'question' | 'result' | 'gameover'

export default function App() {
  const [screen, setScreen] = useState('join');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [questionResult, setQuestionResult] = useState(null);
  const [finalLeaderboard, setFinalLeaderboard] = useState([]);

  // Transition animation
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const transitionTo = useCallback(
    (nextScreen) => {
      Animated.sequence([
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Set screen in the middle of the fade
      setTimeout(() => setScreen(nextScreen), 150);
    },
    [screenOpacity]
  );

  // Reset to join screen
  const resetToJoin = useCallback(() => {
    socket.disconnect();
    setScreen('join');
    setPlayerName('');
    setRoomCode('');
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setQuestionResult(null);
    setFinalLeaderboard([]);
  }, []);

  // Socket event handlers
  useEffect(() => {
    const handleNewQuestion = (data) => {
      setCurrentQuestion(data);
      setSelectedAnswer(null);
      setQuestionResult(null);
      transitionTo('question');
    };

    const handleQuestionResult = (data) => {
      setQuestionResult(data);
      transitionTo('result');
    };

    const handleGameFinished = (data) => {
      setFinalLeaderboard(data.leaderboard || []);
      transitionTo('gameover');
    };

    const handleHostDisconnected = () => {
      Alert.alert(
        'Host Disconnected',
        'The teacher has left the game. Returning to join screen.',
        [{ text: 'OK', onPress: resetToJoin }]
      );
    };

    const handleDisconnect = (reason) => {
      // Only alert if we were in-game (not if user intentionally disconnected)
      if (reason !== 'io client disconnect') {
        Alert.alert(
          'Disconnected',
          'Lost connection to the server. Please rejoin.',
          [{ text: 'OK', onPress: resetToJoin }]
        );
      }
    };

    socket.on('question:new', handleNewQuestion);
    socket.on('question:result', handleQuestionResult);
    socket.on('game:finished', handleGameFinished);
    socket.on('room:host-disconnected', handleHostDisconnected);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('question:new', handleNewQuestion);
      socket.off('question:result', handleQuestionResult);
      socket.off('game:finished', handleGameFinished);
      socket.off('room:host-disconnected', handleHostDisconnected);
      socket.off('disconnect', handleDisconnect);
    };
  }, [transitionTo, resetToJoin]);

  // Handlers
  const handleJoined = useCallback(
    (name, code) => {
      setPlayerName(name);
      setRoomCode(code);
      transitionTo('waiting');
    },
    [transitionTo]
  );

  const handleAnswerSubmitted = useCallback((answerIndex) => {
    setSelectedAnswer(answerIndex);
  }, []);

  const handlePlayAgain = useCallback(() => {
    resetToJoin();
  }, [resetToJoin]);

  // Render current screen
  const renderScreen = () => {
    switch (screen) {
      case 'join':
        return <JoinScreen onJoined={handleJoined} />;

      case 'waiting':
        return <WaitingScreen playerName={playerName} roomCode={roomCode} />;

      case 'question':
        return currentQuestion ? (
          <QuestionScreen
            question={currentQuestion}
            roomCode={roomCode}
            onAnswerSubmitted={handleAnswerSubmitted}
            socket={socket}
          />
        ) : null;

      case 'result':
        return questionResult ? (
          <ResultScreen
            questionResult={questionResult}
            selectedAnswer={selectedAnswer}
            socketId={socket.id}
            question={currentQuestion}
          />
        ) : null;

      case 'gameover':
        return (
          <GameOverScreen
            finalLeaderboard={finalLeaderboard}
            socketId={socket.id}
            playerName={playerName}
            onPlayAgain={handlePlayAgain}
          />
        );

      default:
        return <JoinScreen onJoined={handleJoined} />;
    }
  };

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      {renderScreen()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});

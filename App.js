import 'react-native-gesture-handler';
// Docstec Tracker — Main App Entry
import React, { Component } from 'react';
import { StatusBar, View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from './src/components/Toast';
import { LogBox } from 'react-native';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Invalid DOM property',
  'Unknown event handler property',
]);

// Suppress harmless react-native-chart-kit Web DOM warnings
if (Platform.OS === 'web') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string') {
      const msg = args[0];
      if (
        msg.includes('Invalid DOM property `transform-origin`') ||
        msg.includes('Unknown event handler property `onStartShouldSetResponder`') ||
        msg.includes('Unknown event handler property `onResponderTerminationRequest`') ||
        msg.includes('Unknown event handler property `onResponderGrant`')
      ) {
        return; // Suppress
      }
    }
    originalConsoleError(...args);
  };
}

// Fix horizontal white space bug on web caused by drawer menu being off-canvas
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(`
    html, body, #root {
      overflow-x: hidden !important;
      max-width: 100vw !important;
      width: 100% !important;
      position: relative;
    }
    /* Webkit scrollbar hiding for horizontal */
    ::-webkit-scrollbar:horizontal {
      display: none;
    }
    /* Fix Chrome Autofill background color */
    input:-webkit-autofill,
    input:-webkit-autofill:hover, 
    input:-webkit-autofill:focus, 
    input:-webkit-autofill:active {
      transition: background-color 5000s ease-in-out 0s !important;
      -webkit-text-fill-color: var(--autofill-text-color, inherit) !important;
      background-color: transparent !important;
    }
  `));
  document.head.appendChild(style);
}

class ErrorBoundary extends Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ScrollView style={errorStyles.errorContainer} contentContainerStyle={errorStyles.errorContent}>
          <Text style={errorStyles.errorHeader}>⚠️ Something went wrong.</Text>
          <Text style={errorStyles.errorMessage}>{this.state.error && this.state.error.toString()}</Text>
          <Text style={errorStyles.errorStackTitle}>Component Stack Trace:</Text>
          <Text style={errorStyles.errorStack}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </Text>
          <Text style={errorStyles.errorHint}>Please share this screen to help debug and resolve the issue.</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <AppNavigator />
        <Toast />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const errorStyles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#090D16',
    padding: 24,
  },
  errorContent: {
    paddingVertical: 40,
    alignItems: 'flex-start',
  },
  errorHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#F8FAFC',
    backgroundColor: '#121826',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    width: '100%',
    fontFamily: 'monospace',
    marginBottom: 24,
  },
  errorStackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#818CF8',
    marginBottom: 8,
  },
  errorStack: {
    fontSize: 12,
    color: '#CBD5E1',
    backgroundColor: '#121826',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    fontFamily: 'monospace',
    lineHeight: 18,
    marginBottom: 24,
  },
  errorHint: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },
});


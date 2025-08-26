import { render, screen } from '@testing-library/react';

// react-native-gesture-handler jest setup (if installed)
try {
  // @ts-ignore: jestSetup has no types
  require('react-native-gesture-handler/jestSetup');
} catch (e) {}

// react-native-reanimated mock (if reanimated is installed)
try {
  jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
} catch (e) {}

// Silence NativeAnimatedHelper if present
try {
  jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}));
} catch (e) {}

// Provide safe mock for Switch (prevents hooks running during host-component detection)
try {
  jest.mock(
    'react-native/Libraries/Components/Switch/Switch',
    () => {
      const React = require('react');
      const { View } = require('react-native');
      return function MockSwitch(props) {
        return React.createElement(View, props);
      };
    },
    { virtual: true }
  );
} catch (e) {}
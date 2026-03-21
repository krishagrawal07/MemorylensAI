import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-permissions', () => ({
  RESULTS: {
    UNAVAILABLE: 'unavailable',
    DENIED: 'denied',
    BLOCKED: 'blocked',
    GRANTED: 'granted',
    LIMITED: 'limited',
  },
  PERMISSIONS: {
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
      RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
      READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
      READ_MEDIA_IMAGES: 'android.permission.READ_MEDIA_IMAGES',
    },
    IOS: {
      CAMERA: 'ios.permission.CAMERA',
      MICROPHONE: 'ios.permission.MICROPHONE',
      PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY',
    },
  },
  request: jest.fn(async () => 'granted'),
  check: jest.fn(async () => 'granted'),
  openSettings: jest.fn(async () => undefined),
}));
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(async () => ({ didCancel: true })),
  launchImageLibrary: jest.fn(async () => ({ didCancel: true })),
}));

import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './config';

// Allow the UI to run in demo mode when Firebase environment variables are absent.
const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

export const firebaseApp = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
export const firebaseConfigured = hasFirebaseConfig;

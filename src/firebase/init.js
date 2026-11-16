import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './config';

// Missing configuration keeps the user signed out.
const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

export const firebaseApp = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
export const firebaseConfigured = hasFirebaseConfig;

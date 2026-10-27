import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { firebaseApp } from './init';

const auth = firebaseApp ? getAuth(firebaseApp) : null;

export const signIn = async (email, password) => {
  if (!auth) return { user: { uid: 'demo-user', email } };
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (error) {
    return { error };
  }
};

export const signUp = async (email, password) => {
  if (!auth) return { user: { uid: 'demo-user', email } };
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (error) {
    return { error };
  }
};

export const resetPassword = async (email) => {
  if (!auth) return { success: true };
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { error };
  }
};

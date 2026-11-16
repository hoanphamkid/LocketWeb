import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { firebaseApp } from './init';

const auth = firebaseApp ? getAuth(firebaseApp) : null;

export const signIn = async (email, password) => {
  if (!auth) return { error: new Error('Chưa cấu hình đăng nhập. Hãy kết nối tài khoản Locket từ Studio.') };
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (error) {
    return { error };
  }
};

export const signUp = async (email, password) => {
  if (!auth) return { error: new Error('Chưa cấu hình đăng ký. Hãy tạo tài khoản trong ứng dụng Locket.') };
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (error) {
    return { error };
  }
};

export const resetPassword = async (email) => {
  if (!auth) return { error: new Error('Hãy đặt lại mật khẩu trong ứng dụng Locket.') };
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { error };
  }
};

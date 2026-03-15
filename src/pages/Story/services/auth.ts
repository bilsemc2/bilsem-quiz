import {
  signInUser,
  signOutUser,
  signUpEmailPassword,
} from '@/features/auth/model/authUseCases';

export async function signUp(email: string, password: string) {
  await signUpEmailPassword({ email, password });
}

export async function signIn(email: string, password: string) {
  await signInUser({ email, password });
}

export async function signOut() {
  await signOutUser();
}

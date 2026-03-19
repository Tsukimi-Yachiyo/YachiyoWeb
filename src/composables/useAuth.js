import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserProfile } from './useUserProfile.js';

export function useAuth() {
  const router = useRouter();
  const token = ref(localStorage.getItem('token'));
  const username = ref(localStorage.getItem('username') || '用户');
  const { clearCache } = useUserProfile();

  const isAuthenticated = () => !!token.value;

  const login = (newToken, newUsername) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', newUsername);
    token.value = newToken;
    username.value = newUsername;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    token.value = null;
    username.value = '';
    clearCache();
    router.push('/');
  };

  return {
    token,
    username,
    isAuthenticated,
    login,
    logout
  };
}
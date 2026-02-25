import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { User } from '@/types/plant';

const AUTH_STORAGE_KEY = '@herbalscanner_auth';
const USERS_STORAGE_KEY = '@herbalscanner_users';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) as User : null;
    },
  });

  useEffect(() => {
    if (authQuery.data !== undefined) {
      setUser(authQuery.data);
      setIsInitialized(true);
    } else if (!authQuery.isLoading) {
      setIsInitialized(true);
    }
  }, [authQuery.data, authQuery.isLoading]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const usersRaw = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const users: Array<{ email: string; password: string; name: string; id: string; createdAt: string }> = usersRaw ? JSON.parse(usersRaw) : [];
      const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (!found) {
        throw new Error('Invalid email or password');
      }
      const userData: User = { id: found.id, email: found.email, name: found.name, createdAt: found.createdAt };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      return userData;
    },
    onSuccess: (userData) => {
      setUser(userData);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async ({ email, password, name }: { email: string; password: string; name: string }) => {
      const usersRaw = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const users: Array<{ email: string; password: string; name: string; id: string; createdAt: string }> = usersRaw ? JSON.parse(usersRaw) : [];
      const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        throw new Error('An account with this email already exists');
      }
      const newUser = {
        id: Date.now().toString(),
        email,
        password,
        name,
        createdAt: new Date().toISOString(),
      };
      users.push(newUser);
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      const userData: User = { id: newUser.id, email: newUser.email, name: newUser.name, createdAt: newUser.createdAt };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      return userData;
    },
    onSuccess: (userData) => {
      setUser(userData);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    },
    onSuccess: () => {
      setUser(null);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const login = useCallback((email: string, password: string) => {
    return loginMutation.mutateAsync({ email, password });
  }, [loginMutation]);

  const signup = useCallback((email: string, password: string, name: string) => {
    return signupMutation.mutateAsync({ email, password, name });
  }, [signupMutation]);

  const logout = useCallback(() => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  return {
    user,
    isInitialized,
    isLoading: loginMutation.isPending || signupMutation.isPending,
    login,
    signup,
    logout,
    loginError: loginMutation.error?.message ?? null,
    signupError: signupMutation.error?.message ?? null,
  };
});

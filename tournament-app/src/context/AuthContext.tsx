import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { User } from '../types';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUser(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUser(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email: string, password: string, name: string, username: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          name,
          username,
          bio: null,
          avatar_url: null,
          games_played: [],
        });

        if (profileError) throw profileError;
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  async function updateProfile(updates: Partial<User>) {
    try {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setUser({ ...user, ...updates });
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

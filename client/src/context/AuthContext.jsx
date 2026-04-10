import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile } from '../services/userService';
import apiClient from '../services/apiClient';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('ak7_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();
      setUser(data);
      setIsSignedIn(true);
    } catch (error) {
      console.error('Failed to fetch user profile', error);
      localStorage.removeItem('ak7_token');
      setUser(null);
      setIsSignedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const { data } = await apiClient.post('/auth/login', { email, password });
      localStorage.setItem('ak7_token', data.token);
      setUser(data);
      setIsSignedIn(true);
      toast.success(`Welcome back, ${data.firstName}!`);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const { data } = await apiClient.post('/auth/register', userData);
      localStorage.setItem('ak7_token', data.token);
      setUser(data);
      setIsSignedIn(true);
      toast.success('Account created successfully!');
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ak7_token');
    setUser(null);
    setIsSignedIn(false);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (data) => {
    try {
      const updated = await updateUserProfile(data);
      setUser(updated);
      toast.success('Profile updated successfully');
      return updated;
    } catch (error) {
      toast.error('Failed to update profile');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile: user,
      loading, 
      isSignedIn, 
      login, 
      logout,
      register,
      updateProfile, 
      refreshProfile: fetchProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
// Alias for backward compatibility if needed, but better to migrate
export const useProfile = () => useContext(AuthContext);

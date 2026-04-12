import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    const fetchProfile = async () => {
        try {
            const { data } = await api.get('/auth/profile');
            setUser(data);
        } catch (error) {
            localStorage.removeItem('ak7_token');
            setUser(null);
        } finally {
            setIsLoaded(true);
        }
    };

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            if (data.role !== 'chef' && data.role !== 'admin') {
                toast.error('Access denied. This panel is for chefs only.');
                return;
            }
            localStorage.setItem('ak7_token', data.token);
            setUser(data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed. Please try again.');
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('ak7_token');
        setUser(null);
        toast.success('Logged out successfully.');
    };

    useEffect(() => {
        const token = localStorage.getItem('ak7_token');
        if (token) {
            fetchProfile();
        } else {
            setIsLoaded(true);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoaded, isSignedIn: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

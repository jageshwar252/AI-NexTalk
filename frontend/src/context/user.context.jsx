import { useState, useEffect } from 'react';
import axios from '../config/axios';
import { UserContext } from './user-context';

// Create a provider component
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isBootstrapping, setIsBootstrapping] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.get('/users/profile', {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => {
                setUser(res.data.user);
            })
            .catch(() => {
                setUser(null);
                localStorage.removeItem('token');
            })
            .finally(() => {
                setIsBootstrapping(false);
            });
            return;
        }
        setIsBootstrapping(false);
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, isBootstrapping }}>
            {children}
        </UserContext.Provider>
    );
};

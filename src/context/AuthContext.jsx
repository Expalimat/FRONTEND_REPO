import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { DEMO_PASSWORD } from '../data/demoAccounts';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // show the saved session right away, then confirm it with the server
    const cached = authService.getCurrentUser();
    if (cached) {
      setCurrentUser(cached);
      authService
        .fetchMe()
        .then(setCurrentUser)
        .catch(() => {}); // a 401 clears the session and redirects in api.js
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const user = await authService.login(username, password);
    setCurrentUser(user);
    return user;
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  // Demo helper: really logs in as one of the seeded demo accounts
  const switchMockUser = async (userObj) => {
    authService.logout();
    return login(userObj.username, DEMO_PASSWORD);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, switchMockUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

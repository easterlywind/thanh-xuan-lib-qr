
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '@/services/apiService';

export type UserRole = 'librarian' | 'student';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Mock users for demonstration (will be replaced by API calls in production)
const MOCK_USERS = [
  {
    id: '1',
    username: 'librarian',
    password: 'password123',
    fullName: 'Thủ Thư Thanh Xuân',
    role: 'librarian' as UserRole
  },
  {
    id: '2',
    username: 'student1',
    password: 'password123',
    fullName: 'Nguyễn Văn A',
    role: 'student' as UserRole
  },
  {
    id: '3',
    username: 'student2',
    password: 'password123',
    fullName: 'Trần Thị B',
    role: 'student' as UserRole
  }
];

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('libUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user data:', e);
        localStorage.removeItem('libUser');
      }
    }
  }, []);
  
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // In a real app with backend integration:
      // const response = await authApi.login(username, password);
      // if (response.success && response.user) {
      //   setUser(response.user);
      //   localStorage.setItem('libUser', JSON.stringify(response.user));
      //   return true;
      // }
      
      // For now, we'll use mock data:
      const foundUser = MOCK_USERS.find(
        u => u.username === username && u.password === password
      );
      
      if (foundUser) {
        const { password, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        localStorage.setItem('libUser', JSON.stringify(userWithoutPassword));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('libUser');
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

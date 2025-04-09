
import React, { createContext, useContext, useState, useEffect } from 'react';

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

// Mock users for demonstration
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
    // In a real app, this would be an API call
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

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  uid: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'translator' | 'client';
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    console.log('🔐 Auth context mounting, checking localStorage...');
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    console.log('🔐 Stored values:', { 
      hasToken: !!storedToken, 
      hasUser: !!storedUser,
      userData: storedUser ? JSON.parse(storedUser) : null
    });
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      console.log('🔐 Restored user from localStorage');
    } else {
      console.log('🔐 No stored auth data found');
    }
    
    setIsLoading(false);
    console.log('🔐 Auth context loading complete');
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    setToken(data.token);
    setUser(data.user);
    
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data.user; // Return user data for immediate use
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
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

// Temporary auto-login for testing
// This will automatically log in the test user when the page loads

import { API_BASE_URL } from '../config/api';

export const autoLoginTestUser = async () => {
  console.log('Auto-login: Attempting to log in test user...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123'
      }),
    });

    if (!response.ok) {
      throw new Error('Auto-login failed');
    }

    const data = await response.json();
    console.log('Auto-login: Success!', data);
    
    // Store token
    localStorage.setItem('auth_token', data.token);
    
    // Reload page to apply auth state
    window.location.reload();
    
  } catch (error) {
    console.error('Auto-login: Failed:', error);
  }
};

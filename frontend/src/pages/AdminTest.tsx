import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import config from '../config/config';

const AdminTest: React.FC = () => {
  const { user, loading } = useAuth();
  const [apiTest, setApiTest] = useState<any>(null);

  useEffect(() => {
    // Test admin API endpoint
    const testAdminAPI = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('AdminTest: Token exists:', !!token);
        console.log('AdminTest: User from context:', user);
        
        const response = await fetch(`${config.apiUrl}/api/admin/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('AdminTest: Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setApiTest({ success: true, data });
      } catch (error) {
        console.error('AdminTest: API Error:', error);
        setApiTest({ success: false, error: error instanceof Error ? error.message : String(error) });
      }
    };

    testAdminAPI();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Info</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {user ? 'Logged in' : 'Not logged in'}</p>
            {user && (
              <>
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>User Type:</strong> {user.userType}</p>
                <p><strong>Role:</strong> {user.role}</p>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Test</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(apiTest, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
          <div className="space-y-2">
            <p><strong>Current URL:</strong> {window.location.href}</p>
            <p><strong>User Agent:</strong> {navigator.userAgent}</p>
            <p><strong>Local Storage Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Not present'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTest;

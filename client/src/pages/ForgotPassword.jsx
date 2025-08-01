import React from 'react';
import { useState } from 'react';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      setMessage(
        'If an account with that email exists, a password reset link has been sent. Please check your inbox and follow the instructions.'
      );
    } catch (err) {
      setMessage(
        err.response?.data?.message || 'Error sending reset link. Please try again.'
      );
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Forgot Password</h2>
        <p className="mb-6 text-gray-700 text-center">
          Enter your email address below. If an account exists, you will receive a password reset link. Please check your inbox and follow the instructions in the email.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border rounded px-3 py-2"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        {message && (
          <div className="mt-4 text-center text-green-600">{message}</div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

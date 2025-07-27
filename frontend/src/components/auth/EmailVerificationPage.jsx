import React from 'react';
import { motion } from 'framer-motion';
import EmailVerification from './EmailVerification';

const EmailVerificationPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <EmailVerification />
        </div>
      </motion.div>
    </div>
  );
};

export default EmailVerificationPage; 
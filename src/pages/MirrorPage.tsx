import React from 'react';
import GenerativeMirrorGame from '@/components/MirrorGame';
import RequireAuth from '@/components/RequireAuth';
import { motion } from 'framer-motion';

const MirrorPage = () => {
  return (
    <RequireAuth>
      <div className="container mx-auto px-4 py-8">
        <motion.h1 
          className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Üretken Ayna Oyunu
        </motion.h1>
        <GenerativeMirrorGame />
      </div>
    </RequireAuth>
  );
};

export default MirrorPage;

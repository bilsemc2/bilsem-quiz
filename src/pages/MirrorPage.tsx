import React from 'react';
import MirrorGame from '@/components/MirrorGame';
import RequireAuth from '@/components/RequireAuth';

const MatrixPage = () => {
  return (
    <RequireAuth>
      <div className="container mx-auto px-4 py-8">
        <MirrorGame />
      </div>
    </RequireAuth>
  );
};

export default MatrixPage;

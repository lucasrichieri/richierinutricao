import React from 'react';

export default function Logo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
      <img src="/logo.png" alt="Richieri Nutrição Logo" style={{ maxWidth: '220px', height: 'auto' }} />
    </div>
  );
}

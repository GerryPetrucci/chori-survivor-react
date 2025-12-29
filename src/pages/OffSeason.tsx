import React from "react";
import "../App.css";

const OffSeason: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        textAlign: 'center',
        padding: '24px 8px',
        boxSizing: 'border-box',
      }}
    >
      <img
        src="/assets/logos/chori_survivor.png"
        alt="Chori Survivor Logo"
        style={{
          width: 'clamp(100px, 25vw, 160px)',
          maxWidth: '90vw',
          marginBottom: 32,
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.18)'
        }}
      />
      <h1
        style={{
          fontSize: 'clamp(2rem, 6vw, 3rem)',
          marginBottom: 16,
          lineHeight: 1.1,
          fontWeight: 800,
        }}
      >
        ¡Nos vemos en la temporada 2026 de la NFL!
      </h1>
      <p
        style={{
          fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
          maxWidth: 500,
          marginBottom: 32,
          lineHeight: 1.4,
        }}
      >
        Gracias por participar en <b>Chori Survivor 2025</b>.<br />
        Mantente atento para la próxima temporada.<br />
        ¡Vuelve pronto!
      </p>
      <span
        style={{
          fontSize: 'clamp(1rem, 2vw, 1.15rem)',
          opacity: 0.7,
        }}
      >
        Chori Survivor © {new Date().getFullYear()}
      </span>
    </div>
  );
};

export default OffSeason;

import React, { useEffect } from 'react';

const Snowfall: React.FC = () => {
  useEffect(() => {
    const canvas = document.getElementById('snowfall') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas'ı tam ekran yap
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Kar tanelerini oluştur
    const snowflakes: { x: number; y: number; radius: number; speed: number; wind: number }[] = [];
    const createSnowflake = () => {
      return {
        x: Math.random() * canvas.width,
        y: 0,
        radius: Math.random() * 3 + 1,
        speed: Math.random() * 2 + 1,
        wind: Math.random() * 0.5 - 0.25
      };
    };

    // Başlangıçta 100 kar tanesi oluştur
    for (let i = 0; i < 100; i++) {
      snowflakes.push(createSnowflake());
    }

    // Animasyon döngüsü
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

      snowflakes.forEach((flake, index) => {
        // Kar tanesini çiz
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fill();

        // Kar tanesini hareket ettir
        flake.y += flake.speed;
        flake.x += flake.wind;

        // Ekranın altına ulaşınca yeni kar tanesi oluştur
        if (flake.y > canvas.height) {
          snowflakes[index] = createSnowflake();
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      id="snowfall"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 100
      }}
    />
  );
};

export default Snowfall;

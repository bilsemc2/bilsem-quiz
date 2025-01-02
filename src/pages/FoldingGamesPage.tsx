import React, { useState } from 'react';
import { Container, Typography, Box, Card, CardContent, CardMedia, CardActionArea } from '@mui/material';
import FoldingQuestion from '../components/FoldingQuestion';

const FoldingGamesPage = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const games = [
    {
      id: 'sticks',
      title: 'Çubuk Katlama',
      description: 'Dışarıdaki çubukları içeri katlayarak oluşacak şekli tahmin edin.',
      image: '/images/memory/folding-icon.svg', // Geçici olarak hafıza oyunu görselini kullanıyoruz
      component: <FoldingQuestion />
    },
    // Diğer katlama oyunları buraya eklenecek
  ];

  if (selectedGame) {
    const game = games.find(g => g.id === selectedGame);
    if (!game) return null;

    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <button
            onClick={() => setSelectedGame(null)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ← Geri Dön
          </button>
        </Box>
        {game.component}
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Kağıt Katlama Oyunları
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
        {games.map((game) => (
          <Card key={game.id} sx={{ height: '100%' }}>
            <CardActionArea onClick={() => setSelectedGame(game.id)} sx={{ height: '100%' }}>
              <CardMedia
                component="img"
                height="140"
                image={game.image}
                alt={game.title}
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  {game.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {game.description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Container>
  );
};

export default FoldingGamesPage;

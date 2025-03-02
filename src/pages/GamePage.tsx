import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Card {
    id: number;
    value: string;
    isFlipped: boolean;
    isMatched: boolean;
}

const REQUIRED_XP = 100; // Oyunu oynayabilmek için gereken minimum XP
const MEMORY_ICONS = [
    '🐱', // kedi
    '🐶', // köpek
    '🐼', // panda
    '🦊', // tilki
    '🐘', // fil
    '🐧', // penguen
    '🦁', // aslan
    '🦒', // zürafa
    '🐱', // kedi
    '🐶', // köpek
    '🐼', // panda
    '🦊', // tilki
    '🐘', // fil
    '🐧', // penguen
    '🦁', // aslan
    '🦒', // zürafa
];

export default function GamePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [userXP, setUserXP] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [matchedPairs, setMatchedPairs] = useState<number>(0);
    const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
    const [moves, setMoves] = useState<number>(0);
    const [gameCompleted, setGameCompleted] = useState<boolean>(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchUserXP = async () => {
            try {
                setLoading(true);
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('experience')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    console.error('Error fetching user XP:', profileError);
                    return;
                }

                setUserXP(profileData.experience || 0);
            } finally {
                setLoading(false);
            }
        };

        fetchUserXP();
    }, [user, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (userXP < REQUIRED_XP) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="text-center bg-white rounded-xl shadow-lg p-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            🎮 Hafıza Kartı Oyunu
                        </h1>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-red-700">
                                Bu oyunu oynayabilmek için en az {REQUIRED_XP} XP'ye ihtiyacınız var.
                                Şu anki XP'niz: {userXP}
                            </p>
                            <p className="text-sm text-red-600 mt-2">
                                Quiz çözerek ve bulmaca tamamlayarak XP kazanabilirsiniz!
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/quiz')}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Quiz'e Git
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const shuffleCards = () => {
        const shuffledCards = [...MEMORY_ICONS]
            .sort(() => Math.random() - 0.5)
            .map((value, index) => ({
                id: index,
                value,
                isFlipped: false,
                isMatched: false,
            }));
        setCards(shuffledCards);
        setFlippedCards([]);
        setMatchedPairs(0);
        setMoves(0);
        setGameCompleted(false);
        setIsGameStarted(true);
    };

    const handleCardClick = (cardId: number) => {
        if (
            flippedCards.length === 2 || // İki kart zaten açıksa
            flippedCards.includes(cardId) || // Kart zaten açıksa
            cards[cardId].isMatched // Kart eşleştirilmişse
        ) {
            return;
        }

        const newFlippedCards = [...flippedCards, cardId];
        setFlippedCards(newFlippedCards);

        if (newFlippedCards.length === 2) {
            setMoves(moves + 1);
            const [firstCard, secondCard] = newFlippedCards;

            if (cards[firstCard].value === cards[secondCard].value) {
                // Eşleşme bulundu
                setCards(cards.map(card =>
                    card.id === firstCard || card.id === secondCard
                        ? { ...card, isMatched: true }
                        : card
                ));
                setMatchedPairs(matchedPairs + 1);
                setFlippedCards([]);

                // Oyun tamamlandı mı kontrol et
                if (matchedPairs + 1 === MEMORY_ICONS.length / 2) {
                    setGameCompleted(true);
                    handleGameCompletion();
                }
            } else {
                // Eşleşme yok, kartları geri çevir
                setTimeout(() => {
                    setFlippedCards([]);
                }, 1000);
            }
        }
    };

    const handleGameCompletion = async () => {
        if (!user) return;

        // Oyun tamamlandığında XP ödülü ver
        const xpReward = Math.max(20 - moves, 5); // Minimum 5, maksimum 20 XP

        const { error } = await supabase
            .from('profiles')
            .update({ experience: userXP + xpReward })
            .eq('id', user.id);

        if (error) {
            console.error('Error updating user XP:', error);
            return;
        }

        setUserXP(prevXP => prevXP + xpReward);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        🎮 Hafıza Kartı Oyunu
                    </h1>
                    <p className="text-gray-600">
                        Eşleşen kartları bul!
                    </p>
                </div>

                {!isGameStarted ? (
                    <div className="text-center">
                        <button
                            onClick={shuffleCards}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Oyunu Başlat
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-gray-700">
                                Hamle: {moves}
                            </div>
                            <div className="text-gray-700">
                                Eşleşmeler: {matchedPairs}/{MEMORY_ICONS.length / 2}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                            {cards.map(card => (
                                <button
                                    key={card.id}
                                    onClick={() => handleCardClick(card.id)}
                                    className={`aspect-square rounded-xl text-4xl sm:text-6xl flex items-center justify-center transition-all duration-300 transform ${
                                        card.isMatched || flippedCards.includes(card.id)
                                            ? 'bg-green-100 rotate-0'
                                            : 'bg-white rotate-180'
                                    } ${
                                        !card.isMatched && !gameCompleted
                                            ? 'hover:scale-105 hover:shadow-lg'
                                            : ''
                                    } shadow`}
                                    disabled={gameCompleted}
                                >
                                    {(card.isMatched || flippedCards.includes(card.id)) ? card.value : '❓'}
                                </button>
                            ))}
                        </div>

                        {gameCompleted && (
                            <div className="mt-8 text-center bg-green-50 rounded-xl p-6 border border-green-200">
                                <h2 className="text-2xl font-bold text-green-800 mb-2">
                                    🎉 Tebrikler!
                                </h2>
                                <p className="text-green-700">
                                    Oyunu {moves} hamlede tamamladın!
                                </p>
                                <button
                                    onClick={shuffleCards}
                                    className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Tekrar Oyna
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { Card, Tabs, Button, Progress, Row, Col, Statistic, Modal, Radio, Space, Alert, Input } from 'antd';
import { EyeOutlined, BookOutlined, LineChartOutlined, TrophyOutlined, ClockCircleOutlined, ExperimentOutlined } from '@ant-design/icons';
import { READING_TEXTS } from '../constants/readingTexts';
import { MEMORY_EXERCISES } from '../constants/memoryExercises';
import { WORD_SEARCH_GAMES, MATCHING_GAMES, MISSING_WORD_GAMES } from '../constants/miniGames';

interface ReadingStats {
    wpm: number;
    comprehension: number;
    exercisesDone: number;
    currentLevel: number;
    totalTime: number;
    dailyGoal: number;
    dailyProgress: number;
}

const SpeedReadingPage: React.FC = () => {

    const [activeTab, setActiveTab] = useState('eye-exercises');
    const [stats, setStats] = useState<ReadingStats>({
        wpm: 0,
        comprehension: 0,
        exercisesDone: 0,
        currentLevel: 1,
        totalTime: 0,
        dailyGoal: 5,
        dailyProgress: 0
    });

    // Metinsel çalışmalar için state
    const [selectedText, setSelectedText] = useState(READING_TEXTS[0]);
    const [readingStartTime, setReadingStartTime] = useState<number | null>(null);
    const [showQuestions, setShowQuestions] = useState(false);
    const [answers, setAnswers] = useState<number[]>([]);
    const [readingResults, setReadingResults] = useState<{
        wpm: number;
        comprehension: number;
        timeTaken: number;
    } | null>(null);

    // Hafıza egzersizleri için state
    const [selectedMemoryExercise, setSelectedMemoryExercise] = useState(MEMORY_EXERCISES[0]);
    const [showingMemoryItems, setShowingMemoryItems] = useState(false);
    const [memoryUserInput, setMemoryUserInput] = useState<string[]>([]);
    const [memoryResults, setMemoryResults] = useState<{
        correct: number;
        total: number;
        timeTaken: number;
    } | null>(null);

    // Göz egzersizi için nokta pozisyonu
    const [dotPosition, setDotPosition] = useState({ x: 50, y: 50 });
    const [isExerciseActive, setIsExerciseActive] = useState(false);

    // Mini oyunlar için state
    const [selectedGame, setSelectedGame] = useState<'word-search' | 'matching' | 'missing-word'>('word-search');
    const [gameLevel, setGameLevel] = useState<number>(0);
    const [selectedWords, setSelectedWords] = useState<string[]>([]);
    const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
    const [filledWords, setFilledWords] = useState<{[key: number]: string}>({});

    // Göz egzersizi
    const [exerciseInterval, setExerciseInterval] = useState<number | null>(null);
    const [exerciseTimeout, setExerciseTimeout] = useState<number | null>(null);

    const startEyeExercise = () => {
        setIsExerciseActive(true);
        const interval = window.setInterval(() => {
            setDotPosition({
                x: Math.random() * 80 + 10, // 10% - 90%
                y: Math.random() * 80 + 10
            });
        }, 1000);
        setExerciseInterval(interval);

        // 1 dakika sonra egzersizi bitir
        const timeout = window.setTimeout(() => {
            stopEyeExercise();
        }, 60000);
        setExerciseTimeout(timeout);
    };

    const stopEyeExercise = () => {
        if (exerciseInterval) {
            clearInterval(exerciseInterval);
            setExerciseInterval(null);
        }
        if (exerciseTimeout) {
            clearTimeout(exerciseTimeout);
            setExerciseTimeout(null);
        }
        setIsExerciseActive(false);
        // Egzersiz istatistiklerini güncelle
        setStats(prev => ({
            ...prev,
            exercisesDone: prev.exercisesDone + 1,
            totalTime: prev.totalTime + 1
        }));
    };

    // Mini oyun yardımcı fonksiyonları
    const getWordCoordinates = (grid: string[][], word: string): [number, number][] => {
        const coordinates: [number, number][] = [];
        const height = grid.length;
        const width = grid[0].length;

        // Yatay arama
        for (let i = 0; i < height; i++) {
            for (let j = 0; j <= width - word.length; j++) {
                const currentWord = grid[i].slice(j, j + word.length).join('');
                if (currentWord === word) {
                    for (let k = 0; k < word.length; k++) {
                        coordinates.push([i, j + k]);
                    }
                    return coordinates;
                }
            }
        }

        // Dikey arama
        for (let i = 0; i <= height - word.length; i++) {
            for (let j = 0; j < width; j++) {
                let currentWord = '';
                for (let k = 0; k < word.length; k++) {
                    currentWord += grid[i + k][j];
                }
                if (currentWord === word) {
                    for (let k = 0; k < word.length; k++) {
                        coordinates.push([i + k, j]);
                    }
                    return coordinates;
                }
            }
        }

        return coordinates;
    };

    const handleLetterClick = (row: number, col: number) => {
        const currentGame = WORD_SEARCH_GAMES[gameLevel];

        // Kelimeleri kontrol et
        for (const word of currentGame.words) {
            if (!selectedWords.includes(word)) {
                const coordinates = getWordCoordinates(currentGame.grid, word);
                if (coordinates.some(([r, c]) => r === row && c === col)) {
                    setSelectedWords(prev => [...prev, word]);
                    break;
                }
            }
        }
    };

    const handlePairClick = (id: string) => {
        if (!matchedPairs.includes(id)) {
            setMatchedPairs(prev => [...prev, id]);
        }
    };

    const handleWordSelect = (index: number, word: string) => {
        setFilledWords(prev => ({ ...prev, [index]: word }));
    };

    const canCheckGame = () => {
        switch (selectedGame) {
            case 'word-search':
                return selectedWords.length === WORD_SEARCH_GAMES[gameLevel].words.length;
            case 'matching':
                return matchedPairs.length === MATCHING_GAMES[gameLevel].pairs.length;
            case 'missing-word':
                return Object.keys(filledWords).length === MISSING_WORD_GAMES[gameLevel].missingWords.length;
            default:
                return false;
        }
    };

    const canGoNextLevel = () => {
        switch (selectedGame) {
            case 'word-search':
                return gameLevel < WORD_SEARCH_GAMES.length - 1;
            case 'matching':
                return gameLevel < MATCHING_GAMES.length - 1;
            case 'missing-word':
                return gameLevel < MISSING_WORD_GAMES.length - 1;
            default:
                return false;
        }
    };

    const handleGameCheck = () => {
        let correct = 0;
        let total = 0;

        switch (selectedGame) {
            case 'word-search':
                correct = selectedWords.length;
                total = WORD_SEARCH_GAMES[gameLevel].words.length;
                break;
            case 'matching':
                correct = matchedPairs.length;
                total = MATCHING_GAMES[gameLevel].pairs.length;
                break;
            case 'missing-word':
                correct = Object.values(filledWords).filter(
                    (word, index) => word === MISSING_WORD_GAMES[gameLevel].missingWords[index]
                ).length;
                total = MISSING_WORD_GAMES[gameLevel].missingWords.length;
                break;
        }

        Modal.success({
            title: 'Oyun Tamamlandı!',
            content: (
                <div>
                    <p>Doğru Sayısı: {correct}/{total}</p>
                    <p>Başarı Oranı: {Math.round((correct / total) * 100)}%</p>
                </div>
            ),
            onOk: () => {
                if (canGoNextLevel()) {
                    setGameLevel(prev => prev + 1);
                }
                setSelectedWords([]);
                setMatchedPairs([]);
                setFilledWords({});

                // İstatistikleri güncelle
                setStats(prev => ({
                    ...prev,
                    exercisesDone: prev.exercisesDone + 1,
                    dailyProgress: prev.dailyProgress + 1
                }));
            }
        });
    };

    // Kelime tanıma egzersizi için state
    const [currentWord, setCurrentWord] = useState('');
    const [wordSpeed, setWordSpeed] = useState(500); // ms
    const words = ['hızlı', 'okuma', 'pratik', 'anlama', 'başarı', 'gelişim', 'öğrenme', 'bilsemc2','Ersan'];

    // Kelime tanıma egzersizi
    const startWordRecognition = () => {
        setIsExerciseActive(true);
        let index = 0;
        
        const interval = setInterval(() => {
            if (index < words.length) {
                setCurrentWord(words[index]);
                index++;
            } else {
                clearInterval(interval);
                setIsExerciseActive(false);
                setCurrentWord('');
                // İstatistikleri güncelle
                setStats(prev => ({
                    ...prev,
                    exercisesDone: prev.exercisesDone + 1,
                    totalTime: prev.totalTime + 1
                }));
            }
        }, wordSpeed);
    };

    // Seviye rozetleri
    const badges = [
        { name: 'Başlangıç', icon: '🌱', unlocked: stats.currentLevel >= 1 },
        { name: 'Gelişen', icon: '🌿', unlocked: stats.currentLevel >= 2 },
        { name: 'Hızlı', icon: '🌳', unlocked: stats.currentLevel >= 3 },
        { name: 'Uzman', icon: '🌟', unlocked: stats.currentLevel >= 4 },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Üst Bilgi Kartları */}
                {/* İstatistikler */}
                <Row gutter={16} className="mb-8">
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Ortalama Hız"
                                value={stats.wpm}
                                suffix="WPM"
                                prefix={<BookOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Anlama Oranı"
                                value={stats.comprehension}
                                suffix="%"
                                prefix={<LineChartOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Tamamlanan Egzersiz"
                                value={stats.exercisesDone}
                                prefix={<TrophyOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Toplam Süre"
                                value={stats.totalTime}
                                suffix="dk"
                                prefix={<ClockCircleOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Günlük Hedef ve İlerleme */}
                <Card className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold">Günlük Hedef</h3>
                            <p className="text-gray-500">{stats.dailyProgress} / {stats.dailyGoal} egzersiz tamamlandı</p>
                        </div>
                        <Button
                            type="link"
                            onClick={() => {
                                Modal.confirm({
                                    title: 'Günlük Hedefinizi Güncelleyin',
                                    content: (
                                        <Radio.Group
                                            value={stats.dailyGoal}
                                            onChange={(e) => {
                                                setStats(prev => ({
                                                    ...prev,
                                                    dailyGoal: e.target.value
                                                }));
                                            }}
                                        >
                                            <Space direction="vertical">
                                                <Radio value={3}>Kolay (3 egzersiz)</Radio>
                                                <Radio value={5}>Orta (5 egzersiz)</Radio>
                                                <Radio value={7}>Zor (7 egzersiz)</Radio>
                                                <Radio value={10}>Uzman (10 egzersiz)</Radio>
                                            </Space>
                                        </Radio.Group>
                                    )
                                });
                            }}
                        >
                            Hedefi Düzenle
                        </Button>
                    </div>
                    <Progress
                        percent={Math.min(100, (stats.dailyProgress / stats.dailyGoal) * 100)}
                        status={stats.dailyProgress >= stats.dailyGoal ? 'success' : 'active'}
                        strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                        }}
                    />
                    {stats.dailyProgress >= stats.dailyGoal && (
                        <Alert
                            message="Tebrikler!"
                            description="Bugünkü hedefinize ulaştınız. Pratik yapmaya devam ederek daha da gelişebilirsiniz."
                            type="success"
                            showIcon
                            className="mt-4"
                        />
                    )}
                </Card>

                {/* Rozetler */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Rozetleriniz</h2>
                    <div className="flex space-x-4">
                        {badges.map((badge, index) => (
                            <div
                                key={index}
                                className={`text-center p-4 rounded-lg ${
                                    badge.unlocked
                                        ? 'bg-blue-50 border-2 border-blue-200'
                                        : 'bg-gray-50 border-2 border-gray-200 opacity-50'
                                }`}
                            >
                                <div className="text-3xl mb-2">{badge.icon}</div>
                                <div className="font-medium">{badge.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ana İçerik */}
                <Card>
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={[
                            {
                                key: 'memory-exercises',
                                label: (
                                    <span>
                                        <ExperimentOutlined /> Hafıza Egzersizleri
                                    </span>
                                ),
                                children: (
                                    <div className="p-4">
                                        <div className="mb-4">
                                            <h3 className="text-xl font-bold mb-2">Hafıza Egzersizi</h3>
                                            <p className="text-gray-500 mb-4">
                                                Zorluk: {selectedMemoryExercise.difficulty === 'easy' ? 'Kolay' :
                                                        selectedMemoryExercise.difficulty === 'medium' ? 'Orta' : 'Zor'}
                                                <span className="mx-2">•</span>
                                                Süre: {selectedMemoryExercise.displayTime / 1000} saniye
                                            </p>
                                            <p className="mb-4">{selectedMemoryExercise.description}</p>
                                        </div>

                                        {!showingMemoryItems && !memoryResults && (
                                            <div className="text-center">
                                                <Space>
                                                    <Button
                                                        type="primary"
                                                        onClick={() => {
                                                            setShowingMemoryItems(true);
                                                            setTimeout(() => {
                                                                setShowingMemoryItems(false);
                                                                setMemoryUserInput(new Array(selectedMemoryExercise.content.length).fill(''));
                                                            }, selectedMemoryExercise.displayTime);
                                                        }}
                                                    >
                                                        Başla
                                                    </Button>
                                                    <Button
                                                        onClick={() => {
                                                            const currentIndex = MEMORY_EXERCISES.findIndex(ex => ex.id === selectedMemoryExercise.id);
                                                            setSelectedMemoryExercise(MEMORY_EXERCISES[(currentIndex + 1) % MEMORY_EXERCISES.length]);
                                                        }}
                                                    >
                                                        Sonraki Egzersiz
                                                    </Button>
                                                </Space>
                                            </div>
                                        )}

                                        {showingMemoryItems && (
                                            <div className="flex items-center justify-center h-64">
                                                <div className="text-center">
                                                    <div className="text-4xl mb-4">
                                                        {selectedMemoryExercise.content.map((item, index) => (
                                                            <span key={index} className="mx-2">{item}</span>
                                                        ))}
                                                    </div>
                                                    <p className="text-gray-500">Gösterilen öğeleri aklınızda tutun...</p>
                                                </div>
                                            </div>
                                        )}

                                        {!showingMemoryItems && memoryUserInput && memoryUserInput.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="font-medium mb-4">Gördüğünüz öğeleri sırasıyla girin:</h4>
                                                <div className="grid grid-cols-3 gap-4">
                                                    {memoryUserInput.map((input, index) => (
                                                        selectedMemoryExercise.type === 'visual' ? (
                                                            <div key={index} className="flex flex-col items-center">
                                                                <p className="mb-2">{index + 1}. öğe</p>
                                                                <Radio.Group
                                                                    value={input}
                                                                    onChange={(e) => {
                                                                        const newInputs = [...memoryUserInput];
                                                                        newInputs[index] = e.target.value;
                                                                        setMemoryUserInput(newInputs);
                                                                    }}
                                                                    className="grid grid-cols-3 gap-2"
                                                                >
                                                                    {['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨',
                                                                      '🍎', '🍌', '🍇', '🍊', '🍓', '🍉', '🍍', '🥝', '🍐',
                                                                      '⚽️', '🏀', '🏈', '⚾️', '🎾', '🏐', '🏉', '🎱', '🏓'].map((emoji) => (
                                                                        <Radio.Button key={emoji} value={emoji}>
                                                                            <span style={{ fontSize: '1.2em' }}>{emoji}</span>
                                                                        </Radio.Button>
                                                                    ))}
                                                                </Radio.Group>
                                                            </div>
                                                        ) : (
                                                            <Input
                                                                key={index}
                                                                placeholder={`${index + 1}. öğe`}
                                                                value={input}
                                                                onChange={(e) => {
                                                                    const newInputs = [...memoryUserInput];
                                                                    newInputs[index] = e.target.value;
                                                                    setMemoryUserInput(newInputs);
                                                                }}
                                                                className="mb-2"
                                                            />
                                                        )
                                                    ))}
                                                </div>
                                                <div className="text-center mt-4">
                                                    <Button
                                                        type="primary"
                                                        onClick={() => {
                                                            const correct = memoryUserInput.filter(
                                                                (input, index) => input.toLowerCase() === selectedMemoryExercise.content[index].toLowerCase()
                                                            ).length;

                                                            setMemoryResults({
                                                                correct,
                                                                total: selectedMemoryExercise.content.length,
                                                                timeTaken: selectedMemoryExercise.displayTime / 1000
                                                            });

                                                            // İstatistikleri güncelle
                                                            setStats(prev => ({
                                                                ...prev,
                                                                exercisesDone: prev.exercisesDone + 1,
                                                                dailyProgress: prev.dailyProgress + 1
                                                            }));

                                                            // Sonuçları göster
                                                            Modal.success({
                                                                title: 'Hafıza Egzersizi Tamamlandı!',
                                                                content: (
                                                                    <div>
                                                                        <p>Doğru Sayısı: {correct}/{selectedMemoryExercise.content.length}</p>
                                                                        <p>Başarı Oranı: {Math.round((correct / selectedMemoryExercise.content.length) * 100)}%</p>
                                                                        <p>Gösterim Süresi: {selectedMemoryExercise.displayTime / 1000} saniye</p>
                                                                    </div>
                                                                ),
                                                                onOk: () => {
                                                                    setMemoryResults(null);
                                                                    setMemoryUserInput([]);
                                                                    setSelectedMemoryExercise(MEMORY_EXERCISES[
                                                                        (MEMORY_EXERCISES.findIndex(ex => ex.id === selectedMemoryExercise.id) + 1) % MEMORY_EXERCISES.length
                                                                    ]);
                                                                }
                                                            });
                                                        }}
                                                    >
                                                        Cevapları Kontrol Et
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: 'eye-exercises',
                                label: (
                                    <span>
                                        <EyeOutlined /> Göz Egzersizleri
                                    </span>
                                ),
                                children: (
                                    <div className="p-4">
                                        <div className="text-center mb-4">
                                            <Space>
                                                <Button
                                                    type="primary"
                                                    size="large"
                                                    onClick={startEyeExercise}
                                                    disabled={isExerciseActive}
                                                >
                                                    Egzersizi Başlat
                                                </Button>
                                                {isExerciseActive && (
                                                    <Button
                                                        type="default"
                                                        size="large"
                                                        onClick={stopEyeExercise}
                                                        danger
                                                    >
                                                        Egzersizi Durdur
                                                    </Button>
                                                )}
                                            </Space>
                                        </div>
                                        
                                        <div 
                                            className="relative bg-gray-50 rounded-lg"
                                            style={{ height: '400px', width: '100%' }}
                                        >
                                            {isExerciseActive && (
                                                <div
                                                    className="absolute w-4 h-4 bg-blue-500 rounded-full transition-all duration-300"
                                                    style={{
                                                        left: `${dotPosition.x}%`,
                                                        top: `${dotPosition.y}%`,
                                                        transform: 'translate(-50%, -50%)'
                                                    }}
                                                />
                                            )}
                                            {!isExerciseActive && (
                                                <div className="h-full flex items-center justify-center text-gray-500">
                                                    Egzersizi başlatmak için butona tıklayın
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                key: 'word-recognition',
                                label: (
                                    <span>
                                        <BookOutlined /> Kelime Tanıma
                                    </span>
                                ),
                                children: (
                                    <div className="p-4">
                                        <div className="text-center mb-4">
                                            <Button
                                                type="primary"
                                                size="large"
                                                onClick={startWordRecognition}
                                                disabled={isExerciseActive}
                                            >
                                                Egzersizi Başlat
                                            </Button>
                                        </div>
                                        
                                        <div 
                                            className="bg-gray-50 rounded-lg p-8"
                                            style={{ height: '400px' }}
                                        >
                                            <div className="h-full flex flex-col items-center justify-center">
                                                {currentWord ? (
                                                    <div className="text-4xl font-bold text-blue-600">
                                                        {currentWord}
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-500">
                                                        Egzersizi başlatmak için butona tıklayın
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500 mb-2">Kelime Gösterim Hızı</p>
                                            <div className="flex items-center space-x-4">
                                                <Button 
                                                    onClick={() => setWordSpeed(prev => Math.min(prev + 100, 1000))}
                                                    disabled={wordSpeed >= 1000}
                                                >
                                                    Yavaşlat
                                                </Button>
                                                <Progress 
                                                    percent={100 - (wordSpeed - 100) / 9} 
                                                    showInfo={false}
                                                />
                                                <Button
                                                    onClick={() => setWordSpeed(prev => Math.max(prev - 100, 100))}
                                                    disabled={wordSpeed <= 100}
                                                >
                                                    Hızlandır
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                key: 'mini-games',
                                label: (
                                    <span>
                                        <TrophyOutlined /> Mini Oyunlar
                                    </span>
                                ),
                                children: (
                                    <div className="p-4">
                                        <div className="mb-4">
                                            <Radio.Group
                                                value={selectedGame}
                                                onChange={(e) => {
                                                    setSelectedGame(e.target.value);
                                                    setGameLevel(0);
                                                    setSelectedWords([]);
                                                    setMatchedPairs([]);
                                                    setFilledWords({});
                                                }}
                                            >
                                                <Radio.Button value="word-search">Kelime Avı</Radio.Button>
                                                <Radio.Button value="matching">Eşleştirme</Radio.Button>
                                                <Radio.Button value="missing-word">Kayıp Kelime</Radio.Button>
                                            </Radio.Group>
                                        </div>

                                        {selectedGame === 'word-search' && (
                                            <div>
                                                <h3 className="text-xl font-bold mb-4">Kelime Avı</h3>
                                                <div className="grid grid-cols-5 gap-2 mb-4">
                                                    {WORD_SEARCH_GAMES[gameLevel].grid.map((row, rowIndex) => (
                                                        row.map((letter, colIndex) => (
                                                            <button
                                                                key={`${rowIndex}-${colIndex}`}
                                                                className={`w-12 h-12 text-lg font-bold rounded
                                                                    ${selectedWords.some(word => {
                                                                        const coordinates = getWordCoordinates(WORD_SEARCH_GAMES[gameLevel].grid, word);
                                                                        return coordinates.some(([r, c]) => r === rowIndex && c === colIndex);
                                                                    }) ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                                                                onClick={() => handleLetterClick(rowIndex, colIndex)}
                                                            >
                                                                {letter}
                                                            </button>
                                                        ))
                                                    ))}
                                                </div>
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {WORD_SEARCH_GAMES[gameLevel].words.map(word => (
                                                        <span
                                                            key={word}
                                                            className={`px-3 py-1 rounded ${selectedWords.includes(word) ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                                                        >
                                                            {word}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedGame === 'matching' && (
                                            <div>
                                                <h3 className="text-xl font-bold mb-4">Eşleştirme</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        {MATCHING_GAMES[gameLevel].pairs.map(pair => (
                                                            <button
                                                                key={pair.id}
                                                                className={`w-full p-3 text-left rounded
                                                                    ${matchedPairs.includes(pair.id) ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
                                                                onClick={() => handlePairClick(pair.id)}
                                                                disabled={matchedPairs.includes(pair.id)}
                                                            >
                                                                {pair.word}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="space-y-2">
                                                        {MATCHING_GAMES[gameLevel].pairs
                                                            .sort(() => Math.random() - 0.5)
                                                            .map(pair => (
                                                                <button
                                                                    key={pair.id}
                                                                    className={`w-full p-3 text-left rounded
                                                                        ${matchedPairs.includes(pair.id) ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
                                                                    onClick={() => handlePairClick(pair.id)}
                                                                    disabled={matchedPairs.includes(pair.id)}
                                                                >
                                                                    {pair.match}
                                                                </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {selectedGame === 'missing-word' && (
                                            <div>
                                                <h3 className="text-xl font-bold mb-4">Kayıp Kelime</h3>
                                                <p className="text-lg mb-4">
                                                    {MISSING_WORD_GAMES[gameLevel].text.split('_____').map((part, index) => (
                                                        <React.Fragment key={index}>
                                                            {part}
                                                            {index < MISSING_WORD_GAMES[gameLevel].missingWords.length && (
                                                                <select
                                                                    value={filledWords[index] || ''}
                                                                    onChange={(e) => handleWordSelect(index, e.target.value)}
                                                                    className="mx-2 p-1 border rounded"
                                                                >
                                                                    <option value="">Seçiniz...</option>
                                                                    {MISSING_WORD_GAMES[gameLevel].options.map(option => (
                                                                        <option key={option} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </p>
                                            </div>
                                        )}

                                        <div className="mt-4 text-center">
                                            <Space>
                                                <Button
                                                    type="primary"
                                                    onClick={handleGameCheck}
                                                    disabled={!canCheckGame()}
                                                >
                                                    Kontrol Et
                                                </Button>
                                                {gameLevel > 0 && (
                                                    <Button onClick={() => setGameLevel(prev => prev - 1)}>
                                                        Önceki Seviye
                                                    </Button>
                                                )}
                                                {canGoNextLevel() && (
                                                    <Button onClick={() => setGameLevel(prev => prev + 1)}>
                                                        Sonraki Seviye
                                                    </Button>
                                                )}
                                            </Space>
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                key: 'reading-practice',
                                label: (
                                    <span>
                                        <BookOutlined /> Metinsel Çalışmalar
                                    </span>
                                ),
                                children: (
                                    <div className="p-4">
                                        {!showQuestions ? (
                                            <div>
                                                <div className="mb-4">
                                                    <h3 className="text-xl font-bold mb-2">{selectedText.title}</h3>
                                                    <p className="text-gray-500 mb-4">
                                                        Zorluk: {selectedText.difficulty === 'beginner' ? 'Başlangıç' :
                                                                selectedText.difficulty === 'intermediate' ? 'Orta' : 'İleri'}
                                                        <span className="mx-2">•</span>
                                                        Tahmini Süre: {selectedText.estimatedTime} saniye
                                                    </p>
                                                    {!readingStartTime ? (
                                                        <Button 
                                                            type="primary"
                                                            onClick={() => setReadingStartTime(Date.now())}
                                                        >
                                                            Okumaya Başla
                                                        </Button>
                                                    ) : (
                                                        <div>
                                                            <div className="bg-gray-50 p-6 rounded-lg text-lg leading-relaxed mb-4">
                                                                {selectedText.content}
                                                            </div>
                                                            <Button 
                                                                type="primary"
                                                                onClick={() => {
                                                                    const endTime = Date.now();
                                                                    const timeTaken = (endTime - readingStartTime) / 1000;
                                                                    const words = selectedText.content.split(' ').length;
                                                                    const wpm = Math.round((words / timeTaken) * 60);
                                                                    setReadingResults({
                                                                        wpm,
                                                                        comprehension: 0,
                                                                        timeTaken
                                                                    });
                                                                    setShowQuestions(true);
                                                                }}
                                                            >
                                                                Okudum, Soruları Göster
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <h3 className="text-xl font-bold mb-4">Anlama Soruları</h3>
                                                {selectedText.questions.map((q, idx) => (
                                                    <div key={idx} className="mb-6">
                                                        <p className="font-medium mb-3">{q.question}</p>
                                                        <Radio.Group
                                                            onChange={(e) => {
                                                                const newAnswers = [...answers];
                                                                newAnswers[idx] = e.target.value;
                                                                setAnswers(newAnswers);
                                                            }}
                                                            value={answers[idx]}
                                                        >
                                                            <Space direction="vertical">
                                                                {q.options.map((option, optIdx) => (
                                                                    <Radio key={optIdx} value={optIdx}>{option}</Radio>
                                                                ))}
                                                            </Space>
                                                        </Radio.Group>
                                                    </div>
                                                ))}
                                                <Button
                                                    type="primary"
                                                    onClick={() => {
                                                        const correctAnswers = answers.filter(
                                                            (answer, idx) => answer === selectedText.questions[idx].correctAnswer
                                                        ).length;
                                                        const comprehension = (correctAnswers / selectedText.questions.length) * 100;
                                                        
                                                        if (readingResults) {
                                                            setReadingResults({
                                                                ...readingResults,
                                                                comprehension
                                                            });
                                                            
                                                            // İstatistikleri güncelle
                                                            setStats(prev => ({
                                                                ...prev,
                                                                wpm: Math.round((prev.wpm + readingResults.wpm) / 2),
                                                                comprehension: Math.round((prev.comprehension + comprehension) / 2),
                                                                exercisesDone: prev.exercisesDone + 1,
                                                                totalTime: prev.totalTime + Math.round(readingResults.timeTaken / 60),
                                                                dailyProgress: prev.dailyProgress + 1
                                                            }));
                                                        }
                                                        
                                                        // Sonuçları göster
                                                        Modal.success({
                                                            title: 'Çalışma Tamamlandı!',
                                                            content: (
                                                                <div>
                                                                    <p>Okuma Hızı: {readingResults?.wpm} kelime/dakika</p>
                                                                    <p>Anlama Oranı: {comprehension}%</p>
                                                                    <p>Süre: {readingResults?.timeTaken.toFixed(1)} saniye</p>
                                                                </div>
                                                            ),
                                                            onOk: () => {
                                                                setShowQuestions(false);
                                                                setReadingStartTime(null);
                                                                setAnswers([]);
                                                                setSelectedText(READING_TEXTS[
                                                                    (READING_TEXTS.findIndex(t => t.id === selectedText.id) + 1) % READING_TEXTS.length
                                                                ]);
                                                            }
                                                        });
                                                    }}
                                                >
                                                    Cevapları Gönder
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ),
                            },
                        ]}
                    />
                </Card>
            </div>
        </div>
    );
};

export default SpeedReadingPage;

// PDF Oluşturma
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Story } from './types';
import { decode } from 'html-entities';

Font.register({
  family: 'Roboto',
  src: '/fonts/Roboto/Roboto-VariableFont_wdth,wght.ttf',
  fontWeight: 100
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Roboto',
    fontWeight: 'normal'
  },
  header: {
    marginBottom: 20,
    textAlign: 'center'
  },
  title: {
    fontSize: 24,
    color: '#6B46C1',
    marginBottom: 20
  },
  gameSection: {
    marginBottom: 30
  },
  gameTitle: {
    fontSize: 18,
    color: '#6B46C1',
    marginBottom: 15,
    fontWeight: 'bold'
  },
  question: {
    fontSize: 12,
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#F5F3FF'
  },
  answer: {
    fontSize: 11,
    marginLeft: 10,
    color: '#4C1D95',
    fontWeight: 'bold'
  },
  watermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1
  },
  watermarkText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 60,
    opacity: 0.1,
    color: '#6B46C1'
  }
});

const WatermarkLayer = () => (
  <View style={styles.watermark}>
    <Text style={styles.watermarkText}>bilsemc2</Text>
  </View>
);

interface WordGamesPDFProps {
  story: Story;
}

export function WordGamesPDF({ story }: WordGamesPDFProps) {
  const content = decode(story.content);
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  
  const scrambleWords = sentences
    .slice(0, 2)
    .map(sentence => {
      const words = sentence.trim().split(' ');
      return words[Math.floor(Math.random() * words.length)]
        .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '');
    });

  const fillSentences = sentences
    .slice(2, 4)
    .map(sentence => {
      const words = sentence.trim().split(' ');
      const wordToRemove = words[Math.floor(Math.random() * words.length)]
        .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '');
      return {
        sentence: sentence.trim(),
        word: wordToRemove
      };
    });

  const orderSentences = sentences
    .slice(4, 6)
    .map(sentence => sentence.trim());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <WatermarkLayer />
        <View style={styles.header}>
          <Text style={styles.title}>{decode(story.title)} - Kelime Oyunları</Text>
        </View>

        <View style={styles.gameSection}>
          <Text style={styles.gameTitle}>1. Karışık Kelimeler</Text>
          {scrambleWords.map((word, index) => (
            <View key={`scramble-${index}`}>
              <Text style={styles.question}>
                Bu kelimeyi düzelt: {word.split('').sort(() => Math.random() - 0.5).join('')}
              </Text>
              <Text style={styles.answer}>Cevap: {word}</Text>
            </View>
          ))}
        </View>

        <View style={styles.gameSection}>
          <Text style={styles.gameTitle}>2. Boşluk Doldurma</Text>
          {fillSentences.map(({ sentence, word }, index) => (
            <View key={`fill-${index}`}>
              <Text style={styles.question}>
                {sentence.replace(word, '_____')}
              </Text>
              <Text style={styles.answer}>Cevap: {word}</Text>
            </View>
          ))}
        </View>

        <View style={styles.gameSection}>
          <Text style={styles.gameTitle}>3. Cümle Düzenleme</Text>
          {orderSentences.map((sentence, index) => (
            <View key={`order-${index}`}>
              <Text style={styles.question}>
                Bu cümleyi düzenle:{'\n'}
                {sentence.split(' ').sort(() => Math.random() - 0.5).join(' ')}
              </Text>
              <Text style={styles.answer}>Cevap: {sentence}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
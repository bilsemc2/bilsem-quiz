// PDF Oluşturma Bileşeni
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
    marginBottom: 20,
    fontWeight: 'bold'
  },
  content: {
    fontSize: 12,
    lineHeight: 1.5,
    textAlign: 'justify',
    marginBottom: 20
  },
  questionsSection: {
    marginTop: 20,
    pageBreak: 'before'
  },
  sectionTitle: {
    fontSize: 20,
    color: '#6B46C1',
    marginBottom: 20,
    fontWeight: 'bold'
  },
  questionTitle: {
    fontSize: 18,
    color: '#6B46C1',
    marginBottom: 15,
    fontWeight: 'bold'
  },
  question: {
    marginBottom: 15
  },
  questionText: {
    fontSize: 12,
    marginBottom: 5
  },
  option: {
    fontSize: 11,
    marginBottom: 3,
    paddingLeft: 10
  },
  answerKey: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 15
  },
  answerKeyTitle: {
    fontSize: 16,
    color: '#6B46C1',
    marginBottom: 10
  },
  answer: {
    fontSize: 11,
    marginBottom: 5
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

interface StoryPDFProps {
  story: Story;
}

export function StoryPDF({ story }: StoryPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <WatermarkLayer />
        <View style={styles.header}>
          <Text style={styles.title}>{decode(story.title)}</Text>
        </View>

        <Text style={styles.content}>{decode(story.content)}</Text>
        
        {story.theme === 'animals' && story.animalInfo && (
          <View style={{
            marginTop: 20,
            padding: 15,
            backgroundColor: '#F5F3FF',
            borderRadius: 8
          }}>
            <Text style={{
              fontSize: 14,
              color: '#6B46C1',
              fontWeight: 700,
              marginBottom: 8
            }}>
              Biliyor muydun? 🤔
            </Text>
            <Text style={{
              fontSize: 12,
              color: '#4C1D95'
            }}>
              {decode(story.animalInfo)}
            </Text>
          </View>
        )}
      </Page>
      
      <Page size="A4" style={styles.page}>
        <WatermarkLayer />
        <View style={styles.questionsSection}>
          <Text style={styles.sectionTitle}>Değerlendirme Soruları</Text>
          {story.questions?.map((question, index) => (
            <View key={index} style={styles.question}>
              <Text style={styles.questionText}>
                {index + 1}. {decode(question.text)}
              </Text>
              {question.options?.map((option, optionIndex) => (
                <Text key={optionIndex} style={styles.option}>
                  {String.fromCharCode(65 + optionIndex)}. {decode(option)}
                </Text>
              ))}
            </View>
          ))}

          <View style={styles.answerKey}>
            <Text style={styles.answerKeyTitle}>Yanıt Anahtarı</Text>
            {story.questions?.map((question, index) => (
              <Text key={index} style={styles.answer}>
                {index + 1}. {String.fromCharCode(65 + question.correctAnswer)}
              </Text>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}
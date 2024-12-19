import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

interface ClassDetails {
  id: string;
  name: string;
  grade: number;
  icon: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  grade: number;
  quizizz_codes?: {
    code: string;
    created_at: string;
  }[];
}

const ClassEnvironment: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userClass, setUserClass] = useState<ClassDetails | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (user) {
      checkUserClass();
    }
  }, [user]);

  const checkUserClass = async () => {
    try {
      if (!user) {
        console.log('No user found');
        return;
      }

      setLoading(true);
      setError(null);

      // First get the user's class
      const { data: userClassData, error: userClassError } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', user.id);

      if (userClassError) {
        console.error('User class error:', userClassError);
        throw userClassError;
      }

      if (!userClassData || userClassData.length === 0) {
        console.log('No class found for user');
        return;
      }

      const userClass = userClassData[0]; // Get first class

      // Then get the class details
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', userClass.class_id)
        .single();

      if (classError) {
        console.error('Class error:', classError);
        throw classError;
      }

      // Set class details
      const classDetails: ClassDetails = {
        id: classData.id,
        name: classData.name,
        grade: classData.grade,
        icon: classData.icon,
        created_by: classData.created_by,
        created_at: classData.created_at,
        updated_at: classData.updated_at
      };
      setUserClass(classDetails);

      // Get teacher details
      if (classData.created_by) {
        const { data: teacherData, error: teacherError } = await supabase
          .from('profiles')
          .select('id, name, email, avatar_url')
          .eq('id', classData.created_by)
          .limit(6)
          .single();

        if (teacherError) {
          console.error('Teacher error:', teacherError);
          throw teacherError;
        }

        if (teacherData) {
          setTeacher({
            id: teacherData.id,
            full_name: teacherData.name || teacherData.email.split('@')[0],
            email: teacherData.email,
            avatar_url: teacherData.avatar_url
          });
        }
      }

      // Get ALL students in the class (no single() here because we want multiple students)
      const { data: studentsData, error: studentsError } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classData.id);

      if (studentsError) {
        console.error('Students error:', studentsError);
        throw studentsError;
      }

      console.log('Students data:', studentsData);

      if (studentsData && studentsData.length > 0) {
        // Get student profiles
        const studentIds = studentsData.map(s => s.student_id);
        console.log('Student IDs:', studentIds);

        // Get profiles for all students (no single() here because we want multiple profiles)
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            name,
            email,
            avatar_url,
            grade
          `)
          .in('id', studentIds);

        console.log('Profiles data:', profilesData);

        if (profilesError) {
          console.error('Profiles error:', profilesError);
          throw profilesError;
        }

        if (profilesData) {
          // Get quizizz codes for the class
          const { data: quizizzData, error: quizizzError } = await supabase
            .from('quizizz_codes')
            .select('*')
            .eq('class_id', classData.id);

          if (quizizzError) {
            console.error('Quizizz codes error:', quizizzError);
            throw quizizzError;
          }

          // Map profiles to students with class quizizz codes
          const studentsList = profilesData.map(profile => ({
            id: profile.id,
            full_name: profile.name || profile.email.split('@')[0],
            email: profile.email,
            avatar_url: profile.avatar_url,
            grade: profile.grade || 0,
            quizizz_codes: quizizzData || []
          }));
          setStudents(studentsList);
        }
      }
    } catch (error: any) {
      console.error('Detailed error:', error);
      setError('Error fetching class information: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!userClass) {
    return (
      <Box m={2}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Henüz bir sınıfa kayıtlı değilsiniz
          </Typography>
          <Typography paragraph>
            Özel ders almak için bizimle iletişime geçebilirsiniz.
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<EmailIcon />}
              href="mailto:info@bilsem.com"
            >
              E-posta Gönder
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<WhatsAppIcon />}
              href="https://wa.me/905555555555"
              target="_blank"
            >
              WhatsApp'tan Yaz
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box m={2}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {userClass.name}
        </Typography>

        {teacher && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Öğretmen
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                src={teacher.avatar_url}
                alt={teacher.full_name}
                sx={{ width: 56, height: 56 }}
              >
                {teacher.full_name[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle1">
                  {teacher.full_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {teacher.email}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Öğrenciler ({students.length})
        </Typography>

        <List>
          {students.map((student) => (
            <ListItem key={student.id}>
              <ListItemAvatar>
                <Avatar src={student.avatar_url} alt={student.full_name}>
                  {student.full_name[0]}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={student.full_name}
                secondary={`${student.email}${
                  student.quizizz_codes && student.quizizz_codes.length > 0
                    ? `\nSon Quizizz Kodu: ${student.quizizz_codes[0].code}`
                    : ''
                }`}
                sx={{
                  '& .MuiListItemText-secondary': {
                    whiteSpace: 'pre-line'
                  }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default ClassEnvironment;

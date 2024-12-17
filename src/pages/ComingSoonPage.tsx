import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  min-height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f6f8fb 0%, #e9f0f8 100%);
`;

const Content = styled.div`
  text-align: center;
  max-width: 600px;
  padding: 3rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #2d3748;
  margin-bottom: 1rem;
  font-weight: bold;
`;

const Description = styled.p`
  font-size: 1.125rem;
  color: #4a5568;
  line-height: 1.75;
`;

const ComingSoonPage: React.FC = () => {
  return (
    <Container>
      <Content>
        <Title>Çok Yakında!</Title>
        <Description>
          Bu özellik şu anda geliştirme aşamasında. Yakında burada uzamsal zeka becerilerinizi
          geliştirebileceğiniz yeni bir aktivite ile karşınızda olacağız!
        </Description>
      </Content>
    </Container>
  );
};

export default ComingSoonPage;

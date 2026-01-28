import React, { useState } from 'react';
import { Modal, List, Card, Tag, Button, Divider, Space, Statistic } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, PlayCircleOutlined } from '@ant-design/icons';
import { Assignment } from './types';

interface AssignmentResultsModalProps {
    visible: boolean;
    assignment: Assignment | null;
    onCancel: () => void;
}

const AssignmentResultsModal: React.FC<AssignmentResultsModalProps> = ({
    visible,
    assignment,
    onCancel,
}) => {
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

    if (!assignment || !assignment.answers) return null;

    const totalQuestions = assignment.total_questions || 0;
    const score = assignment.score || 0;
    const successRate = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    return (
        <Modal
            title={<div className="text-xl font-bold">Ödev Sonuç Detayları: {assignment.title}</div>}
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={1000}
            className="results-modal"
        >
            <div className="mb-6 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                <Space size="large">
                    <Statistic
                        title="Puan"
                        value={score}
                        suffix={`/ ${totalQuestions}`}
                        valueStyle={{ color: '#3f51b5' }}
                    />
                    <Statistic
                        title="Başarı Oranı"
                        value={successRate}
                        suffix="%"
                    />
                    {assignment.duration_minutes && (
                        <Statistic title="Süre" value={assignment.duration_minutes} suffix="dk" />
                    )}
                </Space>
                <Tag color={score > totalQuestions / 2 ? 'success' : 'warning'} className="text-lg px-4 py-1">
                    {score === totalQuestions ? 'Mükemmel!' : 'Tamamlandı'}
                </Tag>
            </div>

            <Divider orientation="left">Soru Analizi</Divider>

            <List
                grid={{ gutter: 16, column: 1 }}
                dataSource={assignment.answers}
                renderItem={(answer, index) => {
                    const isCorrect = answer.isCorrect;
                    return (
                        <List.Item>
                            <Card
                                size="small"
                                className={`shadow-sm border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}
                            >
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="md:w-1/3">
                                        <div className="text-xs font-bold text-gray-400 mb-2 uppercase">Soru {index + 1}</div>
                                        <img
                                            src={answer.questionImage}
                                            alt={`Soru ${index + 1}`}
                                            className="w-full h-auto rounded-lg border border-gray-100"
                                        />
                                    </div>
                                    <div className="md:w-2/3">
                                        <div className="mb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                {isCorrect ?
                                                    <Tag icon={<CheckCircleFilled />} color="success">Doğru Cevap</Tag> :
                                                    <Tag icon={<CloseCircleFilled />} color="error">Yanlış Cevap</Tag>
                                                }
                                                {answer.isTimeout && <Tag color="warning">Süre Doldu</Tag>}
                                            </div>
                                            <div className="grid grid-cols-4 gap-2 mt-4">
                                                {answer.options?.map((opt: { id: string; imageUrl: string; isSelected?: boolean; isCorrect?: boolean }) => (
                                                    <div
                                                        key={opt.id}
                                                        className={`relative border-2 rounded p-1 ${opt.isSelected && opt.isCorrect ? 'border-green-500 bg-green-50' :
                                                            opt.isSelected && !opt.isCorrect ? 'border-red-500 bg-red-50' :
                                                                opt.isCorrect ? 'border-green-500 border-dashed' : 'border-transparent'
                                                            }`}
                                                    >
                                                        <img src={opt.imageUrl} className="w-full h-auto" />
                                                        <div className="text-center font-bold text-xs mt-1">{opt.id}</div>
                                                        {opt.isSelected && (
                                                            <div className={`absolute -top-2 -right-2 rounded-full p-1 shadow ${opt.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                                                                {opt.isCorrect ? <CheckCircleFilled className="text-white" /> : <CloseCircleFilled className="text-white" />}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {answer.explanation && (
                                            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-3">
                                                <strong>Açıklama:</strong> {answer.explanation}
                                            </div>
                                        )}

                                        {answer.videoEmbedCode && (
                                            <Button
                                                type="primary"
                                                ghost
                                                icon={<PlayCircleOutlined />}
                                                onClick={() => setSelectedVideo(answer.videoEmbedCode ?? null)}
                                            >
                                                Video Çözümü İzle
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </List.Item>
                    );
                }}
            />

            <Modal
                title="Video Çözümü"
                open={!!selectedVideo}
                onCancel={() => setSelectedVideo(null)}
                footer={null}
                width={800}
                centered
                destroyOnClose
            >
                <div className="aspect-video">
                    <iframe
                        src={`https://www.youtube.com/embed/${selectedVideo}`}
                        title="Video Çözümü"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </Modal>
        </Modal>
    );
};

export default AssignmentResultsModal;

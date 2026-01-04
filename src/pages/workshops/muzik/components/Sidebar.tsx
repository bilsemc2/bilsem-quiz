import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useProgress, TEST_ORDER } from '../contexts/ProgressContext';
import { useModal } from '../contexts/ModalContext';
import '../muzik.css';

const ResetButton: React.FC = () => {
    const { resetProgress } = useProgress();
    const { confirm } = useModal();
    const navigate = useNavigate();

    return (
        <button
            className="muzik-reset-button"
            onClick={async () => {
                const ok = await confirm({
                    title: 'İlerlemeyi Sıfırla',
                    message: 'Tüm ilerlemeniz ve sonuçlarınız silinecektir. Emin misiniz?',
                    confirmText: 'Evet, Sıfırla',
                    cancelText: 'Vazgeç'
                });

                if (ok) {
                    resetProgress();
                    navigate('/atolyeler/muzik');
                }
            }}
        >
            🔄 İlerlemeyi Sıfırla
        </button>
    );
};

const Sidebar: React.FC = () => {
    const { isTestCompleted, isTestLocked, getCompletedCount, getTotalTestCount } = useProgress();

    const completedCount = getCompletedCount();
    const totalCount = getTotalTestCount();
    const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <div className="muzik-sidebar">
            <div className="muzik-sidebar-header">
                <div className="muzik-sidebar-title-row">
                    <h2 className="muzik-sidebar-title">Müzik Atölyesi</h2>
                    <span className="muzik-progress-count">{completedCount}/{totalCount}</span>
                </div>
                <div className="muzik-sidebar-progress-container">
                    <div
                        className="muzik-sidebar-progress-fill"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            <nav className="muzik-sidebar-nav">
                {(() => {
                    let testCounter = 0;
                    return TEST_ORDER.map((test) => {
                        const isCompleted = isTestCompleted(test.id);
                        const isLocked = isTestLocked(test.id);
                        const isTest = !test.alwaysUnlocked;

                        if (isTest) testCounter++;
                        const displayIndex = isTest ? testCounter : null;

                        return (
                            <NavLink
                                key={test.id}
                                to={test.path}
                                className={({ isActive }) => `muzik-sidebar-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}
                                onClick={(e) => {
                                    if (isLocked) {
                                        e.preventDefault();
                                    }
                                }}
                            >
                                <div className="muzik-sidebar-item-icon">
                                    {isLocked ? '🔒' : test.icon}
                                </div>
                                <div className="muzik-sidebar-item-content">
                                    <div className="muzik-sidebar-item-name">{test.name}</div>
                                    {isCompleted && !test.alwaysUnlocked && (
                                        <div className="muzik-sidebar-item-badge">✓ Tamamlandı</div>
                                    )}
                                </div>
                                {displayIndex && (
                                    <div className="text-sm font-black opacity-20 font-mono">{displayIndex}</div>
                                )}
                            </NavLink>
                        );
                    });
                })()}
            </nav>

            <div className="muzik-sidebar-footer">
                <ResetButton />
            </div>
        </div>
    );
};

export default Sidebar;

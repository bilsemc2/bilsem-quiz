import { Video } from 'lucide-react';
import { MEET_CODES } from '../../constants/meetCodes';

interface MeetSectionProps {
    classId: string;
    meetingLink?: string;
}

const MeetSection = ({ classId, meetingLink }: MeetSectionProps) => {
    const handleJoinClick = (link: string) => {
        if (link.startsWith('http')) {
            window.open(link, '_blank');
        } else if (link.match(/^\d{9,11}$/)) {
            window.open(`https://zoom.us/j/${link}`, '_blank');
        } else if (link.match(/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/)) {
            window.open(`https://meet.google.com/${link}`, '_blank');
        } else {
            window.open(`https://meet.google.com/${link}`, '_blank');
        }
    };

    const meetCode = meetingLink || MEET_CODES[classId as keyof typeof MEET_CODES];
    if (!meetCode) return null;

    return (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                        <Video className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">
                            Canlı Ders Başlıyor!
                        </h2>
                        <p className="text-blue-100 mt-1 text-lg">
                            {meetingLink ? 'Toplantıya hemen katıl' : 'Google Meet ile derse hemen katıl'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => handleJoinClick(meetCode)}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-md"
                >
                    <Video className="w-5 h-5" />
                    Derse Katıl
                </button>
            </div>
        </div>
    );
};

export default MeetSection;

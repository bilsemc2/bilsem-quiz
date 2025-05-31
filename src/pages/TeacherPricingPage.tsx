import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Users, 
    Crown, 
    Star, 
    CheckCircle, 
    Zap, 
    TrendingUp, 
    Award, 
    BookOpen, 
    BarChart, 
    MessageCircle, 
    ArrowRight, 
    GraduationCap, 
    Target, 
    Gift, 
    Shield,
    Clock
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function TeacherPricingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
            <div className="py-20">
                <div className="container mx-auto px-4">
                    {/* Header Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                                <GraduationCap className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Öğretmen ve VIP
                            </span>
                            <br />
                            <span className="text-gray-800 dark:text-white">Üyelik Planları</span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                            Eğitimciler için özel hazırlanmış planlarımız ile öğrencilerinizin başarısını artırın. 
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400"> Ücretsiz başlayın</span>, öğrenci sayınız arttıkça kazanın.
                        </p>
                    </motion.div>
                    
                    {/* Ana Planlar */}
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-20"
                    >
                        <motion.div variants={itemVariants} className="transform hover:scale-105 transition-transform duration-300">
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 h-full">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                                        <Users className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Öğretmen Üyelik</h3>
                                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">Ücretsiz</p>
                                    </div>
                                </div>
                                
                                <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
                                    Öğretmenler için özel üyelik planı. Öğrencilerinizle birlikte kullanmak için ideal.
                                </p>
                                
                                <div className="space-y-4 mb-8">
                                    {[
                                        { text: 'Sınırsız sınıf oluşturma', icon: BookOpen },
                                        { text: 'Ödev oluşturma ve takip', icon: Target },
                                        { text: 'Canlı Ders oluşturma', icon: Users },
                                        { text: '2 öğrenci kadar ücretsiz', icon: Gift },
                                        { text: 'Öğretmenimize 2000 xp hediye', icon: Zap },
                                        { text: '2 öğrencisine ayrı ayrı 1000 xp hediye', icon: Star },
                                        { text: 'Ekstra öğrenciler için öğrenci başına ücret', icon: TrendingUp },
                                        { text: 'Öğrenci sayısına göre artan soru görüntüleme limiti', icon: BarChart },
                                        { text: 'Öğrenci performans raporları', icon: Award },
                                        { text: 'Öğretmen danışma hattı', icon: MessageCircle }
                                    ].map((feature, index) => {
                                        const IconComponent = feature.icon;
                                        return (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="flex items-center gap-3"
                                            >
                                                <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                    <IconComponent className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <span className="text-gray-700 dark:text-gray-300">{feature.text}</span>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                                
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => window.location.href = '/contact'}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all font-semibold text-lg shadow-lg"
                                >
                                    <Users className="w-5 h-5" />
                                    Öğretmen Kaydı Yap
                                    <ArrowRight className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </motion.div>
                        
                        <motion.div variants={itemVariants} className="transform hover:scale-105 transition-transform duration-300">
                            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl shadow-2xl p-8 border-2 border-yellow-400 relative overflow-hidden h-full">
                                {/* Popular Badge */}
                                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-bl-2xl font-bold text-sm flex items-center gap-1">
                                    <Crown className="w-4 h-4" />
                                    POPÜLER
                                </div>
                                
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                        <Crown className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">VIP Üyelik</h3>
                                        <p className="text-3xl font-bold text-yellow-300">₺7500/Ay</p>
                                    </div>
                                </div>
                                
                                <p className="text-purple-100 mb-6 text-lg">
                                    VIP üyelere özel ayrıcalıklar ve sınırsız erişim. En yüksek seviye eğitim deneyimi.
                                </p>
                                
                                <div className="space-y-4 mb-8">
                                    {[
                                        { text: '10 öğrenci kadar ücretsiz', icon: Users },
                                        { text: 'Sınırsız soru seçim hakkı', icon: CheckCircle },
                                        { text: 'Tüm sorulara erişim', icon: BookOpen },
                                        { text: 'Tüm sayfalara erişim', icon: Shield },
                                        { text: 'Özel VIP grubu', icon: Crown },
                                        { text: '7/24 öncelikli destek', icon: MessageCircle },
                                        { text: 'Özel eğitim ve danışmanlık', icon: GraduationCap },
                                        { text: 'Kişiselleştirilmiş danışmanlık', icon: Target },
                                        { text: 'Öğrenci başarı grafikleri', icon: BarChart }
                                    ].map((feature, index) => {
                                        const IconComponent = feature.icon;
                                        return (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 + 0.2 }}
                                                className="flex items-center gap-3"
                                            >
                                                <div className="p-1 bg-white/20 backdrop-blur-sm rounded-lg">
                                                    <IconComponent className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-white">{feature.text}</span>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                                
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => window.location.href = '/contact'}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white text-purple-700 hover:bg-gray-50 rounded-xl transition-all font-semibold text-lg shadow-lg"
                                >
                                    <Crown className="w-5 h-5" />
                                    VIP Üye Ol
                                    <ArrowRight className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                    
                    {/* Öğrenci Ekleme Ücretlendirme Tablosu */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-6xl mx-auto mb-20 border border-gray-200/50 dark:border-gray-700/50"
                    >
                        <div className="text-center mb-8">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                                    <BarChart className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
                                Öğrenci Ekleme Ücretlendirmesi
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
                                Öğretmen üyeliğinize eklediğiniz her öğrenci için ekstra ücretlendirme tablosu.
                                <span className="font-semibold text-green-600 dark:text-green-400"> Daha fazla öğrenci ekledikçe, öğrenci başına maliyet düşer!</span>
                            </p>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300 rounded-l-xl">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                Öğrenci Aralığı
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4" />
                                                Öğrenci Başına Ücret
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-4 h-4" />
                                                Görüntülenebilen Soru
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300 rounded-r-xl">
                                            <div className="flex items-center gap-2">
                                                <Award className="w-4 h-4" />
                                                Ek Avantajlar
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                                    {[
                                        { range: '1-2 Öğrenci', price: 'Ücretsiz', questions: '100 soru', benefits: '-', color: 'green' },
                                        { range: '3-5 Öğrenci', price: '₺1500/öğrenci', questions: '350 soru', benefits: 'İstatistik raporları', color: 'blue' },
                                        { range: '6-10 Öğrenci', price: '₺1250/öğrenci', questions: '600 soru', benefits: 'Performans analizi', color: 'indigo' },
                                        { range: '11-20 Öğrenci', price: '₺1000/öğrenci', questions: '1100 soru', benefits: 'Canlı destek', color: 'purple' },
                                        { range: '21+ Öğrenci', price: '₺1000/öğrenci', questions: 'Soru Havuzu', benefits: 'VIP danışmanlık', color: 'orange' }
                                    ].map((row, index) => (
                                        <motion.tr
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.8 + index * 0.1 }}
                                            className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-${row.color}-100 dark:bg-${row.color}-900/30 text-${row.color}-700 dark:text-${row.color}-300 font-semibold`}>
                                                    <Users className="w-4 h-4" />
                                                    {row.range}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-800 dark:text-gray-200 font-semibold text-lg">{row.price}</td>
                                            <td className="px-6 py-4 text-gray-800 dark:text-gray-200 font-medium">{row.questions}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{row.benefits}</td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.3 }}
                            className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50"
                        >
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <strong>Formül:</strong> Görüntülenebilen soru sayısı = 100 + (öğrenci sayısı × 50)
                            </p>
                        </motion.div>
                    </motion.div>
                    
                    {/* Avantajlar */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-3xl p-10 max-w-6xl mx-auto mb-20 text-white shadow-2xl relative overflow-hidden"
                    >
                        {/* Background decoration */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
                        
                        <div className="relative z-10">
                            <div className="text-center mb-12">
                                <div className="flex justify-center mb-6">
                                    <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                                        <GraduationCap className="w-12 h-12 text-white" />
                                    </div>
                                </div>
                                <h2 className="text-4xl font-bold mb-4">Öğretmen Üyeliğinin Avantajları</h2>
                                <p className="text-purple-100 text-lg max-w-2xl mx-auto">
                                    Eğitim dünyasında fark yaratmak için ihtiyacınız olan tüm araçlar burada
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    {
                                        title: 'Sınırsız İçerik Erişimi',
                                        description: 'Öğrencilerinizin ihtiyaçlarına göre özelleştirilmiş içerikler oluşturun. Öğrenci sayınız arttıkça daha fazla soruya erişim kazanın.',
                                        icon: BookOpen,
                                        gradient: 'from-blue-400 to-indigo-500'
                                    },
                                    {
                                        title: 'Gelişmiş Analitik',
                                        description: 'Öğrencilerinizin performansını detaylı olarak takip edin, güçlü ve zayıf yanlarını belirleyin, kişiselleştirilmiş çözümler sunun.',
                                        icon: BarChart,
                                        gradient: 'from-purple-400 to-pink-500'
                                    },
                                    {
                                        title: 'Artan Gelir Modeli',
                                        description: 'Öğrenci sayınızı artırdıkça, platformumuzdan gelir elde etmeye başlayın. Her yeni öğrenci sizin ve platformumuzun büyümesine katkı sağlar.',
                                        icon: TrendingUp,
                                        gradient: 'from-green-400 to-emerald-500'
                                    },
                                    {
                                        title: 'Zaman Tasarrufu',
                                        description: 'Otomatik değerlendirme ve raporlama sistemleri ile zaman kazanın, öğrencilerinize daha fazla odaklanın.',
                                        icon: Clock,
                                        gradient: 'from-orange-400 to-red-500'
                                    }
                                ].map((advantage, index) => {
                                    const IconComponent = advantage.icon;
                                    return (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 1 + index * 0.2 }}
                                            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300"
                                        >
                                            <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${advantage.gradient} mb-6`}>
                                                <IconComponent className="w-8 h-8 text-white" />
                                            </div>
                                            <h3 className="text-2xl font-bold mb-4">{advantage.title}</h3>
                                            <p className="text-purple-100 leading-relaxed">{advantage.description}</p>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>

                    {/* Call to Action */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                        className="text-center"
                    >
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl p-12 max-w-4xl mx-auto border border-gray-200/50 dark:border-gray-700/50">
                            <div className="flex justify-center mb-6">
                                <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl">
                                    <MessageCircle className="w-12 h-12 text-white" />
                                </div>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold mb-6">
                                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    Daha fazla bilgi almak
                                </span>
                                <br />
                                <span className="text-gray-800 dark:text-white">ister misiniz?</span>
                            </h2>
                            <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                                Üyelik planları hakkında detaylı bilgi için bizimle iletişime geçin.
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400"> Uzmanlarımız size yardımcı olmak için burada!</span>
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-6">
                                <Link 
                                    to="/contact"
                                    className="group inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-3xl"
                                >
                                    <MessageCircle className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                                    İletişime Geçin
                                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                                </Link>
                                <Link 
                                    to="/pricing"
                                    className="group inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-gray-700 border-3 border-indigo-500 rounded-2xl shadow-xl hover:bg-indigo-50 dark:hover:bg-gray-600 transition-all duration-300 hover:shadow-2xl"
                                >
                                    <Users className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                                    Öğrenci Planlarına Bak
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

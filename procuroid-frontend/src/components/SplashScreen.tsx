import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
    onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 3500); // splash lasts ~3.5s
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
            {/* Logo */}
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="text-4xl font-bold text-blue-600 tracking-wide mb-8"
            >
                Procuroid
            </motion.h1>

            {/* Waveform animation */}
            <div className="flex space-x-1 mb-6">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="w-1.5 h-8 bg-blue-600 rounded-full"
                        animate={{
                            scaleY: [1, 2, 1],
                        }}
                        transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.1,
                        }}
                    />
                ))}
            </div>

            {/* Tagline */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="text-gray-500 text-sm text-center px-4"
            >
                Smart Calls. Smarter Contracts. <br />
                Powered by <span className="text-blue-600 font-medium">Procuroid</span>
            </motion.p>
        </div>
    );
};

export default SplashScreen;
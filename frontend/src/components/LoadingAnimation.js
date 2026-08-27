import React from 'react';
import { Loader } from 'lucide-react';

function LoadingAnimation({ isDark }) {
  const steps = [
    'Searching social platforms...',
    'Analyzing digital footprint...',
    'Checking data breaches...',
    'Compiling intelligence report...',
    'Generating risk assessment...',
  ];

  const [currentStep, setCurrentStep] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 800);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <section className="mb-12 animate-fade-in">
      <div className={`${isDark ? 'glass' : 'bg-white border border-gray-200'} rounded-xl p-12 text-center`}>
        <div className="flex justify-center mb-6">
          <Loader className={`size-12 animate-spin ${isDark ? 'text-cyberblue-400' : 'text-blue-500'}`} />
        </div>

        <h3 className="text-2xl font-bold mb-4">Analysis In Progress</h3>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`transition-all duration-300 ${
                currentStep === index ? 'opacity-100 scale-100' : 'opacity-40 scale-95'
              }`}
            >
              <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {step}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i <= currentStep
                  ? isDark
                    ? 'bg-cyberblue-500 w-8'
                    : 'bg-blue-500 w-8'
                  : isDark
                    ? 'bg-cyberdark-700 w-2'
                    : 'bg-gray-300 w-2'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default LoadingAnimation;

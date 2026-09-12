/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/common/OnboardingTooltip.tsx
 * PART 20-1 Onboarding Tooltip on Map Screen
 * 3-step spotlight tooltip overlay with persistent completion.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Check, ChevronRight, X, Sparkles, MapPin, Compass, SlidersHorizontal } from 'lucide-react';

interface StepContent {
  title: string;
  description: string;
  badge: string;
  icon: React.ReactNode;
  positionClass: string;
}

const ONBOARDING_STEPS: StepContent[] = [
  {
    title: '모드를 먼저 선택하세요',
    description: '상단의 토글 버튼을 눌러 친구들의 여행 지도와 내 지도, 방문/위시리스트 모드를 자유롭게 전환하세요.',
    badge: '1단계 / 모드 전환',
    icon: <SlidersHorizontal className="w-5 h-5 text-[#C4A484]" />,
    positionClass: 'top-24 left-1/2 -translate-x-1/2 sm:top-28',
  },
  {
    title: '클릭해서 기록을 남겨보세요',
    description: '지도에서 방문한 국가나 국내 시·도를 클릭하면 여행 사진을 등록하고 특별한 여행 스토리를 작성할 수 있습니다.',
    badge: '2단계 / 지도 인터랙션',
    icon: <MapPin className="w-5 h-5 text-[#C4A484]" />,
    positionClass: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  },
  {
    title: '검색과 필터로 빠르게 찾기',
    description: '사이드바를 펼치거나 하단 돋보기 탭을 통해 대륙별/지역별 탐색 및 친구들의 최신 여행 앨범을 확인하세요.',
    badge: '3단계 / 사이드바 & 탐색',
    icon: <Compass className="w-5 h-5 text-[#C4A484]" />,
    positionClass: 'bottom-28 left-1/2 -translate-x-1/2 sm:bottom-24 sm:left-24 sm:translate-x-0',
  },
];

export const OnboardingTooltip: React.FC = () => {
  const { currentUser, completeOnboarding } = useApp();
  const [currentStep, setCurrentStep] = useState(0);

  // Only show if onboarding has not been seen
  if (currentUser.onboardingSeen) {
    return null;
  }

  const step = ONBOARDING_STEPS[currentStep];
  const isLast = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      completeOnboarding();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <AnimatePresence>
      <div
        id="onboarding-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="서비스 이용 가이드 온보딩"
        className="fixed inset-0 z-50 pointer-events-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      >
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 15, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.96 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`absolute ${step.positionClass} w-full max-w-sm bg-white dark:bg-[#121212] border border-zinc-200 dark:border-white/10 rounded-2xl p-5 shadow-2xl z-50 pointer-events-auto`}
        >
          {/* Header & Step Badge */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#C4A484]/15 border border-[#C4A484]/20 flex items-center justify-center">
                {step.icon}
              </span>
              <span className="text-[11px] font-bold text-[#C4A484] tracking-wide uppercase">
                {step.badge}
              </span>
            </div>
            <button
              onClick={handleSkip}
              aria-label="온보딩 건너뛰기"
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title & Description */}
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
            {step.title}
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Indicators & Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-white/5">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5" aria-label={`3단계 중 ${currentStep + 1}단계`}>
              {ONBOARDING_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStep
                      ? 'w-6 bg-[#C4A484]'
                      : 'w-1.5 bg-zinc-300 dark:bg-zinc-700'
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSkip}
                className="px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium transition-colors"
              >
                건너뛰기
              </button>
              <button
                onClick={handleNext}
                className="px-3.5 py-1.5 text-xs bg-[#C4A484] hover:bg-[#B08D6D] text-zinc-950 font-bold rounded-xl flex items-center gap-1 transition-all shadow-sm active:scale-95"
              >
                {isLast ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    시작하기
                  </>
                ) : (
                  <>
                    다음
                    <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

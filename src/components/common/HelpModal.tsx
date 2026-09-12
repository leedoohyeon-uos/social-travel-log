/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/common/HelpModal.tsx
 * PART 12 + PART 25-B Comprehensive User Guide Modal
 * Categorized manual with accessible focus control and keyboard navigation.
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  HelpCircle,
  Users,
  Heart,
  Eye,
  ShieldAlert,
  Clock,
  MapPin,
  Compass,
  Moon,
  Settings,
  AlertTriangle,
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HelpSection {
  title: string;
  icon: React.ReactNode;
  content: string[];
}

const HELP_SECTIONS: HelpSection[] = [
  {
    title: '지도 모드 & 친구 지도 (Map)',
    icon: <MapPin className="w-4 h-4 text-[#C4A484]" />,
    content: [
      '상단 세그먼트 토글로 "친구 지도"와 "내 지도"를 언제든 전환할 수 있습니다.',
      '"친구 지도"에서는 최근 활동 기간(설정에서 1일/7일/30일 선택 가능) 내 친구들의 여행 기록과 실시간 핀 위치를 확인합니다.',
      '"다녀온 곳만 보기" 옵션을 켜면 방문 기록이 있는 지역만 깔끔하게 하이라이트됩니다.',
      '세계지도(국가 단위)와 대한민국 지도(17개 시·도 단위)를 지원합니다.',
    ],
  },
  {
    title: '친구 피드 vs 돋보기 앨범 (Friend vs Search)',
    icon: <Compass className="w-4 h-4 text-[#C4A484]" />,
    content: [
      '하단의 "친구" 탭은 내가 맺은 친구들의 여행 기록만 시간순 피드로 제공하며, 낯선 사람의 글은 일절 노출되지 않습니다.',
      '하단의 "돋보기" 탭은 탐색 허브입니다. 전체 공개 여행 앨범 탐색과 친구 검색/요청을 진행할 수 있습니다.',
      '돋보기 앨범은 내가 "가고 싶다(Wish)"고 표시한 국가/지역의 스토리를 최우선으로 정렬해 보여줍니다.',
    ],
  },
  {
    title: '친구 관계 · 요청 · 차단 규칙',
    icon: <Users className="w-4 h-4 text-[#C4A484]" />,
    content: [
      '돋보기 화면 상단 또는 프로필에서 사용자를 검색해 친구 요청을 보낼 수 있습니다 (일일 최대 20건 제한).',
      '상대방이 요청을 거절하면 24시간 동안 재요청이 제한됩니다.',
      '친구를 차단하면 상호 간의 모든 친구 관계가 즉시 해제되며, 프로필/기록/댓글/지도 핀 조회가 양방향 차단됩니다.',
      '차단 해제 후에는 다시 친구 요청을 보낼 수 있습니다.',
    ],
  },
  {
    title: '좋아요 · 댓글 · 상호작용 규칙',
    icon: <Heart className="w-4 h-4 text-[#C4A484]" />,
    content: [
      '하나의 여행 기록에는 1인당 1회의 좋아요만 가능하며, 중복 좋아요는 엄격히 차단됩니다.',
      '연속 댓글 도배를 방지하기 위해 5초의 제출 쿨다운이 적용됩니다.',
      '댓글 삭제는 본인이 작성한 댓글이거나 해당 여행 기록의 게시물 작성자만 삭제할 수 있습니다.',
    ],
  },
  {
    title: '여행기록 공개 범위 & 사진 주의사항',
    icon: <Eye className="w-4 h-4 text-[#C4A484]" />,
    content: [
      '여행 기록은 전체 공개, 친구 공개, 비공개(나만 보기) 중 선택하여 발행할 수 있습니다.',
      '중요: 여행 기록을 "비공개"로 설정하더라도, 지도에 등록된 방문 대표 사진 자체는 친구 목록에 연결된 친구들에게 공개 상태를 유지할 수 있습니다.',
      '작성한 여행 기록을 삭제하더라도 지도에 등록된 국가/지역 방문 사진은 안전하게 보존됩니다.',
    ],
  },
  {
    title: 'Bubble Pop (24시간 순간 기록)',
    icon: <Clock className="w-4 h-4 text-[#C4A484]" />,
    content: [
      'Bubble Pop은 24시간 동안만 친구들에게 표시되는 순간 기록 공간입니다.',
      '작성 후 정확히 24시간이 지나면 모든 친구 피드에서 자동으로 비노출 처리됩니다.',
      '4가지 이모지(하트, 슬픔, 분노, 따봉)로 반응할 수 있으며, 1인당 1개 반응만 유지됩니다(반응 변경 또는 취소 가능).',
    ],
  },
  {
    title: '신고 및 안전 보호 조치',
    icon: <ShieldAlert className="w-4 h-4 text-[#C4A484]" />,
    content: [
      '부적절한 게시물, 사진, 댓글은 우측 상단 ⋯ 메뉴에서 신고할 수 있습니다 (일일 최대 20건).',
      '신고된 콘텐츠는 관리자 검토 큐에 등록되며, 관리자 숨김 조치 시 작성자 외 모든 타인과 피드/갤러리에서 즉시 제외됩니다.',
      '관리자에 의해 숨김 처리된 콘텐츠는 작성자가 임의로 일반 수정을 통해 다시 공개할 수 없습니다.',
    ],
  },
  {
    title: '테마 및 알림 · 설정',
    icon: <Settings className="w-4 h-4 text-[#C4A484]" />,
    content: [
      '상단 헤더의 해/달 아이콘을 클릭하여 눈이 편안한 Sophisticated Dark 다크모드와 라이트모드를 손쉽게 전환할 수 있습니다.',
      '알림 벨 아이콘에서 친구 요청, 친구 수락, 내 글의 좋아요 및 새 댓글 알림을 실시간으로 확인합니다.',
      '프로필 우측 상단의 톱니바퀴 아이콘을 누르면 기본 지도 설정, 공개 계정 여부, 반응 수 표시 여부 등을 세밀하게 제어할 수 있습니다.',
    ],
  },
];

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap & Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Social Travel Map 도움말 및 가이드"
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#121212] rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-[#121212]/95 backdrop-blur z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#C4A484]/20 border border-[#C4A484]/30 flex items-center justify-center text-[#C4A484]">
                <HelpCircle className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  도움말 & 서비스 이용 가이드
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  소셜 여행 지도의 모든 기능과 규칙을 확인하세요
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="도움말 닫기"
              className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {HELP_SECTIONS.map((sec, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/80 dark:border-white/5 space-y-2.5"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-[#E5C590]">
                  {sec.icon}
                  <span>{sec.title}</span>
                </div>
                <ul className="space-y-1.5 pl-6 list-disc text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {sec.content.map((item, cIdx) => (
                    <li key={cIdx} className="marker:text-[#C4A484]">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-100 dark:border-white/10 bg-zinc-50 dark:bg-[#0c0c0c] flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">
              추가 문의나 제안은 언제든 설정 메뉴에서 확인하실 수 있습니다.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#C4A484] hover:bg-[#B08D6D] text-zinc-950 font-bold text-xs transition-colors shadow-sm active:scale-95"
            >
              확인 완료
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

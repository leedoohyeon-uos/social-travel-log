/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/social/AdminReportModal.tsx
 * Admin Report Monitoring Queue & PART 18-2 Trial Account Instant Reset
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldAlert,
  CheckCircle,
  EyeOff,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Trash2,
} from 'lucide-react';

interface AdminReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminReportModal: React.FC<AdminReportModalProps> = ({ isOpen, onClose }) => {
  const { reports, updateReportStatus, resetTrialAccount } = useApp();
  const [activeTab, setActiveTab] = useState<'reports' | 'trialReset'>('reports');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const handleExecuteReset = async () => {
    setIsResetting(true);
    try {
      await new Promise((res) => setTimeout(res, 600));
      await resetTrialAccount();
      setIsResetConfirmOpen(false);
      onClose();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="관리자 신고 및 체험계정 관리 센터"
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#121212] rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#121212]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500 dark:text-[#E5C590]" />
              <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 font-serif">
                시스템 관리자 센터 (Admin Hub)
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center border-b border-zinc-100 dark:border-white/10 px-4 pt-2 bg-zinc-50/50 dark:bg-[#0c0c0c]/50">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'reports'
                  ? 'border-[#C4A484] text-[#C4A484]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              신고 모니터링 큐 ({reports.filter((r) => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('trialReset')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'trialReset'
                  ? 'border-rose-500 text-rose-500'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              체험 계정 초기화 (18-2)
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeTab === 'reports' ? (
              reports.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-12">
                  접수된 신고 내역이 없습니다.
                </p>
              ) : (
                reports.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/80 dark:border-white/5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
                          {r.targetType}
                        </span>
                        <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                          사유: {r.reason}
                        </span>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        r.status === 'pending'
                          ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                          : r.status === 'reviewed'
                          ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {r.status === 'pending' ? '대기 중' : r.status === 'reviewed' ? '조치 완료' : '기각됨'}
                      </span>
                    </div>

                    {r.reasonDetail && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 bg-white dark:bg-[#121212] p-2.5 rounded-xl border border-zinc-100 dark:border-white/5">
                        상세 사유: {r.reasonDetail}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400">
                      <span>대상: {r.targetPath}</span>

                      {r.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateReportStatus(r.id, 'dismissed')}
                            className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-300 dark:hover:bg-white/15 transition-colors"
                          >
                            기각
                          </button>
                          <button
                            onClick={() => updateReportStatus(r.id, 'reviewed', true)}
                            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            콘텐츠 숨김 & 조치 완료
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )
            ) : (
              /* PART 18-2 Trial Account Instant Reset Tab */
              <div className="p-4 sm:p-6 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/80 dark:border-white/5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      체험 계정 즉시 초기화 (PART 18-2)
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      체험 계정의 모든 상태를 최초 스냅샷(trialBaseline)으로 되돌립니다.
                      단순히 하위 문서만 복원하는 것에 그치지 않고, 상위 탑레벨 컬렉션(friendRequests, friendships)의
                      유령 관계 문서까지 완벽히 정리하여 다른 사용자 화면에 유령 친구가 남지 않도록 보장합니다.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs leading-relaxed space-y-1">
                  <p className="font-bold">⚠️ 주의 사항:</p>
                  <p>• 생성했던 모든 여행 기록, 댓글, 좋아요 및 Bubble Pop이 초기 시점으로 리셋됩니다.</p>
                  <p>• 타인에게 보낸 친구 요청이나 승인된 친구 관계가 초기 스냅샷 상태로 롤백됩니다.</p>
                </div>

                <button
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
                >
                  <RotateCcw className="w-4 h-4" />
                  체험 계정 초기 스냅샷으로 되돌리기
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Confirmation Modal */}
        {isResetConfirmOpen && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-white dark:bg-[#18181b] border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-2.5 text-rose-500">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  체험 계정을 초기화하시겠습니까?
                </h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                초기 스냅샷 상태로 즉시 되돌아갑니다. 세션 동안 생성된 모든 테스트 데이터와
                탑레벨 친구 요청 내역이 정리됩니다. 계속하시겠습니까?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  disabled={isResetting}
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                >
                  취소
                </button>
                <button
                  disabled={isResetting}
                  onClick={handleExecuteReset}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      초기화 중...
                    </>
                  ) : (
                    '확인 및 초기화'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};

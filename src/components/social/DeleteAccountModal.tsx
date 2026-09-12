/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

export const DeleteAccountModal: React.FC = () => {
  const {
    isDeleteAccountModalOpen,
    setIsDeleteAccountModalOpen,
    deleteAccount,
    showToast,
  } = useApp();

  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');

  if (!isDeleteAccountModalOpen) return null;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText !== '탈퇴확인') {
      showToast("'탈퇴확인'을 정확히 입력해주세요.", 'warning');
      return;
    }
    if (!password.trim()) {
      showToast('비밀번호를 입력해주세요.', 'warning');
      return;
    }

    const success = await deleteAccount(password);
    if (success) {
      setIsDeleteAccountModalOpen(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                회원 탈퇴
              </h3>
            </div>
            <button
              onClick={() => setIsDeleteAccountModalOpen(false)}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 space-y-1">
            <p className="font-bold">⚠️ 탈퇴 시 주의사항</p>
            <p className="text-[11px] leading-relaxed">
              탈퇴 시 작성한 모든 여행 기록, 추억 사진, 북마크, 친구 관계 데이터가 즉시 영구 삭제되며 복구할 수 없습니다.
            </p>
          </div>

          <form onSubmit={handleDelete} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                확인을 위해 <strong className="text-rose-600">탈퇴확인</strong>을 입력하세요
              </label>
              <input
                type="text"
                required
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="탈퇴확인"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                현재 계정 비밀번호
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteAccountModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                영구 탈퇴
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

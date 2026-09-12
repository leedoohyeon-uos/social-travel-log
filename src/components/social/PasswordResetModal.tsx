/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Key, Send, Clock, CheckCircle2 } from 'lucide-react';

export const PasswordResetModal: React.FC = () => {
  const {
    isPasswordResetModalOpen,
    setIsPasswordResetModalOpen,
    currentUser,
    passwordResetCooldownSeconds,
    requestPasswordReset,
  } = useApp();

  const [email, setEmail] = useState(currentUser.email);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setEmail(currentUser.email);
  }, [currentUser.email]);

  if (!isPasswordResetModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = requestPasswordReset(email.trim());
    if (success) {
      setSubmitted(true);
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
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                비밀번호 재설정
              </h3>
            </div>
            <button
              onClick={() => {
                setIsPasswordResetModalOpen(false);
                setSubmitted(false);
              }}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {submitted ? (
            <div className="py-4 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                비밀번호 재설정 링크가 이메일(<strong>{email}</strong>)로 발송되었습니다. 메일함을 확인해주세요.
              </p>
              <p className="text-[11px] text-zinc-400">
                (보안을 위해 60초 후 다시 요청하실 수 있습니다.)
              </p>
              <button
                onClick={() => {
                  setIsPasswordResetModalOpen(false);
                  setSubmitted(false);
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm"
              >
                닫기
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                가입하신 이메일 주소를 입력하시면 비밀번호를 안전하게 재설정할 수 있는 링크를 전송해 드립니다.
              </p>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  이메일 주소
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordResetModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={passwordResetCooldownSeconds > 0}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {passwordResetCooldownSeconds > 0 ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      {passwordResetCooldownSeconds}초 대기
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      링크 전송
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

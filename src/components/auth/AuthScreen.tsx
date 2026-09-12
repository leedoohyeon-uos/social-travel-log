/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/auth/AuthScreen.tsx
 * Clean, modern authentication and trial entry screen.
 * Strictly separates Real Firebase Users from Demo/Trial users.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Compass, Sparkles, LogIn, UserPlus, ArrowRight, ShieldCheck, Mail, Lock, User, Info } from 'lucide-react';
import { getFirebaseAuthErrorMessage } from '../../utils/firebaseErrors';

export const AuthScreen: React.FC = () => {
  const { loginWithFirebase, signupWithFirebase, enterDemoMode, requestPasswordReset, showToast } = useApp();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setErrorMsg('이름(닉네임)을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const res = await loginWithFirebase(trimmedEmail, password);
        if (!res.success) {
          setErrorMsg(res.error || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
        }
      } else {
        const res = await signupWithFirebase(trimmedEmail, password, name.trim());
        if (!res.success) {
          setErrorMsg(res.error || '회원가입에 실패했습니다. 이미 사용 중인 이메일인지 확인해주세요.');
        } else {
          showToast('회원가입이 완료되었습니다! 환영합니다.', 'success');
        }
      }
    } catch (err: any) {
      const errInfo = getFirebaseAuthErrorMessage(err);
      setErrorMsg(errInfo.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoMode = () => {
    enterDemoMode();
    showToast('체험하기 모드로 시작합니다. 샘플 데이터로 둘러보실 수 있습니다.', 'info');
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      showToast('이메일 주소를 입력해주세요.', 'warning');
      return;
    }
    const success = await requestPasswordReset(forgotEmail.trim());
    if (success) {
      setShowForgotModal(false);
      setForgotEmail('');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-b from-zinc-50 via-indigo-50/30 to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 shadow-xl overflow-hidden p-6 sm:p-8 relative">
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/25 mx-auto">
            <Compass className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              Travel Log
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              국내외 지도에 새기는 나만의 여행 발자국과 스토리
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl mb-3">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            로그인
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'signup'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            회원가입
          </button>
        </div>

        {/* Informative Guidance */}
        <div className="mb-5 text-center">
          {mode === 'login' ? (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              처음 방문하셨다면 상단의 <strong className="text-indigo-600 dark:text-indigo-400">[회원가입]</strong> 탭에서 계정을 먼저 생성해 주세요.
            </p>
          ) : (
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              이메일과 비밀번호로 간편하게 가입하고 지도를 기록해 보세요.
            </p>
          )}
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-medium text-left space-y-2">
            <p className="leading-relaxed">{errorMsg}</p>
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  if (!name && email) {
                    setName(email.split('@')[0]);
                  }
                }}
                className="w-full mt-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>이 이메일로 바로 회원가입하기</span>
              </button>
            )}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                이름 (닉네임)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800/80 border-none rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              이메일 주소
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800/80 border-none rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                비밀번호
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  비밀번호 찾기
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상 입력"
                className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800/80 border-none rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? '로그인하기' : '회원가입 완료'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-400 font-semibold">
              또는
            </span>
          </div>
        </div>

        {/* Demo / Experience Mode Button (Goal 2) */}
        <button
          type="button"
          onClick={handleDemoMode}
          className="w-full py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-all flex items-center justify-center gap-2 border border-zinc-200/60 dark:border-zinc-700/60 group"
        >
          <Sparkles className="w-4 h-4 text-amber-500 group-hover:rotate-12 transition-transform" />
          <span>체험하기 (로그인 없이 둘러보기)</span>
        </button>

        {/* Notice Info */}
        <div className="mt-5 text-center">
          <p className="text-[11px] text-zinc-400 leading-relaxed flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 inline shrink-0" />
            <span>실제 로그인 시 내 기록과 지도가 안전하게 저장됩니다.</span>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              비밀번호 재설정
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              가입 시 입력했던 이메일 주소를 입력하시면 재설정 링크를 보내드립니다.
            </p>
            <form onSubmit={handlePasswordReset} className="space-y-3">
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="이메일 주소 입력"
                className="w-full text-xs px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                >
                  재설정 링크 받기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

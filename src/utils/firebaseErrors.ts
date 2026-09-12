/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/utils/firebaseErrors.ts
 * Friendly Korean translation and guidance for Firebase Authentication & Firestore errors.
 */

export function getFirebaseAuthErrorMessage(error: any): { message: string; isInvalidCredential?: boolean } {
  if (!error) {
    return { message: '인증 처리 중 오류가 발생했습니다.' };
  }

  const code = typeof error === 'string' ? error : (error.code || error.message || '');
  const rawMsg = typeof error === 'string' ? error : (error.message || '');

  if (code.includes('auth/invalid-credential') || rawMsg.includes('auth/invalid-credential')) {
    return {
      message: '이메일 또는 비밀번호가 일치하지 않거나 아직 가입되지 않은 계정입니다. 처음 방문하셨다면 [회원가입]을 먼저 진행해 주세요.',
      isInvalidCredential: true,
    };
  }

  if (code.includes('auth/user-not-found') || rawMsg.includes('auth/user-not-found')) {
    return {
      message: '가입되지 않은 이메일 주소입니다. 상단의 [회원가입] 탭에서 먼저 가입을 진행해 주세요.',
      isInvalidCredential: true,
    };
  }

  if (code.includes('auth/wrong-password') || rawMsg.includes('auth/wrong-password')) {
    return {
      message: '비밀번호가 올바르지 않습니다. 다시 확인해 주세요.',
    };
  }

  if (code.includes('auth/email-already-in-use') || rawMsg.includes('auth/email-already-in-use')) {
    return {
      message: '이미 가입된 이메일 주소입니다. [로그인] 탭으로 이동하여 로그인해 주세요.',
    };
  }

  if (code.includes('auth/weak-password') || rawMsg.includes('auth/weak-password')) {
    return {
      message: '비밀번호는 최소 6자 이상으로 설정해야 합니다.',
    };
  }

  if (code.includes('auth/invalid-email') || rawMsg.includes('auth/invalid-email')) {
    return {
      message: '유효하지 않은 이메일 형식입니다. 이메일 주소를 다시 확인해 주세요.',
    };
  }

  if (code.includes('auth/too-many-requests') || rawMsg.includes('auth/too-many-requests')) {
    return {
      message: '보안을 위해 연속된 로그인 시도가 일시적으로 차단되었습니다. 잠시 후 다시 시도해 주세요.',
    };
  }

  if (code.includes('auth/network-request-failed') || rawMsg.includes('auth/network-request-failed')) {
    return {
      message: '네트워크 연결이 원활하지 않습니다. 인터넷 연결을 확인해 주세요.',
    };
  }

  if (code.includes('auth/operation-not-allowed') || rawMsg.includes('auth/operation-not-allowed')) {
    return {
      message: '이메일/비밀번호 로그인이 활성화되지 않았습니다. 관리자에게 문의해 주세요.',
    };
  }

  return {
    message: rawMsg || '인증 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  };
}

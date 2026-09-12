/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MapPin,
  Calendar,
  Users,
  Flag,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Plane,
  Send,
} from 'lucide-react';
import { TravelRecord } from '../../types';

interface TravelRecordDetailModalProps {
  record: TravelRecord | null;
  onClose: () => void;
}

export const TravelRecordDetailModal: React.FC<TravelRecordDetailModalProps> = ({
  record,
  onClose,
}) => {
  const {
    currentUser,
    publicProfiles,
    toggleLikeRecord,
    isBookmarked,
    toggleBookmark,
    deleteTravelRecord,
    setActiveRecordEditing,
    setIsRecordComposerOpen,
    addCommentToRecord,
    deleteComment,
    createReport,
    onPlanTripTogether,
    setSelectedUserProfileUid,
    showToast,
  } = useApp();

  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<'inappropriate' | 'spam' | 'other'>('inappropriate');
  const [reportDetail, setReportDetail] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  if (!record) return null;

  const isAuthor = record.authorUid === currentUser.uid;
  const isLiked = !!record.likes?.[currentUser.uid];
  const bookmarked = isBookmarked(record.id);
  const authorProfile = publicProfiles[record.authorUid];
  const likeVisible = isAuthor || (authorProfile ? authorProfile.likeCountVisible : true);
  const photos = record.photoURLs || [];

  const handleNextPhoto = () => {
    setCurrentPhotoIdx((prev) => (prev + 1) % photos.length);
  };
  const handlePrevPhoto = () => {
    setCurrentPhotoIdx((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    setIsSubmittingComment(true);
    const success = await addCommentToRecord(record.id, commentInput.trim());
    setIsSubmittingComment(false);
    if (success) {
      setCommentInput('');
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createReport('record', record.id, reportReason, reportDetail.trim());
    if (res.success) {
      setIsReportOpen(false);
      setReportDetail('');
    } else if (res.error) {
      showToast(res.error, 'error');
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('여행 기록 링크가 클립보드에 복사되었습니다 🔗', 'success');
    }
  };

  const handleStartEdit = () => {
    setActiveRecordEditing(record);
    setIsRecordComposerOpen(true);
    onClose();
  };

  const handleConfirmDelete = () => {
    deleteTravelRecord(record.id);
    setIsDeleteConfirmOpen(false);
    onClose();
  };

  // Sort comments DESC by creation time
  const sortedComments = [...(record.comments || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div
              onClick={() => {
                if (record.authorUid !== currentUser.uid) {
                  setSelectedUserProfileUid(record.authorUid);
                }
              }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              {record.authorPhotoURL ? (
                <img
                  src={record.authorPhotoURL}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 font-bold flex items-center justify-center text-sm">
                  {record.authorName[0]}
                </div>
              )}
              <div>
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600">
                  {record.authorName}
                </span>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <Calendar className="w-3 h-3" />
                  <span>{record.visitDate}</span>
                  <span>•</span>
                  <MapPin className="w-3 h-3 text-indigo-500" />
                  <span>{record.countryName || record.cityName || '여행지'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {(isAuthor || currentUser.role === 'admin') && (
                <>
                  <button
                    onClick={handleStartEdit}
                    className="p-2 text-zinc-400 hover:text-indigo-600 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="기록 수정"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="p-2 text-zinc-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="기록 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}

              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Delete Confirmation Drawer */}
          {isDeleteConfirmOpen && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/40 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                정말로 이 여행 기록을 삭제하시겠습니까? (복구할 수 없습니다)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold text-xs"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
                >
                  삭제 확인
                </button>
              </div>
            </div>
          )}

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto">
            {/* Photo Carousel */}
            {photos.length > 0 && (
              <div className="relative aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden">
                <img
                  src={photos[currentPhotoIdx]}
                  alt=""
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />

                {photos.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevPhoto}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextPhoto}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-white text-[11px] font-bold">
                      {currentPhotoIdx + 1} / {photos.length}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Content Details */}
            <div className="p-5 space-y-4">
              {/* Title & Description */}
              <div className="space-y-2">
                <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 leading-snug">
                  {record.title}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {record.description}
                </p>
              </div>

              {/* Companion Badges */}
              {record.companionNames && record.companionNames.length > 0 && (
                <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>{record.companionNames.join(', ')}님과 함께한 여행</span>
                  </div>
                  {!isAuthor && (
                    <button
                      onClick={() => onPlanTripTogether(record.authorUid, record.id)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs hover:bg-indigo-700"
                    >
                      <Plane className="w-3.5 h-3.5" />
                      함께 계획하기
                    </button>
                  )}
                </div>
              )}

              {/* Tags */}
              {record.tags && record.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {record.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Bar */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleLikeRecord(record.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                      isLiked ? 'text-rose-500' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500' : ''}`} />
                    <span>{likeVisible ? record.likeCount : '여러 개'}</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                    <MessageCircle className="w-5 h-5" />
                    <span>{record.commentCount}개</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleBookmark(record.id)}
                    className={`p-2 rounded-xl transition-colors ${
                      bookmarked
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                        : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                    title="북마크"
                  >
                    <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-amber-500' : ''}`} />
                  </button>

                  <button
                    onClick={handleShare}
                    className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="공유"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  {!isAuthor && (
                    <button
                      onClick={() => setIsReportOpen(true)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="신고"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  댓글 ({record.commentCount})
                </h3>

                {/* Comment Input Composer (with 5-second cooldown notice) */}
                <form onSubmit={handleCommentSubmit} className="flex gap-2">
                  <input
                    type="text"
                    required
                    maxLength={500}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="따뜻한 댓글을 남겨보세요 (최대 500자)"
                    className="flex-1 text-xs px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-indigo-500 focus:outline-none text-zinc-800 dark:text-zinc-100"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !commentInput.trim()}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm transition-all shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    등록
                  </button>
                </form>

                {/* Comments List */}
                <div className="space-y-3">
                  {sortedComments.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-4">첫 댓글을 남겨보세요!</p>
                  ) : (
                    sortedComments.map((comment) => {
                      const canDeleteComment =
                        comment.authorUid === currentUser.uid || isAuthor || currentUser.role === 'admin';

                      return (
                        <div
                          key={comment.id}
                          className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            {comment.authorPhotoURL ? (
                              <img
                                src={comment.authorPhotoURL}
                                alt=""
                                className="w-7 h-7 rounded-full object-cover border border-zinc-200 shrink-0 mt-0.5"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-600 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                {comment.authorName[0]}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                                  {comment.authorName}
                                </span>
                                {comment.authorUid === record.authorUid && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-600">
                                    작성자
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 whitespace-pre-wrap leading-relaxed">
                                {comment.content}
                              </p>
                            </div>
                          </div>

                          {canDeleteComment && (
                            <button
                              onClick={() => deleteComment(record.id, comment.id)}
                              className="p-1 text-zinc-400 hover:text-rose-500 rounded transition-colors shrink-0"
                              title="댓글 삭제"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Report Submodal */}
        {isReportOpen && (
          <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                게시물 신고
              </h3>
              <p className="text-xs text-zinc-500">신고 사유를 선택해주세요.</p>

              <form onSubmit={handleReportSubmit} className="space-y-3">
                <div className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 cursor-pointer">
                    <input
                      type="radio"
                      name="reason"
                      value="inappropriate"
                      checked={reportReason === 'inappropriate'}
                      onChange={() => setReportReason('inappropriate')}
                    />
                    <span>부적절하거나 유해한 콘텐츠</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 cursor-pointer">
                    <input
                      type="radio"
                      name="reason"
                      value="spam"
                      checked={reportReason === 'spam'}
                      onChange={() => setReportReason('spam')}
                    />
                    <span>스팸 또는 상업적 홍보</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 cursor-pointer">
                    <input
                      type="radio"
                      name="reason"
                      value="other"
                      checked={reportReason === 'other'}
                      onChange={() => setReportReason('other')}
                    />
                    <span>기타 사유</span>
                  </label>
                </div>

                <textarea
                  rows={2}
                  value={reportDetail}
                  onChange={(e) => setReportDetail(e.target.value)}
                  placeholder="상세 사유를 적어주세요 (선택)"
                  className="w-full text-xs p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    신고 접수
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};

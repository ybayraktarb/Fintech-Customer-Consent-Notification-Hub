import React from 'react';
import { FeedbackState } from '../../hooks/useCustomerApproval';
import { PROCESS_CODES } from '../../constants/processCodes';

interface FeedbackBannerProps {
  feedback: FeedbackState | null;
}

export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({ feedback }) => {
  if (!feedback) {
    return null;
  }

  const getStyleClass = () => {
    switch (feedback.islemKodu) {
      case PROCESS_CODES.APPROVED_DIGITAL:
      case PROCESS_CODES.APPROVED_BRANCH_CALL:
        return 'feedback-box-success';
      case PROCESS_CODES.REJECTED_NO_CONSENT:
      case PROCESS_CODES.RESTRICTED_STAFF:
        return 'feedback-box-warning';
      default:
        return 'feedback-box-default';
    }
  };

  return (
    <div className={`feedback-container ${getStyleClass()}`}>
      <span className="feedback-label">İşlem Sonucu:</span>
      <span className="feedback-text-bold">{feedback.islemAck}</span>
    </div>
  );
};

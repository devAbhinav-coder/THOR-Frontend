export interface ReviewEligibility {
  canReview: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
  orderId: string | null;
}

export interface ReviewFormState {
  rating: number;
  title: string;
  comment: string;
}

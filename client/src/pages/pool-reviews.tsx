import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, TrendingUp, User } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PoolReview {
  id: string;
  poolId: string;
  userId: string;
  rating: number;
  title: string;
  content: string;
  pros: string;
  cons: string;
  recommendationLevel: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  votes: Array<{
    id: string;
    userId: string;
    voteType: string;
  }>;
}

interface PoolRating {
  averageRating: number;
  totalReviews: number;
}

export default function PoolReviews() {
  const [poolId, setPoolId] = useState('');
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [userId] = useState('demo-user-123'); // In real app, get from auth context
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    title: '',
    content: '',
    pros: '',
    cons: '',
    recommendationLevel: 'neutral'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['/api/pools', selectedPoolId, 'reviews'],
    enabled: !!selectedPoolId,
    queryFn: () => apiRequest(`/api/pools/${selectedPoolId}/reviews`)
  });

  const { data: rating, isLoading: ratingLoading } = useQuery({
    queryKey: ['/api/pools', selectedPoolId, 'rating'],
    enabled: !!selectedPoolId,
    queryFn: () => apiRequest(`/api/pools/${selectedPoolId}/rating`)
  });

  const createReviewMutation = useMutation({
    mutationFn: (reviewData: any) => apiRequest(`/api/pools/${selectedPoolId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ ...reviewData, userId }),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pools', selectedPoolId, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pools', selectedPoolId, 'rating'] });
      setIsWritingReview(false);
      setNewReview({
        rating: 0,
        title: '',
        content: '',
        pros: '',
        cons: '',
        recommendationLevel: 'neutral'
      });
      toast({
        title: "Review Created",
        description: "Your review has been published successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create review. Please try again.",
        variant: "destructive"
      });
    }
  });

  const voteOnReviewMutation = useMutation({
    mutationFn: ({ reviewId, voteType }: { reviewId: string; voteType: string }) =>
      apiRequest(`/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ userId, voteType }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pools', selectedPoolId, 'reviews'] });
      toast({
        title: "Vote Recorded",
        description: "Thank you for your feedback!"
      });
    }
  });

  const handleLoadReviews = () => {
    if (poolId.trim()) {
      setSelectedPoolId(poolId.trim());
    }
  };

  const handleCreateReview = () => {
    if (!newReview.rating || !newReview.title || !newReview.content) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    createReviewMutation.mutate(newReview);
  };

  const renderStars = (rating: number, size: string = "h-4 w-4") => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600'
        }`}
      />
    ));
  };

  const renderSelectableStars = (currentRating: number, onRatingChange: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => onRatingChange(i + 1)}
        className="focus:outline-none"
        data-testid={`star-${i + 1}`}
      >
        <Star
          className={`h-6 w-6 ${
            i < currentRating
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600 hover:fill-yellow-200'
          }`}
        />
      </button>
    ));
  };

  const getRecommendationColor = (level: string) => {
    switch (level) {
      case 'highly_recommended':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'recommended':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'neutral':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'not_recommended':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Pool Reviews & Ratings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Community insights and ratings for yield pools
          </p>
        </div>
      </div>

      {/* Pool Selection */}
      <Card>
        <CardHeader>
          <CardTitle>View Pool Reviews</CardTitle>
          <CardDescription>
            Enter a pool ID to view community reviews and ratings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="poolId">Pool ID</Label>
              <Input
                id="poolId"
                data-testid="input-pool-id"
                value={poolId}
                onChange={(e) => setPoolId(e.target.value)}
                placeholder="Enter pool ID to view reviews..."
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleLoadReviews}
              data-testid="button-load-reviews"
              disabled={!poolId.trim()}
            >
              Load Reviews
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedPoolId && (
        <>
          {/* Pool Rating Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Pool Rating Summary</span>
                <Button
                  onClick={() => setIsWritingReview(true)}
                  data-testid="button-write-review"
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Write Review
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ratingLoading ? (
                <div className="text-center py-4">Loading rating...</div>
              ) : rating && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{rating.averageRating.toFixed(1)}</div>
                    <div className="flex justify-center mb-2">
                      {renderStars(Math.round(rating.averageRating), "h-5 w-5")}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Average Rating
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{rating.totalReviews}</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Total Reviews
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Write Review Form */}
          {isWritingReview && (
            <Card>
              <CardHeader>
                <CardTitle>Write a Review</CardTitle>
                <CardDescription>
                  Share your experience with this yield pool
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Rating *</Label>
                  <div className="flex gap-1 mt-1">
                    {renderSelectableStars(newReview.rating, (rating) =>
                      setNewReview({ ...newReview, rating })
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="title">Review Title *</Label>
                  <Input
                    id="title"
                    data-testid="input-review-title"
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    placeholder="Summarize your experience"
                  />
                </div>

                <div>
                  <Label htmlFor="content">Review Content *</Label>
                  <Textarea
                    id="content"
                    data-testid="textarea-review-content"
                    value={newReview.content}
                    onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                    placeholder="Share your detailed experience with this pool"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pros">Pros</Label>
                    <Textarea
                      id="pros"
                      data-testid="textarea-review-pros"
                      value={newReview.pros}
                      onChange={(e) => setNewReview({ ...newReview, pros: e.target.value })}
                      placeholder="What are the advantages?"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cons">Cons</Label>
                    <Textarea
                      id="cons"
                      data-testid="textarea-review-cons"
                      value={newReview.cons}
                      onChange={(e) => setNewReview({ ...newReview, cons: e.target.value })}
                      placeholder="What are the disadvantages?"
                      rows={3}
                    />
                  </div>
                </div>

                <div>
                  <Label>Recommendation Level</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                    {[
                      { value: 'highly_recommended', label: 'Highly Recommended' },
                      { value: 'recommended', label: 'Recommended' },
                      { value: 'neutral', label: 'Neutral' },
                      { value: 'not_recommended', label: 'Not Recommended' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, recommendationLevel: option.value })}
                        className={`p-2 text-sm rounded border ${
                          newReview.recommendationLevel === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        data-testid={`button-recommendation-${option.value}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateReview}
                    data-testid="button-submit-review"
                    disabled={createReviewMutation.isPending}
                  >
                    {createReviewMutation.isPending ? 'Publishing...' : 'Publish Review'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsWritingReview(false)}
                    data-testid="button-cancel-review"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews List */}
          <Card>
            <CardHeader>
              <CardTitle>Community Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <div className="text-center py-8">Loading reviews...</div>
              ) : reviews?.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review: PoolReview) => (
                    <div key={review.id} className="border rounded-lg p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{review.user.username}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <Badge
                            variant="secondary"
                            className={getRecommendationColor(review.recommendationLevel)}
                          >
                            {review.recommendationLevel.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium text-lg mb-2">{review.title}</h3>
                        <p className="text-gray-700 dark:text-gray-300">{review.content}</p>
                      </div>

                      {(review.pros || review.cons) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {review.pros && (
                            <div>
                              <h4 className="font-medium text-green-600 mb-1">Pros</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{review.pros}</p>
                            </div>
                          )}
                          {review.cons && (
                            <div>
                              <h4 className="font-medium text-red-600 mb-1">Cons</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{review.cons}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <Separator />

                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => voteOnReviewMutation.mutate({
                            reviewId: review.id,
                            voteType: 'upvote'
                          })}
                          data-testid={`button-upvote-${review.id}`}
                          className="flex items-center gap-1"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          {review.upvotes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => voteOnReviewMutation.mutate({
                            reviewId: review.id,
                            voteType: 'downvote'
                          })}
                          data-testid={`button-downvote-${review.id}`}
                          className="flex items-center gap-1"
                        >
                          <ThumbsDown className="h-4 w-4" />
                          {review.downvotes}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No reviews yet. Be the first to share your experience!
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
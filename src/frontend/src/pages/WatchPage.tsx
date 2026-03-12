import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  MessageCircle,
  ThumbsUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useAddComment,
  useGetComments,
  useGetVideo,
  useIncrementViewCount,
  useLikeVideo,
} from "../hooks/useQueries";
import { formatCount, timeAgo } from "../utils/time";

export function WatchPage() {
  const { id } = useParams({ from: "/watch/$id" });
  const videoId = BigInt(id);

  const { data: videoTuple, isLoading, isError } = useGetVideo(videoId);
  const { data: comments, isLoading: commentsLoading } =
    useGetComments(videoId);
  const likeMutation = useLikeVideo();
  const incrementView = useIncrementViewCount();
  const addComment = useAddComment();

  const [descExpanded, setDescExpanded] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);
  const viewCounted = useRef(false);
  const incrementViewRef = useRef(incrementView.mutate);
  const videoIdRef = useRef(videoId);

  useEffect(() => {
    if (!viewCounted.current) {
      viewCounted.current = true;
      incrementViewRef.current(videoIdRef.current);
    }
  }, []);

  useEffect(() => {
    if (!videoTuple) return;
    const [video] = videoTuple;
    let objectUrl = "";

    setVideoLoading(true);
    video.videoBlob
      .getBytes()
      .then((bytes: Uint8Array) => {
        // Try mp4 first
        const blob = new Blob([bytes.buffer as ArrayBuffer], {
          type: "video/mp4",
        });
        objectUrl = URL.createObjectURL(blob);
        setVideoUrl(objectUrl);
      })
      .catch(() => {
        // Fallback: create blob without explicit type
        try {
          const blob = new Blob([new Uint8Array(0)]);
          objectUrl = URL.createObjectURL(blob);
          setVideoUrl(objectUrl);
        } catch {
          setVideoUrl("");
        }
      })
      .finally(() => {
        setVideoLoading(false);
      });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [videoTuple]);

  const handleVideoError = () => {
    if (!videoTuple) return;
    const [video] = videoTuple;
    // Retry with webm mime type
    video.videoBlob
      .getBytes()
      .then((bytes: Uint8Array) => {
        const blob = new Blob([bytes.buffer as ArrayBuffer], {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
      })
      .catch(() => {
        // silent — keep existing url
      });
  };

  const handleLike = () => {
    likeMutation.mutate(videoId, {
      onSuccess: () => toast.success("Liked!"),
      onError: () => toast.error("Could not like video"),
    });
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !commentText.trim()) {
      toast.error("Please fill in both fields");
      return;
    }
    addComment.mutate(
      { videoId, authorName: authorName.trim(), content: commentText.trim() },
      {
        onSuccess: () => {
          setCommentText("");
          toast.success("Comment added!");
        },
        onError: () => toast.error("Could not add comment"),
      },
    );
  };

  if (isLoading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Skeleton className="aspect-video w-full rounded-xl mb-6" />
        <Skeleton className="h-8 w-3/4 mb-3" />
        <Skeleton className="h-5 w-1/2" />
      </main>
    );
  }

  if (isError) {
    return (
      <main
        className="max-w-5xl mx-auto px-4 py-16 text-center"
        data-ocid="watch.error_state"
      >
        <h2 className="font-display text-2xl font-bold mb-2">
          Could not load video
        </h2>
        <p className="text-muted-foreground mb-6">
          There was a problem fetching this video. Please try again later.
        </p>
        <Link to="/" search={{ q: undefined }}>
          <Button>Go Home</Button>
        </Link>
      </main>
    );
  }

  if (!videoTuple) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h2 className="font-display text-2xl font-bold mb-4">
          Video not found
        </h2>
        <Link to="/" search={{ q: undefined }}>
          <Button>Go Home</Button>
        </Link>
      </main>
    );
  }

  const [video, viewCount, likeCount] = videoTuple;

  const tags = video.tags ?? [];
  const description = video.description ?? "";

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      {/* Back */}
      <Link
        to="/"
        search={{ q: undefined }}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to videos
      </Link>

      {/* Video player */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="relative rounded-xl overflow-hidden bg-black shadow-card mb-6">
          {videoLoading && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/80 z-10"
              data-ocid="watch.video.loading_state"
            >
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
          )}
          {/* biome-ignore lint/a11y/useMediaCaption: captions not available for user-uploaded content */}
          <video
            src={videoUrl || undefined}
            controls
            className="w-full aspect-video"
            preload="metadata"
            onError={handleVideoError}
          >
            Your browser does not support the video element.
          </video>
        </div>
      </motion.div>

      {/* Video info */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight flex-1">
            {video.title}
          </h1>
        </div>

        <div className="flex items-center gap-4 flex-wrap mb-4">
          <Badge
            variant="secondary"
            className="bg-primary/20 text-primary border-0 text-sm"
          >
            {video.category}
          </Badge>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Eye className="w-4 h-4" />
            {formatCount(viewCount)} views
          </span>
          <span className="text-sm text-muted-foreground">
            {timeAgo(video.createdAt)}
          </span>
          <Button
            data-ocid="watch.like_button"
            variant="outline"
            size="sm"
            onClick={handleLike}
            disabled={likeMutation.isPending}
            className="ml-auto gap-2 border-border hover:bg-primary/10 hover:border-primary hover:text-primary"
          >
            {likeMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ThumbsUp className="w-4 h-4" />
            )}
            {formatCount(likeCount)} Likes
          </Button>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs border-border"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Description */}
        {description && (
          <div className="bg-card rounded-lg p-4">
            <AnimatePresence initial={false}>
              <motion.p
                className={`text-sm text-foreground/80 whitespace-pre-line ${
                  !descExpanded ? "line-clamp-3" : ""
                }`}
              >
                {description}
              </motion.p>
            </AnimatePresence>
            {description.length > 200 && (
              <button
                type="button"
                onClick={() => setDescExpanded(!descExpanded)}
                className="mt-2 text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1"
              >
                {descExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" /> Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" /> Show more
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      <Separator className="mb-6" />

      {/* Comments */}
      <section>
        <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          Comments
          {comments && (
            <span className="text-muted-foreground text-base font-normal">
              ({comments.length})
            </span>
          )}
        </h2>

        {/* Add comment form */}
        <form
          onSubmit={handleComment}
          className="mb-8 bg-card rounded-xl p-4 space-y-3"
        >
          <Input
            data-ocid="watch.comment.input"
            placeholder="Your name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="bg-background border-border"
          />
          <Textarea
            data-ocid="watch.comment.textarea"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            className="bg-background border-border resize-none"
          />
          <div className="flex justify-end">
            <Button
              data-ocid="watch.comment.submit_button"
              type="submit"
              disabled={addComment.isPending}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              {addComment.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Post Comment
            </Button>
          </div>
        </form>

        {/* Comments list */}
        {commentsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment, i) => (
              <motion.div
                key={comment.id.toString()}
                data-ocid={i === 0 ? "watch.comment.item.1" : undefined}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex gap-3 bg-card rounded-lg p-4"
              >
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                  {comment.authorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-sm text-foreground">
                      {comment.authorName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="watch.comment.empty_state"
          >
            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No comments yet. Be the first!</p>
          </div>
        )}
      </section>
    </main>
  );
}

import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { Eye, ThumbsUp } from "lucide-react";
import { motion } from "motion/react";
import type { Video } from "../backend";
import { formatCount, timeAgo } from "../utils/time";

interface VideoCardProps {
  video: Video;
  viewCount: bigint;
  likeCount: bigint;
  index?: number;
  ocid?: string;
}

export function VideoCard({
  video,
  viewCount,
  likeCount,
  index = 0,
  ocid,
}: VideoCardProps) {
  const thumbnailUrl = video.thumbnailBlob.getDirectURL();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      data-ocid={ocid}
    >
      <Link
        to="/watch/$id"
        params={{ id: video.id.toString() }}
        className="block group"
      >
        <div className="relative overflow-hidden rounded-lg bg-card shadow-card group-hover:shadow-card-hover transition-shadow duration-300">
          {/* Thumbnail */}
          <div className="aspect-video relative overflow-hidden bg-muted">
            <img
              src={thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white ml-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>Play</title>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
          {/* Info */}
          <div className="p-3">
            <div className="flex items-start gap-2 mb-2">
              <Badge
                variant="secondary"
                className="text-xs shrink-0 bg-primary/20 text-primary border-0"
              >
                {video.category}
              </Badge>
            </div>
            <h3 className="font-display font-semibold text-sm text-foreground line-clamp-2 leading-snug mb-2 group-hover:text-primary transition-colors duration-200">
              {video.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {formatCount(viewCount)}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                {formatCount(likeCount)}
              </span>
              <span className="ml-auto">{timeAgo(video.createdAt)}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { Film, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCreateVideo } from "../hooks/useQueries";

const CATEGORIES = [
  "Music",
  "Gaming",
  "Education",
  "Sports",
  "News",
  "Entertainment",
  "Technology",
  "Other",
];

export function UploadPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const createVideo = useCreateVideo();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbProgress, setThumbProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (identity === null) {
      void navigate({ to: "/", search: { q: undefined } });
    }
  }, [identity, navigate]);

  if (!identity) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!thumbnailFile) {
      toast.error("Please select a thumbnail image");
      return;
    }
    if (!videoFile) {
      toast.error("Please select a video file");
      return;
    }

    if (videoFile.size > 100 * 1024 * 1024) {
      toast.warning("Large files may take several minutes to upload.");
    }

    setThumbProgress(0);
    setVideoProgress(0);
    setIsUploading(true);
    try {
      const thumbBytes = new Uint8Array(await thumbnailFile.arrayBuffer());
      const videoBytes = new Uint8Array(await videoFile.arrayBuffer());

      const thumbnailBlob = ExternalBlob.fromBytes(
        thumbBytes,
      ).withUploadProgress((p) => setThumbProgress(p));
      const videoBlob = ExternalBlob.fromBytes(videoBytes).withUploadProgress(
        (p) => setVideoProgress(p),
      );

      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await createVideo.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        thumbnailBlob,
        videoBlob,
        category: category || "Other",
        tags: tagList,
      });

      toast.success("Video uploaded successfully!");
      void navigate({ to: "/", search: { q: undefined } });
    } catch (err) {
      console.error("Upload error:", err);
      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Upload Video</h1>
            <p className="text-sm text-muted-foreground">
              Share your content with the world
            </p>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-display">
              Video Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                void handleSubmit(e);
              }}
              className="space-y-6"
            >
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-primary">*</span>
                </Label>
                <Input
                  id="title"
                  data-ocid="upload.title.input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your video a great title..."
                  className="bg-secondary border-border"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  data-ocid="upload.description.textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers about your video..."
                  className="bg-secondary border-border min-h-[100px] resize-none"
                />
              </div>

              {/* Category + Tags row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger
                      data-ocid="upload.category.select"
                      className="bg-secondary border-border"
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    data-ocid="upload.tags.input"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="gaming, tutorial, funny"
                    className="bg-secondary border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated
                  </p>
                </div>
              </div>

              {/* Thumbnail */}
              <div className="space-y-2">
                <Label>Thumbnail Image</Label>
                {thumbnailFile ? (
                  <div className="border-2 border-border rounded-lg p-4 flex items-center justify-between bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="w-6 h-6 text-primary shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {thumbnailFile.name}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setThumbnailFile(null)}
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Label
                    htmlFor="thumbnail-input"
                    data-ocid="upload.thumbnail.upload_button"
                    className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors block"
                  >
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        Click to upload thumbnail
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, WEBP supported
                      </p>
                    </div>
                    <input
                      id="thumbnail-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setThumbnailFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </Label>
                )}
                {isUploading && (
                  <div
                    className="space-y-1"
                    data-ocid="upload.thumbnail.loading_state"
                  >
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uploading thumbnail</span>
                      <span>{thumbProgress}%</span>
                    </div>
                    <Progress value={thumbProgress} className="h-1.5" />
                  </div>
                )}
              </div>

              {/* Video File */}
              <div className="space-y-2">
                <Label>Video File</Label>
                {videoFile ? (
                  <div className="border-2 border-border rounded-lg p-4 flex items-center justify-between bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <Film className="w-6 h-6 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium truncate">
                          {videoFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setVideoFile(null)}
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Label
                    htmlFor="video-input"
                    data-ocid="upload.video_file.upload_button"
                    className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors block"
                  >
                    <Film className="w-8 h-8 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        Click to upload video
                      </p>
                      <p className="text-xs text-muted-foreground">
                        MP4, MOV, AVI, WEBM supported
                      </p>
                    </div>
                    <input
                      id="video-input"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) =>
                        setVideoFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </Label>
                )}
                {isUploading && (
                  <div
                    className="space-y-1"
                    data-ocid="upload.video.loading_state"
                  >
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uploading video</span>
                      <span>{videoProgress}%</span>
                    </div>
                    <Progress value={videoProgress} className="h-1.5" />
                  </div>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                data-ocid="upload.submit_button"
                disabled={isUploading || createVideo.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {isUploading || createVideo.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Video
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

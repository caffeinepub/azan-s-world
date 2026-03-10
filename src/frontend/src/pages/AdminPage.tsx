import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "@tanstack/react-router";
import { Edit, Film, Loader2, PlusCircle, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { Video } from "../backend";
import {
  useCreateVideo,
  useDeleteVideo,
  useIsAdmin,
  useListVideos,
  useUpdateVideo,
} from "../hooks/useQueries";
import { timeAgo } from "../utils/time";

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

interface UploadForm {
  title: string;
  description: string;
  category: string;
  tags: string;
  thumbnailFile: File | null;
  videoFile: File | null;
}

const emptyForm: UploadForm = {
  title: "",
  description: "",
  category: "Entertainment",
  tags: "",
  thumbnailFile: null,
  videoFile: null,
};

export function AdminPage() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: videos, isLoading: videosLoading } = useListVideos();
  const createVideo = useCreateVideo();
  const updateVideo = useUpdateVideo();
  const deleteVideo = useDeleteVideo();

  const [form, setForm] = useState<UploadForm>(emptyForm);
  const [thumbProgress, setThumbProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [editVideo, setEditVideo] = useState<Video | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    tags: "",
  });
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!adminLoading && isAdmin === false) {
      void navigate({ to: "/", search: { q: undefined } });
    }
  }, [isAdmin, adminLoading, navigate]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.thumbnailFile || !form.videoFile || !form.title.trim()) {
      toast.error("Please fill all required fields and upload files");
      return;
    }

    try {
      setThumbProgress(0);
      setVideoProgress(0);

      const thumbBytes = new Uint8Array(await form.thumbnailFile.arrayBuffer());
      const videoBytes = new Uint8Array(await form.videoFile.arrayBuffer());

      const thumbnailBlob = ExternalBlob.fromBytes(
        thumbBytes,
      ).withUploadProgress((p) => setThumbProgress(Math.round(p)));
      const videoBlob = ExternalBlob.fromBytes(videoBytes).withUploadProgress(
        (p) => setVideoProgress(Math.round(p)),
      );

      const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await createVideo.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim(),
        thumbnailBlob,
        videoBlob,
        category: form.category,
        tags,
      });

      toast.success("Video uploaded successfully!");
      setForm(emptyForm);
      setThumbProgress(0);
      setVideoProgress(0);
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Please try again.");
    }
  };

  const handleEditOpen = (video: Video) => {
    setEditVideo(video);
    setEditForm({
      title: video.title,
      description: video.description,
      category: video.category,
      tags: video.tags.join(", "),
    });
  };

  const handleEditSave = () => {
    if (!editVideo) return;
    const tags = editForm.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    updateVideo.mutate(
      {
        id: editVideo.id,
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        category: editForm.category,
        tags,
      },
      {
        onSuccess: () => {
          toast.success("Video updated!");
          setEditVideo(null);
        },
        onError: () => toast.error("Update failed"),
      },
    );
  };

  const handleDelete = () => {
    if (deleteId === null) return;
    deleteVideo.mutate(deleteId, {
      onSuccess: () => {
        toast.success("Video deleted");
        setDeleteId(null);
      },
      onError: () => toast.error("Delete failed"),
    });
  };

  if (adminLoading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </main>
    );
  }

  if (!isAdmin) return null;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">Admin Panel</h1>
          <p className="text-muted-foreground text-sm">
            Manage your video content
          </p>
        </div>
        <Link to="/" search={{ q: undefined }}>
          <Button variant="outline" size="sm" className="border-border">
            View Site
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="videos">
        <TabsList className="mb-8 bg-secondary">
          <TabsTrigger
            value="videos"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Film className="w-4 h-4" />
            My Videos
          </TabsTrigger>
          <TabsTrigger
            value="upload"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <PlusCircle className="w-4 h-4" />
            Upload Video
          </TabsTrigger>
        </TabsList>

        {/* Videos list */}
        <TabsContent value="videos">
          {videosLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : !videos || videos.length === 0 ? (
            <div
              data-ocid="admin.video.empty_state"
              className="text-center py-20 text-muted-foreground"
            >
              <Film className="w-14 h-14 mx-auto mb-4 opacity-20" />
              <h3 className="font-display text-lg font-semibold mb-2">
                No videos uploaded
              </h3>
              <p className="text-sm">
                Upload your first video using the Upload tab.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {videos.map(([video], idx) => (
                <div
                  key={video.id.toString()}
                  data-ocid={
                    idx < 3 ? `admin.video.item.${idx + 1}` : undefined
                  }
                  className="flex items-center gap-4 bg-card rounded-xl p-4 hover:bg-card/80 transition-colors"
                >
                  <div className="w-24 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                    <img
                      src={video.thumbnailBlob.getDirectURL()}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {video.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className="text-xs bg-primary/20 text-primary border-0"
                      >
                        {video.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(video.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      data-ocid={
                        idx < 3
                          ? `admin.video.edit_button.${idx + 1}`
                          : undefined
                      }
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditOpen(video)}
                      className="gap-1.5 border-border hover:border-primary hover:text-primary"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      data-ocid={
                        idx < 3
                          ? `admin.video.delete_button.${idx + 1}`
                          : undefined
                      }
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(video.id)}
                      className="gap-1.5 border-border hover:border-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Upload form */}
        <TabsContent value="upload">
          <form
            onSubmit={(e) => void handleUpload(e)}
            className="space-y-6 bg-card rounded-xl p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Title <span className="text-primary">*</span>
                </Label>
                <Input
                  id="title"
                  data-ocid="admin.title.input"
                  placeholder="Enter video title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="bg-background border-border"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  data-ocid="admin.description.textarea"
                  placeholder="Describe your video..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={4}
                  className="bg-background border-border resize-none"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Category <span className="text-primary">*</span>
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(val) =>
                    setForm((f) => ({ ...f, category: val }))
                  }
                >
                  <SelectTrigger
                    data-ocid="admin.category.select"
                    className="bg-background border-border"
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

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm font-medium">
                  Tags (comma-separated)
                </Label>
                <Input
                  id="tags"
                  data-ocid="admin.tags.input"
                  placeholder="music, tutorial, live..."
                  value={form.tags}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tags: e.target.value }))
                  }
                  className="bg-background border-border"
                />
              </div>

              {/* Thumbnail upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Thumbnail <span className="text-primary">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  onKeyDown={(e) =>
                    e.key === "Enter" && thumbnailInputRef.current?.click()
                  }
                  className="w-full cursor-pointer border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors group"
                  data-ocid="admin.thumbnail.upload_button"
                >
                  <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                  <p className="text-sm text-muted-foreground">
                    {form.thumbnailFile
                      ? form.thumbnailFile.name
                      : "Click to upload thumbnail"}
                  </p>
                </button>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setForm((f) => ({ ...f, thumbnailFile: file }));
                  }}
                />
                {createVideo.isPending && thumbProgress > 0 && (
                  <Progress value={thumbProgress} className="h-1.5" />
                )}
              </div>

              {/* Video upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Video File <span className="text-primary">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  onKeyDown={(e) =>
                    e.key === "Enter" && videoInputRef.current?.click()
                  }
                  className="w-full cursor-pointer border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors group"
                  data-ocid="admin.video_file.upload_button"
                >
                  <Film className="w-6 h-6 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                  <p className="text-sm text-muted-foreground">
                    {form.videoFile
                      ? form.videoFile.name
                      : "Click to upload video"}
                  </p>
                </button>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setForm((f) => ({ ...f, videoFile: file }));
                  }}
                />
                {createVideo.isPending && videoProgress > 0 && (
                  <Progress value={videoProgress} className="h-1.5" />
                )}
              </div>
            </div>

            <Button
              type="submit"
              data-ocid="admin.upload_button"
              disabled={createVideo.isPending}
              className="w-full h-11 bg-primary hover:bg-primary/90 gap-2 text-base"
            >
              {createVideo.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading... ({videoProgress}%)
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Video
                </>
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog
        open={!!editVideo}
        onOpenChange={(open) => !open && setEditVideo(null)}
      >
        <DialogContent
          data-ocid="admin.edit.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Edit Video
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Title</Label>
              <Input
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, title: e.target.value }))
                }
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                className="bg-background border-border resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Category</Label>
              <Select
                value={editForm.category}
                onValueChange={(val) =>
                  setEditForm((f) => ({ ...f, category: val }))
                }
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
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
            <div className="space-y-1.5">
              <Label className="text-sm">Tags (comma-separated)</Label>
              <Input
                value={editForm.tags}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, tags: e.target.value }))
                }
                className="bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="admin.edit.cancel_button"
              variant="outline"
              onClick={() => setEditVideo(null)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin.edit.save_button"
              onClick={handleEditSave}
              disabled={updateVideo.isPending}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              {updateVideo.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent
          data-ocid="admin.delete.dialog"
          className="bg-card border-border"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl">
              Delete Video?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The video will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.delete.cancel_button"
              className="border-border"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin.delete.confirm_button"
              onClick={handleDelete}
              disabled={deleteVideo.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {deleteVideo.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

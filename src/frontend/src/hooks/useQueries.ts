import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob } from "../backend";
import { useActor } from "./useActor";

export type VideoTuple = [import("../backend").Video, bigint, bigint];

export function useListVideos() {
  const { actor, isFetching } = useActor();
  return useQuery<VideoTuple[]>({
    queryKey: ["videos"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listVideos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearchVideos(searchText: string) {
  const { actor, isFetching } = useActor();
  return useQuery<VideoTuple[]>({
    queryKey: ["videos", "search", searchText],
    queryFn: async () => {
      if (!actor || !searchText.trim()) return [];
      return actor.searchVideos(searchText);
    },
    enabled: !!actor && !isFetching && searchText.trim().length > 0,
  });
}

export function useFilterByCategory(category: string) {
  const { actor, isFetching } = useActor();
  return useQuery<VideoTuple[]>({
    queryKey: ["videos", "category", category],
    queryFn: async () => {
      if (!actor) return [];
      return actor.filterByCategory(category);
    },
    enabled: !!actor && !isFetching && category !== "All",
  });
}

export function useGetVideo(id: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<VideoTuple>({
    queryKey: ["video", id.toString()],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getVideo(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetComments(videoId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<import("../backend").Comment[]>({
    queryKey: ["comments", videoId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getComments(videoId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLikeVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.likeVideo(id);
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({
        queryKey: ["video", id.toString()],
      });
    },
  });
}

export function useIncrementViewCount() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.incrementViewCount(id);
    },
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      videoId,
      authorName,
      content,
    }: {
      videoId: bigint;
      authorName: string;
      content: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addComment(videoId, authorName, content);
    },
    onSuccess: (_data, { videoId }) => {
      void queryClient.invalidateQueries({
        queryKey: ["comments", videoId.toString()],
      });
    },
  });
}

export function useCreateVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      thumbnailBlob: ExternalBlob;
      videoBlob: ExternalBlob;
      category: string;
      tags: string[];
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createVideo(
        data.title,
        data.description,
        data.thumbnailBlob,
        data.videoBlob,
        data.category,
        data.tags,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

export function useUpdateVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      title: string;
      description: string;
      category: string;
      tags: string[];
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateVideo(
        data.id,
        data.title,
        data.description,
        data.category,
        data.tags,
      );
    },
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["videos"] });
      void queryClient.invalidateQueries({
        queryKey: ["video", id.toString()],
      });
    },
  });
}

export function useDeleteVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteVideo(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

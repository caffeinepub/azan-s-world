import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Video {
    id: bigint;
    title: string;
    createdAt: bigint;
    tags: Array<string>;
    description: string;
    videoBlob: ExternalBlob;
    thumbnailBlob: ExternalBlob;
    category: string;
}
export interface Comment {
    id: bigint;
    content: string;
    createdAt: bigint;
    authorName: string;
    videoId: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(videoId: bigint, authorName: string, content: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createVideo(title: string, description: string, thumbnailExternalBlob: ExternalBlob, videoExternalBlob: ExternalBlob, category: string, tags: Array<string>): Promise<bigint>;
    deleteVideo(id: bigint): Promise<void>;
    filterByCategory(category: string): Promise<Array<[Video, bigint, bigint]>>;
    getCallerUserRole(): Promise<UserRole>;
    getComments(videoId: bigint): Promise<Array<Comment>>;
    getVideo(id: bigint): Promise<[Video, bigint, bigint]>;
    incrementViewCount(id: bigint): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    likeVideo(id: bigint): Promise<void>;
    listVideos(): Promise<Array<[Video, bigint, bigint]>>;
    searchVideos(searchText: string): Promise<Array<[Video, bigint, bigint]>>;
    updateVideo(id: bigint, title: string, description: string, category: string, tags: Array<string>): Promise<void>;
}

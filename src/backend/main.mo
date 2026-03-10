import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Int "mo:core/Int";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

actor {
  type Video = {
    id : Nat;
    title : Text;
    description : Text;
    thumbnailBlob : Storage.ExternalBlob;
    videoBlob : Storage.ExternalBlob;
    category : Text;
    tags : [Text];
    createdAt : Int;
  };

  type Comment = {
    id : Nat;
    videoId : Nat;
    authorName : Text;
    content : Text;
    createdAt : Int;
  };

  module Video {
    public func compare(video1 : Video, video2 : Video) : Order.Order {
      Nat.compare(video1.id, video2.id);
    };
  };

  module Comment {
    public func compareByCreatedAtDescending(comment1 : Comment, comment2 : Comment) : Order.Order {
      Int.compare(comment2.createdAt, comment1.createdAt);
    };
  };

  let videos = Map.empty<Nat, { video : Video; var viewCount : Nat; var likeCount : Nat }>();
  let comments = Map.empty<Nat, Comment>();

  var nextVideoId = 1;
  var nextCommentId = 1;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

  public shared ({ caller }) func createVideo(title : Text, description : Text, thumbnailExternalBlob : Storage.ExternalBlob, videoExternalBlob : Storage.ExternalBlob, category : Text, tags : [Text]) : async Nat {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: You must be logged in to upload videos");
    };

    let videoId = nextVideoId;
    nextVideoId += 1;

    let video : Video = {
      id = videoId;
      title;
      description;
      thumbnailBlob = thumbnailExternalBlob;
      videoBlob = videoExternalBlob;
      category;
      tags;
      createdAt = Time.now();
    };

    videos.add(
      videoId,
      {
        video;
        var viewCount = 0;
        var likeCount = 0;
      },
    );
    videoId;
  };

  public shared ({ caller }) func updateVideo(id : Nat, title : Text, description : Text, category : Text, tags : [Text]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    switch (videos.get(id)) {
      case (null) { Runtime.trap("Video not found") };
      case (?existingVideo) {
        let updatedVideo : Video = {
          id = existingVideo.video.id;
          title;
          description;
          thumbnailBlob = existingVideo.video.thumbnailBlob;
          videoBlob = existingVideo.video.videoBlob;
          category;
          tags;
          createdAt = existingVideo.video.createdAt;
        };
        videos.add(
          id,
          {
            video = updatedVideo;
            var viewCount = existingVideo.viewCount;
            var likeCount = existingVideo.likeCount;
          },
        );
      };
    };
  };

  public shared ({ caller }) func deleteVideo(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    if (not videos.containsKey(id)) {
      Runtime.trap("Video not found");
    };
    videos.remove(id);
  };

  public query ({ caller }) func getVideo(id : Nat) : async (Video, Nat, Nat) {
    switch (videos.get(id)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) { (video.video, video.viewCount, video.likeCount) };
    };
  };

  public query ({ caller }) func listVideos() : async [(Video, Nat, Nat)] {
    videos.values().toArray().map(
      func(video) {
        (video.video, video.viewCount, video.likeCount);
      }
    );
  };

  public query ({ caller }) func searchVideos(searchText : Text) : async [(Video, Nat, Nat)] {
    let filtered = videos.values().toArray().filter(
      func(video) {
        video.video.title.contains(#text searchText);
      }
    );
    filtered.map(
      func(video) {
        (video.video, video.viewCount, video.likeCount);
      }
    );
  };

  public query ({ caller }) func filterByCategory(category : Text) : async [(Video, Nat, Nat)] {
    let filtered = videos.values().toArray().filter(
      func(video) {
        video.video.category == category;
      }
    );
    filtered.map(
      func(video) {
        (video.video, video.viewCount, video.likeCount);
      }
    );
  };

  public shared ({ caller }) func incrementViewCount(id : Nat) : async () {
    switch (videos.get(id)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) {
        video.viewCount += 1;
      };
    };
  };

  public shared ({ caller }) func likeVideo(id : Nat) : async () {
    switch (videos.get(id)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) {
        video.likeCount += 1;
      };
    };
  };

  public shared ({ caller }) func addComment(videoId : Nat, authorName : Text, content : Text) : async Nat {
    if (not videos.containsKey(videoId)) {
      Runtime.trap("Video not found");
    };

    let commentId = nextCommentId;
    nextCommentId += 1;

    let comment : Comment = {
      id = commentId;
      videoId;
      authorName;
      content;
      createdAt = Time.now();
    };

    comments.add(commentId, comment);
    commentId;
  };

  public query ({ caller }) func getComments(videoId : Nat) : async [Comment] {
    if (not videos.containsKey(videoId)) {
      Runtime.trap("Video not found");
    };

    let filtered = comments.values().toArray().filter(
      func(comment) {
        comment.videoId == videoId;
      }
    );

    filtered.sort(Comment.compareByCreatedAtDescending);
  };
};

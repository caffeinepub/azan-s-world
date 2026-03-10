import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearch } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { VideoCard } from "../components/VideoCard";
import { VideoSkeleton } from "../components/VideoSkeleton";
import {
  useFilterByCategory,
  useListVideos,
  useSearchVideos,
} from "../hooks/useQueries";
import type { VideoTuple } from "../hooks/useQueries";

const CATEGORIES = [
  "All",
  "Music",
  "Gaming",
  "Education",
  "Sports",
  "News",
  "Entertainment",
  "Technology",
];

const SKELETON_IDS = ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6", "sk7", "sk8"];

export function HomePage() {
  const search = useSearch({ from: "/" }) as { q?: string };
  const [activeCategory, setActiveCategory] = useState("All");
  const [heroSearch, setHeroSearch] = useState(search.q ?? "");
  const navigate = useNavigate();

  const { data: allVideos, isLoading: allLoading } = useListVideos();
  const { data: searchResults, isLoading: searchLoading } = useSearchVideos(
    search.q ?? "",
  );
  const { data: categoryVideos, isLoading: categoryLoading } =
    useFilterByCategory(activeCategory);

  const isSearching = !!search.q?.trim();

  const displayVideos: VideoTuple[] = useMemo(() => {
    if (isSearching) return searchResults ?? [];
    if (activeCategory !== "All") return categoryVideos ?? [];
    return allVideos ?? [];
  }, [isSearching, searchResults, activeCategory, categoryVideos, allVideos]);

  const isLoading = isSearching
    ? searchLoading
    : activeCategory !== "All"
      ? categoryLoading
      : allLoading;

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      void navigate({ to: "/", search: { q: heroSearch.trim() } });
    } else {
      void navigate({ to: "/", search: { q: undefined } });
    }
  };

  return (
    <main className="min-h-screen">
      {/* Hero */}
      {!isSearching && (
        <section className="relative py-16 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img
                src="/assets/uploads/image-1.png"
                alt="Azan's World"
                className="w-12 h-12 object-contain"
              />
              <h1 className="font-display font-black text-4xl md:text-5xl">
                Azan's <span className="text-primary">World</span>
              </h1>
            </div>
            <p className="text-muted-foreground text-lg mb-8">
              Discover, share, and enjoy amazing videos
            </p>
            <form
              onSubmit={handleHeroSearch}
              className="flex gap-3 max-w-lg mx-auto"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for videos..."
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  className="pl-11 h-12 text-base bg-card border-border focus-visible:ring-primary"
                />
              </div>
              <Button
                type="submit"
                className="h-12 px-6 bg-primary hover:bg-primary/90"
              >
                Search
              </Button>
            </form>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Search results header */}
        {isSearching && (
          <div className="mb-6 pt-6">
            <h2 className="font-display text-2xl font-bold">
              Results for{" "}
              <span className="text-primary">&ldquo;{search.q}&rdquo;</span>
            </h2>
            <button
              type="button"
              onClick={() =>
                void navigate({ to: "/", search: { q: undefined } })
              }
              className="text-sm text-muted-foreground hover:text-foreground mt-1 underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Category tabs */}
        {!isSearching && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                data-ocid="home.category.tab"
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-primary text-white shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Video grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {SKELETON_IDS.map((skId) => (
              <VideoSkeleton key={skId} />
            ))}
          </div>
        ) : displayVideos.length === 0 ? (
          <div
            data-ocid="home.video.empty_state"
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <img
              src="/assets/uploads/image-1.png"
              alt="Azan's World"
              className="w-16 h-16 object-contain opacity-30 mb-4"
            />
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              {isSearching ? "No videos found" : "No videos yet"}
            </h3>
            <p className="text-muted-foreground">
              {isSearching
                ? "Try a different search term."
                : "Videos will appear here once uploaded."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayVideos.map(([video, views, likes], i) => (
              <VideoCard
                key={video.id.toString()}
                video={video}
                viewCount={views}
                likeCount={likes}
                index={i}
                ocid={i < 3 ? `home.video.item.${i + 1}` : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          caffeine.ai
        </a>
      </footer>
    </main>
  );
}

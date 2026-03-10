import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Navbar } from "./components/Navbar";
import { AdminPage } from "./pages/AdminPage";
import { HomePage } from "./pages/HomePage";
import { UploadPage } from "./pages/UploadPage";
import { WatchPage } from "./pages/WatchPage";

// Root layout
const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Outlet />
      <Toaster richColors position="bottom-right" />
    </div>
  ),
});

// Home route with search params
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: HomePage,
});

// Watch route
const watchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watch/$id",
  component: WatchPage,
});

// Admin route
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

// Upload route
const uploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/upload",
  component: UploadPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  watchRoute,
  adminRoute,
  uploadRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}

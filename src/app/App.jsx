import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../core/supabase/AuthProvider";
import { LoadingState } from "../shared/components/Feedback";
import { AppLayout } from "../shared/layouts/AppLayout";

const HomePage = lazy(() => import("../pages/HomePage").then((module) => ({ default: module.HomePage })));
const QuizPage = lazy(() => import("../modules/quiz/pages/QuizPage").then((module) => ({ default: module.QuizPage })));
const LibraryPage = lazy(() => import("../pages/LibraryPage").then((module) => ({ default: module.LibraryPage })));
const SmithCharactersPage = lazy(() => import("../modules/smith/pages/SmithCharactersPage").then((module) => ({ default: module.SmithCharactersPage })));
const SmithSessionsPage = lazy(() => import("../modules/smith/pages/SmithSessionsPage").then((module) => ({ default: module.SmithSessionsPage })));
const SmithChatPage = lazy(() => import("../modules/smith/pages/SmithChatPage").then((module) => ({ default: module.SmithChatPage })));
const ConfigPage = lazy(() => import("../pages/ConfigPage").then((module) => ({ default: module.ConfigPage })));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Suspense fallback={<div className="page"><LoadingState label="Loading…" /></div>}>
          <HashRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<HomePage />} />
                <Route path="quiz" element={<QuizPage />} />
                <Route path="library" element={<LibraryPage />} />
                <Route path="smith" element={<SmithCharactersPage />} />
                <Route path="smith/chats" element={<SmithSessionsPage />} />
                <Route path="smith/chat/:sessionId" element={<SmithChatPage />} />
                <Route path="config" element={<ConfigPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </HashRouter>
        </Suspense>
      </AuthProvider>
    </QueryClientProvider>
  );
}

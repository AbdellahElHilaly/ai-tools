import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../core/supabase/AuthProvider";
import { LibraryPage } from "../pages/LibraryPage";
import { ConfigPage } from "../pages/ConfigPage";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { QuizPage } from "../modules/quiz/pages/QuizPage";
import { AppLayout } from "../shared/layouts/AppLayout";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="quiz" element={<QuizPage />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="config" element={<ConfigPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

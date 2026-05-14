import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppLayout from "./components/AppLayout";
import UploadPage    from "./pages/UploadPage";
import ResultsPage   from "./pages/ResultsPage";
import ReportPage    from "./pages/ReportPage";
import HistoryPage   from "./pages/HistoryPage";
import NotFoundPage  from "./pages/NotFoundPage";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/"        element={<UploadPage />}   />
            <Route path="/results" element={<ResultsPage />}  />
            <Route path="/report"  element={<ReportPage />}   />
            <Route path="/history" element={<HistoryPage />}  />
            <Route path="*"        element={<NotFoundPage />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}


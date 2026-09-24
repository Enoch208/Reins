import { Route, Routes } from "react-router";
import { AppShell } from "./components/chrome/app-shell";
import { ActivityPage } from "./routes/activity-page";
import { DashboardPage } from "./routes/dashboard-page";
import { EvidencePage } from "./routes/evidence-page";
import { JobPage } from "./routes/job-page";
import { JobsPage } from "./routes/jobs-page";
import { LandingPage } from "./routes/landing-page";
import { NewJobPage } from "./routes/new-job-page";
import { NotFoundPage } from "./routes/not-found-page";
import { WalletPage } from "./routes/wallet-page";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="*"
        element={
          <AppShell>
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/jobs/new" element={<NewJobPage />} />
              <Route path="/jobs/:jobId" element={<JobPage />} />
              <Route path="/jobs/:jobId/evidence/:entryId" element={<EvidencePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AppShell>
        }
      />
    </Routes>
  );
}

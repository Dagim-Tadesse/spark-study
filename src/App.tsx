import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { A11yProvider } from "@/contexts/A11yContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Decks from "./pages/Decks.tsx";
import Study from "./pages/Study.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Help from "./pages/Help.tsx";
import About from "./pages/About.tsx";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <I18nProvider>
          <A11yProvider>
            <AuthProvider>
              <SettingsProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<Landing />} />
                      <Route path="/login" element={<Login />} />
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/decks"
                        element={
                          <ProtectedRoute>
                            <Decks />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/study"
                        element={
                          <ProtectedRoute>
                            <Study />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/help" element={<Help />} />
                      <Route path="/about" element={<About />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </SettingsProvider>
            </AuthProvider>
          </A11yProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Analytics from "@/pages/analytics";
import Districts from "@/pages/districts";
import Records from "@/pages/records";
import AdminAdd from "@/pages/admin-add";
import AdminEdit from "@/pages/admin-edit";
import AdminPanel from "@/pages/admin-panel";
import Future from "@/pages/future";
import Login from "@/pages/login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Home} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/districts" component={Districts} />
      <Route path="/records" component={Records} />
      <Route path="/future" component={Future} />
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminPanel} />}
      </Route>
      <Route path="/admin/add">
        {() => <ProtectedRoute component={AdminAdd} />}
      </Route>
      <Route path="/admin/edit/:id">
        {() => <ProtectedRoute component={AdminEdit} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

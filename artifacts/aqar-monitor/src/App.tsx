import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { LanguageProvider } from "@/contexts/language-context";
import { AdminRoute, UserRoute } from "@/components/protected-route";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Analytics from "@/pages/analytics";
import Districts from "@/pages/districts";
import Future from "@/pages/future";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Account from "@/pages/account";
import Dashboard from "@/pages/dashboard";

import Listings from "@/pages/listings";
import ListingDetail from "@/pages/listing-detail";
import ListingForm from "@/pages/listing-form";

import Marketers from "@/pages/marketers";
import MarketerProfile from "@/pages/marketer-profile";
import MarketerDashboard from "@/pages/marketer-dashboard";

import Services from "@/pages/services";
import ServiceForm from "@/pages/service-form";
import ServiceProviderProfile from "@/pages/service-provider-profile";
import ServiceProviderDashboard from "@/pages/service-provider-dashboard";

import MapPage from "@/pages/map-page";

import Requests from "@/pages/requests";
import RequestForm from "@/pages/request-form";

import AdminPanel from "@/pages/admin-panel";
import AdminAdd from "@/pages/admin-add";
import AdminEdit from "@/pages/admin-edit";
import AdminUsers from "@/pages/admin-users";

import LegalTerms from "@/pages/legal-terms";
import LegalPrivacy from "@/pages/legal-privacy";
import LegalUsage from "@/pages/legal-usage";

import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import MyListings from "@/pages/my-listings";

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
      {/* Auth pages */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />

      {/* Public pages */}
      <Route path="/" component={Home} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/districts" component={Districts} />
      <Route path="/future" component={Future} />

      {/* Marketplace — authenticated actions (MUST be before /:id wildcards) */}
      <Route path="/listings/new">
        {() => <UserRoute component={ListingForm} />}
      </Route>
      <Route path="/listings/:id/edit">
        {() => <UserRoute component={ListingForm} />}
      </Route>
      <Route path="/services/new">
        {() => <UserRoute component={ServiceForm} />}
      </Route>
      <Route path="/services/dashboard">
        {() => <UserRoute component={ServiceProviderDashboard} />}
      </Route>
      <Route path="/services/:id" component={ServiceProviderProfile} />
      <Route path="/requests/new">
        {() => <UserRoute component={RequestForm} />}
      </Route>

      {/* Marketer dashboard — must come before /marketers/:id wildcard */}
      <Route path="/marketer/dashboard">
        {() => <UserRoute component={MarketerDashboard} />}
      </Route>

      {/* Interactive map */}
      <Route path="/map" component={MapPage} />

      {/* Marketplace — public browse */}
      <Route path="/listings" component={Listings} />
      <Route path="/listings/:id" component={ListingDetail} />
      <Route path="/marketers" component={Marketers} />
      <Route path="/marketers/:id" component={MarketerProfile} />
      <Route path="/services" component={Services} />
      <Route path="/requests" component={Requests} />

      {/* My listings standalone page */}
      <Route path="/my/listings">
        {() => <UserRoute component={MyListings} />}
      </Route>

      {/* User dashboard & account */}
      <Route path="/dashboard">
        {() => <UserRoute component={Dashboard} />}
      </Route>
      <Route path="/account">
        {() => <UserRoute component={Account} />}
      </Route>

      {/* Admin-only pages */}
      <Route path="/admin">
        {() => <AdminRoute component={AdminPanel} />}
      </Route>
      <Route path="/admin/add">
        {() => <AdminRoute component={AdminAdd} />}
      </Route>
      <Route path="/admin/edit/:id">
        {() => <AdminRoute component={AdminEdit} />}
      </Route>
      <Route path="/admin/users">
        {() => <AdminRoute component={AdminUsers} />}
      </Route>

      {/* Legal pages */}
      <Route path="/terms" component={LegalTerms} />
      <Route path="/privacy" component={LegalPrivacy} />
      <Route path="/usage" component={LegalUsage} />

      {/* Password recovery */}
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

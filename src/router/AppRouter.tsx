import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import Layout from '../components/Layout/Layout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import RouteErrorBoundary from '../components/common/RouteErrorBoundary';
import { ThemeProvider } from '../theme';
import { ProtectedProviders } from '../providers/ProtectedProviders';
import { publicRoutes, themedPublicRoutes, protectedRoutes } from './routes';
import { RoleGuard } from './RoleGuard';

const LoadingFallback = () => (
  <Box
    display='flex'
    justifyContent='center'
    alignItems='center'
    minHeight='100vh'
  >
    <CircularProgress />
  </Box>
);

export function AppRouter() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Plain public routes */}
          {publicRoutes.map(({ path, component: Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}

          {/* Public routes that need the theme (terms, privacy policy) */}
          {themedPublicRoutes.map(({ path, component: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <ThemeProvider>
                  <Component />
                </ThemeProvider>
              }
            />
          ))}

          {/* Protected dashboard shell */}
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute>
                <ProtectedProviders>
                  <Layout />
                </ProtectedProviders>
              </ProtectedRoute>
            }
          >
            {protectedRoutes.map((config, i) => {
              const Component = config.component;
              // withErrorBoundary defaults to true — set false on a route to opt out.
              const withBoundary =
                (config.withErrorBoundary ?? true) ? (
                  <RouteErrorBoundary>
                    <Component />
                  </RouteErrorBoundary>
                ) : (
                  <Component />
                );

              // Wrap with RoleGuard when the route declares a required role.
              const guarded = config.requiredRole ? (
                <RoleGuard requiredRole={config.requiredRole}>
                  {withBoundary}
                </RoleGuard>
              ) : (
                withBoundary
              );

              if (config.index) {
                return (
                  <Route
                    key='index'
                    index
                    element={
                      <Suspense fallback={<LoadingFallback />}>
                        {guarded}
                      </Suspense>
                    }
                  />
                );
              }

              return (
                <Route
                  key={config.path ?? String(i)}
                  path={config.path}
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      {guarded}
                    </Suspense>
                  }
                />
              );
            })}
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

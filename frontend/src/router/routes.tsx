import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout.tsx'
import {
  AnalysisDetailPage,
  AnalysisPage,
  DashboardPage,
  HistoryPage,
  LandingPage,
  NotFoundPage,
  ScenarioBuilderPage,
  ScenarioDetailPage,
  ScenariosPage,
} from '../pages/index.ts'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/landing',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'builder',
        element: <ScenarioBuilderPage />,
      },
      {
        path: 'scenarios/new',
        element: <ScenarioBuilderPage />,
      },
      {
        path: 'scenarios/builder',
        element: <ScenarioBuilderPage />,
      },
      {
        path: 'scenarios',
        element: <ScenariosPage />,
      },
      {
        path: 'scenarios/:id',
        element: <ScenarioDetailPage />,
      },
      {
        path: 'analysis',
        element: <AnalysisPage />,
      },
      {
        path: 'analysis/:id',
        element: <AnalysisDetailPage />,
      },
      {
        path: 'history',
        element: <HistoryPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])


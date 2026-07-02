import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from './AppShell';
import WorkspaceShell from './WorkspaceShell';
import Placeholder from './Placeholder';
import Dashboard from './screens/Dashboard';
import { ROUTES } from './routes';

const P = (name: string, note?: string) => <Placeholder name={name} note={note} />;

export const router = createBrowserRouter([
  { path: ROUTES.root, element: <Navigate to={ROUTES.dashboard} replace /> },

  // Global navigation pages — wrapped in the app shell
  {
    element: <AppShell />,
    children: [
      { path: ROUTES.dashboard,         element: <Dashboard /> },
      { path: ROUTES.projects,          element: P('Projects') },
      { path: ROUTES.lookLibrary,       element: P('Look Library') },
      { path: ROUTES.lookLibraryEmpty,  element: P('Look Library — Empty') },
      { path: ROUTES.assetsLibrary,     element: P('Assets Library') },
      { path: ROUTES.assetsLibraryEmpty,element: P('Assets Library — Empty') },
      { path: ROUTES.notifications,     element: P('Notifications') },
      { path: ROUTES.settings,          element: P('Settings') },
      { path: ROUTES.billing,           element: P('Billing') },
      { path: ROUTES.brandKits,         element: P('Brand Kits', 'Coming soon — placeholder screen per hand-off note.') },
      { path: ROUTES.reports,           element: P('Reports', 'Coming soon — placeholder screen per hand-off note.') },
      { path: ROUTES.lookEditor,        element: P('Look Editor') },
      { path: ROUTES.createProject,     element: P('Create Project', 'Modal over dimmed Dashboard — will render as overlay.') },
      { path: ROUTES.attachLook,        element: P('Attach a Look', 'Modal picker over Service Setup.') },
    ],
  },

  // Project workspace — wrapped in the workspace shell
  {
    element: <WorkspaceShell />,
    children: [
      { path: ROUTES.projectOverview,     element: P('Project Overview') },
      { path: ROUTES.projectWorkspace,    element: P('Project Workspace') },
      { path: ROUTES.serviceSetup,        element: P('Service Setup') },
      { path: ROUTES.serviceSetupLocked,  element: P('Service Setup — Locked') },
      { path: ROUTES.propsAssets,         element: P('Props & Assets') },
      { path: ROUTES.propsAssetsUploaded, element: P('Props & Assets — Uploaded') },
      { path: ROUTES.generationCanvas,    element: P('Generation Canvas') },
      { path: ROUTES.output,              element: P('Output') },
      { path: ROUTES.review,              element: P('Review') },
      { path: ROUTES.addSku,              element: P('Add SKU') },
      { path: ROUTES.skuReview,           element: P('SKU Upload Review') },
      { path: ROUTES.addSkuStored,        element: P('Add SKUs — Stored') },
      { path: ROUTES.addSkuStoredEmpty,   element: P('Add SKUs — Stored — Empty') },
      { path: ROUTES.prepareSku,          element: P('Prepare SKUs', 'Modal to fix angle tagging.') },
      { path: ROUTES.groupSku,            element: P('Group SKU', 'Modal to assign ungrouped images.') },
    ],
  },

  // Fallback → dashboard
  { path: '*', element: <Navigate to={ROUTES.dashboard} replace /> },
]);

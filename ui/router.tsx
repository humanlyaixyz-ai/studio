import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from './AppShell';
import WorkspaceShell from './WorkspaceShell';
import { ROUTES } from './routes';

// Global nav screens
import Dashboard from './screens/Dashboard';
import Projects from './screens/Projects';
import LookLibrary, { LookLibraryEmpty } from './screens/LookLibrary';
import AssetsLibrary, { AssetsLibraryEmpty } from './screens/AssetsLibrary';
import Notifications from './screens/Notifications';
import Settings from './screens/Settings';
import Billing from './screens/Billing';
import BrandKits from './screens/BrandKits';
import Reports from './screens/Reports';
import LookEditor from './screens/LookEditor';
import CreateProject from './screens/CreateProject';
import AttachLook from './screens/AttachLook';

// Workspace screens
import ProjectOverview from './screens/ProjectOverview';
import ProjectWorkspace, { ServiceSetupLocked } from './screens/ProjectWorkspace';
import ServiceSetup from './screens/ServiceSetup';
import PropsAssets, { PropsAssetsUploaded } from './screens/PropsAssets';
import GenerationCanvas from './screens/GenerationCanvas';
import Output from './screens/Output';
import Review from './screens/Review';
import AddSku from './screens/AddSku';
import SkuReview from './screens/SkuReview';
import AddSkuStored, { AddSkuStoredEmpty } from './screens/AddSkuStored';
import PrepareSku from './screens/PrepareSku';
import GroupSku from './screens/GroupSku';

export const router = createBrowserRouter([
  { path: ROUTES.root, element: <Navigate to={ROUTES.dashboard} replace /> },

  // Global navigation pages — app shell
  {
    element: <AppShell />,
    children: [
      { path: ROUTES.dashboard,          element: <Dashboard /> },
      { path: ROUTES.projects,           element: <Projects /> },
      { path: ROUTES.lookLibrary,        element: <LookLibrary /> },
      { path: ROUTES.lookLibraryEmpty,   element: <LookLibraryEmpty /> },
      { path: ROUTES.assetsLibrary,      element: <AssetsLibrary /> },
      { path: ROUTES.assetsLibraryEmpty, element: <AssetsLibraryEmpty /> },
      { path: ROUTES.notifications,      element: <Notifications /> },
      { path: ROUTES.settings,           element: <Settings /> },
      { path: ROUTES.billing,            element: <Billing /> },
      { path: ROUTES.brandKits,          element: <BrandKits /> },
      { path: ROUTES.reports,            element: <Reports /> },
      { path: ROUTES.lookEditor,         element: <LookEditor /> },
      { path: ROUTES.createProject,      element: <CreateProject /> },
      { path: ROUTES.attachLook,         element: <AttachLook /> },
    ],
  },

  // Project workspace — workspace shell
  {
    element: <WorkspaceShell />,
    children: [
      { path: ROUTES.projectOverview,     element: <ProjectOverview /> },
      { path: ROUTES.projectWorkspace,    element: <ProjectWorkspace /> },
      { path: ROUTES.serviceSetup,        element: <ServiceSetup /> },
      { path: ROUTES.serviceSetupLocked,  element: <ServiceSetupLocked /> },
      { path: ROUTES.propsAssets,         element: <PropsAssets /> },
      { path: ROUTES.propsAssetsUploaded, element: <PropsAssetsUploaded /> },
      { path: ROUTES.generationCanvas,    element: <GenerationCanvas /> },
      { path: ROUTES.output,              element: <Output /> },
      { path: ROUTES.review,              element: <Review /> },
      { path: ROUTES.addSku,              element: <AddSku /> },
      { path: ROUTES.skuReview,           element: <SkuReview /> },
      { path: ROUTES.addSkuStored,        element: <AddSkuStored /> },
      { path: ROUTES.addSkuStoredEmpty,   element: <AddSkuStoredEmpty /> },
      { path: ROUTES.prepareSku,          element: <PrepareSku /> },
      { path: ROUTES.groupSku,            element: <GroupSku /> },
    ],
  },

  { path: '*', element: <Navigate to={ROUTES.dashboard} replace /> },
]);

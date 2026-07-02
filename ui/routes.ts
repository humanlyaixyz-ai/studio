// OVARLY route map — mirrors the hand-off note's routes exactly.
// Modals (create-project, prepare-sku, group-sku, attach-look) get routes too;
// they can render as overlays over their origin later.

export const ROUTES = {
  root: '/',

  // 1 · Global navigation pages
  dashboard: '/dashboard-v2',
  projects: '/projects',
  lookLibrary: '/look-library',
  lookLibraryEmpty: '/look-library-empty',
  assetsLibrary: '/assets-library',
  assetsLibraryEmpty: '/assets-library-empty',
  notifications: '/notifications',
  settings: '/settings',
  billing: '/billing',
  brandKits: '/brand-kits',
  reports: '/reports',

  // 2 · Project creation & workspace
  createProject: '/create-project',
  projectOverview: '/project-overview',
  projectWorkspace: '/project-workspace',
  serviceSetup: '/service-setup',
  serviceSetupLocked: '/service-setup-locked',
  propsAssets: '/props-assets',
  propsAssetsUploaded: '/props-assets-uploaded',
  generationCanvas: '/generation-canvas',
  output: '/output',
  review: '/review',

  // 3 · SKU flow
  addSku: '/add-sku',
  skuReview: '/sku-review',
  addSkuStored: '/add-sku-stored',
  addSkuStoredEmpty: '/add-sku-stored-empty',
  prepareSku: '/prepare-sku',
  groupSku: '/group-sku',

  // 4 · Look flow
  lookEditor: '/look-editor',
  attachLook: '/attach-look',
} as const;

export type RouteKey = keyof typeof ROUTES;


export enum ModelType {
  ECOM_SHOOT = 'ECOM_SHOOT',
  LIFESTYLE_SHOOT = 'LIFESTYLE_SHOOT',
  CREATIVE_SHOOT = 'CREATIVE_SHOOT',
  EDITORIAL_HIGH_FASHION = 'EDITORIAL_HIGH_FASHION',
}

export enum ProductCategory {
  TOP = 'Top',
  BOTTOM = 'Bottom',
  DRESS = 'Dress',
  JACKET = 'Jacket',
  COAT = 'Coat',
  ETHNIC = 'Ethnic',
  SWEATER = 'Sweater',
  ACCESSORIES = 'Accessories',
  SHOES = 'Shoes',
  // New Categories
  BEAUTY = 'Beauty Products',
  HOME_LIGHTS = 'Home Lights',
  HOME_APPLIANCE = 'Home Appliance',
  ELECTRONIC_APPLIANCE = 'Electronic Appliance',
  HOME_WARE = 'Home Ware',
  FMCG = 'FMCG',
  SAREE = 'Saree',
}

export interface UploadedFile {
  data: string;
  mimeType: string;
}

export interface UploadedFiles {
  characterFace?: UploadedFile;
  topFront?: UploadedFile;
  topBack?: UploadedFile;
  bottomFront?: UploadedFile;
  bottomBack?: UploadedFile;
  shoes?: UploadedFile;
  accessories?: UploadedFile;
  sunglasses?: UploadedFile;
  background?: UploadedFile;
  // Generic product image for non-fashion categories
  productImage?: UploadedFile;
  // Saree specific
  drape?: UploadedFile;
  blouse?: UploadedFile;
  accessory1?: UploadedFile;
  accessory2?: UploadedFile;
}

export interface GeneratedImage {
  id: string;
  url?: string;
  status: 'pending' | 'generating' | 'refining' | 'success' | 'failed';
  errorMessage?: string;
  prompt: string;
  generationTime?: number;
}

export interface ActiveGenerationMeta {
  id: string;
  model: ModelType;
  category: ProductCategory;
  projectId?: string;
}

export interface GenerationBatch {
  id: string;
  projectId?: string;
  skuId?: string;
  skuName?: string;
  timestamp: number;
  images: GeneratedImage[];
  model: ModelType;
  category: ProductCategory;
}

export interface ShotConfig {
  prompt: string;
  referenceImage?: UploadedFile;
}

export interface AssetFile {
  id: string;
  data: string;
  mimeType: string;
}

export interface ProjectAssets {
  [slotKey: string]: AssetFile[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  category: ProductCategory;
  model: ModelType;
  brandName: string;
  shots: ShotConfig[];
  assets?: ProjectAssets;
  posePrompts?: string[];
  environment?: string;
  lighting?: string;
  negativePrompt?: string;
  seed?: number;
  fashionType?: string;
  mood?: string;
}

export interface StylingConfig {
  materialDescription: string; // Consolidated for better control
}

export interface CameraConfig {
  framing: string;
  angle: string;
  focalLength: string;
}

export interface ToolCall {
  args: { [key: string]: unknown };
  name: string;
  id: string;
}

export interface FunctionCallResponse {
  id: string;
  name: string;
  response: {
    result: unknown;
  };
}

export type ApiProvider = 'google' | 'kie';

export interface SKU {
  id: string;
  projectId: string;
  name: string;
  skuCode?: string;
  productAssets: { [slotKey: string]: AssetFile };
  createdAt: number;
}
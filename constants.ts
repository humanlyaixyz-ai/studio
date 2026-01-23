

import { ModelType, ProductCategory } from './types';

export const GEMINI_IMAGE_MODEL = 'gemini-3-pro-image-preview';
export const GEMINI_FLASH_IMAGE_MODEL = 'gemini-2.5-flash-image';
export const PLACEHOLDER_IMAGE_URL = 'https://picsum.photos/300/400';

export const NON_FASHION_CATEGORIES = [
  ProductCategory.BEAUTY,
  ProductCategory.HOME_LIGHTS,
  ProductCategory.HOME_APPLIANCE,
  ProductCategory.ELECTRONIC_APPLIANCE,
  ProductCategory.HOME_WARE,
  ProductCategory.FMCG,
];

// --- FASHION & MOOD CONSTANTS ---
export const FASHION_TYPES = [
  'Everyday Casual',
  'Smart Casual',
  'Business Formal',
  'Office Wear',
  'Workwear',
  'Street Style',
  'Athleisure',
  'Party Wear',
  'Evening Wear',
  'Occasion Wear',
  'Festive Wear',
  'Resort Wear',
  'Travel Wear',
  'Loungewear',
  'Activewear',
  'Luxury Minimal',
  'Premium Editorial'
];

export const MOODS = [
  'Neutral Studio',
  'Bright Commercial',
  'Natural Daylight',
  'Soft Premium',
  'High Contrast Editorial',
  'Low-Key Dramatic',
  'Warm Lifestyle',
  'Cool Minimal',
  'Clean Technical',
  'Luxury Cinematic'
];

export const CAMERA_FRAMINGS = [
  'Wide Shot (Environmental)',
  'Full Body Shot',
  'Medium Shot (Waist Up)',
  'Close-Up',
  'Detail Shot (Macro)',
];

export const CAMERA_ANGLES = [
  'Eye-Level:Camera aligned with subject eye height, neutral perspective',
  'Slight Low Angle:Camera slightly below subject, subtle hero feel only',
  'Slight High Angle: Camera slightly above subject, natural perspective',
  'Overhead Flat Lay: Camera perpendicular to ground, zero tilt',
  'Front-On Straight: Camera square to subject, no rotation',
  'Three-Quarter Angle: Camera rotated 30–45 degrees from front',
  'Profile Side Angle: Camera 90 degrees from subject'
];

export const FOCAL_LENGTHS = [
  '24mm (Wide)',
  '35mm (Street/Lifestyle)',
  '50mm (Natural/Portrait)',
  '85mm (Studio Portrait)',
  '100mm (Macro/Product)',
];

export const DEFAULT_NEGATIVE_PROMPT = "low quality, inconsistent texture, inconsistent pattern,low resolution, blurry, soft focus, pixelated, jpeg artifacts,distorted proportions, warped geometry, stretched textures,fake lighting, flat lighting, unrealistic shadows, incorrect reflections,cgi, render, unreal engine look, 3d model, plastic skin, waxy skin,ai-generated look, over-smoothed, airbrushed, artificial sharpening,mannequin, lifeless pose, stiff posture,cartoon, illustration, painting, drawing, anime,bad anatomy, incorrect anatomy, extra limbs, missing limbs, fused fingers,halo edges, cutout look, compositing seams, floating subject,color bleed, color banding, oversaturated, undersaturated,overexposed, underexposed, crushed blacks, clipped highlights,grain, excessive noise,text, watermark, logo overlay, signature fake";

// --- PROMPTS ---

// System Instruction defines the persona and strict rules
export const SYSTEM_INSTRUCTION = `
You generate hyper-realistic, true 8K, award-level commercial photography.
You are a world-class commercial product photographer.
You simulate real-world photography ONLY — no illustrations, CGI, renders, or stylized visuals.
{
  "system_instruction": {
    "role": "commercial_product_photographer",
    "objective": "Generate hyper-realistic, true 8K, award-level commercial photography indistinguishable from real-world photographs.",
    "mode": "real_world_photography_only",
    "forbidden_styles": [
      "illustration",
      "cgi",
      "render",
      "stylized",
      "artistic_interpretation"
    ],

    "camera_physics": {
      "camera": "Phase One XT / IQ4 150MP",
      "color_depth": "16-bit",
      "dynamic_range": "extreme",
      "optics": "premium_full_frame_and_medium_format",
      "depth_of_field": "natural_physical",
      "focus_falloff": "realistic",
      "motion_blur": "none_unless_requested",
      "sharpening": "none",
      "enhancement": "none",
      "exposure": "physically_correct",
      "white_balance": "accurate",
      "color_science": "true_to_life"
    },

    "rendering_constraints": {
      "unreal_engine_5": "light_transport_only",
      "ue5_visibility": "forbidden",
      "output_character": "raw_photograph_like"
    },

    "absolute_priorities": {
      "priority_1_product_fidelity": {
        "product_is_generative": false,
        "reproduction": "1:1 exact_product",
        "fabric_rules": {
          "pattern_scale": "fixed",
          "pattern_spacing": "fixed",
          "pattern_alignment": "fixed",
          "pattern_continuity": "globally_traceable",
          "fold_behavior": "deform_only_never_redraw"
        },
        "immutable_attributes": [
          "logos",
          "text",
          "typography",
          "stitching",
          "seams",
          "buttons",
          "pockets",
          "zippers",
          "shape",
          "proportions",
          "color",
          "surface_finish"
        ]
      },

      "priority_2_photographic_realism": {
        "must_be_indistinguishable": true,
        "forbidden_artifacts": [
          "cgi",
          "plastic",
          "painterly",
          "ai_artifacts"
        ]
      },

      "priority_3_lighting_physics": {
        "global_illumination": "physically_correct",
        "reflections": "physically_correct",
        "subsurface_scattering": "correct"
      },

      "priority_4_resolution": {
        "appearance": "true_8k",
        "micro_detail_visibility": "110_percent_zoom",
        "forbidden": [
          "smearing",
          "blur",
          "softness"
        ]
      },

      "priority_5_identity_lock": {
        "character_identity": "locked",
        "product_identity": "locked",
        "background_identity": "locked",
        "face_regeneration": "forbidden",
        "beautification": "forbidden"
      }
    }
  }
}
`;

export const CORE_GENERATION_PROMPT = `Generate a high-end commercial photograph strictly from the provided inputs.
This is a REAL-WORLD PHOTOGRAPH simulation.
{
  "core_generation": {
    "task_type": "single_real_world_photograph",
    "composition_sources": [
      "product_reference",
      "character_reference",
      "background_reference"
    ],
    "scene_rules": {
      "space_time": "same_physical_space_same_moment",
      "no_element_creation": true
    },
    "product_character_integration": {
      "interaction": "physically_worn",
      "scale": "real_world_correct",
      "contact_points": "accurate",
      "occlusion": "natural",
      "shadows": "shared",
      "lighting": "shared",
      "focus_behavior": "consistent",
      "visibility": "full_product_sharp"
    },
    "background_consistency": {
      "background_modification": "forbidden",
      "perspective": "matched",
      "lens_behavior": "matched",
      "camera_height": "matched",
      "lighting": {
        "direction": "matched",
        "intensity": "matched",
        "color_temperature": "matched"
      },
      "ground_contact_shadows": "required"
    },
    "critical_locks": {
      "product_reuse": {
        "regeneration": "forbidden",
        "reinterpretation": "forbidden"
      },
      "character_identity": {
        "face_reuse": "exact",
        "alteration": "forbidden"
      },
      "batch_consistency": {
        "same_character": true,
        "same_product": true,
        "allowed_variations": [
          "pose",
          "camera_framing"
        ]
      }
    },
    "final_validation": {
      "checks": [
        "product_matches_reference_exactly",
        "character_identity_unchanged",
        "photographic_realism_at_100_percent_zoom"
      ],
      "failure_action": "regenerate_until_all_pass"
    }
  }
}
`;

export const PRODUCT_GENERATION_PROMPT = `{
  "role": "system",
  "objective": "Generate a high-end, production-grade commercial visual by strictly following the provided Product Reference and Input Prompt without hallucination or creative deviation.",
  "task_definition": {
    "primary_task": "Analyze the Product Reference and Input Prompt. Generate a commercial visual that exactly matches the requested output type.",
    "allowed_output_types": [
      "product_photography",
      "photoshoot_creative",
      "lifestyle_image",
      "infographic",
      "creatives"
    ]
  },
  "adaptive_execution_rules": {
    "product_photography_or_photoshoot": {
      "conditions": [
        "Input Prompt specifies photography",
        "Input Prompt specifies photoshoot",
        "Input Prompt specifies camera, lighting, or lens details"
      ],
      "execution": {
        "visual_style": "photorealistic, real-world commercial photography",
        "environment": "studio or on-location as specified",
        "camera_matching": [
          "camera angle",
          "focal length",
          "lighting setup",
          "composition",
          "depth of field"
        ]
      }
    },
    "infographic_or_informational": {
      "conditions": [
        "Input Prompt specifies infographic",
        "Input Prompt specifies annotations, callouts, or information layout"
      ],
      "execution": {
        "layout_style": "clean, structured, brand-aligned",
        "design_rules": [
          "follow hierarchy exactly as provided",
          "use only provided or clearly implied information",
          "no decorative or speculative elements"
        ]
      }
    },
    "reference_creative_handling": {
      "conditions": [
        "Reference creative is provided"
      ],
      "execution": {
        "replicate": [
          "creative style",
          "framing",
          "composition logic",
          "visual language"
        ],
        "replace_only": [
          "product"
        ],
        "preserve": [
          "creative intent",
          "layout structure",
          "shot logic"
        ]
      }
    }
  },
  "fidelity_and_identity_lock": {
    "brand_integrity": {
      "preserve": [
        "logo placement",
        "label text",
        "typography",
        "dimensions and proportions",
        "materials",
        "surface finish",
        "geometry"
      ]
    },
    "prohibited_actions": [
      "hallucinating features",
      "adding or removing branding elements",
      "altering colors or textures",
      "enhancing materials beyond reference",
      "fixing or beautifying design flaws",
      "interpreting missing details creatively"
    ],
    "product_match_requirement": "Product must be an exact visual match to the Product Reference with zero deviation."
  },
  "scene_and_physical_accuracy": {
    "lighting": "physically accurate light interaction with product and environment",
    "shadows": "realistic contact and cast shadows based on scene lighting",
    "reflections": "environment-consistent reflections only",
    "perspective_and_scale": "matched precisely to background and camera viewpoint",
    "compositing_rules": [
      "no floating artifacts",
      "no scale mismatch",
      "no lighting mismatch"
    ]
  },
  "quality_gate": {
    "output_standard": "premium real-world commercial deliverable",
    "acceptable_use_cases": [
      "ecommerce listings",
      "marketplace imagery",
      "brand campaigns",
      "catalogs"
    ],
    "explicitly_disallowed": [
      "illustration",
      "CGI look",
      "stylization",
      "artistic interpretation",
      "concept art"
    ],
    "exception_rule": "Stylization is allowed only if explicitly requested in the Input Prompt."
  },
  "failure_handling": {
    "if_information_is_missing": "Do not infer or guess. Use only what is provided.",
    "if_prompt_is_ambiguous": "Default to the safest, most literal interpretation without creative expansion."
  }
}
`;

export const REFINEMENT_PROMPT = `You are a senior commercial photo retoucher specializing in high-end e-commerce and luxury editorial imagery.

Your task is NOT to beautify or reinterpret the image.
Your task is to achieve perfect 1:1 visual fidelity with the provided reference assets.

**PRIMARY OBJECTIVE — TEXTURE & MATERIAL CONSISTENCY**
- The product’s material texture MUST remain uniform and consistent across the entire image.
- Fabric weave, grain, pattern scale, and surface behavior must match the reference exactly.
- No areas of the product may appear:
  - Softer, smoother, or blurrier than others
  - Over-sharpened compared to the reference
  - Digitally “painted” or AI-synthesized
- Texture continuity must be preserved across folds, curves, seams, and edges.
**ARTIFACT REMOVAL (CORRECTIVE ONLY)**
- Remove AI artifacts, smudging, banding, noise, and compression defects.
- Do NOT introduce new texture or detail.
- Do NOT smooth or homogenize real fabric detail.
- All corrections must preserve the original material structure.
**DETAIL REFINEMENT (REFERENCE-MATCHED)**
- Enhance clarity only where detail exists in the reference.
- Match:
  - Fabric weave density
  - Stitch sharpness
  - Edge definition
  - Surface micro-contrast
- Any enhancement must bring the image closer to the reference — never beyond it.
**TEXT, LOGOS & BRANDING**
- All logos, typography, patterns, and printed elements must remain identical to the reference.
- Text must be crisp, correctly shaped, and fully legible.
- No warping, redrawing, or reinterpretation of branding.
**CHARACTER IDENTITY LOCK**
- The character face must match the source image exactly.
- No facial reconstruction, beautification, smoothing, or reshaping.
- Preserve natural skin texture, pores, and tone.
**LIGHTING & SHADOW CORRECTION**
- Correct inconsistent lighting or shadow falloff only where it breaks realism.
- Shadows must remain physically accurate and consistent across:
  - Product
  - Character
  - Environment
- Do NOT add dramatic lighting or stylistic effects.
**OUTPUT REQUIREMENTS**
- Final output must appear as true 8K resolution.
- Micro-detail must remain visible at 100% zoom.
- No visible retouching artifacts.
- The image must look like a professionally retouched photograph, not an AI-altered image.
`;

export const MODEL_CONFIGS: Record<ModelType, { description: string; poses: string[]; model: string; imageSize: string; aspectRatio: string }> = {
  [ModelType.ECOM_SHOOT]: {
    description: 'Clean, direct poses suitable for product listings. High quality (Pro model, 4K).',
    poses: [], // Populated dynamically based on category
    model: GEMINI_IMAGE_MODEL,
    imageSize: '4K',
    aspectRatio: '3:4',
  },
  [ModelType.LIFESTYLE_SHOOT]: {
    description: 'Natural, real-world context, relaxed and dynamic.',
    poses: [], // Populated dynamically based on category
    model: GEMINI_IMAGE_MODEL,
    imageSize: '4K',
    aspectRatio: '16:9',
  },
  [ModelType.CREATIVE_SHOOT]: {
    description: 'Bold, artistic, and experimental concepts.',
    poses: [], // Populated dynamically based on category
    model: GEMINI_IMAGE_MODEL,
    imageSize: '4K',
    aspectRatio: '16:9',
  },
  [ModelType.EDITORIAL_HIGH_FASHION]: {
    description: 'Artistic, avant-garde poses with a focus on clothing design.',
    poses: [], // Populated dynamically based on category
    model: GEMINI_IMAGE_MODEL,
    imageSize: '4K',
    aspectRatio: '4:3',
  },
};

export const KIE_MODEL_ID = 'nano-banana-pro';
export const KIE_CALLBACK_URL = 'https://virtualshoot.odndigital.com/api/callback';

export const PRESET_BACKGROUNDS: Record<ModelType, { label: string; color: string }[]> = {
  [ModelType.ECOM_SHOOT]: [
    { label: 'Pure White', color: '#FFFFFF' },
    { label: 'Studio Grey', color: '#E5E5E5' },
    { label: 'Off White', color: '#FAF9F6' },
    { label: 'Warm Beige', color: '#F5F5DC' },
    { label: 'Cool Grey', color: '#D1D5DB' },
    { label: 'Charcoal', color: '#374151' },
  ],
  [ModelType.LIFESTYLE_SHOOT]: [
    { label: 'Soft Sunlight', color: '#FEF3C7' },
    { label: 'Sky Blue', color: '#E0F2FE' },
    { label: 'Urban Concrete', color: '#9CA3AF' },
    { label: 'Park Green', color: '#D1FAE5' },
    { label: 'Warm Interior', color: '#FFF7ED' },
  ],
  [ModelType.CREATIVE_SHOOT]: [
    { label: 'Neon Pink', color: '#F472B6' },
    { label: 'Electric Blue', color: '#60A5FA' },
    { label: 'Deep Purple', color: '#7C3AED' },
    { label: 'Lime Burst', color: '#A3E635' },
    { label: 'Midnight Black', color: '#000000' },
  ],
  [ModelType.EDITORIAL_HIGH_FASHION]: [
    { label: 'Muted Olive', color: '#57534E' },
    { label: 'Sepia Tone', color: '#78350F' },
    { label: 'Slate Blue', color: '#475569' },
    { label: 'Rich Maroon', color: '#7F1D1D' },
    { label: 'Cream Studio', color: '#FDFBF7' },
  ],
};

export const CATEGORY_POSES: Record<ProductCategory, string[]> = {
  [ProductCategory.TOP]: [
    'Full body shot, front view, standing straight, looking forward, neutral background',
    'Waist-up shot, front view, arms relaxed',
    'Waist-up shot, 45-degree angle, highlighting fit',
    'Close-up of neckline and collar details (front view)',
    'Back view, waist-up, showing back design',
    'Side profile, upper body, focusing on sleeve silhouette',
    'Detail shot of fabric texture and shoulder drape (front)',
    'Dynamic upper body pose, arms crossed or interacting with collar (front view)',
    'Seated pose, waist-up, relaxed posture (front view)',
    'High-angle upper body shot (front view)',
  ],
  [ProductCategory.BOTTOM]: [
    'Full body shot, front view, standing straight, looking forward, neutral background',
    'Waist-down shot, front view, highlighting waistband and fit',
    'Waist-down shot, side profile, showing leg silhouette',
    'Back view of trousers/skirt, focusing on pocket details',
    '3/4 angle, lower body, showing movement (front view)',
    'Close-up of hemline and shoe interaction (front view)',
    'Walking stride, focused on leg movement and fabric flow (front view)',
    'Seated pose, focused on how fabric gathers (front view)',
    'Low-angle shot, elongating the legs (front view)',
    'Detail shot of fabric texture on thigh/knee area (front view)',
  ],
  [ProductCategory.DRESS]: [
    'Full body shot, front view, standing straight, looking forward, neutral background',
    'Full body front view, hands on waist to show shape',
    'Full body back view, showing closure or back detail',
    'Side profile, full length, showing silhouette',
    'Dynamic twirl or movement to show fabric drape and flow (front view)',
    'Close-up of bodice/neckline details (front view)',
    'Mid-shot, seated elegantly (front view)',
    'Walking forward, full body (front view)',
    'Detail shot of waistline or belt (front view)',
    'Close-up of skirt texture and hem (front view)',
  ],
  [ProductCategory.JACKET]: [
    'Full body shot, front view, standing straight, looking forward, neutral background',
    'Upper body, jacket open to show lining/layering (front view)',
    'Upper body, jacket closed/buttoned up (front view)',
    'Close-up of lapel, collar, and button details (front view)',
    'Back view, showing structure and vent',
    'Side profile, showing sleeve length and fit (front view)',
    'Hands in pockets, casual stance (front view)',
    'Dynamic pose, putting on or taking off jacket (front view)',
    'Texture detail shot of material (leather/wool/denim) (front view)',
    'Seated pose, upper body (front view)',
  ],
  [ProductCategory.COAT]: [
    'Full body shot, front view, standing straight, looking forward, neutral background',
    'Full body, coat open showing outfit underneath (front view)',
    'Full body, coat closed/belted (front view)',
    'Back view, full length showing coat drape',
    'Side profile, showing coat length and silhouette (front view)',
    'Close-up of collar, buttons, and texture (front view)',
    'Walking pose, coat moving with stride (front view)',
    'Hands in pockets, wrapped up for warmth (front view)',
    'Seated pose, coat draped around (front view)',
    'Detail shot of cuff and fabric texture (front view)',
  ],
  [ProductCategory.ETHNIC]: [
    'Full body shot, front view, standing straight, looking forward, neutral background',
    'Full body front view traditional greeting pose (Namaste or similar)',
    'Close-up of embroidery, zari work, or print details (front view)',
    'Side profile, highlighting drape of dupatta or saree',
    'Back view, showing blouse or kurta back design',
    'Seated traditionally (if applicable) or elegant chair sit (front view)',
    'Walking pose, capturing the flow of the garment (front view)',
    'Hands adjusting dupatta or accessory (front view)',
    'Low-angle full body shot for grandeur (front view)',
    'Detail shot of borders and hemline (front view)',
  ],
  [ProductCategory.SWEATER]: [
    'Full body shot, front view, standing straight, looking forward, neutral background',
    'Waist-up shot, front view, arms relaxed, showcasing knit texture',
    'Waist-up shot, 45-degree angle, highlighting relaxed fit and drape (front view)',
    'Close-up of collar, ribbing, and material details (front view)',
    'Back view, waist-up, showing back knit pattern or seams',
    'Side profile, upper body, focusing on sleeve volume and cuff (front view)',
    'Hands subtly tucked into front pocket or at waist, casual (front view)',
    'Sitting on a stool, relaxed posture, emphasizing cozy feel (front view)',
    'High-angle upper body shot, capturing overall silhouette (front view)',
    'Detail shot of cable knit or specific sweater pattern on chest (front view)',
  ],
  [ProductCategory.ACCESSORIES]: [
    'Close-up shot focused specifically on the accessory, neutral background',
    'Stylized shot of the accessory being worn naturally',
    'Detail macro shot showing material and craftsmanship',
    'Contextual shot showing the item in use (e.g., holding a bag)',
    'Artistic flat lay perspective simulated on a surface',
    'Side view highlighting the profile of the accessory',
    'Interaction shot (e.g., hand adjusting the item)',
    'High-contrast lighting emphasizing texture and shine',
    'Lifestyle shot, natural lighting, blurred background',
    'Minimalist composition with focus solely on the item',
  ],
  [ProductCategory.SHOES]: [
    'Low angle shot focused on the shoes, neutral background',
    'Walking stride highlighting the footwear motion',
    'Top-down view of shoes on feet',
    'Side profile of shoes showing silhouette and heel',
    'Back view of shoes showing heel details',
    'Close-up detail shot of material, laces, or buckle',
    'Seated pose, legs crossed to showcase shoes',
    'One foot forward, dynamic stance',
    'Floating or jumping pose to show sole details',
    'Lifestyle shot on pavement or textured surface',
  ],
  // NEW CATEGORIES - Default/Ecom Poses
  [ProductCategory.BEAUTY]: [
    'Front view of product, studio lighting, clean white background',
    'Top-down flat lay shot of product with ingredients context',
    'Close-up of product texture (cream/liquid) smear',
    'Product standing on a reflective surface, elegant lighting',
    'Hand holding the product, showing scale',
    'Product with packaging box next to it',
    'Low angle hero shot of the bottle/container',
    'Lifestyle shot on a bathroom vanity',
    'Macro shot of the applicator/nozzle',
    'Group shot of product line (simulated)',
  ],
  [ProductCategory.HOME_LIGHTS]: [
    'Light fixture turned on, warm glow, dark room context',
    'Light fixture turned off, studio white background',
    'Detail shot of the material (glass/metal/fabric)',
    'Wide shot showing light in a living room setting',
    'Close-up of the bulb/filament details',
    'Low angle looking up at the fixture',
    'Light casting shadows on a wall',
    'Installed view (hanging or wall mounted)',
    'Lifestyle shot next to a reading chair',
    'Minimalist composition, geometric focus',
  ],
  [ProductCategory.HOME_APPLIANCE]: [
    'Front view, studio lighting, neutral background',
    '3/4 angle showing depth and control panel',
    'Close-up of buttons/dials/interface',
    'Lifestyle shot in a modern kitchen/home context',
    'Product in use (simulated), e.g., pouring/spinning',
    'Open view (if applicable, e.g., fridge/oven) showing interior',
    'Top-down view',
    'Detail shot of the finish/texture',
    'Side profile view',
    'Hero shot with dramatic lighting',
  ],
  [ProductCategory.ELECTRONIC_APPLIANCE]: [
    'Front facing view, screen on (if applicable)',
    'Angled shot showing slim profile/ports',
    'Back view showing connections/ventilation',
    'Close-up of logo and material finish',
    'Lifestyle shot on a desk or entertainment unit',
    'Hand interacting with the device (remote/touch)',
    'Top-down view',
    'Hero shot with "tech" blue lighting',
    'Detail of specific feature (lens/button)',
    'Minimalist floating product shot',
  ],
  [ProductCategory.HOME_WARE]: [
    'Eye-level front view, studio lighting',
    '45-degree angle showing shape and volume',
    'Top-down view (for plates/bowls/rugs)',
    'Close-up of texture/pattern/glaze',
    'Lifestyle shot on a dining table or shelf',
    'Stacked view (if applicable)',
    'In-hand shot to show scale',
    'Detail of handle or rim',
    'Contextual shot with related items (e.g., flowers in vase)',
    'Shadow play shot, artistic composition',
  ],
  [ProductCategory.FMCG]: [
    'Front view of packaging, clear text readability',
    'Angled view showing 3D box/bag shape',
    'Product out of packaging (if applicable, e.g., food bar)',
    'Top-down flat lay with raw ingredients',
    'Group shot of multiple packs',
    'Close-up of nutritional info/key claim badge',
    'Lifestyle consumption shot (simulated)',
    'Hand holding the pack',
    'Shelf view simulation',
    'Hero shot with splash/freshness effect',
  ],
  [ProductCategory.SAREE]: [
    'Full length front view, standing elegantly, showing drape and pleats, neutral studio background',
    'Close-up of the pallu/drape detail on shoulder, front view',
    'Back view showing blouse design and how saree is wrapped',
    'Side profile, full length, highlighting the silhouette and fabric flow',
    'Medium shot, front view, focus on blouse and upper drape',
    'Walking pose, capturing movement of the pleats and fabric (front view)',
    'Seated elegantly on a traditional chair, full drape visible (front view)',
    'Low-angle shot for a majestic, royal feel, full length (front view)',
    'Detail shot of the border and embroidery at the feet (front view)',
    'Three-quarter view highlighting both blouse and drape (front view)',
  ],
};

export const LIFESTYLE_POSES: Record<ProductCategory, string[]> = {
  // ... existing fashion ...
  // New Categories placeholders
  [ProductCategory.BEAUTY]: ['Product on a marble vanity, morning light', 'Being applied in a mirror reflection', 'In a travel bag, messy chic', 'Next to flowers, soft focus', 'Held in hand, sunny outdoor vibe', 'On a spa towel, relaxing mood', 'Spilled texture art shot', 'Bathroom shelf context', 'Night routine, dim warm light', 'Summer beach bag context'],
  [ProductCategory.HOME_LIGHTS]: ['Cozy reading corner at night', 'Dinner party ambient lighting', 'Bedside table warm glow', 'Entryway welcoming light', 'Workspace task lighting', 'Kitchen island pendant context', 'Outdoor patio string lights', 'Living room movie night vibe', 'Minimalist hallway', 'Boho bedroom aesthetic'],
  [ProductCategory.HOME_APPLIANCE]: ['Morning coffee routine, sun streaming in', 'Preparing a meal, messy kitchen counter', 'Family breakfast context', 'Modern minimal kitchen', 'Appliance in motion (blending/mixing)', 'Fresh ingredients around product', 'Holiday cooking vibe', 'Healthy lifestyle context', 'Night time kitchen glow', 'Sunday brunch setting'],
  [ProductCategory.ELECTRONIC_APPLIANCE]: ['Home office desk setup', 'Gaming room neon vibe', 'Living room entertainment center', 'Cozy movie night', 'Music listening session', 'Smart home interface interaction', 'Travel context (if portable)', 'Modern minimalist desk', 'Tech reviewer style setup', 'Late night work session'],
  [ProductCategory.HOME_WARE]: ['Sunday lunch spread', 'Fresh flowers in vase', 'Cozy tea time', 'Organized shelfie', 'Picnic setup', 'Bedside water carafe', 'Elegant dinner party', 'Rustic farmhouse vibe', 'Modern apartment styling', 'Plant lover corner'],
  [ProductCategory.FMCG]: ['Snack on the go, street background', 'Picnic spread', 'Lunchbox packing context', 'Late night craving vibe', 'Gym bag essential', 'Office desk snack', 'Party bowl sharing', 'Fresh produce market vibe', 'Vending machine context', 'Road trip essential'],

  [ProductCategory.TOP]: CATEGORY_POSES[ProductCategory.TOP],
  [ProductCategory.BOTTOM]: CATEGORY_POSES[ProductCategory.BOTTOM],
  [ProductCategory.DRESS]: CATEGORY_POSES[ProductCategory.DRESS],
  [ProductCategory.JACKET]: CATEGORY_POSES[ProductCategory.JACKET],
  [ProductCategory.COAT]: CATEGORY_POSES[ProductCategory.COAT],
  [ProductCategory.ETHNIC]: CATEGORY_POSES[ProductCategory.ETHNIC],
  [ProductCategory.SWEATER]: CATEGORY_POSES[ProductCategory.SWEATER],
  [ProductCategory.ACCESSORIES]: CATEGORY_POSES[ProductCategory.ACCESSORIES],
  [ProductCategory.SHOES]: CATEGORY_POSES[ProductCategory.SHOES],
  [ProductCategory.SAREE]: CATEGORY_POSES[ProductCategory.SAREE],
};

export const CREATIVE_POSES: Record<ProductCategory, string[]> = {
  // New Categories placeholders
  [ProductCategory.BEAUTY]: ['Product floating in water', 'Smear texture macro art', 'Neon lighting beauty shot', 'Suspended in mid-air', 'Geometric shadows', 'Mirror prism effect', 'Exploded view of ingredients', 'Monochromatic color block', 'Ice frozen product', 'Smoke and vapor effect'],
  [ProductCategory.HOME_LIGHTS]: ['Long exposure light trails', 'Cyberpunk neon colors', 'Light painting around fixture', 'Silhouette against bright light', 'Reflection in water', 'Dreamy bokeh overload', 'Geometric pattern shadows', 'Floating bulb surrealism', 'High contrast noir', 'Color gel lighting'],
  [ProductCategory.HOME_APPLIANCE]: ['Levitating ingredients', 'Splash photography (liquid/powder)', 'Cut-away view (artistic)', 'Product in a jungle', 'Futuristic lab setting', 'Pop-art background', 'Chrome reflection abstract', 'Minimalist void', 'Dramatic spotlight', 'Motion blur spin'],
  [ProductCategory.ELECTRONIC_APPLIANCE]: ['Circuit board city background', 'Holographic interface overlay', 'Floating components', 'Cyberpunk street context', 'Glitch art effect', 'Macro chip detail', 'Glowing wireframe', 'Underwater (simulated)', 'Space station environment', 'Laser scan effect'],
  [ProductCategory.HOME_WARE]: ['Balancing sculpture stack', 'Breaking/Shattering effect (artistic)', 'Flying food', 'Surreal giant scale', 'Pattern repetition', 'Shadow puppet play', 'Liquid splash crown', 'Mirror infinity room', 'Zero gravity dining', 'Abstract texture close-up'],
  [ProductCategory.FMCG]: ['Exploding packaging', 'Flying ingredients', 'Pop-art repetition', 'Giant product small city', 'Neon grocery aisle', 'X-ray view', 'Liquid splash', 'Floating in soda bubbles', 'Comic book style', 'Vaporwave aesthetic'],

  [ProductCategory.TOP]: CATEGORY_POSES[ProductCategory.TOP],
  [ProductCategory.BOTTOM]: CATEGORY_POSES[ProductCategory.BOTTOM],
  [ProductCategory.DRESS]: CATEGORY_POSES[ProductCategory.DRESS],
  [ProductCategory.JACKET]: CATEGORY_POSES[ProductCategory.JACKET],
  [ProductCategory.COAT]: CATEGORY_POSES[ProductCategory.COAT],
  [ProductCategory.ETHNIC]: CATEGORY_POSES[ProductCategory.ETHNIC],
  [ProductCategory.SWEATER]: CATEGORY_POSES[ProductCategory.SWEATER],
  [ProductCategory.ACCESSORIES]: CATEGORY_POSES[ProductCategory.ACCESSORIES],
  [ProductCategory.SHOES]: CATEGORY_POSES[ProductCategory.SHOES],
  [ProductCategory.SAREE]: CATEGORY_POSES[ProductCategory.SAREE],
};

export const EDITORIAL_HIGH_FASHION_POSES: Record<ProductCategory, string[]> = {
  // New Categories placeholders
  [ProductCategory.BEAUTY]: ['Model holding product over eye', 'High contrast black and white', 'Product balancing on face', 'Abstract makeup smear', 'Avant-garde styling context', 'Reflected in broken mirror', 'Minimalist concrete background', 'Gloved hand holding product', 'Dramatic shadow lines', 'Overexposed high key'],
  [ProductCategory.HOME_LIGHTS]: ['Fixture as art sculpture', 'Model posing with light', 'Shadow play on face', 'Industrial warehouse setting', 'Gothic atmosphere', 'Minimalist gallery space', 'Abstract composition', 'Light as jewelry', 'Dark moody aesthetic', 'Architectural focus'],
  [ProductCategory.HOME_APPLIANCE]: ['Appliance on a pedestal', 'Model in couture with appliance', 'Brutalist architecture context', 'Metallic silver theme', 'Abstract food styling', 'Appliance as luxury object', 'Museum display style', 'Dramatic side lighting', 'Monolith concept', 'Reflection focus'],
  [ProductCategory.ELECTRONIC_APPLIANCE]: ['Device as fashion accessory', 'High tech noir', 'Model wearing VR/Tech', 'Reflective chrome environment', 'Abstract data projection', 'Minimalist white void', 'Geometric composition', 'Device floating', 'Dark sleek aesthetic', 'Glass and metal texture'],
  [ProductCategory.HOME_WARE]: ['Surreal banquet', 'Plate on face', 'Ceramic art installation', 'Dark moody food', 'Floating cutlery', 'Abstract texture focus', 'Minimalist stone background', 'Model interacting with object', 'Dramatic spotlight', 'Geometric arrangement'],
  [ProductCategory.FMCG]: ['Packaging as fashion pattern', 'Model eating elegantly', 'Pop art colors', 'Surreal size comparison', 'Luxury grocery concept', 'Crystal bowl display', 'Velvet background', 'Abstract ingredient art', 'Gold leaf details', 'Minimalist typography focus'],

  [ProductCategory.TOP]: CATEGORY_POSES[ProductCategory.TOP],
  [ProductCategory.BOTTOM]: CATEGORY_POSES[ProductCategory.BOTTOM],
  [ProductCategory.DRESS]: CATEGORY_POSES[ProductCategory.DRESS],
  [ProductCategory.JACKET]: CATEGORY_POSES[ProductCategory.JACKET],
  [ProductCategory.COAT]: CATEGORY_POSES[ProductCategory.COAT],
  [ProductCategory.ETHNIC]: CATEGORY_POSES[ProductCategory.ETHNIC],
  [ProductCategory.SWEATER]: CATEGORY_POSES[ProductCategory.SWEATER],
  [ProductCategory.ACCESSORIES]: CATEGORY_POSES[ProductCategory.ACCESSORIES],
  [ProductCategory.SHOES]: CATEGORY_POSES[ProductCategory.SHOES],
  [ProductCategory.SAREE]: CATEGORY_POSES[ProductCategory.SAREE],
};

export const ITEMS_TO_UPLOAD = [
  { key: 'characterFace', label: 'Character Face' },
  { key: 'drape', label: 'Drape' },
  { key: 'blouse', label: 'Blouse' },
  { key: 'topFront', label: 'Top (Front)' },
  { key: 'topBack', label: 'Top (Back)' },
  { key: 'bottomFront', label: 'Bottom (Front)' },
  { key: 'bottomBack', label: 'Bottom (Back)' },
  { key: 'shoes', label: 'Shoes' },
  { key: 'accessories', label: 'Accessories' },
  { key: 'sunglasses', label: 'Sunglasses' },
  { key: 'productImage', label: 'Product Image' }, // Added Generic
  { key: 'background', label: 'Background' },
  { key: 'accessory1', label: 'Accessory 1' },
  { key: 'accessory2', label: 'Accessory 2' },
];

export const IMAGES_PER_GENERATION = 10;
export const BASE_COST_PER_IMAGE = 75;

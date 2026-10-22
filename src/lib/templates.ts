export interface ServiceTemplate {
  id: string;
  name: string;
  description: string;
  defaultPriceCents: number;
  category: "General Pest" | "Termites" | "Rodents" | "Specialty";
}

export const PEST_SERVICE_TEMPLATES: ServiceTemplate[] = [
  {
    id: "tpl-initial-cleanout",
    name: "Initial Pest Cleanout & Barrier",
    description: "Intensive initial indoor flush-out plus full exterior foundation perimeter power spray barrier (3ft up, 3ft out).",
    defaultPriceCents: 18500, // $185.00
    category: "General Pest",
  },
  {
    id: "tpl-quarterly-perimeter",
    name: "Quarterly Perimeter Defense Maintenance",
    description: "Scheduled recurring exterior barrier treatment, de-webbing eaves, wasp nest removal, and granule yard barrier.",
    defaultPriceCents: 11500, // $115.00
    category: "General Pest",
  },
  {
    id: "tpl-termite-inspection",
    name: "WDIR Official Termite Inspection",
    description: "Full crawlspace, attic, perimeter foundation structural inspection with official state Wood-Destroying Insect Report.",
    defaultPriceCents: 15000, // $150.00
    category: "Termites",
  },
  {
    id: "tpl-termite-trench",
    name: "Termite Liquid Trench & Treat (Taurus SC)",
    description: "Continuous perimeter liquid chemical barrier trenching along foundation with termiticide rodding.",
    defaultPriceCents: 85000, // $850.00
    category: "Termites",
  },
  {
    id: "tpl-rodent-exclusion",
    name: "Rodent Exclusion & Attic Trapping",
    description: "Hardware cloth sealing of crawl vents, pipe penetrations, roof returns, plus multi-catch trap setup and 14-day reset.",
    defaultPriceCents: 45000, // $450.00
    category: "Rodents",
  },
  {
    id: "tpl-bedbug-treatment",
    name: "Bedbug Thermal & Chemical Eradication",
    description: "Room-by-room preparation, targeted residual application to mattress encasements, baseboards, and void injection.",
    defaultPriceCents: 65000, // $650.00
    category: "Specialty",
  },
  {
    id: "tpl-flea-tick-yard",
    name: "Flea & Tick Outdoor Turf Treatment",
    description: "Insect growth regulator (IGR) broadcast treatment across lawn, fence lines, and dog runs.",
    defaultPriceCents: 16000, // $160.00
    category: "Specialty",
  },
];


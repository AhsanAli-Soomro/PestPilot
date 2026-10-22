export interface ChemicalProduct {
  name: string;
  manufacturer: string;
  epaRegNumber: string;
  activeIngredient: string;
  concentration: string;
  targetPests: string[];
  standardDilution: string;
  applicationType: "Liquid Spray" | "Gel Bait" | "Granular / Dust" | "Rodenticide Block" | "Aerosol / Foam";
  safetyNotes: string;
}

export const EPA_CHEMICAL_DIRECTORY: ChemicalProduct[] = [
  {
    name: "Talstar P Professional",
    manufacturer: "FMC Corporation",
    epaRegNumber: "279-3206",
    activeIngredient: "Bifenthrin",
    concentration: "7.9%",
    targetPests: ["Ants", "Spiders", "Cockroaches", "Mosquitoes", "Ticks", "Termites"],
    standardDilution: "0.5 to 1.0 fl oz per gallon of water",
    applicationType: "Liquid Spray",
    safetyNotes: "Approved for indoor crack/crevice and outdoor perimeter barrier. Keep pets and children away until spray is completely dry.",
  },
  {
    name: "Termidor SC",
    manufacturer: "BASF",
    epaRegNumber: "7969-210",
    activeIngredient: "Fipronil",
    concentration: "9.1%",
    targetPests: ["Subterranean Termites", "Drywood Termites", "Carpenter Ants", "Acrobat Ants"],
    standardDilution: "0.8 fl oz per gallon of water (0.06% finished dilution)",
    applicationType: "Liquid Spray",
    safetyNotes: "Non-repellent transfer technology. Federal label prohibits broadcast indoor applications. Max 2 applications per year around structures.",
  },
  {
    name: "Suspend SC",
    manufacturer: "Envu (Bayer)",
    epaRegNumber: "432-763",
    activeIngredient: "Deltamethrin",
    concentration: "4.75%",
    targetPests: ["Bedbugs", "Fleas", "Roaches", "Boxelder Bugs", "Silverfish", "Crickets"],
    standardDilution: "0.25 to 0.75 fl oz per gallon of water",
    applicationType: "Liquid Spray",
    safetyNotes: "Micro-encapsulated formulation. Ideal for mattress tufts and bedbug harborage zones. Zero odor, non-staining.",
  },
  {
    name: "Advion Cockroach Gel Bait",
    manufacturer: "Syngenta",
    epaRegNumber: "100-1484",
    activeIngredient: "Indoxacarb",
    concentration: "0.6%",
    targetPests: ["German Cockroaches", "American Cockroaches", "Oriental Cockroaches"],
    standardDilution: "Ready-to-use (1-3 spots per 10 linear feet)",
    applicationType: "Gel Bait",
    safetyNotes: "Bio-activation via insect metabolic enzymes. Apply in unexposed cracks, hinges, and behind kitchen appliances. Do not spray insecticide over bait placements.",
  },
  {
    name: "Demand CS",
    manufacturer: "Syngenta",
    epaRegNumber: "100-1066",
    activeIngredient: "Lambda-Cyhalothrin",
    concentration: "9.7%",
    targetPests: ["Scorpions", "Black Widows", "Wasps", "Carpenter Bees", "Mosquitoes", "Ants"],
    standardDilution: "0.4 to 0.8 fl oz per gallon of water",
    applicationType: "Liquid Spray",
    safetyNotes: "iCAP microencapsulation provides superior residual on porous brick and concrete. Outstanding knockdown for scorpions and outdoor perimeter barriers.",
  },
  {
    name: "Alpine WSG Water Soluble Granule",
    manufacturer: "BASF",
    epaRegNumber: "499-561",
    activeIngredient: "Dinotefuran",
    concentration: "40.0%",
    targetPests: ["German Roaches", "Ants", "Bedbugs", "House Flies", "Fleas"],
    standardDilution: "10 to 30 grams per gallon of water",
    applicationType: "Liquid Spray",
    safetyNotes: "Reduced Risk chemical non-repellent neonicotinoid. Approved for commercial food handling establishments.",
  },
  {
    name: "Contrac All-Weather Blox",
    manufacturer: "Bell Laboratories",
    epaRegNumber: "12455-79",
    activeIngredient: "Bromadiolone",
    concentration: "0.005%",
    targetPests: ["Norway Rats", "Roof Rats", "House Mice"],
    standardDilution: "Ready-to-use (1 to 8 blocks per tamper-resistant station)",
    applicationType: "Rodenticide Block",
    safetyNotes: "Second-generation anticoagulant. Must be deployed inside tamper-resistant bait stations anchored in outdoor perimeters or subfloors.",
  },
  {
    name: "Premise Foam",
    manufacturer: "Envu (Bayer)",
    epaRegNumber: "432-1391",
    activeIngredient: "Imidacloprid",
    concentration: "0.05%",
    targetPests: ["Drywood Termites", "Subterranean Termites", "Carpenter Ants", "Wood-Boring Beetles"],
    standardDilution: "Ready-to-use aerosol foam (30:1 expansion ratio)",
    applicationType: "Aerosol / Foam",
    safetyNotes: "Pressurized foam expands into wall voids, pipe chases, and gallery wood cavities where liquids cannot penetrate.",
  },
];


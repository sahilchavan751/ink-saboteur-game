// Paired prompts bank for Ink Saboteur
export const PROMPT_PAIRS = [
  {
    category: "Landmarks & Space",
    promptA: "Eiffel Tower",
    promptB: "Space Rocket",
    hint: "Tall vertical triangular structure"
  },
  {
    category: "Food & Math",
    promptA: "Pizza Slice",
    promptB: "Pie Chart",
    hint: "Triangular wedge in a circle"
  },
  {
    category: "Animals & Construction",
    promptA: "Giraffe",
    promptB: "Construction Crane",
    hint: "Long towering neck with dots/beams"
  },
  {
    category: "Vehicles",
    promptA: "Bicycle",
    promptB: "Motorcycle",
    hint: "Two wheels with handlebars"
  },
  {
    category: "Nature & Fire",
    promptA: "Volcano Eruption",
    promptB: "Campfire with Logs",
    hint: "Mountain/cone with rising flames"
  },
  {
    category: "Music",
    promptA: "Acoustic Guitar",
    promptB: "Violin",
    hint: "Curved wooden body with neck and strings"
  },
  {
    category: "Everyday Objects",
    promptA: "Umbrella",
    promptB: "Mushroom",
    hint: "Dome canopy on a straight stem"
  },
  {
    category: "Everyday Objects",
    promptA: "Lightbulb",
    promptB: "Hot Air Balloon",
    hint: "Bulbous top tapering down to a base/basket"
  },
  {
    category: "Deep Sea",
    promptA: "Great White Shark",
    promptB: "Submarine",
    hint: "Sleek aquatic hull with dorsal fin/conning tower"
  },
  {
    category: "Aerial",
    promptA: "Jellyfish",
    promptB: "Parachute",
    hint: "Curved dome with hanging strings/tentacles"
  },
  {
    category: "Cosmos & Culture",
    promptA: "Saturn with Rings",
    promptB: "Sombrero Hat",
    hint: "Central dome encircled by a wide flat brim"
  },
  {
    category: "Mythical & Prehistoric",
    promptA: "Fire-breathing Dragon",
    promptB: "T-Rex Dinosaur",
    hint: "Reptilian beast standing on hind legs with teeth"
  },
  {
    category: "Food",
    promptA: "Cheeseburger",
    promptB: "Pancake Stack",
    hint: "Layered circular discs stacked high"
  },
  {
    category: "Food & Lights",
    promptA: "Ice Cream Cone",
    promptB: "Torch / Flashlight",
    hint: "Cone handle with a scoop/beam emerging from top"
  },
  {
    category: "Timepieces",
    promptA: "Big Ben (Clock Tower)",
    promptB: "Grandfather Clock",
    hint: "Tall rectangular tower with a circular clock face"
  },
  {
    category: "Garden & Reptiles",
    promptA: "Coiled Snake",
    promptB: "Garden Hose",
    hint: "Winding coiled cord with a nozzle or head"
  },
  {
    category: "Tools & Bakery",
    promptA: "Knight's Sword",
    promptB: "French Baguette",
    hint: "Long narrow cylinder with angled cuts or hilt"
  },
  {
    category: "Winter & Games",
    promptA: "Snowman",
    promptB: "Bowling Pins",
    hint: "Stacked round white spheres"
  },
  {
    category: "Aviation & Wind",
    promptA: "Windmill",
    promptB: "Helicopter",
    hint: "Spinning propeller blades on a central hub"
  },
  {
    category: "Weather & Treats",
    promptA: "Tornado",
    promptB: "Soft-serve Ice Cream Swirl",
    hint: "Funnel spiraling wider at the top"
  },
  {
    category: "Characters",
    promptA: "Pirate with Eyepatch",
    promptB: "Astronaut with Helmet",
    hint: "Face covered with visor or single eye patch"
  },
  {
    category: "Creatures",
    promptA: "Spider",
    promptB: "Octopus",
    hint: "Bulbous body with 8 radiating limbs"
  },
  {
    category: "Tech & Travel",
    promptA: "Smart Watch",
    promptB: "Magnetic Compass",
    hint: "Circular dial strapped or cased with needles"
  },
  {
    category: "Magic & Music",
    promptA: "Magic Wand with Sparkles",
    promptB: "Stage Microphone",
    hint: "Straight rod with round bulb/star on the tip"
  },
  {
    category: "Sports & Web",
    promptA: "Basketball Hoop",
    promptB: "Dreamcatcher",
    hint: "Circular ring with woven netting dangling down"
  },
  {
    category: "Night & Stealth",
    promptA: "Bat Flying",
    promptB: "Stealth Fighter Jet",
    hint: "Sharp angular swept wings with dark silhouette"
  },
  {
    category: "Food & Safety",
    promptA: "Glazed Donut",
    promptB: "Lifesaver Buoy",
    hint: "Torus ring with sprinkles or stripes"
  },
  {
    category: "Tools & Nature",
    promptA: "Pair of Scissors",
    promptB: "Crab with Pincers",
    hint: "Two sharp intersecting blades or claws"
  }
];

export const getRandomPromptPair = () => {
  const index = Math.floor(Math.random() * PROMPT_PAIRS.length);
  return PROMPT_PAIRS[index];
};

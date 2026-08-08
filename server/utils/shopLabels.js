const CATEGORY_MAP = {
  armors: "Armor",
  artefacts: "Artifacts",
  bags: "Bags",
  capes: "Capes",
  consumables: "Consumables",
  crafting: "Crafting",
  farming: "Farming",
  furniture: "Furniture",
  gathering: "Gathering",
  head: "Helmets",
  mounts: "Mounts",
  offhands: "Off-hands",
  other: "Other",
  shoes: "Shoes/Boots",
  weapons: "Weapons"
};

const SUBCATEGORY1_MAP = {
  cloth_armor: "Cloth Armor",
  cloth_helmet: "Cloth Helmet",
  cloth_shoes: "Cloth Shoes",
  leather_armor: "Leather Armor",
  leather_helmet: "Leather Helmet",
  leather_shoes: "Leather Shoes",
  plate_armor: "Plate Armor",
  plate_helmet: "Plate Helmet",
  plate_shoes: "Plate Shoes",
  arcanestaff: "Arcane Staff",
  cursestaff: "Cursed Staff",
  firestaff: "Fire Staff",
  froststaff: "Frost Staff",
  holystaff: "Holy Staff",
  naturestaff: "Nature Staff",
  shapeshifterstaff: "Shapeshifter Staff",
  basemounts: "Base Mounts",
  battle_mount: "Battle Mounts",
  raremounts: "Rare Mounts",
  cityresources: "City Resources",
  refinedresources: "Refined Resources",
  repairkit: "Repair Kit",
  shieldtype: "Shields",
  torchtype: "Torches",
  farmingproducts: "Farming Products",
  hardcoreexpeditions: "HCE Maps",
  luxurygoods: "Luxury Goods",
  lootitem: "Loot Items",
  gatheringgear: "Gathering Gear",
  tracking: "Tracking Items",
  arcanestaff_avalon: "Avalonian Arcane Staff",
  arcanestaff_crystal: "Crystal Arcane Staff",
  arcanestaff_hell: "Occult Staff",
  arcanestaff_morgana: "Malevolent Locus",
  arcanestaff_undead: "Witchwork Staff",
};

const PREFIXES = [
  /^(Beginner's|Novice's|Journeyman's|Adept's|Expert's|Master's|Grandmaster's|Elder's|Apprentice's|Recruiter's)\s+/i,
  /^(Tame|Baby|Elite|Tame Elite|Saddled|Saddled Elite|Swiftclaw|Direbear|Direboar|Direwolf|Winter Bear|Swamp Dragon|Swamp Salamander|Bighorn Ram|Greywolf|Wild Boar|Moabird|Moose|Mystic Owl|Terrorbird)\s+/i,
  /^(Minor|Major|Basic|Pure|Fine|Rugged|Excellent|Rare|Common|Faceted)\s+/i,
  /^(Uncommon|Exceptional|Flawless|Standard)\s+/i,
];

function humanizeKey(key) {
  if (!key) return "";
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function cleanItemName(name) {
  if (!name) return "";
  let clean = name;
  let changed = true;
  while (changed) {
    changed = false;
    for (const regex of PREFIXES) {
      const next = clean.replace(regex, "");
      if (next !== clean) {
        clean = next;
        changed = true;
      }
    }
  }
  return clean.trim();
}

function getBestLabelForGroup(key, names) {
  const cleanedNames = names.map(cleanItemName).filter(Boolean);
  if (cleanedNames.length === 0) {
    return humanizeKey(key);
  }

  const counts = {};
  let maxCount = 0;
  let bestName = "";

  for (const name of cleanedNames) {
    counts[name] = (counts[name] || 0) + 1;
    if (counts[name] > maxCount) {
      maxCount = counts[name];
      bestName = name;
    } else if (counts[name] === maxCount) {
      if (name.length < bestName.length) {
        bestName = name;
      }
    }
  }

  return bestName || humanizeKey(key);
}

let labelsCache = null;

async function getOrBuildLabels(pool) {
  if (labelsCache) return labelsCache;

  const result = await pool.query(
    `SELECT shop_category, shop_subcategory1, shop_subcategory2, shop_subcategory3,
            localized_names ->> 'EN-US' AS english_name
     FROM items
     WHERE shop_category IS NOT NULL`
  );

  const categoryLabels = { ...CATEGORY_MAP };
  const sub1Labels = { ...SUBCATEGORY1_MAP };
  const sub2Labels = {};
  const sub3Labels = {};

  const sub2Samples = {};
  const sub3Samples = {};

  for (const row of result.rows) {
    const { shop_category, shop_subcategory1, shop_subcategory2, shop_subcategory3, english_name } = row;

    if (shop_category && !categoryLabels[shop_category]) {
      categoryLabels[shop_category] = humanizeKey(shop_category);
    }
    if (shop_subcategory1 && !sub1Labels[shop_subcategory1]) {
      sub1Labels[shop_subcategory1] = humanizeKey(shop_subcategory1);
    }

    if (shop_subcategory2 && english_name) {
      if (!sub2Samples[shop_subcategory2]) sub2Samples[shop_subcategory2] = [];
      sub2Samples[shop_subcategory2].push(english_name);
    }
    if (shop_subcategory3 && english_name) {
      if (!sub3Samples[shop_subcategory3]) sub3Samples[shop_subcategory3] = [];
      sub3Samples[shop_subcategory3].push(english_name);
    }
  }

  for (const [key, names] of Object.entries(sub2Samples)) {
    sub2Labels[key] = getBestLabelForGroup(key, names);
  }

  for (const [key, names] of Object.entries(sub3Samples)) {
    sub3Labels[key] = getBestLabelForGroup(key, names);
  }

  labelsCache = {
    shop_category: categoryLabels,
    shop_subcategory1: sub1Labels,
    shop_subcategory2: sub2Labels,
    shop_subcategory3: sub3Labels,
  };

  return labelsCache;
}

module.exports = {
  cleanItemName,
  humanizeKey,
  getOrBuildLabels,
};

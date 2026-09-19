const names = [
  ["NovaKnight", 58, 245670, "Skyforge"],
  ["PixelRider", 52, 198430, "Skyforge"],
  ["GameSensei", 49, 176220, "DragonBorn"],
  ["CloudChaser", 46, 152980, "DragonBorn"],
  ["ByteWarrior", 45, 148670, "NightRaiders"],
  ["NeoPlayer", 43, 138550, "NightRaiders"],
  ["ShadowFox", 41, 129410, "Starfall"],
  ["ZenMaster", 40, 121300, "Starfall"],
  ["StarDrifter", 38, 118760, "PixelGuild"],
  ["LunaBlade", 37, 112940, "PixelGuild"],
  ["RuneRunner", 36, 108520, "Skyforge"],
  ["CrystalMage", 35, 104180, "DragonBorn"],
  ["ArcadeWolf", 34, 101740, "NightRaiders"],
  ["TurboTurtle", 33, 97880, "Starfall"],
  ["MoonRanger", 32, 94210, "PixelGuild"],
  ["FireSprite", 31, 91140, "Skyforge"],
  ["StormByte", 30, 88430, "DragonBorn"],
  ["QuestFox", 29, 85120, "NightRaiders"],
  ["CloudMage", 28, 82110, "Starfall"],
  ["PixelGhost", 27, 79450, "PixelGuild"],
  ["FrostKnight", 26, 76300, "Skyforge"],
  ["SolarAce", 25, 73120, "DragonBorn"],
  ["MagmaKid", 24, 70210, "NightRaiders"],
  ["AquaDash", 23, 67890, "Starfall"],
  ["ThunderCat", 22, 65240, "PixelGuild"],
  ["MysticRay", 21, 62980, "Skyforge"],
  ["DungeonDuke", 20, 60120, "DragonBorn"],
  ["RocketRook", 19, 57430, "NightRaiders"],
  ["JadeJumper", 18, 54820, "Starfall"],
  ["GoldenGoblin", 17, 52110, "PixelGuild"]
];

const teamSizes = names.reduce((acc, [, , , team]) => {
  acc[team] = (acc[team] || 0) + 1;
  return acc;
}, {});

export const leaderboardData = names.map(
  ([name, level, score, team], index) => ({
    rank: index + 1,
    name,
    score,
    team,
    teamSize: teamSizes[team],

    avatar: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(name)}`,

    badges: (index % 3) + 2
  })
);
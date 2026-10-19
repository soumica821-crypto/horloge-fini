IMG = "https://static.wikia.nocookie.net/stealabr/images/{}/revision/latest/scale-to-width-down/150"

RARITY_ORDER = ["Common", "Rare", "Epic", "Legendary", "Mythic", "Brainrot God", "Secret", "OG"]

MUTATIONS = {
    "Normal": 1.0, "Gold": 1.25, "Diamond": 1.5, "Bloodrot": 2.5, "Candy": 4.0, "Lava": 6.0,
    "Galaxy": 7.0, "Yin-Yang": 7.5, "Radioactive": 8.5, "Cursed": 9.0, "Divine": 10.0,
}

# (name, rarity, base income per second, image path) - base values approximate, editable later
_RAW = [
    ("Noobini Pizzanini", "Common", 1, "8/85/New_Noobini_Pizzanini.png"),
    ("Lirilì Larilà", "Common", 3, "0/0f/Liril%C3%AC_Laril%C3%A0.png"),
    ("Tim Cheese", "Common", 5, "1/11/Tim_Cheese.png"),
    ("Fluriflura", "Common", 7, "7/77/Fluriflura.png"),
    ("Talpa Di Fero", "Common", 9, "b/b1/Talpa_Di_Fero.png"),
    ("Svinina Bombardino", "Common", 10, "4/45/Svinina_Bombardino.png"),
    ("Pipi Kiwi", "Common", 13, "9/92/Pipi_Kiwi.png"),
    ("Trippi Troppi", "Rare", 15, "f/f0/Trippi_Troppi.png"),
    ("Gangster Footera", "Rare", 30, "7/73/Gangster_Footera.png"),
    ("Bandito Bobritto", "Rare", 35, "7/7e/Oi_Oi_Oi.png"),
    ("Boneca Ambalabu", "Rare", 40, "9/9c/Boneca_Ambalabu.png"),
    ("Cacto Hipopotamo", "Rare", 50, "b/bf/Cacto_Hipopotamo.png"),
    ("Ta Ta Ta Ta Sahur", "Rare", 55, "e/e2/Ta_Ta_Ta_Ta_Sahur.png"),
    ("Tric Trac Baraboom", "Rare", 65, "5/5a/Tric-Trac-Baraboom-5.png"),
    ("Cappuccino Assassino", "Epic", 75, "4/4e/Cappuccino_Assassino.png"),
    ("Brr Brr Patapim", "Epic", 100, "6/6d/Lil_wayne.png"),
    ("Trulimero Trulicina", "Epic", 125, "d/d3/Trulimero_Trulicina.png"),
    ("Bambini Crostini", "Epic", 135, "9/90/Bambini_Crostini.png"),
    ("Bananita Dolphinita", "Epic", 150, "e/e4/Bananita_Dolphinita.png"),
    ("Perochello Lemonchello", "Epic", 160, "1/13/Perochello_Lemonchello.png"),
    ("Brri Brri Bicus Dicus Bombicus", "Epic", 175, "4/4e/Berry_berry_bicus_dickus.png"),
    ("Salamino Penguino", "Epic", 250, "f/f4/Salamino_Penguino.png"),
    ("Burbaloni Loliloli", "Legendary", 300, "c/c6/Burbaloni_Loliloli.png"),
    ("Chimpanzini Bananini", "Legendary", 300, "0/0b/Default_Chimpanzini_Bananini.png"),
    ("Ballerina Cappuccina", "Legendary", 500, "6/6c/Ballerina_Cappuccina.png"),
    ("Chef Crabracadabra", "Legendary", 600, "2/26/Chef_Crabracadabra.png"),
    ("Lionel Cactuseli", "Legendary", 650, "4/44/Lionel_Cactuseli.png"),
    ("Glorbo Fruttodrillo", "Legendary", 750, "6/60/Glorbo_Fruttodrillo.png"),
    ("Blueberrinni Octopusini", "Legendary", 1000, "8/81/Blueberrinni_Octopusini.png"),
    ("Strawberrelli Flamingelli", "Legendary", 1100, "2/21/Strawberrelli_Flamingelli.png"),
    ("Pandaccini Bananini", "Legendary", 1200, "0/03/Pandaccini_Bananini.png"),
    ("Sigma Boy", "Legendary", 1300, "1/1d/Sigma_Boy.png"),
    ("Cocosini Mama", "Mythic", 2500, "c/ca/Cocosini_Mama.png"),
    ("Caramello Filtrello", "Mythic", 3500, "d/da/Caramello_Filtrello.png"),
    ("Clickerino Crabo", "Mythic", 5000, "9/9f/Clicker_Crabo.png"),
    ("Bandito Axolito", "Mythic", 7500, "e/eb/Bandito_Axolito.png"),
    ("Signore Carapace", "Brainrot God", 25000, "4/4a/Default_Signore_Carapace.png"),
    ("Gattatino Neonino", "Brainrot God", 35000, "f/fd/Gattatino_Neonino.png"),
    ("Statutino Libertino", "Brainrot God", 75000, "5/5e/Default_Statutino_Libertino.png"),
    ("Chimpanzini Spiderini", "Secret", 1_750_000, "2/25/Chimpanzini_Spiderini.png"),
    ("Tung Tung Tung Sahur", "Secret", 5_000_000, "e/e3/Tung_Tung_Tung_Sahur.png"),
    ("Plant Bros", "Secret", 15_000_000, "9/9f/Plant_Bros.png"),
    ("Dragon Gingerini", "Secret", 50_000_000, "a/a6/Dragon_Gingerini.png"),
    ("Dragon Skeletonini", "Secret", 80_000_000, "5/51/Dragon_Skeletonini.png"),
    ("Dragon Aquanini", "Secret", 120_000_000, "0/0c/Dragon_aquanini_but_high_graphism.png"),
    ("Griffin", "Secret", 150_000_000, "f/f8/Griffin.png"),
    ("Hydra Dragon Cannelloni", "Secret", 200_000_000, "e/ee/Hydra_Dragon_Cannelloni.png"),
    ("Los Dragons", "Secret", 250_000_000, "4/43/Los_Dragons.png"),
    ("Phoenix", "Secret", 300_000_000, "c/c1/Phoenix.png"),
    ("Skibidi Toilet", "OG", 450_000_000, "a/a7/Default_Skibidi_Toilet.png"),
    ("John Pork", "OG", 500_000_000, "d/d2/John_Pork.png"),
    ("Meowl", "OG", 600_000_000, "6/62/Meowl.png"),
    ("Strawberry Elephant", "OG", 700_000_000, "7/7b/Strawberry_Elephant.png"),
    ("Headless Horseman", "OG", 750_000_000, "2/2a/Horseman.webp"),
    ("Spyder Elephant", "OG", 1_000_000_000, "3/3b/Spyder_Elephant_New.png"),
]

BRAINROTS = [
    {"name": n, "rarity": r, "income": float(i), "image": IMG.format(p)} for n, r, i, p in _RAW
]
BY_NAME = {b["name"].lower(): b for b in BRAINROTS}

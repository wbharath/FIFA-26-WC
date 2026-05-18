import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import json
import urllib.request

# Load historical World Cup data
df = pd.read_csv('ml/WorldCupMatches.csv')
df = df.dropna(subset=['Home Team Name', 'Away Team Name', 'Home Team Goals', 'Away Team Goals'])

# Normalize team names to match our API
name_map = {
    'USA': 'USA', 'United States': 'USA',
    'Korea Republic': 'South Korea', 'South Korea': 'South Korea',
    'IR Iran': 'Iran', 'Iran': 'Iran',
    'England': 'England', 'C?te d\'Ivoire': 'Ivory Coast',
    'Ivory Coast': 'Ivory Coast', "C\x99te d'Ivoire": 'Ivory Coast',
    'Bosnia and Herzegovina': 'Bosnia-Herzegovina',
    'Czech Republic': 'Czechia', 'Czechia': 'Czechia',
    'DR Congo': 'Congo DR', 'Congo DR': 'Congo DR',
    'Cape Verde': 'Cape Verde Islands',
    'Cura?ao': 'Curaçao', 'Curaçao': 'Curaçao',
    'rn">Germany': 'Germany',
    'rn">Serbia and Montenegro': 'Serbia',
    'rn">Yugoslavia': 'Serbia',
    'Trinidad and Tobago': 'Trinidad and Tobago',
}

def normalize(name):
    return name_map.get(str(name).strip(), str(name).strip())

# FIFA Rankings (approximate 2026)
fifa_rankings = {
    "Argentina": 1, "France": 2, "England": 3, "Belgium": 4,
    "Brazil": 5, "Portugal": 6, "Netherlands": 7, "Spain": 8,
    "Germany": 9, "Croatia": 10, "Italy": 11, "Morocco": 12,
    "USA": 13, "Mexico": 14, "Switzerland": 15, "Colombia": 16,
    "Uruguay": 17, "Denmark": 18, "Japan": 19, "Senegal": 20,
    "South Korea": 21, "Australia": 22, "Poland": 23, "Canada": 24,
    "Norway": 25, "Austria": 26, "Turkey": 27, "Ecuador": 28,
    "Sweden": 29, "Scotland": 30, "Tunisia": 31, "Ivory Coast": 32,
    "Algeria": 33, "Egypt": 34, "Saudi Arabia": 35, "Iran": 36,
    "Iraq": 37, "Czechia": 38, "South Africa": 39, "Ghana": 40,
    "Serbia": 41, "Uzbekistan": 42, "Jordan": 43, "Qatar": 44,
    "Panama": 45, "Haiti": 46, "Bosnia-Herzegovina": 47,
    "Cape Verde Islands": 48, "Congo DR": 49, "New Zealand": 50,
    "Paraguay": 51, "Curaçao": 52
}

def get_ranking(team):
    return fifa_rankings.get(team, 50)

def prepare_features(home_team, away_team):
    home_rank = get_ranking(home_team)
    away_rank = get_ranking(away_team)
    rank_diff = away_rank - home_rank
    return [rank_diff, home_rank, away_rank]

# Prepare training data from full historical dataset
X = []
y = []

for _, row in df.iterrows():
    home = normalize(row['Home Team Name'])
    away = normalize(row['Away Team Name'])
    hg = int(row['Home Team Goals'])
    ag = int(row['Away Team Goals'])

    features = prepare_features(home, away)
    X.append(features)
    if hg > ag:
        y.append(1)
    elif hg < ag:
        y.append(0)
    else:
        y.append(2)

X = np.array(X)
y = np.array(y)

# Train model
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

model = LogisticRegression(max_iter=1000)
model.fit(X_scaled, y)

print(f"Model trained on {len(X)} matches")
print(f"Training accuracy: {model.score(X_scaled, y):.2f}")

# Fetch real 2026 fixtures from API
print("\nFetching 2026 fixtures from API...")
req = urllib.request.Request(
    'https://api.football-data.org/v4/competitions/WC/matches',
    headers={'X-Auth-Token': '7cbee2571de14a7191573b1e5d2dc6b9'}
)
with urllib.request.urlopen(req) as response:
    match_data = json.loads(response.read())

print(f"Fetched {len(match_data['matches'])} fixtures")

# Predict all 2026 fixtures
results = []
for m in match_data['matches']:
    home = m['homeTeam']['name']
    away = m['awayTeam']['name']

    if not home or not away:
        results.append({
            "home": "TBD",
            "away": "TBD",
            "stage": m['stage'],
            "utcDate": m['utcDate'],
            "predicted_winner": "TBD",
            "home_win_prob": 0.5,
            "draw_prob": 0.1,
            "away_win_prob": 0.5
        })
        continue

    features = prepare_features(normalize(home), normalize(away))
    features_scaled = scaler.transform([features])
    probs = model.predict_proba(features_scaled)[0]
    pred = model.predict(features_scaled)[0]

    winner = home if pred == 1 else (away if pred == 0 else "Draw")

    results.append({
        "home": home,
        "away": away,
        "stage": m['stage'],
        "group": m.get('group'),
        "utcDate": m['utcDate'],
        "predicted_winner": winner,
        "home_win_prob": round(float(probs[1]), 2),
        "draw_prob": round(float(probs[2]), 2),
        "away_win_prob": round(float(probs[0]), 2)
    })
    print(f"{home} vs {away}: {winner}")

# Save results
with open('ml/predictions.json', 'w') as f:
    json.dump(results, f, indent=2)

print(f"\n{len(results)} predictions saved to ml/predictions.json")
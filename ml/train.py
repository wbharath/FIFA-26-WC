import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
import json
import urllib.request

# ── Load & clean ──────────────────────────────────────────────────────────────
df = pd.read_csv('ml/WorldCupMatches.csv')
df = df.dropna(subset=['Home Team Name', 'Away Team Name', 'Home Team Goals', 'Away Team Goals'])
df = df[df['Home Team Name'].str.strip() != '']

# ── Name normalisation ────────────────────────────────────────────────────────
name_map = {
    'USA': 'USA', 'United States': 'USA',
    'Korea Republic': 'South Korea', 'South Korea': 'South Korea',
    'IR Iran': 'Iran', 'Iran': 'Iran',
    'C?te d\'Ivoire': 'Ivory Coast', 'Ivory Coast': 'Ivory Coast',
    "C\x99te d'Ivoire": 'Ivory Coast', "Côte d'Ivoire": 'Ivory Coast',
    'Bosnia and Herzegovina': 'Bosnia-Herzegovina',
    'Czech Republic': 'Czechia', 'Czechia': 'Czechia',
    'DR Congo': 'Congo DR', 'Congo DR': 'Congo DR',
    'Cape Verde': 'Cape Verde Islands',
    'C?te d\'Ivoire': 'Ivory Coast',
    'rn">Germany': 'Germany',
    'rn">Serbia and Montenegro': 'Serbia',
    'rn">Yugoslavia': 'Serbia',
    'Germany FR': 'Germany',
    'Soviet Union': 'Russia',
    'Trinidad and Tobago': 'Trinidad and Tobago',
    'Republic of Ireland': 'Ireland',
    'rn">Republic of Ireland': 'Ireland',
    'rn">Bosnia and Herzegovina': 'Bosnia-Herzegovina',
    'rn">Trinidad and Tobago': 'Trinidad and Tobago',
    'rn">United Arab Emirates': 'UAE',
    'Dutch East Indies': 'Indonesia',
    'German DR': 'Germany',
    'Yugoslavia': 'Serbia',
    'Czechoslovakia': 'Czechia',
    'Scotland': 'Scotland',
    'Wales': 'Wales',
    'Northern Ireland': 'Northern Ireland',
}

def normalize(name):
    name = str(name).strip()
    return name_map.get(name, name)

df['home'] = df['Home Team Name'].apply(normalize)
df['away'] = df['Away Team Name'].apply(normalize)
df['hg'] = df['Home Team Goals'].astype(int)
df['ag'] = df['Away Team Goals'].astype(int)
df['year'] = df['Year'].astype(int)

# ── FIFA Rankings (approximate 2026) ─────────────────────────────────────────
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
    "Paraguay": 51, "Curaçao": 52,
    # Legacy teams
    "Russia": 28, "Ukraine": 22, "Wales": 17, "Ireland": 33,
    "Northern Ireland": 55, "Slovakia": 48, "Slovenia": 57,
    "Romania": 46, "Bulgaria": 70, "Greece": 53,
    "Nigeria": 40, "Cameroon": 43, "Senegal": 20,
    "Costa Rica": 44, "Honduras": 75, "Jamaica": 60,
    "Peru": 38, "Chile": 30, "Bolivia": 80, "Venezuela": 55,
    "Indonesia": 130, "Cuba": 90, "El Salvador": 85,
    "Kuwait": 110, "UAE": 65, "Saudi Arabia": 35,
    "China PR": 88, "Korea DPR": 100, "Thailand": 95,
    "Angola": 95, "Togo": 100, "Zimbabwe": 110,
}

def ranking_to_win_rate(ranking):
    # Convert FIFA ranking to an estimated win rate (rank 1 ≈ 0.65, rank 60 ≈ 0.30)
    return max(0.20, 0.65 - (ranking - 1) * (0.35 / 59))

HOST_NATIONS = {'Mexico', 'USA', 'Canada'}

def get_ranking(team):
    base = fifa_rankings.get(team, 60)
    # Host nation bonus — effectively boost their ranking
    if team in HOST_NATIONS:
        base = max(1, base - 8)  # 8 rank boost for hosts
    return base


# ── Confederation mapping ─────────────────────────────────────────────────────
confederation_strength = {
    # 1 = strongest historically
    "Argentina": 1, "Brazil": 1, "Uruguay": 1, "Colombia": 1,
    "Chile": 1, "Paraguay": 1, "Ecuador": 1, "Peru": 1, "Bolivia": 1,
    "Germany": 2, "France": 2, "Spain": 2, "Italy": 2, "England": 2,
    "Netherlands": 2, "Portugal": 2, "Belgium": 2, "Croatia": 2,
    "Denmark": 2, "Sweden": 2, "Switzerland": 2, "Austria": 2,
    "Norway": 2, "Poland": 2, "Czechia": 2, "Russia": 2, "Serbia": 2,
    "Romania": 2, "Bulgaria": 2, "Greece": 2, "Hungary": 2,
    "Scotland": 2, "Wales": 2, "Turkey": 2, "Slovakia": 2,
    "Slovenia": 2, "Ukraine": 2, "Ireland": 2,
}

def get_confederation_strength(team):
    return confederation_strength.get(team, 3)

# ── Build per-team historical stats from WC data ─────────────────────────────
def build_team_stats(df):
    stats = {}
    for _, row in df.iterrows():
        h, a = row['home'], row['away']
        hg, ag = row['hg'], row['ag']
        yr = row['year']
        weight = 1.0 + (yr - 1930) / 100  # recent tournaments weighted more

        for team, gf, ga, is_win, is_draw in [
            (h, hg, ag, hg > ag, hg == ag),
            (a, ag, hg, ag > hg, hg == ag)
        ]:
            if team not in stats:
                stats[team] = {
                    'games': 0, 'wins': 0, 'draws': 0, 'losses': 0,
                    'gf': 0, 'ga': 0, 'weighted_wins': 0, 'weighted_games': 0,
                    'appearances': set(), 'last2_wins': 0, 'last2_games': 0
                }
            s = stats[team]
            s['games'] += 1
            s['gf'] += gf
            s['ga'] += ga
            s['weighted_games'] += weight
            s['appearances'].add(row['year'])
            if is_win:
                s['wins'] += 1
                s['weighted_wins'] += weight
            elif is_draw:
                s['draws'] += 1
            else:
                s['losses'] += 1
            # Last 2 tournaments (2010, 2014)
            if yr >= 2010:
                s['last2_games'] += 1
                if is_win:
                    s['last2_wins'] += 1

    # Convert appearances set to count
    for team in stats:
        stats[team]['wc_appearances'] = len(stats[team]['appearances'])
        del stats[team]['appearances']
    return stats

team_stats = build_team_stats(df)

HOST_NATIONS = {'Mexico', 'USA', 'Canada'}

def get_team_features(team):
    s = team_stats.get(team)
    rank = get_ranking(team)
    rank_wr = ranking_to_win_rate(rank)

    if not s or s['games'] == 0:
        wr = rank_wr
        if team in HOST_NATIONS:
            wr = min(wr + 0.12, 0.75)
        return {
            'win_rate': wr,
            'avg_gf': 1.0 + (60 - rank) / 60,
            'avg_ga': 1.0 + rank / 60,
            'weighted_win_rate': wr,
            'wc_appearances': 0,
            'last2_win_rate': wr
        }

    games = s['games']
    blend = min(games / 20, 1.0)
    hist_wr = s['wins'] / games

    blended_wr = blend * hist_wr + (1 - blend) * rank_wr
    blended_wwr = blend * (s['weighted_wins'] / s['weighted_games']) + (1 - blend) * rank_wr
    blended_l2 = (s['last2_wins'] / s['last2_games']) if s['last2_games'] > 0 else rank_wr

    # Host nation boost — applied after blending
    if team in HOST_NATIONS:
        blended_wr = min(blended_wr + 0.12, 0.75)
        blended_wwr = min(blended_wwr + 0.12, 0.75)
        blended_l2 = min(blended_l2 + 0.12, 0.75)

    return {
        'win_rate': blended_wr,
        'avg_gf': s['gf'] / games,
        'avg_ga': s['ga'] / games,
        'weighted_win_rate': blended_wwr,
        'wc_appearances': min(s['wc_appearances'], 20) / 20,
        'last2_win_rate': blended_l2
    }
# ── H2H from historical data ──────────────────────────────────────────────────
def build_h2h(df):
    h2h = {}
    for _, row in df.iterrows():
        h, a = row['home'], row['away']
        hg, ag = row['hg'], row['ag']
        key = tuple(sorted([h, a]))
        if key not in h2h:
            h2h[key] = {h: 0, a: 0, 'draws': 0}
        if hg > ag:
            h2h[key][h] = h2h[key].get(h, 0) + 1
        elif ag > hg:
            h2h[key][a] = h2h[key].get(a, 0) + 1
        else:
            h2h[key]['draws'] = h2h[key].get('draws', 0) + 1
    return h2h

h2h_data = build_h2h(df)

def get_h2h_features(home, away):
    key = tuple(sorted([home, away]))
    if key not in h2h_data:
        return {'h2h_home_wr': 0.33, 'h2h_games': 0}
    h2h = h2h_data[key]
    total = sum(v for k, v in h2h.items() if k != 'draws') + h2h.get('draws', 0)
    if total == 0:
        return {'h2h_home_wr': 0.33, 'h2h_games': 0}
    home_wins = h2h.get(home, 0)
    return {
        'h2h_home_wr': home_wins / total,
        'h2h_games': min(total, 10) / 10  # normalize
    }

# ── Feature engineering ───────────────────────────────────────────────────────
def prepare_features(home, away):
    hr = get_ranking(home)
    ar = get_ranking(away)
    hf = get_team_features(home)
    af = get_team_features(away)
    h2h = get_h2h_features(home, away)
    hconf = get_confederation_strength(home)
    aconf = get_confederation_strength(away)

    rank_diff = (ar - hr) / 60          # normalize to ~[-1, 1]
    home_rank_norm = (60 - hr) / 60     # higher rank = closer to 1
    away_rank_norm = (60 - ar) / 60

    return [
        # Ranking features — repeated 3x to increase weight
        rank_diff,
        rank_diff,
        rank_diff,
        home_rank_norm,
        away_rank_norm,
        # Historical WC features
        hf['win_rate'] - af['win_rate'],
        hf['avg_gf'] - af['avg_gf'],
        hf['avg_ga'] - af['avg_ga'],
        hf['weighted_win_rate'] - af['weighted_win_rate'],
        hf['wc_appearances'] - af['wc_appearances'],
        hf['last2_win_rate'] - af['last2_win_rate'],
        # H2H
        h2h['h2h_home_wr'],
        h2h['h2h_games'],
        # Confederation
        hconf - aconf,
        # Absolute scoring ability
        hf['avg_gf'],
        af['avg_gf'],
    ]
# ── Build training set ────────────────────────────────────────────────────────
X, y = [], []
for _, row in df.iterrows():
    features = prepare_features(row['home'], row['away'])
    X.append(features)
    hg, ag = row['hg'], row['ag']
    if hg > ag:
        y.append(1)   # home win
    elif hg < ag:
        y.append(0)   # away win
    else:
        y.append(2)   # draw

X = np.array(X)
y = np.array(y)

# ── Train & evaluate ──────────────────────────────────────────────────────────
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

models = {
    'Logistic Regression': LogisticRegression(max_iter=1000, C=0.5),
    'Random Forest': RandomForestClassifier(n_estimators=200, max_depth=6, random_state=42),
    'Gradient Boosting': GradientBoostingClassifier(n_estimators=200, max_depth=4, random_state=42),
}

print(f"Training on {len(X)} matches\n")
best_model, best_score = None, 0

for name, m in models.items():
    cv_scores = cross_val_score(m, X_scaled, y, cv=5, scoring='accuracy')
    print(f"{name}: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
    if cv_scores.mean() > best_score:
        best_score = cv_scores.mean()
        best_model = m

print(f"\nBest model: {best_model.__class__.__name__} ({best_score:.3f})")
best_model.fit(X_scaled, y)
print(f"Training accuracy: {best_model.score(X_scaled, y):.3f}")

# ── Fetch 2026 fixtures from api-football ─────────────────────────────────────
print("\nFetching 2026 fixtures from api-football...")
req = urllib.request.Request(
    'https://v3.football.api-sports.io/fixtures?league=1&season=2026',
    headers={'x-apisports-key': '21323f57b939e87320101335bcb90d42'}
)
with urllib.request.urlopen(req) as response:
    fixture_data = json.loads(response.read())

fixtures = fixture_data.get('response', [])
print(f"Fetched {len(fixtures)} fixtures")

# Build group map from standings
req2 = urllib.request.Request(
    'https://v3.football.api-sports.io/standings?league=1&season=2026',
    headers={'x-apisports-key': '21323f57b939e87320101335bcb90d42'}
)
with urllib.request.urlopen(req2) as response:
    standings_data = json.loads(response.read())

group_map = {}
standings = standings_data['response'][0]['league']['standings'] if standings_data['response'] else []
for group_array in standings:
    for entry in group_array:
        group_map[entry['team']['id']] = entry['group']



print(f"Mexico rank: {get_ranking('Mexico')}")

# ── Predict all fixtures ──────────────────────────────────────────────────────
results = []
for m in fixtures:
    home_name = m['teams']['home']['name']
    away_name = m['teams']['away']['name']
    home_norm = normalize(home_name)
    away_norm = normalize(away_name)

    group = group_map.get(m['teams']['home']['id']) or group_map.get(m['teams']['away']['id'])

    if not home_name or not away_name:
        results.append({
            "fixture_id": m['fixture']['id'],
            "home": "TBD", "away": "TBD",
            "stage": m['league']['round'],
            "utcDate": m['fixture']['date'],
            "predicted_winner": "TBD",
            "home_win_prob": 0.34,
            "draw_prob": 0.32,
            "away_win_prob": 0.34
        })
        continue

    features = prepare_features(home_norm, away_norm)
    features_scaled = scaler.transform([features])
    probs = best_model.predict_proba(features_scaled)[0]
    pred = best_model.predict(features_scaled)[0]

    # Map class indices to probabilities
    classes = list(best_model.classes_)
    prob_map = {c: p for c, p in zip(classes, probs)}

    home_win_prob = prob_map.get(1, 0.33)
    away_win_prob = prob_map.get(0, 0.33)
    draw_prob = prob_map.get(2, 0.33)

    winner = home_name if pred == 1 else (away_name if pred == 0 else "Draw")

    results.append({
        "fixture_id": m['fixture']['id'],
        "home": home_name,
        "away": away_name,
        "home_team_id": m['teams']['home']['id'],
        "away_team_id": m['teams']['away']['id'],
        "stage": m['league']['round'],
        "group": group,
        "utcDate": m['fixture']['date'],
        "predicted_winner": winner,
        "home_win_prob": round(float(home_win_prob), 3),
        "draw_prob": round(float(draw_prob), 3),
        "away_win_prob": round(float(away_win_prob), 3)
    })
    print(f"{home_name} vs {away_name}: {winner} ({home_win_prob:.0%} / {draw_prob:.0%} / {away_win_prob:.0%})")

with open('ml/predictions.json', 'w') as f:
    json.dump(results, f, indent=2)

print(f"\n{len(results)} predictions saved to ml/predictions.json")
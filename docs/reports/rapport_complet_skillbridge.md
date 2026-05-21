# Rapport Complet du Projet SkillBridge
## Architecture, Pipeline Big Data et Analyse de Liaison

**Date** : 20 mai 2026
**Auteur** : Omar El Khali
**Version** : 1.0

---

## Table des Matières

1. [Présentation Générale](#1-présentation-générale)
2. [Architecture Technique Globale](#2-architecture-technique-globale)
3. [Le Frontend (React + Vite)](#3-le-frontend-react--vite)
4. [Le Backend (Spring Boot)](#4-le-backend-spring-boot)
5. [La Base de Données (Supabase PostgreSQL)](#5-la-base-de-données-supabase-postgresql)
6. [Le Pipeline Big Data](#6-le-pipeline-big-data)
7. [Use Case 1 : Recherche de Cours et Extraction de Mots-Clés (Flume + MapReduce)](#7-use-case-1--recherche-de-cours)
8. [Use Case 2 : Catalogue Analytique (Sqoop + Hive)](#8-use-case-2--catalogue-analytique)
9. [Use Case 3 : Recommandation de Cours par Projet (Moteur de Règles + HBase)](#9-use-case-3--recommandation-de-cours)
10. [Use Case 4 : Suivi d'Activité et Statistiques (HBase + Flume)](#10-use-case-4--suivi-dactivité)
11. [Résultats des Tests de Liaison](#11-résultats-des-tests-de-liaison)
12. [Conclusion](#12-conclusion)

---

## 1. Présentation Générale

**SkillBridge** est une plateforme éducative full-stack qui transforme une idée de projet en un parcours d'apprentissage personnalisé :

```
Idée de Projet → Détection des Compétences → Recommandation de Cours
```

L'utilisateur décrit son projet (ex : "*Je veux créer une API REST sécurisée avec Spring Boot et PostgreSQL*"), et la plateforme :
1. **Détecte automatiquement** les compétences nécessaires (Spring Boot, JWT, PostgreSQL, REST API...)
2. **Identifie les catégories** technologiques associées (Backend Development, Application Security, Databases)
3. **Classe et note** les meilleurs cours issus de Coursera, edX et d'autres plateformes (score sur 100 points)

Le catalogue contient **17 072 cours unifiés** issus de 4 sources de données Kaggle, **13 647 compétences** et **459 fournisseurs**.

---

## 2. Architecture Technique Globale

Le projet sépare clairement deux mondes :
- **Le monde transactionnel web** : React ↔ Spring Boot ↔ Supabase PostgreSQL Cloud
- **Le monde analytique Big Data** : PostgreSQL Mirror local ↔ Sqoop ↔ HDFS ↔ Hive ↔ MapReduce ↔ HBase

### Diagramme d'architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    ZONE WEB TRANSACTIONNELLE                     │
│                                                                  │
│  ┌─────────────┐    REST/JWT     ┌──────────────────┐           │
│  │  React       │◄──────────────►│  Spring Boot      │           │
│  │  Frontend    │   Port 5173    │  Backend          │           │
│  │  (Vite)      │                │  Port 8081        │           │
│  └─────────────┘                 └────────┬─────────┘           │
│                                           │ JPA/Hikari           │
│                                           │ Port 6543            │
│                                  ┌────────▼─────────┐           │
│                                  │  Supabase         │           │
│                                  │  PostgreSQL Cloud │           │
│                                  │  (17 075 cours)   │           │
│                                  └──────────────────┘           │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    ZONE BIG DATA (Docker)                        │
│                                                                  │
│  ┌─────────┐  append   ┌────────────┐  tail    ┌──────────┐    │
│  │ Backend  │─────────►│ events.log  │────────►│  Flume    │    │
│  │ (events) │          └────────────┘          │  Agent    │    │
│  └─────────┘                                   └────┬─────┘    │
│                                                      │          │
│  ┌──────────────┐  Sqoop   ┌─────────────────────────▼──┐      │
│  │  PostgreSQL   │─────────►│          HDFS               │      │
│  │  Mirror       │  batch   │  ┌─raw/sqoop/courses      │      │
│  │  Port 5433    │          │  ├─raw/flume/events        │      │
│  │  (17 072)     │          │  └─processed/mapreduce     │      │
│  └──────────────┘          └──────┬──────────────────────┘      │
│                                    │                             │
│            ┌───────────────────────┼──────────────────┐         │
│            ▼                       ▼                  ▼         │
│     ┌────────────┐         ┌─────────────┐    ┌──────────┐     │
│     │    Hive     │         │  MapReduce   │    │  HBase   │     │
│     │ SQL Engine  │         │  Java Job    │    │ Key-Val  │     │
│     │ (analytics) │         │ (keywords)   │    │ (stats)  │     │
│     └────────────┘         └─────────────┘    └──────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

### Stack Technologique

| Couche | Technologie | Rôle |
|--------|-------------|------|
| Frontend | React 18 + Vite + TypeScript | Interface utilisateur SPA |
| Backend | Java 21, Spring Boot 4.0, Spring Security, Spring Data JPA | API REST, Auth JWT, Moteur de recommandation |
| BDD App | Supabase PostgreSQL 17.6 (Cloud) | Source de vérité applicative |
| BDD Mirror | PostgreSQL 16 (Docker local, port 5433) | Source pour Sqoop, isolation Big Data |
| Stockage distribué | HDFS (Namenode + 2 DataNodes) | Fichiers bruts et résultats traités |
| Collecte batch | Sqoop 1.4.7 | Import PostgreSQL → HDFS |
| Collecte streaming | Flume 1.9.0 | Tail events.log → HDFS en temps réel |
| SQL analytique | Hive 2.3.2 | Tables externes sur HDFS |
| Traitement distribué | MapReduce (Hadoop 2.7.4) | Comptage de mots-clés Java |
| Stockage clé-valeur | HBase | Statistiques d'activité par cours |
| Traitement métier | Python 3.10+ | Matching compétences-projets, catalogue |

---

## 3. Le Frontend (React + Vite)

### 3.1 Structure des Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | `LoginPage` | Authentification email/mot de passe, Google OAuth, GitHub OAuth |
| `/register` | `RegisterPage` | Inscription avec validation |
| `/dashboard` | `DashboardPage` | Tableau de bord utilisateur avec KPIs et résumé |
| `/courses` | `CoursesPage` | Catalogue de 17 075 cours avec filtres et recherche |
| `/projects` | `ProjectsPage` | Liste des idées de projet de l'utilisateur |
| `/projects/:id` | `ProjectDetailPage` | **Moteur de recommandation** avec scoring détaillé |
| `/saved-courses` | `SavedCoursesPage` | Cours favoris de l'utilisateur |
| `/progress` | `ProgressPage` | Suivi de progression des cours |
| `/admin` | `AdminDashboardPage` | **Dashboard admin** avec KPIs globaux et visualisations |
| `/admin/users` | `AdminUsersPage` | Gestion des utilisateurs (activer/désactiver, rôle) |
| `/admin/courses` | `AdminCatalogPage` | CRUD complet sur les cours |
| `/admin/categories` | `AdminCatalogPage` | Gestion des catégories |
| `/admin/providers` | `AdminCatalogPage` | Gestion des fournisseurs |
| `/admin/skills` | `AdminCatalogPage` | Gestion des compétences |
| `/admin/bigdata` | `BigDataStatusPage` | **Monitoring Big Data** avec WordCloud, DonutChart, barres |

### 3.2 Comment le Frontend Communique avec le Backend

Le fichier `api.ts` centralise toutes les requêtes HTTP. Chaque appel :
1. Injecte automatiquement le **token JWT** dans le header `Authorization: Bearer <token>`
2. Cible l'URL de base `http://localhost:8081` (variable `VITE_API_BASE_URL`)
3. Gère les erreurs avec des messages utilisateur explicites

### 3.3 Comment le Frontend Déclenche le Pipeline Big Data

Le frontend ne parle **jamais directement** à Hadoop, Flume ou HBase. Mais chaque action utilisateur génère implicitement des événements Big Data :

| Action utilisateur | API appelée | Événement Big Data généré |
|--------------------|-------------|--------------------------|
| Rechercher un cours | `GET /api/courses?q=python` | `COURSE_SEARCH` → events.log → Flume → HDFS |
| Cliquer sur un cours | `POST /api/courses/{id}/click` | `COURSE_CLICK` → events.log → Flume → HDFS |
| Sauvegarder un cours | `POST /api/saved-courses/{id}` | `COURSE_SAVE` → events.log → Flume → HDFS |
| Créer un projet | `POST /api/projects` | `PROJECT_CREATED` → events.log → Flume → HDFS |
| Générer des recommandations | `POST /api/projects/{id}/recommendations` | `PROJECT_RECOMMENDATION` → events.log → Flume → HDFS |

---

## 4. Le Backend (Spring Boot)

### 4.1 Architecture du Backend

Le code source est organisé en packages par domaine fonctionnel :

```
com.skillbridge/
├── admin/           → AdminController, AdminService (KPIs, overview)
├── auth/            → AuthController, JWT filter, Google/GitHub OAuth
├── bigdata/         → BigDataController, BigDataEventService, BigDataStatusService
├── common/          → Exceptions, DTOs partagés
├── course/          → CourseController, CourseService, CourseRepository
├── projectidea/     → ProjectIdeaController, entités, repositories
├── recommendation/  → RecommendationService (moteur de scoring)
├── savedcourse/     → SavedCourseController/Service
├── security/        → SecurityConfig, JwtProvider, AppUserPrincipal
├── skill/           → SkillController/Service
└── user/            → UserController/Service
```

### 4.2 Le Moteur de Recommandation (RecommendationService.java)

C'est le cœur algorithmique du projet. Le scoring fonctionne ainsi :

```
Score Total (max 100) = Title Match (max 30) + Skill Match (max 40) 
                      + Category Match (max 20) + Bonus Big Data (max 10)
```

**Détail du scoring :**

| Composante | Points max | Calcul |
|------------|-----------|--------|
| Title Match | 30 | +6 par mot-clé du projet trouvé dans le titre du cours, +8 si une compétence détectée est dans le titre |
| Skill Match | 40 | +10 par compétence en commun, +4 par compétence trouvée dans la description |
| Category Match | 20 | 20 si la catégorie du cours correspond à une catégorie détectée dans le projet, 10 si des mots-clés de catégorie sont dans le texte |
| Bonus (Big Data) | 10 | Jusqu'à 8 points de popularité du catalogue, +2 si des stats HBase existent pour ce cours |

### 4.3 Le Service BigDataEventService

Ce service est le **pont entre l'application web et le pipeline Big Data** :

```java
public boolean appendEvent(String eventType, Map<String, Object> fields) {
    // Sérialise l'événement en JSON
    // L'écrit en append dans apps/bigdata/data/events/events.log
    // Flume surveille ce fichier et envoie chaque nouvelle ligne vers HDFS
}
```

### 4.4 Connexion à Supabase

Le backend utilise le **port 6543 (Transaction Mode Pooler)** de Supabase au lieu du port 5432 (Session Mode). Cela permet de multiplexer les transactions et d'éviter l'erreur `EMAXCONNSESSION` (limite de 15 sessions concurrentes). Le pool Hikari est configuré avec `maximum-pool-size=3` et `minimum-idle=1`.

---

## 5. La Base de Données (Supabase PostgreSQL)

### 5.1 Schéma Principal

```
users (id, email, password_hash, first_name, last_name, role_id, active)
roles (id, name)  → USER, ADMIN
courses (id, title, slug, description, level, language, source_url, 
         thumbnail_url, category_id, provider_id, published, popularity_score)
categories (id, name, slug, description)
providers (id, name, website_url, description)
skills (id, name, slug, description)
course_skills (course_id, skill_id)  → Table de jointure N:N
project_ideas (id, user_id, title, description, status)
project_detected_skills (id, project_idea_id, skill_id, matched_keyword, 
                         match_source, confidence_score)
recommendation_snapshots (id, project_idea_id, generated_at, keyword_summary,
                          algorithm_version, total_results)
recommendation_results (id, snapshot_id, course_id, rank_position, score,
                        title_match_score, skill_match_score, 
                        category_match_score, bonus_score, explanation)
saved_courses (id, user_id, course_id, saved_at)
course_progress (id, user_id, course_id, status, progress_percent, 
                 started_at, completed_at, last_updated_at)
```

### 5.2 Supabase vs PostgreSQL Mirror

| Aspect | Supabase Cloud | PostgreSQL Mirror (Docker) |
|--------|---------------|---------------------------|
| **Port** | 6543 (transaction pooler) | 5433 (local) |
| **Usage** | Application web en production | Pipeline Big Data uniquement |
| **Accès** | Backend Spring Boot via JPA | Sqoop, scripts Python |
| **Sécurité** | SSL requis, pool limité | Réseau Docker interne |
| **Données** | 17 075 cours (enrichis par upsert) | 17 072 cours (miroir du catalogue) |

---

## 6. Le Pipeline Big Data

### 6.1 Services Docker (12 conteneurs)

| Conteneur | Image | Rôle | Port exposé |
|-----------|-------|------|-------------|
| `skillbridge-namenode` | hadoop-namenode:2.0.0 | Métadonnées HDFS | 9000, 9870 |
| `bigdata-datanode-1` | hadoop-datanode:2.0.0 | Stockage HDFS (réplique 1) | — |
| `bigdata-datanode-2` | hadoop-datanode:2.0.0 | Stockage HDFS (réplique 2) | — |
| `skillbridge-resourcemanager` | hadoop-resourcemanager | YARN scheduler | 8088 |
| `skillbridge-nodemanager` | hadoop-nodemanager | YARN worker | 8042 |
| `skillbridge-sqoop-client` | skillbridge-sqoop:1.4.7 | Import batch PostgreSQL→HDFS | — |
| `skillbridge-flume-agent` | skillbridge-flume:1.9.0 | Streaming events.log→HDFS | — |
| `skillbridge-hive-metastore-postgresql` | hive-metastore-postgresql | Métadonnées Hive | — |
| `skillbridge-hive-metastore` | hive-metastore | Service métadonnées | 9083 |
| `skillbridge-hive-server` | hive-server | Endpoint SQL (Beeline) | 10000 |
| `skillbridge-hbase` | hbase:latest | Base clé-valeur distribuée | 16010 |
| `skillbridge-postgres-mirror` | postgres:16 | Miroir local pour Sqoop | 5433 |

### 6.2 Structure HDFS

```
/data/skillbridge/
├── raw/
│   ├── sqoop/                    ← Données importées par Sqoop
│   │   ├── courses/part-m-00000      (38.8 MB, 17 072 lignes)
│   │   ├── skills/part-m-00000
│   │   ├── course_skills/part-m-00000 (1.09 MB, 104 006 lignes)
│   │   ├── providers/part-m-00000
│   │   ├── categories/part-m-00000
│   │   ├── project_ideas/part-m-00000
│   │   ├── saved_courses/part-m-00000
│   │   └── course_progress/part-m-00000
│   └── flume/
│       └── events/               ← Événements streamés par Flume
│           ├── events.1776679507079   (870 B)
│           ├── events.1776679669807   (1.3 KB)
│           ├── ...
│           └── events.1779297456331   (120 B) ← Dernier: COURSE_SAVE
├── processed/
│   └── mapreduce/
│       └── top_search_keywords/
│           ├── _SUCCESS
│           └── part-r-00000      ← Résultat MapReduce (166 B)
├── hive/
└── export/
    └── hbase/
```

---

## 7. Use Case 1 : Recherche de Cours

### Flux complet : De la recherche utilisateur aux tendances analytiques

```
[1] Utilisateur tape "python machine learning" dans la barre de recherche
                    │
                    ▼
[2] React appelle GET /api/courses?q=python+machine+learning
                    │
                    ▼
[3] CourseController détecte q != null
    → BigDataEventService.appendEvent("COURSE_SEARCH", {query: "python machine learning"})
    → Écrit une ligne JSON dans events.log :
      {"eventType":"COURSE_SEARCH","source":"web-app","timestamp":"...","query":"python machine learning"}
                    │
                    ▼
[4] Flume Agent (conteneur Docker)
    → Exécute flume-follow-events.sh (script Perl qui fait tail -f)
    → Lit chaque nouvelle ligne de events.log
    → Envoie vers HDFS hdfs://namenode:9000/data/skillbridge/raw/flume/events/
                    │
                    ▼
[5] Hadoop MapReduce : TopSearchKeywordsJob.java
    → MAPPER : Lit chaque ligne JSON, extrait "query", tokenise, émet (mot, 1)
    → COMBINER : Somme locale sur chaque nœud
    → REDUCER : Somme globale → Résultat final dans HDFS
    
    Résultat vérifié (part-r-00000) :
    ┌────────────────┬───────┐
    │ Mot-clé        │ Count │
    ├────────────────┼───────┤
    │ developer      │ 5     │
    │ frontend       │ 5     │
    │ learning       │ 5     │
    │ machine        │ 5     │
    │ python         │ 5     │
    │ react          │ 5     │
    │ airflow        │ 4     │
    │ boot           │ 4     │
    │ data           │ 4     │
    │ hive           │ 4     │
    │ security       │ 4     │
    │ spark          │ 4     │
    │ spring         │ 4     │
    └────────────────┴───────┘
                    │
                    ▼
[6] BigDataStatusService lit bigdata-summary.json
    → Sert les top keywords via GET /api/bigdata/status
                    │
                    ▼
[7] BigDataStatusPage.tsx affiche un WordCloud interactif
```

### Code clé du Mapper Java

```java
// TopSearchKeywordsJob.java - SearchKeywordMapper
protected void map(Object key, Text value, Context context) {
    String line = value.toString();
    String eventType = jsonField(line, "eventType");
    if (!"COURSE_SEARCH".equals(eventType) && !"PROJECT_RECOMMENDATION".equals(eventType))
        return;
    
    String query = "COURSE_SEARCH".equals(eventType)
        ? jsonField(line, "query").toLowerCase()
        : (jsonField(line, "projectTitle") + " " + jsonField(line, "projectDescription")).toLowerCase();
    
    Matcher matcher = TOKEN_PATTERN.matcher(query);
    while (matcher.find()) {
        String token = matcher.group();
        if (token.length() <= 1 || STOP_WORDS.contains(token)) continue;
        outputKey.set(token);
        context.write(outputKey, ONE); // Émet (mot, 1)
    }
}
```

---

## 8. Use Case 2 : Catalogue Analytique

### Flux complet : Des datasets Kaggle aux analyses Hive

```
[1] Datasets ZIP (Kaggle)
    ├── archive (1).zip → final_cleaned_dataset.csv      (2 377 cours)
    ├── archive.zip     → all_courses.csv                 (1 041 cours)
    └── archive (2).zip → processed_coursera_data.json    (13 174 cours)
                         → edx_courses.json               (1 000 cours)
                    │
                    ▼
[2] Python : 12_merge_and_enrich_catalog.py
    → Lit les ZIP directement
    → Normalise : niveaux (BEGINNER/INTERMEDIATE/ADVANCED), langues, providers
    → Déduplique : par URL + par (titre+provider), garde le plus riche
    → 519 doublons supprimés
    → Résultat : 17 072 cours uniques
    → Écrit dans output/catalog/unified_courses.csv
                    │
                    ▼
[3] Python : 14_seed_postgres_mirror_from_catalog.py
    → Charge les CSV dans le PostgreSQL Mirror local (port 5433)
    
    Résultat vérifié :
    ┌───────────────┬────────┐
    │ Table         │ Count  │
    ├───────────────┼────────┤
    │ courses       │ 17 072 │
    │ skills        │ 13 647 │
    │ course_skills │ 104 006│
    │ project_ideas │ 10     │
    │ providers     │ 459    │
    │ categories    │ 12     │
    └───────────────┴────────┘
                    │
                    ▼
[4] Sqoop (conteneur Docker)
    → Exécute : 04_sqoop_import_mvp.sh
    → Pour chaque table : SELECT * → fichier TSV dans HDFS
    → Résultat : /data/skillbridge/raw/sqoop/courses/part-m-00000 (38.8 MB)
                    │
                    ▼
[5] Hive Server
    → 01_create_hive_tables.sql : Crée 9 tables externes sur les répertoires HDFS
    → Pas de copie de données ! Hive lit directement les fichiers HDFS
    
    Tables Hive créées :
    ┌─────────────────────┬──────────────────────────────────────────┐
    │ Table               │ Location HDFS                            │
    ├─────────────────────┼──────────────────────────────────────────┤
    │ hive_courses        │ /data/skillbridge/raw/sqoop/courses      │
    │ hive_skills         │ /data/skillbridge/raw/sqoop/skills       │
    │ hive_course_skills  │ /data/skillbridge/raw/sqoop/course_skills│
    │ hive_providers      │ /data/skillbridge/raw/sqoop/providers    │
    │ hive_categories     │ /data/skillbridge/raw/sqoop/categories   │
    │ hive_project_ideas  │ /data/skillbridge/raw/sqoop/project_ideas│
    │ hive_saved_courses  │ /data/skillbridge/raw/sqoop/saved_courses│
    │ hive_course_progress│ /data/skillbridge/raw/sqoop/course_progress│
    │ hive_events         │ /data/skillbridge/raw/flume/events       │
    └─────────────────────┴──────────────────────────────────────────┘
                    │
                    ▼
[6] Requêtes HiveQL analytiques (02_demo_queries.sql)
    
    Exemples :
    • Répartition par niveau :
      SELECT level, COUNT(*) FROM hive_courses GROUP BY level;
      → BEGINNER: 8690, INTERMEDIATE: 7431, ADVANCED: 951

    • Top 10 providers :
      SELECT p.name, COUNT(*) FROM hive_courses c JOIN hive_providers p ...
      → Coursera Project Network: 1589, Google Cloud: 1422, Coursera: 1239...

    • Top catégories :
      → Machine Learning: 5925, Backend Development: 2092, Product and UX: 1955...

    • Types d'événements :
      SELECT get_json_object(raw_line, '$.eventType'), COUNT(*) FROM hive_events ...
    
    Résultat vérifié :
    ┌────────────────┬───────┐
    │ Métrique Hive  │ Count │
    ├────────────────┼───────┤
    │ hive_courses   │ 17 072│
    │ hive_events    │ 62    │
    └────────────────┴───────┘
```

---

## 9. Use Case 3 : Recommandation de Cours

### Flux complet : D'une idée de projet aux cours recommandés

```
[1] Utilisateur crée un projet : "Create a small AI study assistant for students"
    → React : POST /api/projects → Backend sauvegarde + événement PROJECT_CREATED
                    │
                    ▼
[2] Utilisateur clique "Generate recommendations" (limit=5)
    → React : POST /api/projects/39/recommendations/generate?limit=5
                    │
                    ▼
[3] RecommendationService.generateForProject()
    
    a) Normalisation du texte :
       "create a small ai study assistant for students"
       → Tokens : {small, ai, study, assistant, students}
    
    b) Détection des catégories :
       → "ai" matche la règle Machine Learning
       → matchedCategories = {Machine Learning: ["ai"]}
    
    c) Détection des compétences :
       → Parcourt les 13 647 skills de la base
       → Cherche si le nom de chaque skill apparaît dans le texte du projet
       → Ici : aucune skill exacte détectée (text trop court)
    
    d) Recherche de cours candidats :
       → Pas de skills détectées → fallback sur recherche par mots-clés
       → Pour chaque token (ai, study, assistant...) :
           SELECT course_ids FROM courses WHERE title ILIKE '%ai%' ORDER BY popularity
       → + Fallback sur les cours les plus populaires
    
    e) Scoring de chaque cours candidat :
       
       Exemple : "OpenAI GPTs: Creating Your Own Custom AI Assistants"
       ┌──────────────────────┬────────┐
       │ Composante           │ Points │
       ├──────────────────────┼────────┤
       │ Title Match (ai+assistant) │ 12     │
       │ Skill Match          │ 0      │
       │ Category Match (ML)  │ 20     │
       │ Bonus (popularity 69)│ 6      │
       │ TOTAL                │ 38     │
       └──────────────────────┴────────┘
    
    f) Tri décroissant par score, limitation aux 5 meilleurs
                    │
                    ▼
[4] Sauvegarde du Snapshot de Recommandation
    → Écriture dans la table recommendation_snapshots (Supabase)
    → Écriture de chaque résultat dans recommendation_results
    → Écriture d'un événement PROJECT_RECOMMENDATION dans events.log
    → Écriture du résultat complet dans output/recommendation_result.json
    
    Résultat vérifié :
    ┌───┬─────────────────────────────────────────────┬────────┬───────┐
    │ # │ Cours                                       │ Score  │ Provider │
    ├───┼─────────────────────────────────────────────┼────────┼───────┤
    │ 1 │ OpenAI GPTs: Creating Custom AI Assistants  │ 38 pts │ Vanderbilt │
    │ 2 │ ML Foundations: A Case Study Approach       │ 33 pts │ Coursera │
    │ 3 │ AI for Everyday Life                        │ 32 pts │ Kennesaw │
    │ 4 │ Dairy Production and Management             │ 32 pts │ Penn State │
    │ 5 │ Generative AI for Leaders                   │ 32 pts │ Vanderbilt │
    └───┴─────────────────────────────────────────────┴────────┴───────┘
                    │
                    ▼
[5] React : ProjectDetailPage.tsx affiche
    → Skills détectées (tags colorés)
    → Catégories matchées avec leurs mots-clés
    → Liste classée avec score, breakdown, et explication
    → Boutons "Open course" (→ COURSE_CLICK) et "Save" (→ COURSE_SAVE)
```

---

## 10. Use Case 4 : Suivi d'Activité

### Flux : Des clics/sauvegardes aux statistiques HBase

```
[1] Utilisateur clique "Save" sur un cours recommandé (courseId=16360)
    → React : POST /api/saved-courses/16360
                    │
                    ▼
[2] SavedCourseService.save()
    → Sauvegarde dans la table saved_courses (Supabase)
    → BigDataEventService.appendEvent("COURSE_SAVE", {userId:8, courseId:16360})
    → Écriture JSON dans events.log :
      {"eventType":"COURSE_SAVE","source":"web-app","timestamp":"...","userId":8,"courseId":16360}
                    │
                    ▼
[3] Flume tail → HDFS (vérifié en temps réel)
    → Le fichier events.1779297456331 dans HDFS contient exactement :
      {"eventType":"COURSE_SAVE","source":"web-app",...,"courseId":16360}
                    │
                    ▼
[4] Python : 09_load_course_stats_hbase.py
    → Lit les saved_courses et course_progress depuis PostgreSQL Mirror
    → Agrège : clicks, saves, avg_progress par course_id
    → Génère un script HBase Shell (load_course_stats.hbase)
    → Charge dans la table HBase course_stats
    
    Structure HBase :
    ┌───────────────┬────────────────────┬─────────┐
    │ Row Key       │ Column             │ Value   │
    ├───────────────┼────────────────────┼─────────┤
    │ course_1208   │ meta:title         │ "Análisis de Datos..." │
    │ course_1208   │ activity:clicks    │ 0       │
    │ course_1208   │ activity:saves     │ 1       │
    │ course_1208   │ activity:avg_progress │ 80.0  │
    └───────────────┴────────────────────┴─────────┘
    
    Vérifié : 50 lignes dans course_stats
                    │
                    ▼
[5] BigDataStatusService.courseStatsForCourse(courseId)
    → Lit bigdata-summary.json
    → Retourne les stats HBase pour le calcul du bonus (max 2 points)
                    │
                    ▼
[6] Frontend BigDataStatusPage : Graphique "HBase Top Courses"
    → Barres horizontales montrant les cours les plus sauvegardés/cliqués
```

---

## 11. Résultats des Tests de Liaison

Tous les tests ont été exécutés le **20 mai 2026 à 18h17** avec les services backend (port 8081), frontend (port 5173) et les 12 conteneurs Docker actifs simultanément.

### 11.1 Test de Liaison Backend ↔ Supabase

```
✅ HikariPool-1 - Start completed
✅ Database: PostgreSQL 17.6 via port 6543 (Transaction Mode)
✅ Tomcat started on port 8081
✅ SkillBridge started in 20.228 seconds
✅ API /api/courses retourne 17 075 cours
```

### 11.2 Test de Liaison App ↔ Big Data Catalogue

```
✅ Script 20_verify_app_bigdata_link.ps1 :
   → Courses visible through backend API: 17 075
   → Status: OK
```

### 11.3 Test de Liaison Flume ↔ HDFS (Streaming Temps Réel)

```
✅ Événement COURSE_SAVE écrit dans events.log à 17:17:34Z
✅ Même événement retrouvé dans HDFS events.1779297456331 à 17:17Z
   Contenu HDFS : {"eventType":"COURSE_SAVE","source":"web-app",
                    "timestamp":"2026-05-20T17:17:34.197671800Z",
                    "userId":8,"courseId":16360}
✅ Délai d'ingestion Flume : < 30 secondes
```

### 11.4 Test Sqoop ↔ HDFS

```
✅ /data/skillbridge/raw/sqoop/courses/part-m-00000 : 38.8 MB
✅ PostgreSQL Mirror : 17 072 cours, 13 647 skills, 104 006 course_skills
```

### 11.5 Test Hive SQL

```
✅ SELECT COUNT(*) FROM hive_courses → 17 072
✅ SELECT COUNT(*) FROM hive_events → 62
```

### 11.6 Test MapReduce

```
✅ part-r-00000 : 18 mots-clés extraits
   Top 5 : developer(5), frontend(5), learning(5), machine(5), python(5)
```

### 11.7 Test HBase

```
✅ Table course_stats : 50 lignes
✅ Exemples : Elements of AI (saves=1, progress=80%), 
              IBM DevOps (saves=1, progress=80%)
```

### 11.8 Test du Moteur de Recommandation

```
✅ Projet "AI study assistant" → 5 cours recommandés
✅ Score le plus élevé : 38 pts (OpenAI GPTs)
✅ Événement PROJECT_RECOMMENDATION enregistré dans events.log
✅ BigDataTrace.eventRecorded = true
✅ BigDataTrace.latestAnalyticsAvailable = true
```

---

## 12. Conclusion

Le projet SkillBridge démontre une intégration complète et fonctionnelle entre une application web moderne et un pipeline Big Data distribué :

1. **Frontend React** : Interface professionnelle avec 12 pages, des visualisations interactives (WordCloud, DonutChart, barres horizontales), et un moteur de recommandation visuel avec scoring détaillé.

2. **Backend Spring Boot** : API REST sécurisée (JWT + OAuth), moteur de recommandation algorithmique avec scoring sur 100 points, et pont transparent vers le pipeline Big Data via BigDataEventService.

3. **Pipeline Big Data** : 12 conteneurs Docker orchestrés couvrant les 6 technologies clés du cours :
   - **Sqoop** : Collecte batch (PostgreSQL → HDFS)
   - **Flume** : Collecte streaming temps réel (events.log → HDFS, délai < 30s)
   - **HDFS** : Stockage distribué (2 DataNodes répliqués, ~40 MB de données)
   - **Hive** : SQL analytique (9 tables externes, requêtes GROUP BY sur 17 072 cours)
   - **MapReduce** : Traitement distribué Java (extraction et comptage de mots-clés)
   - **HBase** : Stockage clé-valeur (50 statistiques d'activité par cours)

4. **Boucle de valeur complète** : Les actions utilisateur (recherches, clics, sauvegardes, recommandations) sont capturées en temps réel par Flume, analysées par MapReduce et Hive, consolidées dans HBase, et les résultats alimentent le scoring de recommandation et les visualisations du dashboard admin.

---

*Rapport généré automatiquement à partir de l'analyse en direct du projet SkillBridge.*

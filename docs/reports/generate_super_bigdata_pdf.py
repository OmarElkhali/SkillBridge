import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

# Setup directories
reports_dir = os.path.dirname(os.path.abspath(__file__))
pdf_output_path = os.path.join(reports_dir, "Rapport_Super_BigData.pdf")

# Theme Colors
PRIMARY = colors.HexColor("#1A365D")    # Dark Blue
SECONDARY = colors.HexColor("#319795")  # Teal
ACCENT = colors.HexColor("#D69E2E")     # Gold
DARK_TEXT = colors.HexColor("#2D3748")  # Slate
LIGHT_BG = colors.HexColor("#EDF2F7")   # Light Grey
WHITE = colors.HexColor("#FFFFFF")

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, num_pages):
        self.saveState()
        # Page 1 is Cover page - skip header/footer
        if self._pageNumber == 1:
            self.setFillColor(PRIMARY)
            self.rect(0, 0, 30, 792, fill=True, stroke=False)
            self.setFillColor(SECONDARY)
            self.rect(30, 0, 10, 792, fill=True, stroke=False)
            self.restoreState()
            return

        # Header
        self.setFont('Helvetica-Bold', 8)
        self.setFillColor(colors.HexColor("#718096"))
        self.drawString(54, 750, "SkillBridge - Documentation Exhaustive de l'Écosystème Big Data")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 742, 558, 742)
        
        # Footer
        self.setFont('Helvetica', 8)
        self.drawString(54, 40, "Auteur: Omar El Khali | Architecture & Ingénierie des Données")
        self.drawRightString(558, 40, f"Page {self._pageNumber} sur {num_pages}")
        self.line(54, 52, 558, 52)
        self.restoreState()

def create_report():
    doc = SimpleDocTemplate(
        pdf_output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )

    styles = getSampleStyleSheet()
    
    # Custom Typography Styles
    title_style = ParagraphStyle('CoverTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=24, leading=30, textColor=PRIMARY, spaceAfter=15)
    subtitle_style = ParagraphStyle('CoverSubtitle', parent=styles['Normal'], fontName='Helvetica', fontSize=12, leading=16, textColor=colors.HexColor("#4A5568"), spaceAfter=45)
    meta_style = ParagraphStyle('CoverMeta', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=DARK_TEXT, spaceAfter=6)
    
    h1_style = ParagraphStyle('Heading1_Custom', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=16, leading=20, textColor=PRIMARY, spaceBefore=20, spaceAfter=10, keepWithNext=True)
    h2_style = ParagraphStyle('Heading2_Custom', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=13, leading=16, textColor=SECONDARY, spaceBefore=12, spaceAfter=6, keepWithNext=True)
    h3_style = ParagraphStyle('Heading3_Custom', parent=styles['Heading3'], fontName='Helvetica-Bold', fontSize=11, leading=14, textColor=DARK_TEXT, spaceBefore=10, spaceAfter=4, keepWithNext=True)
    body_style = ParagraphStyle('Body_Custom', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.5, leading=14, textColor=DARK_TEXT, spaceAfter=8)
    
    code_style = ParagraphStyle('Code_Custom', parent=styles['Code'], fontName='Courier', fontSize=8, leading=10, textColor=colors.HexColor("#1A202C"), backColor=LIGHT_BG, borderColor=colors.HexColor("#CBD5E0"), borderWidth=0.5, borderPadding=5, spaceAfter=10)
    cmd_style = ParagraphStyle('Cmd_Custom', parent=styles['Code'], fontName='Courier-Bold', fontSize=8.5, leading=11, textColor=WHITE, backColor=colors.HexColor("#2D3748"), borderPadding=5, spaceAfter=10)

    story = []

    # ==========================================
    # PAGE 1: COVER PAGE
    # ==========================================
    story.append(Spacer(1, 150))
    story.append(Paragraph("SKILLBRIDGE BIG DATA", ParagraphStyle('Upper', fontName='Helvetica-Bold', fontSize=14, leading=16, textColor=SECONDARY, spaceAfter=10)))
    story.append(Paragraph("Documentation Exhaustive : Écosystème Big Data, Conteneurs, Scripts & Commandes", title_style))
    story.append(Paragraph("Une plongée profonde dans l'architecture distribuée de SkillBridge. Ce rapport détaille exhaustivement chaque conteneur Docker, chaque fichier de configuration, l'ensemble des logiques MapReduce/HiveQL, l'ingestion temps réel Flume, le cache HBase, ainsi que les commandes de terminal pour les démonstrations interactives.", subtitle_style))
    
    story.append(Spacer(1, 120))
    story.append(Paragraph("Auteur : <b>Omar El Khali</b>", meta_style))
    story.append(Paragraph("Projet : <b>SkillBridge - Plateforme E-Learning Intelligente</b>", meta_style))
    story.append(Paragraph("Date de Publication : <b>20 mai 2026</b>", meta_style))
    
    story.append(PageBreak())

    # ==========================================
    # SECTION 1: ARCHITECTURE DOCKER
    # ==========================================
    story.append(Paragraph("1. Architecture Docker & Rôle des Conteneurs", h1_style))
    story.append(Paragraph("Le cluster Big Data de SkillBridge fonctionne sur une architecture distribuée conteneurisée gérée via <code>docker-compose.yml</code>. Il comprend 12 services distincts interagissant en réseau.", body_style))
    
    table_data = [
        [Paragraph("<b>Conteneur</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)), Paragraph("<b>Image Base</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)), Paragraph("<b>Rôle Technique Explicite</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE))],
        [Paragraph("<code>postgres-mirror</code>", body_style), Paragraph("postgres:16", body_style), Paragraph("Réplique relationnelle. Contient les tables <code>courses</code>, <code>users</code>, etc., servant de source de vérité pour les imports Sqoop.", body_style)],
        [Paragraph("<code>namenode</code>", body_style), Paragraph("hadoop-namenode:2.7.4", body_style), Paragraph("Maître HDFS. Gère les métadonnées du système de fichiers distribué et les allocations de blocs de données.", body_style)],
        [Paragraph("<code>datanode</code>", body_style), Paragraph("hadoop-datanode:2.7.4", body_style), Paragraph("Esclave HDFS. Stocke physiquement les blocs de données distribués sur ses disques locaux.", body_style)],
        [Paragraph("<code>resourcemanager</code>", body_style), Paragraph("hadoop-resourcemanager", body_style), Paragraph("Maître YARN. Alloue les ressources CPU/RAM pour l'exécution des jobs MapReduce distribués.", body_style)],
        [Paragraph("<code>nodemanager</code>", body_style), Paragraph("hadoop-nodemanager", body_style), Paragraph("Esclave YARN. Exécute les tâches Map/Reduce sur les serveurs individuels.", body_style)],
        [Paragraph("<code>hive-metastore-postgresql</code>", body_style), Paragraph("postgresql", body_style), Paragraph("Base de données relationnelle interne stockant les métadonnées (schémas, tables) pour Apache Hive.", body_style)],
        [Paragraph("<code>hive-metastore</code>", body_style), Paragraph("hive:2.3.2", body_style), Paragraph("Service abstrait exposant le catalogue de schémas aux clients Hive et Spark.", body_style)],
        [Paragraph("<code>hive-server</code>", body_style), Paragraph("hive:2.3.2", body_style), Paragraph("Moteur d'exécution des requêtes HiveQL (via JDBC/Beeline) transformant le SQL en jobs MapReduce.", body_style)],
        [Paragraph("<code>sqoop-client</code>", body_style), Paragraph("custom skillbridge-sqoop", body_style), Paragraph("Outil d'ingestion batch. Déplace les données entre le Postgres-mirror et HDFS.", body_style)],
        [Paragraph("<code>flume-agent</code>", body_style), Paragraph("custom skillbridge-flume", body_style), Paragraph("Agent d'ingestion streaming. Écoute le fichier <code>events.log</code> du backend web et transfère les logs JSON vers HDFS en temps réel.", body_style)],
        [Paragraph("<code>hbase</code>", body_style), Paragraph("harisekhon/hbase", body_style), Paragraph("Base de données NoSQL orientée colonnes, offrant un accès O(1) aux statistiques de popularité pour les recommandations rapides de l'interface web.", body_style)]
    ]
    t = Table(table_data, colWidths=[120, 100, 250])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, colors.HexColor("#F7FAFC")]),
    ]))
    story.append(t)
    story.append(PageBreak())

    # ==========================================
    # SECTION 2: FILE DICTIONARY
    # ==========================================
    story.append(Paragraph("2. Dictionnaire Complet des Fichiers (Dossier apps/bigdata)", h1_style))
    story.append(Paragraph("Le pipeline Big Data est orchestré par de multiples scripts et configurations. Voici l'explication détaillée de chacun d'eux :", body_style))

    story.append(Paragraph("A. Scripts d'Orchestration (Dossier scripts/)", h2_style))
    story.append(Paragraph("<b>00_check_prereqs.ps1</b> : Script PowerShell vérifiant la présence de Docker, Python, Java, et les dépendances nécessaires avant de lancer le pipeline.", body_style))
    story.append(Paragraph("<b>03_create_hdfs_dirs.sh</b> : Script bash qui s'exécute dans le <code>namenode</code> pour préparer les répertoires racines HDFS (ex: <code>/data/skillbridge/raw</code>, <code>/data/skillbridge/processed</code>).", body_style))
    story.append(Paragraph("<b>04_sqoop_import_mvp.sh</b> : Lance les commandes <code>sqoop import</code> pour rapatrier les tables relationnelles depuis <code>postgres-mirror</code> vers HDFS.", body_style))
    story.append(Paragraph("<b>06_run_hive_queries.sh</b> : Exécute via Beeline les scripts SQL pour créer les tables externes Hive et exécuter les requêtes de démonstration.", body_style))
    story.append(Paragraph("<b>07_run_mapreduce.ps1 / .sh</b> : Compile et exécute le job Java MapReduce (<code>TopSearchKeywordsJob</code>) sur le cluster Hadoop pour analyser les recherches textuelles.", body_style))
    story.append(Paragraph("<b>08_match_project_skills.py</b> : Script Python qui implémente une logique d'association NLP pour lier des compétences aux descriptions de projets.", body_style))
    story.append(Paragraph("<b>09_load_course_stats_hbase.py</b> : Extrait les statistiques de PostgreSQL et HDFS, compile le fichier <code>bigdata-summary.json</code> et génère le script de chargement pour HBase (<code>load_course_stats.hbase</code>).", body_style))
    story.append(Paragraph("<b>10_run_mvp_pipeline.ps1</b> : Le script principal qui orchestre toute la séquence (Sqoop -> Hive -> MapReduce -> Python -> HBase).", body_style))
    story.append(Paragraph("<b>12_merge_and_enrich_catalog.py</b> & <b>13_push_catalog_to_supabase.py</b> : Scripts avancés Python de préparation des données pour le catalogue web.", body_style))
    story.append(Paragraph("<b>14_seed_postgres_mirror_from_catalog.py</b> : Remplit la base miroir Postgres avec un jeu de données initial généré ou mocké.", body_style))

    story.append(Paragraph("B. Code Java MapReduce", h2_style))
    story.append(Paragraph("<b>TopSearchKeywordsJob.java</b> : Implémente la classe <code>Mapper</code> pour extraire les mots (nettoyés des stop-words) depuis les logs JSON Flume de type <code>COURSE_SEARCH</code>, et la classe <code>Reducer</code> pour agréger et compter les occurrences de chaque mot.", body_style))

    story.append(Paragraph("C. Configurations", h2_style))
    story.append(Paragraph("<b>flume/skillbridge-events.conf</b> : Définit la source (Exec source sur <code>tail -F events.log</code>), le canal (en mémoire), et le puits (HDFS Sink avec rotation des fichiers) pour Apache Flume.", body_style))
    story.append(Paragraph("<b>hive/01_create_hive_tables.sql</b> : Création des tables <code>EXTERNAL</code> pointant vers les répertoires Sqoop et Flume dans HDFS.", body_style))

    story.append(PageBreak())

    # ==========================================
    # SECTION 3: EXPLANATION OF COMPONENTS
    # ==========================================
    story.append(Paragraph("3. Explication Approfondie des Outils du Pipeline", h1_style))
    
    # SQOOP
    story.append(Paragraph("3.1 Apache Sqoop (Import Relationnel)", h2_style))
    story.append(Paragraph("<b>Rôle :</b> Extraire en masse des données structurées depuis le `postgres-mirror` vers HDFS.", body_style))
    story.append(Paragraph("<b>Fonctionnement détaillé :</b> Sqoop connecte Hadoop à Postgres via JDBC. Pour chaque table (ex: <code>courses</code>, <code>users</code>), il génère automatiquement du code Java (des classes ORM), divise la table selon sa clé primaire, et lance des tâches Map() parallèles pour copier les lignes directement dans HDFS sous forme de fichiers texte (valeurs séparées par des tabulations).", body_style))
    story.append(Paragraph("<b>Exemple de commande générée par 04_sqoop_import_mvp.sh :</b>", body_style))
    story.append(Paragraph("sqoop import --connect jdbc:postgresql://postgres-mirror:5432/skillbridge --username skillbridge --password skillbridge --table courses --target-dir /data/skillbridge/raw/sqoop/courses -m 1", code_style))

    # FLUME
    story.append(Paragraph("3.2 Apache Flume (Ingestion Streaming Temps Réel)", h2_style))
    story.append(Paragraph("<b>Rôle :</b> Capturer les clics et recherches générés par le serveur Spring Boot et les écrire dans HDFS.", body_style))
    story.append(Paragraph("<b>Fonctionnement détaillé :</b> Le backend Spring Boot génère un fichier log local <code>events.log</code> contenant des JSON Lines grâce à <code>BigDataEventService.java</code> (protégé par un <code>ReentrantLock</code> pour éviter la corruption). L'agent Flume possède une source de type <code>exec</code> qui écoute les ajouts de ce fichier (comme la commande Unix <code>tail -F</code>). Les données traversent un <i>Memory Channel</i> puis sont poussées par un <i>HDFS Sink</i> qui crée un nouveau fichier dans Hadoop toutes les minutes ou selon la taille.", body_style))
    story.append(Paragraph("<b>Extrait de skillbridge-events.conf :</b>", body_style))
    story.append(Paragraph(
        "agent.sources.eventSource.type = exec\n"
        "agent.sources.eventSource.command = tail -F /opt/skillbridge/data/events/events.log\n"
        "agent.sinks.hdfsSink.type = hdfs\n"
        "agent.sinks.hdfsSink.hdfs.path = hdfs://namenode:9000/data/skillbridge/raw/flume/events\n"
        "agent.sinks.hdfsSink.hdfs.fileType = DataStream",
        code_style
    ))

    # HDFS
    story.append(Paragraph("3.3 Hadoop HDFS (Système de Fichiers Distribué)", h2_style))
    story.append(Paragraph("<b>Rôle :</b> Servir de Data Lake central, unifiant les données structurées de Sqoop et les données semi-structurées de Flume.", body_style))
    story.append(Paragraph("<b>Fonctionnement détaillé :</b> Divise les gros fichiers en blocs de 128 MB et les distribue sur les <code>datanodes</code> avec une réplication de 2 (pour la tolérance aux pannes). Le <code>namenode</code> conserve l'arborescence (répertoires <code>/data/skillbridge/*</code>) en mémoire RAM pour un accès ultra-rapide aux métadonnées.", body_style))

    story.append(PageBreak())

    # HIVE
    story.append(Paragraph("3.4 Apache Hive (Data Warehouse & BI)", h2_style))
    story.append(Paragraph("<b>Rôle :</b> Fournir une interface SQL standard sur les fichiers textes HDFS sans avoir à écrire de code Java MapReduce.", body_style))
    story.append(Paragraph("<b>Fonctionnement détaillé :</b> Utilise le concept de <i>Schema-on-Read</i>. Les tables sont définies comme <code>EXTERNAL</code>, c'est-à-dire que Hive ne copie pas les données, il ne fait qu'y associer une structure logique. Pour analyser les logs Flume qui sont au format JSON, Hive utilise ses UDFs (<i>User Defined Functions</i>) natives comme <code>get_json_object()</code>.", body_style))
    story.append(Paragraph("<b>Requête d'analyse des compétences tendances (02_demo_queries.sql) :</b>", body_style))
    story.append(Paragraph(
        "SELECT s.name, COUNT(*) AS total_courses\n"
        "FROM hive_course_skills cs\n"
        "JOIN hive_skills s ON s.id = cs.skill_id\n"
        "GROUP BY s.name ORDER BY total_courses DESC LIMIT 10;",
        code_style
    ))

    # MAPREDUCE
    story.append(Paragraph("3.5 Hadoop MapReduce (Calcul Distribué Avancé)", h2_style))
    story.append(Paragraph("<b>Rôle :</b> Analyser textuellement le champ JSON <code>query</code> des événements pour identifier les mots-clés les plus populaires.", body_style))
    story.append(Paragraph("<b>Fonctionnement détaillé :</b> Le script Java définit une fonction <i>Map</i> qui s'exécute sur les nœuds contenant les données HDFS, découpe les phrases de recherche en mots, filtre les « mots vides » (stop-words), et émet des paires clé/valeur <code>(mot, 1)</code>. La phase de <i>Shuffle/Sort</i> regroupe ces valeurs par mot, et la fonction <i>Reduce</i> additionne les 1 pour obtenir un compte final distribué <code>(mot, N)</code>.", body_style))

    # HBASE
    story.append(Paragraph("3.6 Apache HBase (Cache Analytique NoSQL)", h2_style))
    story.append(Paragraph("<b>Rôle :</b> Fournir des lectures à très faible latence (millisecondes) des résultats analytiques aux applications web.", body_style))
    story.append(Paragraph("<b>Fonctionnement détaillé :</b> Contrairement à Hive qui scanne tout le fichier pour répondre, HBase indexe les données par une clé (ici l'ID du cours). Le script Python <code>09_load_course_stats_hbase.py</code> fusionne les statistiques de Hive et l'activité événementielle en un script de commandes HBase Shell. Le serveur backend Spring Boot lit ces données via l'API pour ajouter instantanément un « bonus de popularité » (+10 points) aux recommandations de l'étudiant.", body_style))

    story.append(PageBreak())

    # ==========================================
    # SECTION 4: TERMINAL COMMANDS GUIDE
    # ==========================================
    story.append(Paragraph("4. Guide des Commandes Terminal (Exécution & Démonstration)", h1_style))
    story.append(Paragraph("Cette section liste les commandes que vous pouvez taper ou copier/coller dans votre terminal (à la racine du dossier <code>apps/bigdata</code>) pour démontrer le fonctionnement de chaque outil en temps réel. Assurez-vous que le cluster Docker est démarré.", body_style))

    # Docker
    story.append(Paragraph("<b>A. Gestion du Cluster Docker</b>", h3_style))
    story.append(Paragraph("Démarrer tous les conteneurs en arrière-plan :", body_style))
    story.append(Paragraph("docker compose up -d", cmd_style))
    story.append(Paragraph("Vérifier les logs du namenode Hadoop :", body_style))
    story.append(Paragraph("docker compose logs -f namenode", cmd_style))

    # HDFS Commands
    story.append(Paragraph("<b>B. Exploration de HDFS</b>", h3_style))
    story.append(Paragraph("Vérifier la santé du cluster Hadoop (SafeMode, Noeuds Actifs) :", body_style))
    story.append(Paragraph("docker compose exec namenode hdfs dfsadmin -report", cmd_style))
    story.append(Paragraph("Lister tous les fichiers bruts importés par Sqoop :", body_style))
    story.append(Paragraph("docker compose exec namenode hdfs dfs -ls /data/skillbridge/raw/sqoop", cmd_style))
    story.append(Paragraph("Lire le contenu des événements ingérés par Flume (affiche les JSON générés par l'interface web) :", body_style))
    story.append(Paragraph("docker compose exec namenode hdfs dfs -cat /data/skillbridge/raw/flume/events/* | head -n 20", cmd_style))

    # Hive Commands
    story.append(Paragraph("<b>C. Exécution des requêtes SQL Hive</b>", h3_style))
    story.append(Paragraph("Ouvrir l'invite interactive Beeline connectée au serveur Hive :", body_style))
    story.append(Paragraph("docker compose exec hive-server beeline -u jdbc:hive2://localhost:10000", cmd_style))
    story.append(Paragraph("<i>(Une fois dans Beeline, vous pouvez taper :)</i>", body_style))
    story.append(Paragraph("USE skillbridge_bigdata;\nSHOW TABLES;\nSELECT COUNT(*) FROM hive_events;", code_style))

    # Sqoop Commands
    story.append(Paragraph("<b>D. Interactions Sqoop</b>", h3_style))
    story.append(Paragraph("Exécuter une évaluation rapide (tester la connexion et lister les bases PostgreSQL) :", body_style))
    story.append(Paragraph("docker compose exec sqoop-client sqoop eval --connect jdbc:postgresql://postgres-mirror:5432/skillbridge --username skillbridge --password skillbridge --query \"SELECT count(*) FROM courses\"", cmd_style))

    # HBase Commands
    story.append(Paragraph("<b>E. Interactions HBase</b>", h3_style))
    story.append(Paragraph("Ouvrir le shell interactif HBase :", body_style))
    story.append(Paragraph("docker compose exec hbase hbase shell", cmd_style))
    story.append(Paragraph("<i>(Une fois dans HBase, vous pouvez scanner la table des statistiques :)</i>", body_style))
    story.append(Paragraph("scan 'course_stats', {LIMIT => 5}", code_style))

    # Orchestration Scripts
    story.append(Paragraph("<b>F. Automatisation Globale (Orchestrateur)</b>", h3_style))
    story.append(Paragraph("Si vous êtes sur Windows PowerShell, vous pouvez lancer le pipeline Big Data complet d'une seule traite (qui rafraîchira Sqoop, Hive, MapReduce et HBase) :", body_style))
    story.append(Paragraph(".\\scripts\\10_run_mvp_pipeline.ps1", cmd_style))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)

if __name__ == "__main__":
    create_report()
    print("Super Big Data PDF generated successfully!")

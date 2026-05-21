import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

# Setup directories
reports_dir = os.path.dirname(os.path.abspath(__file__))
pdf_output_path = os.path.join(reports_dir, "Rapport_BigData_SkillBridge.pdf")

# Image paths
arch_img_path = os.path.join(reports_dir, "architecture_diagram.png")
flow_img_path = os.path.join(reports_dir, "recommendation_flow.png")

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
            # Draw beautiful side accent bar on cover page
            self.setFillColor(PRIMARY)
            self.rect(0, 0, 30, 792, fill=True, stroke=False)
            self.setFillColor(SECONDARY)
            self.rect(30, 0, 10, 792, fill=True, stroke=False)
            self.restoreState()
            return

        # Header
        self.setFont('Helvetica-Bold', 8)
        self.setFillColor(colors.HexColor("#718096"))
        self.drawString(54, 750, "SkillBridge - Rapport Technique Architecture & Big Data")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 742, 558, 742)
        
        # Footer
        self.setFont('Helvetica', 8)
        self.drawString(54, 40, "Auteur: Omar El Khali | Projet Big Data & Web Full-Stack")
        self.drawRightString(558, 40, f"Page {self._pageNumber} sur {num_pages}")
        self.line(54, 52, 558, 52)
        self.restoreState()

def create_report():
    # Page setup
    # Margins: Left/Right=54 (0.75 in), Top/Bottom=72 (1 in)
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
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        textColor=PRIMARY,
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#4A5568"),
        spaceAfter=40
    )
    
    meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=DARK_TEXT,
        spaceAfter=6
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=PRIMARY,
        spaceBefore=15,
        spaceAfter=12,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        spaceBefore=10,
        spaceAfter=8,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=DARK_TEXT,
        spaceAfter=10
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Code'],
        fontName='Courier',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#1A202C"),
        backColor=LIGHT_BG,
        borderColor=colors.HexColor("#CBD5E0"),
        borderWidth=0.5,
        borderPadding=6,
        spaceAfter=10
    )

    story = []

    # ==========================================
    # PAGE 1: COVER PAGE
    # ==========================================
    story.append(Spacer(1, 150))
    story.append(Paragraph("SKILLBRIDGE", ParagraphStyle('Upper', fontName='Helvetica-Bold', fontSize=12, leading=14, textColor=SECONDARY, spaceAfter=10)))
    story.append(Paragraph("Architecture Technique Globale & Analyse Détaillée du Pipeline Big Data", title_style))
    story.append(Paragraph("Un guide d'analyse fonctionnelle, expliquant la liaison complète entre le Web Full-Stack et les infrastructures distribuées Apache Hadoop, Flume, Sqoop, Hive et HBase.", subtitle_style))
    
    story.append(Spacer(1, 120))
    story.append(Paragraph("Auteur : <b>Omar El Khali</b>", meta_style))
    story.append(Paragraph("Rôle : <b>Administrateur SkillBridge & Architecte Big Data</b>", meta_style))
    story.append(Paragraph("Projet : <b>SPRING_BIGDATA_PROJECT (Full-Stack Engineering)</b>", meta_style))
    story.append(Paragraph("Date de Publication : <b>20 mai 2026</b>", meta_style))
    
    story.append(PageBreak())

    # ==========================================
    # PAGE 2: ARCHITECTURE DU PROJET
    # ==========================================
    story.append(Paragraph("1. Architecture Globale du Projet", h1_style))
    story.append(Paragraph(
        "L'architecture technique de <b>SkillBridge</b> sépare le monde <i>transactionnel web</i> du monde <i>analytique Big Data</i>. "
        "Cette division permet de maintenir des performances optimales en production pour les étudiants tout en menant des analyses lourdes de type "
        "Business Intelligence et Big Data à froid.",
        body_style
    ))
    
    # Embed Architecture Image
    # Original aspect ratio: 10:7. Target width: 480pt. Height: 336pt
    story.append(Spacer(1, 5))
    story.append(Image(arch_img_path, width=480, height=336))
    story.append(Spacer(1, 5))
    
    story.append(Paragraph(
        "<b>Les trois grands piliers de l'architecture :</b><br/>"
        "• <b>Zone Applicative (React + Spring Boot) :</b> Interface utilisateur réactive liée à une API REST sécurisée par JWT, avec connexions sociales simulées.<br/>"
        "• <b>Zone Transactionnelle (Supabase PostgreSQL) :</b> Base de données applicative hébergée sur le cloud de Supabase, gérant 17 075 cours via un pooler de connexions optimisé.<br/>"
        "• <b>Zone Big Data (Docker) :</b> Contient un cluster Hadoop complet (Namenode, Datanodes), des moteurs d'ingestion (Flume, Sqoop), un moteur SQL (Hive), un magasin NoSQL (HBase) et un serveur de calcul MapReduce.",
        body_style
    ))
    story.append(PageBreak())

    # ==========================================
    # PAGE 3: ROLE DES CONTENEURS DOCKER
    # ==========================================
    story.append(Paragraph("2. Le Rôle des Conteneurs dans l'Écosystème Docker", h1_style))
    story.append(Paragraph(
        "L'infrastructure Big Data de SkillBridge repose sur une orchestration de <b>12 conteneurs Docker</b>. "
        "Chacun remplit une fonction précise pour garantir le bon déroulement du cycle de vie des données, de l'ingestion au stockage distribué.",
        body_style
    ))

    # Containers Table
    data_containers = [
        [Paragraph("<b>Conteneur Docker</b>", body_style), Paragraph("<b>Technologie</b>", body_style), Paragraph("<b>Rôle principal</b>", body_style)],
        
        [Paragraph("<b>skillbridge-namenode</b>", body_style), Paragraph("Apache Hadoop 2.7.4", body_style), 
         Paragraph("Gère les métadonnées et l'arborescence des répertoires du système de fichiers distribué HDFS.", body_style)],
        
        [Paragraph("<b>bigdata-datanode-1 / 2</b>", body_style), Paragraph("Apache Hadoop 2.7.4", body_style), 
         Paragraph("Stockent les blocs de données réels du HDFS avec réplication.", body_style)],
         
        [Paragraph("<b>skillbridge-resourcemanager</b>", body_style), Paragraph("Apache Hadoop YARN", body_style), 
         Paragraph("Orchestre et alloue les ressources du cluster pour l'exécution des jobs distribués (MapReduce).", body_style)],

        [Paragraph("<b>skillbridge-nodemanager</b>", body_style), Paragraph("Apache Hadoop YARN", body_style), 
         Paragraph("Exécute les tâches de calcul allouées par le Resource Manager sur chaque nœud du cluster.", body_style)],

        [Paragraph("<b>skillbridge-flume-agent</b>", body_style), Paragraph("Apache Flume 1.9.0", body_style), 
         Paragraph("Ingère en streaming temps réel les événements web écrits dans 'events.log' vers le HDFS.", body_style)],

        [Paragraph("<b>skillbridge-sqoop-client</b>", body_style), Paragraph("Apache Sqoop 1.4.7", body_style), 
         Paragraph("Passeelle d'import batch reliant PostgreSQL local à HDFS pour le catalogue de cours.", body_style)],

        [Paragraph("<b>skillbridge-hive-server</b>", body_style), Paragraph("Apache Hive 2.3.2", body_style), 
         Paragraph("Fournit un moteur d'exécution SQL (HiveQL) avec serveur JDBC Beeline pour interroger HDFS.", body_style)],

        [Paragraph("<b>skillbridge-hbase</b>", body_style), Paragraph("Apache HBase (NoSQL)", body_style), 
         Paragraph("Base de données orientée colonnes clé-valeur pour un accès en lecture ultra-rapide aux statistiques.", body_style)],

        [Paragraph("<b>skillbridge-postgres-mirror</b>", body_style), Paragraph("PostgreSQL 16", body_style), 
         Paragraph("Miroir transactionnel local utilisé par Sqoop et Python pour isoler le Big Data de Supabase.", body_style)]
    ]

    t_containers = Table(data_containers, colWidths=[120, 110, 250])
    t_containers.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT_BG]),
    ]))
    
    story.append(t_containers)
    story.append(PageBreak())

    # ==========================================
    # PAGE 4: USE CASE RECOMMENDATION FLOW
    # ==========================================
    story.append(Paragraph("3. Focus Use Case : Clic sur 'Generate Recommendation'", h1_style))
    story.append(Paragraph(
        "Ce cas d'usage représente le cœur interactif de SkillBridge. Il démontre la synergie entre la requête utilisateur (UI), "
        "l'algorithme de scoring (Backend API), la base de données transactionnelle (Supabase) et les statistiques analytiques accumulées par HBase.",
        body_style
    ))
    
    # Embed Flow Image
    story.append(Spacer(1, 5))
    story.append(Image(flow_img_path, width=480, height=288))
    story.append(Spacer(1, 5))

    story.append(Paragraph(
        "<b>Description détaillée du flux d'exécution :</b><br/>"
        "1. <b>Déclenchement :</b> L'utilisateur clique sur 'Generate Recommendation' sur le frontend. React envoie une requête POST au backend.<br/>"
        "2. <b>Normalisation et Matching (Backend) :</b> Le backend charge l'idée de projet, tokenise la description, filtre les mots vides et détecte les compétences requises.<br/>"
        "3. <b>Calcul du Score Recommandeur :</b> Le service Spring Boot évalue les cours du catalogue sur 100 points.<br/>"
        "4. <b>Injection Analytique HBase :</b> Pour chaque cours, le backend interroge les données de popularité consolidées par HBase. Si un cours a été très visité ou complété, il gagne un <b>bonus de 2 points</b>.<br/>"
        "5. <b>Historisation de l'Événement :</b> Le backend sauvegarde un snapshot et écrit en append dans le fichier local <b>events.log</b>.<br/>"
        "6. <b>Streaming Flume :</b> L'agent Flume détecte immédiatement la ligne et l'envoie dans HDFS en moins de 30 secondes pour les futurs traitements MapReduce.",
        body_style
    ))
    story.append(PageBreak())

    # ==========================================
    # PAGE 5: AUTRES USE CASES - STREAMING & BATCH
    # ==========================================
    story.append(Paragraph("4. Les Autres Cas d'Usage de la Plateforme", h1_style))
    
    story.append(Paragraph("Use Case A : Recherche de cours et comptage MapReduce (Streaming)", h2_style))
    story.append(Paragraph(
        "Chaque fois qu'un étudiant recherche un cours, le frontend appelle l'API et génère un événement de type <b>COURSE_SEARCH</b>. "
        "Cet événement est écrit dans <b>events.log</b>, streamé par <b>Flume</b> dans HDFS, puis analysé de manière distribuée par un job <b>MapReduce Java</b>.",
        body_style
    ))
    
    story.append(Paragraph("<b>Extrait du code clé du Mapper Java (TopSearchKeywordsJob) :</b>", ParagraphStyle('CodeTitle', parent=body_style, fontName='Helvetica-Bold')))
    story.append(Paragraph(
        "// Extrait le type d'événement et tokenise les mots-clés de recherche\n"
        "String query = \"COURSE_SEARCH\".equals(eventType)\n"
        "    ? jsonField(line, \"query\").toLowerCase(Locale.ROOT)\n"
        "    : (jsonField(line, \"projectTitle\") + \" \" + jsonField(line, \"projectDescription\")).toLowerCase(Locale.ROOT);\n"
        "Matcher matcher = TOKEN_PATTERN.matcher(query);\n"
        "while (matcher.find()) {\n"
        "    String token = matcher.group();\n"
        "    if (token.length() <= 1 || STOP_WORDS.contains(token)) continue;\n"
        "    outputKey.set(token);\n"
        "    context.write(outputKey, ONE); // Émet (mot, 1)\n"
        "}",
        code_style
    ))

    story.append(Paragraph("Use Case B : Synchronisation du Catalogue et Requêtes HiveQL (Batch)", h2_style))
    story.append(Paragraph(
        "Ce cas d'usage commence par la fusion et déduplication de datasets Kaggle (Coursera, edX) via un script Python. "
        "Les <b>17 072 cours uniques</b> sont stockés dans le miroir PostgreSQL local. "
        "<b>Sqoop</b> les importe ensuite dans HDFS au format TSV. Enfin, <b>Hive Server</b> crée des tables externes pointant vers ces fichiers HDFS, "
        "permettant aux administrateurs de mener des requêtes SQL complexes.",
        body_style
    ))
    
    story.append(Paragraph("<b>Exemple de requête HiveQL Analytique :</b>", ParagraphStyle('CodeTitle2', parent=body_style, fontName='Helvetica-Bold')))
    story.append(Paragraph(
        "-- Répartition des cours du catalogue HDFS par niveau\n"
        "SELECT level, COUNT(*) AS total_courses\n"
        "FROM hive_courses\n"
        "GROUP BY level\n"
        "ORDER BY total_courses DESC;",
        code_style
    ))
    story.append(PageBreak())

    # ==========================================
    # PAGE 6: USE CASE D'ACTIVITE & MONITORING
    # ==========================================
    story.append(Paragraph("5. Suivi d'Activité (HBase) & Validation des Liaisons", h1_style))
    
    story.append(Paragraph("Use Case C : Suivi d'Activité et Consolidation dans HBase", h2_style))
    story.append(Paragraph(
        "Lorsqu'un étudiant clique ou sauvegarde un cours sur l'UI React, un événement <b>COURSE_CLICK</b> ou <b>COURSE_SAVE</b> est généré. "
        "Les événements sont accumulés dans HDFS. Un script Python analytique agrège ces données brutes HDFS avec les tables de progression, "
        "puis charge le résultat dans la base NoSQL <b>HBase</b> dans la table <b>course_stats</b>. "
        "Les statistiques clés (nombre de clics, de sauvegardes, progression moyenne) sont rendues sous forme de graphiques sur le dashboard d'administration.",
        body_style
    ))
    
    story.append(Paragraph("Résultats de la Validation Technique des Liaisons", h2_style))
    story.append(Paragraph(
        "Des tests de liaison approfondis ont été exécutés en direct pour confirmer la synchronisation parfaite de tout le système. "
        "Les résultats du monitoring confirment le fonctionnement nominal de chaque module.",
        body_style
    ))

    # Validation Table
    data_val = [
        [Paragraph("<b>Composant & Test de Liaison</b>", body_style), Paragraph("<b>Description du Test</b>", body_style), Paragraph("<b>Résultat de Validation</b>", body_style)],
        
        [Paragraph("<b>Liaison API → Supabase</b>", body_style), Paragraph("Vérification du chargement et de la pagination du catalogue de cours.", body_style), 
         Paragraph("<b>Succès</b> : 17 075 cours retournés via port 6543 (HikariPool).", body_style)],
        
        [Paragraph("<b>Liaison Flume → HDFS</b>", body_style), Paragraph("Vérification de la détection et écriture en streaming en direct des clics de l'UI.", body_style), 
         Paragraph("<b>Succès</b> : Fichier events.1779297456331 trouvé dans HDFS.", body_style)],

        [Paragraph("<b>Liaison Sqoop → HDFS</b>", body_style), Paragraph("Vérification de l'import des cours et compétences de PostgreSQL local à HDFS.", body_style), 
         Paragraph("<b>Succès</b> : Fichier unified_courses de 38.8 MB dans raw/sqoop.", body_style)],

        [Paragraph("<b>Requêtes HiveQL</b>", body_style), Paragraph("Exécution de comptages SQL sur les tables externes Hive.", body_style), 
         Paragraph("<b>Succès</b> : hive_courses count = 17 072 | hive_events count = 62.", body_style)],

        [Paragraph("<b>Traitement MapReduce</b>", body_style), Paragraph("Extraction des mots-clés à partir de la sortie part-r-00000 HDFS.", body_style), 
         Paragraph("<b>Succès</b> : 18 mots-clés trouvés (developer, frontend, python...).", body_style)],

        [Paragraph("<b>Stockage HBase</b>", body_style), Paragraph("Vérification du nombre de lignes dans la table course_stats HBase.", body_style), 
         Paragraph("<b>Succès</b> : 50 lignes indexées avec succès.", body_style)]
    ]

    t_val = Table(data_val, colWidths=[120, 180, 180])
    t_val.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT_BG]),
    ]))
    
    story.append(t_val)
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "Ce rapport technique démontre que le pipeline Big Data et l'interface applicative web de SkillBridge collaborent de manière "
        "synchrone et résiliente, offrant un écosystème robuste pour l'apprentissage et l'analyse de données à grande échelle.",
        body_style
    ))

    # Build Document using our NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)

if __name__ == "__main__":
    create_report()
    print("Report PDF generated successfully!")

import os
import sys
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Setup output directories
reports_dir = os.path.dirname(os.path.abspath(__file__))
os.makedirs(reports_dir, exist_ok=True)

arch_path = os.path.join(reports_dir, "architecture_diagram.png")
flow_path = os.path.join(reports_dir, "recommendation_flow.png")

# Define Theme Colors
PRIMARY = "#1A365D"    # Dark Blue
SECONDARY = "#319795"  # Teal
ACCENT = "#D69E2E"     # Gold
BG_LIGHT = "#EDF2F7"   # Warm Light Grey
TEXT_DARK = "#2D3748"  # Charcoal
TEXT_LIGHT = "#FFFFFF" # White

# ==========================================
# DIAGRAM 1: ARCHITECTURE DIAGRAM
# ==========================================
def draw_architecture():
    fig, ax = plt.subplots(figsize=(10, 7), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.axis('off')
    fig.patch.set_facecolor('#F7FAFC')

    # Draw Layers Title
    ax.text(5, 7.6, "SkillBridge Architecture Globale & Pipeline Big Data", 
            fontsize=16, fontweight='bold', color=PRIMARY, ha='center')

    # --- WEB LAYER (0.5 to 1.5 y) ---
    # React Box
    rect_react = patches.FancyBboxPatch((1.5, 6.0), 3.0, 1.0, boxstyle="round,pad=0.1", 
                                        facecolor=SECONDARY, edgecolor=PRIMARY, linewidth=1.5)
    ax.add_patch(rect_react)
    ax.text(3.0, 6.5, "Frontend Web UI\nReact + Vite\n(Port 5173)", 
            fontsize=10, color=TEXT_LIGHT, fontweight='bold', ha='center', va='center')

    # Spring Boot Box
    rect_spring = patches.FancyBboxPatch((5.5, 6.0), 3.0, 1.0, boxstyle="round,pad=0.1", 
                                         facecolor=PRIMARY, edgecolor=SECONDARY, linewidth=1.5)
    ax.add_patch(rect_spring)
    ax.text(7.0, 6.5, "Backend API REST\nSpring Boot\n(Port 8081)", 
            fontsize=10, color=TEXT_LIGHT, fontweight='bold', ha='center', va='center')

    # --- DATABASE LAYER (4.0 to 5.0 y) ---
    # Supabase Box
    rect_supabase = patches.FancyBboxPatch((1.5, 4.2), 3.0, 1.0, boxstyle="round,pad=0.1", 
                                           facecolor="#4A5568", edgecolor="#2D3748", linewidth=1.5)
    ax.add_patch(rect_supabase)
    ax.text(3.0, 4.7, "Supabase Cloud\nPostgreSQL Database\n(Port 6543)", 
            fontsize=9, color=TEXT_LIGHT, fontweight='bold', ha='center', va='center')

    # Postgres Mirror Box
    rect_mirror = patches.FancyBboxPatch((5.5, 4.2), 3.0, 1.0, boxstyle="round,pad=0.1", 
                                         facecolor="#4A5568", edgecolor="#2D3748", linewidth=1.5)
    ax.add_patch(rect_mirror)
    ax.text(7.0, 4.7, "Local Postgres Mirror\nDocker Container\n(Port 5433)", 
            fontsize=9, color=TEXT_LIGHT, fontweight='bold', ha='center', va='center')

    # --- BIG DATA INGESTION & STORAGE LAYER (1.8 to 3.2 y) ---
    # events.log & Flume
    rect_flume = patches.FancyBboxPatch((0.5, 2.0), 2.5, 1.2, boxstyle="round,pad=0.1", 
                                        facecolor=ACCENT, edgecolor=PRIMARY, linewidth=1.5)
    ax.add_patch(rect_flume)
    ax.text(1.75, 2.6, "Collecte Streaming\nevents.log\n+ Flume Agent", 
            fontsize=9, color=TEXT_DARK, fontweight='bold', ha='center', va='center')

    # HDFS Box
    rect_hdfs = patches.FancyBboxPatch((3.75, 2.0), 2.5, 1.2, boxstyle="round,pad=0.1", 
                                       facecolor="#2B6CB0", edgecolor=PRIMARY, linewidth=1.5)
    ax.add_patch(rect_hdfs)
    ax.text(5.0, 2.6, "HDFS Distributed File System\nNamenode + 2 Datanodes\n(Port 9000 / 9870)", 
            fontsize=8, color=TEXT_LIGHT, fontweight='bold', ha='center', va='center')

    # Sqoop Client Box
    rect_sqoop = patches.FancyBboxPatch((7.0, 2.0), 2.5, 1.2, boxstyle="round,pad=0.1", 
                                        facecolor=ACCENT, edgecolor=PRIMARY, linewidth=1.5)
    ax.add_patch(rect_sqoop)
    ax.text(8.25, 2.6, "Sqoop Client\nBatch Data Sync\nPostgres -> HDFS", 
            fontsize=9, color=TEXT_DARK, fontweight='bold', ha='center', va='center')

    # --- BIG DATA ANALYTICS & STATS LAYER (0.2 to 1.2 y) ---
    # Hive
    rect_hive = patches.FancyBboxPatch((1.0, 0.4), 2.3, 0.9, boxstyle="round,pad=0.1", 
                                       facecolor="#ED8936", edgecolor="#C05621", linewidth=1.5)
    ax.add_patch(rect_hive)
    ax.text(2.15, 0.85, "HiveQL Analytics\nHive Server\n(Port 10000)", 
            fontsize=8, color=TEXT_LIGHT, fontweight='bold', ha='center', va='center')

    # MapReduce
    rect_mr = patches.FancyBboxPatch((3.85, 0.4), 2.3, 0.9, boxstyle="round,pad=0.1", 
                                     facecolor="#3182CE", edgecolor="#2B6CB0", linewidth=1.5)
    ax.add_patch(rect_mr)
    ax.text(5.0, 0.85, "Hadoop MapReduce\nJava Job\n(Keywords Extractor)", 
            fontsize=8, color=TEXT_LIGHT, fontweight='bold', ha='center', va='center')

    # HBase
    rect_hbase = patches.FancyBboxPatch((6.7, 0.4), 2.3, 0.9, boxstyle="round,pad=0.1", 
                                        facecolor="#38A169", edgecolor="#2F855A", linewidth=1.5)
    ax.add_patch(rect_hbase)
    ax.text(7.85, 0.85, "HBase NoSQL Database\nTable 'course_stats'\n(Port 16010)", 
            fontsize=8, color=TEXT_LIGHT, fontweight='bold', ha='center', va='center')

    # --- DRAWING ARROWS ---
    def draw_arrow(x1, y1, x2, y2, label="", color="#4A5568"):
        ax.annotate(label, xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(facecolor=color, edgecolor=color, width=1.5, headwidth=6, shrink=0.08),
                    fontsize=8, fontweight='bold', color=color, ha='center', va='center')

    # React <-> Spring Boot (Bidirectional REST)
    draw_arrow(4.6, 6.6, 5.4, 6.6, "", SECONDARY)
    draw_arrow(5.4, 6.4, 4.6, 6.4, "", SECONDARY)

    # Spring Boot -> Supabase
    draw_arrow(3.0, 6.0, 3.0, 5.3, "REST/JPA", TEXT_DARK)

    # Spring Boot -> events.log -> Flume
    draw_arrow(7.0, 6.0, 1.75, 3.3, "Append Events", TEXT_DARK)

    # Flume -> HDFS
    draw_arrow(3.1, 2.6, 3.65, 2.6, "Stream", PRIMARY)

    # Postgres Mirror -> Sqoop -> HDFS
    draw_arrow(7.0, 4.2, 8.25, 3.3, "Batch", TEXT_DARK)
    draw_arrow(8.25, 2.0, 6.35, 2.6, "Import", PRIMARY)

    # HDFS -> Hive (Internal relation)
    draw_arrow(4.5, 2.0, 2.15, 1.4, "External Tables", SECONDARY)

    # HDFS -> MapReduce
    draw_arrow(5.0, 2.0, 5.0, 1.4, "Process", SECONDARY)

    # HBase stats back to Spring Boot
    draw_arrow(7.85, 1.4, 7.0, 5.9, "Aggregated Stats", SECONDARY)

    plt.tight_layout()
    plt.savefig(arch_path, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()

# ==========================================
# DIAGRAM 2: RECOMMENDATION FLOW DIAGRAM
# ==========================================
def draw_flow():
    fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis('off')
    fig.patch.set_facecolor('#F7FAFC')

    ax.text(5, 5.6, "Flux du Use Case : Clic sur 'Generate Recommendation'", 
            fontsize=15, fontweight='bold', color=PRIMARY, ha='center')

    # Step Boxes
    steps = [
        ("1. Interface React", "L'utilisateur clique sur 'Generate Recommendation'\npour une idée de projet.", (0.5, 3.8), 2.5, 1.2, SECONDARY),
        ("2. Backend API Controller", "Le controller Spring Boot reçoit le projet\net démarre le traitement.", (3.75, 3.8), 2.5, 1.2, PRIMARY),
        ("3. Recommendation Engine", "Analyse les mots-clés, matche\nles catégories & compétences.\nCalcule le score initial.", (7.0, 3.8), 2.5, 1.2, PRIMARY),
        ("4. HBase Stats Cache", "Récupère les statistiques de clics\net progression dans 'course_stats'\npour ajouter un bonus analytique.", (7.0, 1.2), 2.5, 1.2, "#38A169"),
        ("5. Persistance & Ingestion", "Enregistre le snapshot de recommandation\net écrit un événement PROJECT_RECOMMENDATION\ndans events.log.", (3.75, 1.2), 2.5, 1.2, ACCENT),
        ("6. Flume Streaming", "L'événement de recommandation est poussé\nvers HDFS en temps réel par Flume\npour de futures analyses analytiques.", (0.5, 1.2), 2.5, 1.2, "#ED8936")
    ]

    for title, desc, pos, w, h, col in steps:
        rect = patches.FancyBboxPatch(pos, w, h, boxstyle="round,pad=0.1", 
                                      facecolor=col, edgecolor=PRIMARY, linewidth=1.2)
        ax.add_patch(rect)
        
        text_color = TEXT_LIGHT if col != ACCENT else TEXT_DARK
        ax.text(pos[0] + w/2, pos[1] + h - 0.3, title, fontsize=9, color=text_color, fontweight='bold', ha='center')
        ax.text(pos[0] + w/2, pos[1] + h/2 - 0.2, desc, fontsize=7.5, color=text_color, ha='center', va='center')

    # Arrows
    def arrow(x1, y1, x2, y2):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(facecolor=PRIMARY, edgecolor=PRIMARY, width=1.0, headwidth=5, shrink=0.08))

    arrow(3.1, 4.4, 3.65, 4.4)
    arrow(6.35, 4.4, 6.9, 4.4)
    arrow(8.25, 3.7, 8.25, 2.5)
    arrow(6.9, 1.8, 6.35, 1.8)
    arrow(3.65, 1.8, 3.1, 1.8)
    # Loop back arrow from Step 5 to React (via backend return)
    ax.annotate('7. Retour des résultats enrichis à l\'UI', xy=(1.75, 3.7), xytext=(5.0, 3.1),
                arrowprops=dict(facecolor=SECONDARY, edgecolor=SECONDARY, width=1.0, headwidth=5, shrink=0.08),
                fontsize=8, fontweight='bold', color=SECONDARY, ha='center')

    plt.tight_layout()
    plt.savefig(flow_path, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()

if __name__ == "__main__":
    draw_architecture()
    draw_flow()
    print("Visual diagrams created successfully in docs/reports/!")

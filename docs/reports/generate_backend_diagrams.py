import os
import sys
import matplotlib.pyplot as plt
import matplotlib.patches as patches

reports_dir = os.path.dirname(os.path.abspath(__file__))
os.makedirs(reports_dir, exist_ok=True)

class_diag_path = os.path.join(reports_dir, "backend_classes_diagram.png")

PRIMARY = "#1A365D"    # Dark Blue
SECONDARY = "#319795"  # Teal
ACCENT = "#D69E2E"     # Gold
DARK_TEXT = "#2D3748"  # Slate
LIGHT_BG = "#EDF2F7"   # Warm Grey
WHITE = "#FFFFFF"

def draw_backend_classes():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')
    fig.patch.set_facecolor('#F7FAFC')

    ax.text(5, 6.6, "Structure des Classes du Backend Spring Boot (SkillBridge)", 
            fontsize=15, fontweight='bold', color=PRIMARY, ha='center')

    # Draw Layer Blocks
    # 1. CONTROLLERS (y=4.5 to 5.7)
    # 2. SERVICES (y=2.5 to 3.7)
    # 3. REPOSITORIES (y=0.7 to 1.7)
    
    # Draw Layer Labels
    ax.text(0.3, 5.1, "REST CONTROLLERS", fontsize=10, fontweight='bold', color=SECONDARY, rotation=90, va='center')
    ax.text(0.3, 3.1, "BUSINESS SERVICES", fontsize=10, fontweight='bold', color=PRIMARY, rotation=90, va='center')
    ax.text(0.3, 1.2, "JPA REPOSITORIES", fontsize=10, fontweight='bold', color="#4A5568", rotation=90, va='center')

    # CONTROLLER BOXES
    ctrls = [
        ("AuthController", "Auth / JWT Login\nGoogle / GitHub", (0.8, 4.6), 1.9, 1.0, SECONDARY),
        ("CourseController", "Catalog browsing\nCRUD endpoints", (3.0, 4.6), 1.9, 1.0, SECONDARY),
        ("ProjectIdeaController", "Manage ideas\nTrigger recs", (5.2, 4.6), 1.9, 1.0, SECONDARY),
        ("AdminController", "Overview stats\nBig Data pipelines", (7.4, 4.6), 1.9, 1.0, SECONDARY)
    ]
    
    for title, desc, pos, w, h, col in ctrls:
        rect = patches.FancyBboxPatch(pos, w, h, boxstyle="round,pad=0.08", 
                                      facecolor=col, edgecolor=PRIMARY, linewidth=1.2)
        ax.add_patch(rect)
        ax.text(pos[0]+w/2, pos[1]+h-0.25, title, fontsize=8.5, color=WHITE, fontweight='bold', ha='center')
        ax.text(pos[0]+w/2, pos[1]+h/2-0.15, desc, fontsize=7, color=WHITE, ha='center', va='center')

    # SERVICE BOXES
    svcs = [
        ("JwtService", "JWT parsing, token\ngeneration & validation", (0.8, 2.6), 1.9, 1.0, PRIMARY),
        ("RecommendationService", "Scoring engine (100 pts)\nCat & Skill matching", (3.0, 2.6), 2.2, 1.0, PRIMARY),
        ("AdminService", "Overview & Metrics\nJDBC aggregator", (5.5, 2.6), 1.9, 1.0, PRIMARY),
        ("BigDataEventService\n& BigDataStatusService", "Appends events.log |\nReads HDFS / HBase stats", (7.7, 2.6), 2.0, 1.0, ACCENT)
    ]
    
    for title, desc, pos, w, h, col in svcs:
        rect = patches.FancyBboxPatch(pos, w, h, boxstyle="round,pad=0.08", 
                                      facecolor=col, edgecolor=PRIMARY, linewidth=1.2)
        ax.add_patch(rect)
        text_color = WHITE if col != ACCENT else DARK_TEXT
        ax.text(pos[0]+w/2, pos[1]+h-0.3, title, fontsize=8, color=text_color, fontweight='bold', ha='center')
        ax.text(pos[0]+w/2, pos[1]+h/2-0.2, desc, fontsize=6.5, color=text_color, ha='center', va='center')

    # REPOSITORY BOXES
    repos = [
        ("UserRepository", "User entity\nDB queries", (0.8, 0.8), 1.9, 0.8, "#4A5568"),
        ("CourseRepository", "Course & Skill coverage\nPopularity sorts", (3.0, 0.8), 2.1, 0.8, "#4A5568"),
        ("ProjectIdeaRepository", "Snapshot & Results\nJointures loading", (5.4, 0.8), 2.1, 0.8, "#4A5568"),
        ("Supabase PostgreSQL", "Live Cloud Database\n(Port 6543)", (7.8, 0.8), 1.9, 0.8, "#2D3748")
    ]
    
    for title, desc, pos, w, h, col in repos:
        rect = patches.FancyBboxPatch(pos, w, h, boxstyle="round,pad=0.08", 
                                      facecolor=col, edgecolor=PRIMARY, linewidth=1.2)
        ax.add_patch(rect)
        ax.text(pos[0]+w/2, pos[1]+h-0.25, title, fontsize=8, color=WHITE, fontweight='bold', ha='center')
        ax.text(pos[0]+w/2, pos[1]+h/2-0.18, desc, fontsize=6.5, color=WHITE, ha='center', va='center')

    # ARROWS
    def draw_arrow(x1, y1, x2, y2, color="#4A5568"):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(facecolor=color, edgecolor=color, width=0.8, headwidth=4, shrink=0.05))

    # Controller -> Service Connections
    draw_arrow(1.75, 4.6, 1.75, 3.6) # AuthCtrl -> JwtSvc
    draw_arrow(4.0, 4.6, 4.0, 3.6) # CourseCtrl -> RecSvc (directly / indirectly)
    draw_arrow(6.15, 4.6, 4.25, 3.6) # ProjectIdeaCtrl -> RecSvc
    draw_arrow(8.35, 4.6, 6.45, 3.6) # AdminCtrl -> AdminSvc
    draw_arrow(8.35, 4.6, 8.7, 3.6) # AdminCtrl -> BigDataSvc

    # Service -> Repository/DB Connections
    draw_arrow(1.75, 2.6, 1.75, 1.6) # JwtSvc -> UserRepo
    draw_arrow(4.0, 2.6, 4.0, 1.6) # RecSvc -> CourseRepo
    draw_arrow(4.2, 2.6, 6.2, 1.6) # RecSvc -> ProjectRepo
    draw_arrow(6.45, 2.6, 6.45, 1.6) # AdminSvc -> ProjectRepo
    draw_arrow(8.7, 2.6, 8.7, 1.6) # BigDataSvc -> Supabase / HDFS

    # Repo -> Supabase line
    draw_arrow(2.7, 1.2, 7.8, 1.2, SECONDARY)
    draw_arrow(5.1, 1.2, 7.8, 1.2, SECONDARY)

    plt.tight_layout()
    plt.savefig(class_diag_path, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()

if __name__ == "__main__":
    draw_backend_classes()
    print("Backend classes diagram created successfully!")

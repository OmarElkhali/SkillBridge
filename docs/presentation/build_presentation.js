const path = require("path");
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();

pres.layout = "LAYOUT_16x9";
pres.author = "SkillBridge Team";
pres.company = "SkillBridge";
pres.subject = "SkillBridge Platform";
pres.title = "SkillBridge";
pres.theme = {
  headFontFace: "Georgia",
  bodyFontFace: "Calibri",
  lang: "en-US",
};

const COLORS = {
  navy: "0B1F2A",
  deep: "0E5A72",
  teal: "1C7293",
  mint: "6CBFB4",
  sand: "F4F6F8",
  gold: "C9A227",
  gray: "65717E",
  dark: "20242A",
  white: "FFFFFF",
};

const SLIDE_W = 10;
const SLIDE_H = 5.625;
const ASSETS = path.join(__dirname, "assets");
const PIPELINE_IMG = path.join(ASSETS, "bigdata-pipeline.jpeg");
const LOGO = path.join(ASSETS, "logo.svg");

function addTitle(slide, title, subtitle) {
  slide.addText(title, {
    x: 0.7,
    y: 1.2,
    w: 8.6,
    h: 1.0,
    fontSize: 44,
    bold: true,
    color: COLORS.white,
  });
  slide.addText(subtitle, {
    x: 0.7,
    y: 2.3,
    w: 8.6,
    h: 0.8,
    fontSize: 18,
    color: COLORS.mint,
  });
}

function addHeader(slide, title) {
  slide.addText(title, {
    x: 0.7,
    y: 0.4,
    w: 8.9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: COLORS.dark,
  });
}

function addSectionSlide(title, subtitle) {
  const slide = pres.addSlide();
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { color: COLORS.navy },
    line: { color: COLORS.navy },
  });
  slide.addText(title, {
    x: 0.8,
    y: 2.0,
    w: 8.5,
    h: 0.8,
    fontSize: 38,
    bold: true,
    color: COLORS.white,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.8,
      y: 2.85,
      w: 8.5,
      h: 0.6,
      fontSize: 18,
      color: COLORS.mint,
    });
  }
  return slide;
}

function addFooter(slide, text) {
  slide.addText(text, {
    x: 0.7,
    y: 5.2,
    w: 8.6,
    h: 0.3,
    fontSize: 10,
    color: COLORS.gray,
  });
}

function addAgenda(items) {
  const slide = pres.addSlide();
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { color: COLORS.sand },
    line: { color: COLORS.sand },
  });
  addHeader(slide, "Agenda");
  slide.addText(
    items.map((item) => ({ text: item, options: { bullet: true, breakLine: true } })),
    {
      x: 0.9,
      y: 1.3,
      w: 8.6,
      h: 3.6,
      fontSize: 18,
      color: COLORS.dark,
    }
  );
  addFooter(slide, "SkillBridge | Academic Project Report");
}

function addTwoColumn(title, leftTitle, leftPoints, rightTitle, rightPoints) {
  const slide = pres.addSlide();
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { color: COLORS.sand },
    line: { color: COLORS.sand },
  });
  addHeader(slide, title);

  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.7,
    y: 1.3,
    w: 4.25,
    h: 3.6,
    fill: { color: COLORS.white },
    line: { color: COLORS.mint },
    rectRadius: 0.08,
  });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.05,
    y: 1.3,
    w: 4.25,
    h: 3.6,
    fill: { color: COLORS.white },
    line: { color: COLORS.mint },
    rectRadius: 0.08,
  });

  slide.addText(leftTitle, {
    x: 0.95,
    y: 1.5,
    w: 3.8,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: COLORS.deep,
  });
  slide.addText(
    leftPoints.map((item) => ({ text: item, options: { bullet: true, breakLine: true } })),
    {
      x: 0.95,
      y: 2.0,
      w: 3.9,
      h: 2.7,
      fontSize: 14,
      color: COLORS.dark,
    }
  );

  slide.addText(rightTitle, {
    x: 5.3,
    y: 1.5,
    w: 3.8,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: COLORS.deep,
  });
  slide.addText(
    rightPoints.map((item) => ({ text: item, options: { bullet: true, breakLine: true } })),
    {
      x: 5.3,
      y: 2.0,
      w: 3.9,
      h: 2.7,
      fontSize: 14,
      color: COLORS.dark,
    }
  );

  addFooter(slide, "SkillBridge | Platform Overview");
}

function addCardsSlide(title, cards) {
  const slide = pres.addSlide();
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { color: COLORS.sand },
    line: { color: COLORS.sand },
  });
  addHeader(slide, title);

  const cardW = 2.9;
  const cardH = 3.2;
  const startX = 0.6;
  const gap = 0.35;

  cards.forEach((card, index) => {
    const x = startX + index * (cardW + gap);
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 1.4,
      w: cardW,
      h: cardH,
      fill: { color: COLORS.white },
      line: { color: COLORS.mint },
      rectRadius: 0.08,
      shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 135, opacity: 0.12 },
    });
    slide.addText(card.title, {
      x: x + 0.2,
      y: 1.6,
      w: cardW - 0.4,
      h: 0.4,
      fontSize: 16,
      bold: true,
      color: COLORS.deep,
    });
    slide.addText(
      card.points.map((point) => ({ text: point, options: { bullet: true, breakLine: true } })),
      {
        x: x + 0.2,
        y: 2.05,
        w: cardW - 0.4,
        h: 2.3,
        fontSize: 13,
        color: COLORS.dark,
      }
    );
  });

  addFooter(slide, "SkillBridge | Core Modules");
}

function addPipelineDiagramSlide() {
  const slide = pres.addSlide();
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { color: COLORS.sand },
    line: { color: COLORS.sand },
  });
  addHeader(slide, "End-to-End Pipeline (System View)");

  const stepsTop = [
    "Idea Input",
    "Skill Detection",
    "Catalog Search",
    "Recommendation",
    "Event Logging",
    "Analytics"
  ];
  const stepsBottom = [
    "Catalog Build",
    "Supabase Sync",
    "Sqoop Import",
    "Hive Queries",
    "MapReduce",
    "HBase Serving"
  ];

  const boxW = 1.4;
  const boxH = 0.8;
  const gap = 0.22;
  const startX = 0.5;

  stepsTop.forEach((label, idx) => {
    const x = startX + idx * (boxW + gap);
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 1.45,
      w: boxW,
      h: boxH,
      fill: { color: COLORS.white },
      line: { color: COLORS.mint },
      rectRadius: 0.08,
    });
    slide.addText(label, {
      x: x + 0.08,
      y: 1.55,
      w: boxW - 0.16,
      h: 0.6,
      fontSize: 12,
      align: "center",
      color: COLORS.dark,
      margin: 0,
    });
  });

  stepsBottom.forEach((label, idx) => {
    const x = startX + idx * (boxW + gap);
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 3.05,
      w: boxW,
      h: boxH,
      fill: { color: COLORS.white },
      line: { color: COLORS.mint },
      rectRadius: 0.08,
    });
    slide.addText(label, {
      x: x + 0.08,
      y: 3.15,
      w: boxW - 0.16,
      h: 0.6,
      fontSize: 12,
      align: "center",
      color: COLORS.dark,
      margin: 0,
    });
  });

  slide.addText("Web Application Flow", {
    x: 0.6,
    y: 1.05,
    w: 4.5,
    h: 0.3,
    fontSize: 12,
    color: COLORS.gray,
  });
  slide.addText("Big Data Flow", {
    x: 0.6,
    y: 2.65,
    w: 4.5,
    h: 0.3,
    fontSize: 12,
    color: COLORS.gray,
  });
  slide.addText("Outputs: explainable recommendations, dashboards, and analytics", {
    x: 0.6,
    y: 4.25,
    w: 8.8,
    h: 0.4,
    fontSize: 14,
    color: COLORS.deep,
  });

  addFooter(slide, "SkillBridge | Full Pipeline");
}

function addImageSlide(title, imagePath, caption) {
  const slide = pres.addSlide();
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { color: COLORS.sand },
    line: { color: COLORS.sand },
  });
  addHeader(slide, title);
  slide.addImage({ path: imagePath, x: 0.6, y: 1.15, w: 8.8, h: 3.9 });
  if (caption) {
    slide.addText(caption, {
      x: 0.6,
      y: 5.1,
      w: 8.8,
      h: 0.3,
      fontSize: 11,
      color: COLORS.gray,
    });
  }
}

function addClosingSlide() {
  const slide = pres.addSlide();
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { color: COLORS.navy },
    line: { color: COLORS.navy },
  });
  slide.addText("Thank you", {
    x: 0.8,
    y: 2.2,
    w: 8.5,
    h: 0.8,
    fontSize: 42,
    bold: true,
    color: COLORS.white,
  });
  slide.addText("Questions & discussion", {
    x: 0.8,
    y: 3.1,
    w: 8.5,
    h: 0.6,
    fontSize: 18,
    color: COLORS.mint,
  });
}

// Slide 1: Title
{
  const slide = pres.addSlide();
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { color: COLORS.navy },
    line: { color: COLORS.navy },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 4.6,
    w: SLIDE_W,
    h: 1.0,
    fill: { color: COLORS.deep },
    line: { color: COLORS.deep },
  });
  slide.addImage({ path: LOGO, x: 0.7, y: 0.6, w: 1.0, h: 1.0 });
  addTitle(slide, "SkillBridge", "Project-Idea-to-Learning-Path Platform");
  slide.addText("Academic Project Report | JEE, Spring Security, Big Data", {
    x: 0.7,
    y: 3.2,
    w: 8.6,
    h: 0.5,
    fontSize: 14,
    color: COLORS.white,
  });
}

// Slide 2: Agenda
addAgenda([
  "Problem & objectives",
  "Solution architecture",
  "Backend & security",
  "Recommendation engine",
  "Frontend experience",
  "Big Data pipeline",
  "Results & validation",
  "Roadmap",
]);

// Slide 3: Problem & opportunity
addTwoColumn(
  "Problem & Opportunity",
  "Learner pain points",
  [
    "Project ideas are concrete, skill paths are not",
    "Course discovery is noisy and unstructured",
    "Lack of explainable recommendations",
  ],
  "SkillBridge response",
  [
    "Turn project text into skills",
    "Ranked, explainable recommendations",
    "Progress + analytics in one platform",
  ]
);

// Slide 4: Architecture overview
addCardsSlide("Three-Application Architecture", [
  {
    title: "Frontend",
    points: ["React + TypeScript", "Protected routes", "Dashboard UX", "API client"],
  },
  {
    title: "Backend",
    points: ["Spring Boot 4", "REST APIs", "Recommendation engine", "Security filters"],
  },
  {
    title: "Big Data",
    points: ["Docker lab", "Sqoop + Flume", "Hive + MapReduce", "HBase outputs"],
  },
]);

// Slide 5: Backend architecture
addTwoColumn(
  "Backend Architecture",
  "Layered design",
  ["Controllers → Services → Repositories", "DTO validation", "Transactions", "Central error handling"],
  "Key modules",
  ["Auth & security", "Catalog management", "Recommendations", "Admin analytics"],
);

// Slide 6: Security highlights
addCardsSlide("Spring Security Highlights", [
  {
    title: "Authentication",
    points: ["JWT tokens", "BCrypt hashing", "Google/GitHub OAuth"],
  },
  {
    title: "Authorization",
    points: ["Role-based access", "Method security", "Owner checks"],
  },
  {
    title: "Hardening",
    points: ["Strict CORS", "HSTS + headers", "Brute-force protection"],
  },
]);

// Slide 7: Recommendation engine
addTwoColumn(
  "Recommendation Engine",
  "Explainable algorithm",
  ["Text normalization", "Skill detection", "Category rules", "Score components"],
  "Score breakdown",
  ["Title match (30)", "Skill match (40)", "Category match (20)", "Popularity bonus (10)"],
);

// Slide 8: Data model focus
addCardsSlide("Core Domain Model", [
  {
    title: "User & Roles",
    points: ["USER / ADMIN", "OAuth identity", "Security context"],
  },
  {
    title: "Learning entities",
    points: ["Projects", "Detected skills", "Recommendations"],
  },
  {
    title: "Catalog",
    points: ["Courses", "Providers", "Categories", "Skills"],
  },
]);

// Slide 9: Frontend experience
addTwoColumn(
  "Frontend Experience",
  "Primary routes",
  ["Dashboard", "Projects", "Courses", "Saved & Progress"],
  "Admin suite",
  ["Overview analytics", "Users management", "Catalog CRUD", "Big Data status"],
);

// Slide 10: Big Data lab overview
addTwoColumn(
  "Big Data Laboratory",
  "Batch pipeline",
  ["Catalog build", "Postgres mirror", "Sqoop → HDFS", "Hive queries"],
  "Streaming pipeline",
  ["events.log", "Flume ingestion", "HDFS raw zone", "Analytics refresh"],
);

// Slide 11: Custom pipeline diagram
addPipelineDiagramSlide();

// Slide 12: Provided pipeline diagram
addImageSlide("Pipeline Diagram (Reference)", PIPELINE_IMG, "Provided pipeline visual for the Big Data flow.");

// Slide 13: Data ingestion & catalog
addTwoColumn(
  "Catalog Building",
  "Inputs",
  ["CSV/JSON datasets", "Provider normalization", "Skill extraction"],
  "Outputs",
  ["Unified courses", "Categories/providers", "Popularity score", "Supabase sync"],
);

// Slide 14: Analytics outputs
addCardsSlide("Analytics Outputs", [
  {
    title: "Hive",
    points: ["Course counts", "Top providers", "Skill distribution"],
  },
  {
    title: "MapReduce",
    points: ["Top search keywords", "User intent signals"],
  },
  {
    title: "HBase",
    points: ["course_stats", "Fast lookup", "Admin dashboards"],
  },
]);

// Slide 15: Admin dashboard value
addTwoColumn(
  "Admin Dashboards",
  "Transactional metrics",
  ["Users", "Projects", "Recommendations", "Saved courses"],
  "Big Data metrics",
  ["Top categories", "Top skills", "Pipeline status", "Data freshness"],
);

// Slide 16: Testing & validation
addCardsSlide("Testing & Validation", [
  {
    title: "Automated",
    points: ["Security tests", "Recommendation tests", "Context load"],
  },
  {
    title: "Manual",
    points: ["Login lockout", "Admin access", "Project workflow"],
  },
  {
    title: "Big Data",
    points: ["Sqoop imports", "Hive queries", "HBase load"],
  },
]);

// Slide 17: Runbook
addTwoColumn(
  "Runbook (Demo Commands)",
  "Backend",
  ["mvn spring-boot:run", "JWT auth ready", "API at :8080"],
  "Frontend + Big Data",
  ["npm run dev", "docker compose up", "Run pipeline scripts"],
);

// Slide 18: Limitations
addTwoColumn(
  "Current Limitations",
  "Product",
  ["Rule-based recommendations", "Manual Hadoop execution", "Screenshots pending"],
  "Engineering",
  ["OAuth setup required", "Docker services dependency", "No auto refresh"],
);

// Slide 19: Future work
addTwoColumn(
  "Future Improvements",
  "Intelligence",
  ["Semantic embeddings", "Feedback loop", "Smarter ranking"],
  "Platform",
  ["Scheduled refresh", "Deployment automation", "Richer analytics"],
);

// Slide 20: Closing
addClosingSlide();

pres.writeFile({ fileName: path.join(__dirname, "SkillBridge_Presentation.pptx") });

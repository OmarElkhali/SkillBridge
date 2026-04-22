INSERT INTO roles(name) VALUES ('USER'), ('ADMIN')
ON CONFLICT (name) DO NOTHING;

INSERT INTO users(first_name, last_name, email, password_hash, role_id)
SELECT first_name, last_name, email, 'demo-password-hash', (SELECT id FROM roles WHERE name = 'USER')
FROM (VALUES
    ('Sara', 'Alaoui', 'sara.alaoui@skillbridge.local'),
    ('Yassine', 'Bennani', 'yassine.bennani@skillbridge.local'),
    ('Imane', 'El Fassi', 'imane.elfassi@skillbridge.local'),
    ('Nadir', 'Kettani', 'nadir.kettani@skillbridge.local'),
    ('Lina', 'Rami', 'lina.rami@skillbridge.local')
) AS seed(first_name, last_name, email)
ON CONFLICT (email) DO NOTHING;

INSERT INTO project_ideas(user_id, title, description)
SELECT u.id, seed.title, seed.description
FROM (VALUES
    ('sara.alaoui@skillbridge.local', 'Secure Spring Boot API', 'Build a REST API with Spring Boot, JWT authentication, PostgreSQL, Docker, and role based access control.'),
    ('yassine.bennani@skillbridge.local', 'Data Lake Analytics Platform', 'Create a data engineering pipeline with Spark, Airflow, data lakes, SQL analytics, and dashboards.'),
    ('imane.elfassi@skillbridge.local', 'React Learning Dashboard', 'Build a frontend dashboard using React, Redux, HTML, CSS, and API integration.'),
    ('nadir.kettani@skillbridge.local', 'Machine Learning Course Recommender', 'Train and evaluate a recommendation system with Python, machine learning, pandas, and deep learning basics.'),
    ('lina.rami@skillbridge.local', 'Cloud DevOps Monitoring App', 'Deploy a cloud application using Docker, Kubernetes, CI/CD, monitoring, and automated testing.'),
    ('sara.alaoui@skillbridge.local', 'SQL Data Quality Tool', 'Design PostgreSQL checks, SQL reports, data cleaning rules, and validation dashboards.'),
    ('yassine.bennani@skillbridge.local', 'Blockchain Audit Prototype', 'Prototype a blockchain data auditing workflow with Ethereum, smart contracts, and backend APIs.'),
    ('imane.elfassi@skillbridge.local', 'UX Research Portal', 'Create a UX research portal with prototyping, usability testing, product design, and user interface workflows.'),
    ('nadir.kettani@skillbridge.local', 'Python Automation Toolkit', 'Build Python automation scripts using packages, object oriented programming, testing, and CLI design.'),
    ('lina.rami@skillbridge.local', 'Digital Marketing Analyzer', 'Analyze SEO, social media marketing, ads, search campaigns, and data visualization metrics.')
) AS seed(email, title, description)
JOIN users u ON u.email = seed.email
WHERE NOT EXISTS (
    SELECT 1 FROM project_ideas p WHERE p.user_id = u.id AND p.title = seed.title
);


# Guide d'Obtention des Captures d'Écran du Pipeline Big Data

Ce guide explique étape par étape comment exécuter les commandes et quelles interfaces ouvrir pour capturer les 5 captures d'écran requises pour documenter le projet Big Data SkillBridge.

---

## 1. État du Cluster HDFS (`figures/hdfs-cluster.png`)

Cette capture doit montrer que le système de fichiers distribué (HDFS) est actif, en bonne santé, avec ses deux Datanodes opérationnels.

### 💻 Commande Terminal (CLI)
Pour vérifier l'état du système de fichiers HDFS depuis votre terminal :
```bash
docker compose exec namenode hdfs dfsadmin -report
```
* **Résultat attendu :** Un résumé affichant `Datanodes available: 2 (2 total, 0 dead)` ainsi que la capacité totale utilisée et disponible du cluster.

### 🌐 Interface Web (Le meilleur endroit pour la capture)
1. Ouvrez votre navigateur internet à l'adresse : **[http://localhost:9870](http://localhost:9870)** (Interface Hadoop NameNode Web UI).
2. **Où faire la capture :**
   * Prenez une capture de la page d'accueil (**Summary**) montrant l'état global du stockage.
   * Ou allez sur l'onglet **Datanodes** pour prendre une capture du tableau listant les 2 Datanodes actifs et en ligne (`In Service`).

---

## 2. Ingestion Batch avec Sqoop (`figures/sqoop-import.png`)

Cette capture doit montrer le processus de synchronisation des tables de cours depuis PostgreSQL vers HDFS à l'aide d'Apache Sqoop.

### 💻 Commande Terminal (CLI)
Exécutez l'importation Sqoop de la table des cours en mode verbeux pour voir les logs du transfert :
```bash
docker compose exec sqoop-client sqoop import \
  --connect jdbc:postgresql://postgres-mirror:5432/skillbridge \
  --username skillbridge \
  --password skillbridge \
  --table courses \
  --target-dir /data/skillbridge/raw/sqoop/courses \
  --delete-target-dir \
  -m 1
```
* **Où faire la capture :** Prenez une capture d'écran de votre terminal à la fin de l'exécution, montrant les lignes contenant le nombre de lignes importées, par exemple :
  `INFO mapreduce.ImportJobBase: Retrieved 100 records.`

### 🌐 Interface Web Alternative
Ouvrez **[http://localhost:8088](http://localhost:8088)** (YARN Resource Manager) pendant ou juste après l'import. Vous verrez le Job MapReduce soumis par Sqoop sous le nom `import_courses` avec le statut `SUCCEEDED`.

---

## 3. Pipeline Temps Réel Flume (`figures/flume-pipeline.png`)

Cette capture doit prouver que l'agent Flume écoute activement le fichier `events.log` du backend et écrit les flux JSON en continu dans HDFS.

### 💻 Commandes Terminal (CLI)
1. **Écouter les logs de Flume :**
   ```bash
   docker compose logs -f flume-agent
   ```
   *(Générez de l'activité sur le site web, par exemple des recherches ou des recommandations, pour voir Flume ingérer les événements en temps réel).*

2. **Lister les fichiers créés par Flume dans HDFS :**
   ```bash
   docker compose exec namenode hdfs dfs -ls -R /data/skillbridge/raw/flume/events
   ```
* **Où faire la capture :** Capturez la liste des fichiers JSON créés sous `/data/skillbridge/raw/flume/events/` avec leurs tailles et horodatages montrant que des paquets d'événements sont écrits de manière distribuée.

---

## 4. Analyses Analytiques avec HiveQL (`figures/hive-analysis.png`)

Cette capture doit montrer une requête SQL complexe exécutée dans Apache Hive qui analyse les données importées pour extraire de la BI.

### 💻 Commande Terminal (CLI)
Lancez une requête SQL d'agrégation de compétences directement dans le serveur Hive via Beeline :
```bash
docker compose exec hive-server beeline -u jdbc:hive2://localhost:10000 -e "
USE skillbridge_bigdata;
SELECT s.name, COUNT(*) AS total_courses
FROM hive_course_skills cs
JOIN hive_skills s ON s.id = cs.skill_id
GROUP BY s.name
ORDER BY total_courses DESC
LIMIT 10;
"
```
* **Où faire la capture :** Capturez le magnifique tableau ASCII généré par Beeline dans votre console terminal affichant la liste des compétences les plus demandées sur la plateforme.

---

## 5. Lecture Rapide HBase NoSQL (`figures/hbase-scan.png`)

Cette capture doit montrer le contenu de la table NoSQL `course_stats` dans HBase, démontrant que les données analytiques sont prêtes à être lues en $O(1)$ par le backend Spring Boot.

### 💻 Commande Terminal (CLI)
Entrez dans le shell HBase et exécutez un scan rapide :
```bash
docker compose exec hbase bash -c "echo \"scan 'course_stats', {LIMIT => 10}\" | hbase shell"
```
* **Où faire la capture :** Prenez une capture d'écran du résultat dans le terminal. Vous y verrez les lignes décrivant les ID de cours avec les familles de colonnes `stats:views`, `stats:recommendations`, et `stats:completions` accompagnées de leurs valeurs respectives.

### 🌐 Interface Web Alternative
Ouvrez **[http://localhost:16010](http://localhost:16010)** (HBase Master UI) dans votre navigateur. Vous y verrez la table `course_stats` listée sous la section **User Tables** avec le nombre de régions actives.

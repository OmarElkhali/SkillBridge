# PlantUML diagram sources

Easiest render command from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\docs\reports\render-plantuml.ps1
```

Manual render command from `docs/reports`:

```powershell
java -jar plantuml.jar -tpng -o ../diagrams .\plantuml\*.puml
```

Expected generated files:

```text
diagrams/use-case.png
diagrams/global-architecture.png
diagrams/layered-backend.png
diagrams/domain-model.png
diagrams/recommendation-sequence.png
diagrams/security-request-flow.png
diagrams/login-sequence.png
diagrams/learner-workflow.png
diagrams/bigdata-pipeline.png
diagrams/mapreduce-keywords.png
```

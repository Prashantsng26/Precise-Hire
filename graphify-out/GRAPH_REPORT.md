# Graph Report - Precise hire  (2026-05-06)

## Corpus Check
- 46 files · ~30,143 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 121 nodes · 90 edges · 7 communities detected
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 30|Community 30]]

## God Nodes (most connected - your core abstractions)
1. `generateEmailBody()` - 5 edges
2. `App (React Entry)` - 5 edges
3. `callLlama()` - 4 edges
4. `sendEmail()` - 4 edges
5. `Backend Express API` - 4 edges
6. `NVIDIA AI Service` - 4 edges
7. `getPipelineData()` - 3 edges
8. `cleanJSON()` - 3 edges
9. `categorizeCandidates()` - 3 edges
10. `scoreCandidates()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Screening Page` --implements--> `Candidate Screening Flow`  [INFERRED]
  frontend/src/pages/Screening.jsx → prd.md
- `NVIDIA NIM (Llama 3.1 70B)` --integrates_with--> `NVIDIA AI Service`  [INFERRED]
  prd.md → backend/services/nvidiaService.js
- `AWS DynamoDB` --integrates_with--> `DynamoDB Data Service`  [INFERRED]
  prd.md → backend/services/dynamoService.js
- `AWS S3` --shares_data_with--> `Excel Parser Service`  [INFERRED]
  prd.md → backend/services/excelParser.js
- `AWS SES` --integrates_with--> `SES Mailer Service`  [INFERRED]
  prd.md → backend/services/sesMailer.js

## Hyperedges (group relationships)
- **AWS Cloud Infrastructure** — aws_dynamodb, aws_s3, aws_ses, aws_textract [INFERRED 0.90]
- **Recruitment Lifecycle** — screening_page, shortlist_page, pipeline_page [INFERRED 0.85]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (16): Admin Upload Page, Frontend API Service, App (React Entry), AWS DynamoDB, AWS SES, AWS Textract OCR, Backend Express API, Candidate Screening Flow (+8 more)

### Community 2 - "Community 2"
Cohesion: 0.24
Nodes (4): getPipelineData(), getCandidatesByJob(), getJob(), updateJob()

### Community 3 - "Community 3"
Cohesion: 0.67
Nodes (5): generateEmailBody(), sendAssessmentLinks(), sendEmail(), sendInterviewInvites(), sendOfferLetters()

### Community 4 - "Community 4"
Cohesion: 0.8
Nodes (4): callLlama(), categorizeCandidates(), cleanJSON(), scoreCandidates()

### Community 7 - "Community 7"
Cohesion: 0.67
Nodes (1): cn()

### Community 8 - "Community 8"
Cohesion: 0.67
Nodes (2): Test POST /api/pipeline/create with jobId and candidateIds to initialize pipelin, test_pipeline_api_create_and_retrieve_candidate_pipeline_status()

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (2): AWS S3, Excel Parser Service

## Knowledge Gaps
- **10 isolated node(s):** `Test POST /api/pipeline/create with jobId and candidateIds to initialize pipelin`, `Dashboard Page`, `Pipeline Kanban`, `Shortlist Leaderboard`, `NVIDIA NIM (Llama 3.1 70B)` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 7`** (3 nodes): `utils.js`, `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (3 nodes): `TC004_pipeline_api_create_and_retrieve_candidate_pipeline_status.py`, `Test POST /api/pipeline/create with jobId and candidateIds to initialize pipelin`, `test_pipeline_api_create_and_retrieve_candidate_pipeline_status()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `AWS S3`, `Excel Parser Service`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 3 inferred relationships involving `generateEmailBody()` (e.g. with `sendInterviewInvites()` and `sendAssessmentLinks()`) actually correct?**
  _`generateEmailBody()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Test POST /api/pipeline/create with jobId and candidateIds to initialize pipelin`, `Dashboard Page`, `Pipeline Kanban` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
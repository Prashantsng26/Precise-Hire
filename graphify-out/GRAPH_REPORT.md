# Graph Report - Precise hire  (2026-05-17)

## Corpus Check
- 46 files · ~30,716 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 129 nodes · 104 edges · 7 communities detected
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 31|Community 31]]

## God Nodes (most connected - your core abstractions)
1. `sleep()` - 6 edges
2. `sendEmail()` - 6 edges
3. `generateEmailBody()` - 5 edges
4. `App (React Entry)` - 5 edges
5. `callLlama()` - 4 edges
6. `sendInterviewInvites()` - 4 edges
7. `sendAssessmentLinks()` - 4 edges
8. `sendOfferLetters()` - 4 edges
9. `Backend Express API` - 4 edges
10. `NVIDIA AI Service` - 4 edges

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
Cohesion: 0.56
Nodes (8): generateEmailBody(), sendAssessmentLinks(), sendEmail(), sendInterviewInvites(), sendOfferLetters(), sendRejectionEmail(), sendRoundClearance(), sleep()

### Community 5 - "Community 5"
Cohesion: 0.8
Nodes (4): callLlama(), categorizeCandidates(), cleanJSON(), scoreCandidates()

### Community 8 - "Community 8"
Cohesion: 0.67
Nodes (1): cn()

### Community 9 - "Community 9"
Cohesion: 0.67
Nodes (2): Test POST /api/pipeline/create with jobId and candidateIds to initialize pipelin, test_pipeline_api_create_and_retrieve_candidate_pipeline_status()

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (2): AWS S3, Excel Parser Service

## Knowledge Gaps
- **10 isolated node(s):** `Test POST /api/pipeline/create with jobId and candidateIds to initialize pipelin`, `Dashboard Page`, `Pipeline Kanban`, `Shortlist Leaderboard`, `NVIDIA NIM (Llama 3.1 70B)` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 8`** (3 nodes): `utils.js`, `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (3 nodes): `TC004_pipeline_api_create_and_retrieve_candidate_pipeline_status.py`, `Test POST /api/pipeline/create with jobId and candidateIds to initialize pipelin`, `test_pipeline_api_create_and_retrieve_candidate_pipeline_status()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `AWS S3`, `Excel Parser Service`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `generateEmailBody()` connect `Community 3` to `Community 5`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `generateEmailBody()` (e.g. with `sendInterviewInvites()` and `sendAssessmentLinks()`) actually correct?**
  _`generateEmailBody()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Test POST /api/pipeline/create with jobId and candidateIds to initialize pipelin`, `Dashboard Page`, `Pipeline Kanban` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
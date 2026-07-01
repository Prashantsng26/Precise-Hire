# Graph Report - Precise hire  (2026-07-01)

## Corpus Check
- 70 files · ~41,464 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 212 nodes · 173 edges · 12 communities detected
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 48|Community 48]]

## God Nodes (most connected - your core abstractions)
1. `Utils` - 6 edges
2. `sleep()` - 6 edges
3. `sendEmail()` - 6 edges
4. `generateEmailBody()` - 5 edges
5. `App (React Entry)` - 5 edges
6. `callLlama()` - 4 edges
7. `sendInterviewInvites()` - 4 edges
8. `sendAssessmentLinks()` - 4 edges
9. `sendOfferLetters()` - 4 edges
10. `Backend Express API` - 4 edges

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

### Community 1 - "Community 1"
Cohesion: 0.19
Nodes (6): createParticles(), parseColor(), renderCanvas(), transformValue(), useIsInView(), VaporizeTextCycle()

### Community 2 - "Community 2"
Cohesion: 0.18
Nodes (3): FinancialScoreDisplay(), handleGenerateScore(), Utils

### Community 5 - "Community 5"
Cohesion: 0.27
Nodes (5): getPipelineData(), getCandidatesByJob(), getJob(), saveJob(), updateJob()

### Community 6 - "Community 6"
Cohesion: 0.56
Nodes (8): generateEmailBody(), sendAssessmentLinks(), sendEmail(), sendInterviewInvites(), sendOfferLetters(), sendRejectionEmail(), sendRoundClearance(), sleep()

### Community 9 - "Community 9"
Cohesion: 0.4
Nodes (2): parseExcel(), mapExcelData()

### Community 10 - "Community 10"
Cohesion: 0.8
Nodes (4): callLlama(), categorizeCandidates(), cleanJSON(), scoreCandidates()

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (2): run(), extractText()

### Community 16 - "Community 16"
Cohesion: 0.67
Nodes (1): cn()

### Community 17 - "Community 17"
Cohesion: 0.67
Nodes (2): Test POST /api/pipeline/create with jobId and candidateIds to initialize pipelin, test_pipeline_api_create_and_retrieve_candidate_pipeline_status()

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (2): cleanJSON(), parseAIResponse()

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (2): AWS S3, Excel Parser Service

## Knowledge Gaps
- **10 isolated node(s):** `Test POST /api/pipeline/create with jobId and candidateIds to initialize pipelin`, `Dashboard Page`, `Pipeline Kanban`, `Shortlist Leaderboard`, `NVIDIA NIM (Llama 3.1 70B)` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 9`** (5 nodes): `excelParser.js`, `excelMapper.js`, `parseExcel()`, `mapExcelData()`, `mapExcelRow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (4 nodes): `textExtractor.js`, `test_pdf.js`, `run()`, `extractText()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (3 nodes): `utils.js`, `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (3 nodes): `TC004_pipeline_api_create_and_retrieve_candidate_pipeline_status.py`, `Test POST /api/pipeline/create with jobId and candidateIds to initialize pipelin`, `test_pipeline_api_create_and_retrieve_candidate_pipeline_status()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (3 nodes): `aiParser.js`, `cleanJSON()`, `parseAIResponse()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (2 nodes): `AWS S3`, `Excel Parser Service`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `generateEmailBody()` connect `Community 6` to `Community 10`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `generateEmailBody()` (e.g. with `sendInterviewInvites()` and `sendAssessmentLinks()`) actually correct?**
  _`generateEmailBody()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Test POST /api/pipeline/create with jobId and candidateIds to initialize pipelin`, `Dashboard Page`, `Pipeline Kanban` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
import requests
import uuid
import time

BASE_URL = "http://localhost:5001"
TIMEOUT = 30

def test_pipeline_api_create_and_retrieve_candidate_pipeline_status():
    """
    Test POST /api/pipeline/create with jobId and candidateIds to initialize pipeline,
    then GET /api/pipeline/status/:jobId to verify rounds, candidates grouped by round,
    and pipeline statistics.
    
    Since the test requires existing candidateIds and a jobId,
    we will:
    - Upload a simple Excel file to generate jobId and candidates
    - Use that jobId and candidateIds to initialize pipeline
    - Call pipeline status to validate response
    Clean up is not explicitly required here as the resource is linked to uploaded job,
    but should we want to delete, that API is not defined,
    so we rely on isolation by unique upload.
    """
    upload_url = f"{BASE_URL}/api/upload"
    pipeline_create_url = f"{BASE_URL}/api/pipeline/create"
    rounds_expected = ["ATS","Interview","Technical","Offer"]

    # Minimal valid Excel content in-memory for upload: create a simple Excel file with required columns.
    # Using openpyxl to create in-memory Excel file.
    try:
        from openpyxl import Workbook
        from io import BytesIO
    except ImportError:
        assert False, "openpyxl is required to run this test"

    # Create a workbook with columns: Name, Email, Resume Link and 2 candidates
    wb = Workbook()
    ws = wb.active
    ws.append(["Name", "Email", "Resume Link"])
    ws.append(["Alice Smith", "alice@example.com", "http://resume-link/alice"])
    ws.append(["Bob Johnson", "bob@example.com", "http://resume-link/bob"])
    file_stream = BytesIO()
    wb.save(file_stream)
    file_stream.seek(0)

    files = {
        'file': ('candidates.xlsx', file_stream, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    }

    # Step 1: Upload Excel file to create job and candidates
    try:
        upload_resp = requests.post(upload_url, files=files, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Upload API request failed: {e}"

    assert upload_resp.status_code == 200, f"Upload API returned status {upload_resp.status_code}"
    upload_json = upload_resp.json()
    assert upload_json.get("success") is True, f"Upload API response success false: {upload_json}"
    job_id = upload_json.get("jobId")
    candidates = upload_json.get("candidates")
    assert job_id and isinstance(job_id, str), "Upload response missing valid jobId"
    assert isinstance(candidates, list) and len(candidates) > 0, "Upload response missing candidates list"

    candidate_ids = []
    for c in candidates:
        cid = c.get("candidateId")
        if cid:
            candidate_ids.append(cid)
    assert candidate_ids, "Candidates missing candidateId"

    # Step 2: POST /api/pipeline/create with jobId and candidateIds
    pipeline_create_payload = {
        "jobId": job_id,
        "candidateIds": candidate_ids
    }
    try:
        create_resp = requests.post(pipeline_create_url, json=pipeline_create_payload, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Pipeline create request failed: {e}"

    assert create_resp.status_code == 200, f"Pipeline create returned status {create_resp.status_code}"
    create_json = create_resp.json()
    assert create_json.get("success") is True, f"Pipeline create success false: {create_json}"

    # Step 3: GET /api/pipeline/status/:jobId
    pipeline_status_url = f"{BASE_URL}/api/pipeline/status/{job_id}"
    try:
        status_resp = requests.get(pipeline_status_url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Pipeline status request failed: {e}"

    assert status_resp.status_code == 200, f"Pipeline status returned status {status_resp.status_code}"
    status_json = status_resp.json()
    assert status_json.get("success") is True, f"Pipeline status success false: {status_json}"

    rounds = status_json.get("rounds")
    candidates_by_round = status_json.get("candidatesByRound")
    stats = status_json.get("stats")

    assert isinstance(rounds, list), "Rounds should be a list"
    # Validate expected rounds present
    for expected_round in rounds_expected:
        assert expected_round in rounds, f"Expected round '{expected_round}' missing in rounds"

    assert isinstance(candidates_by_round, dict), "candidatesByRound should be a dict"
    # Each round key should be present with list of candidate entries
    for round_key in rounds:
        assert round_key in candidates_by_round, f"candidatesByRound missing key for round '{round_key}'"
        assert isinstance(candidates_by_round[round_key], list), f"CandidatesByRound[{round_key}] not a list"

    # Stats should contain total and progressed as integers
    assert isinstance(stats, dict), "Stats should be a dict"
    total = stats.get("total")
    progressed = stats.get("progressed")
    assert isinstance(total, int), "Stats total should be integer"
    assert isinstance(progressed, int), "Stats progressed should be integer"
    assert total == len(candidate_ids), "Stats total candidate count mismatch"

test_pipeline_api_create_and_retrieve_candidate_pipeline_status()

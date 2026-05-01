import requests
import uuid

BASE_URL = "http://localhost:5001"
TIMEOUT = 30

def test_screening_api_ai_powered_candidate_scoring_and_classification():
    # Step 1: Create a new upload job with a valid Excel file to get a jobId and candidate list
    upload_url = f"{BASE_URL}/api/upload"
    excel_content = (
        b"Name,Email,Resume Link\n"
        b"John Doe,john.doe@example.com,http://example.com/resume/john.pdf\n"
        b"Jane Smith,jane.smith@example.com,http://example.com/resume/jane.pdf\n"
    )
    files = {
        "file": ("candidates.xlsx", excel_content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    }
    create_job_resp = requests.post(upload_url, files=files, timeout=TIMEOUT)
    assert create_job_resp.status_code == 200
    create_job_json = create_job_resp.json()
    assert create_job_json.get("success") is True
    job_id = create_job_json.get("jobId")
    assert isinstance(job_id, str) and len(job_id) > 0
    candidates = create_job_json.get("candidates")
    assert isinstance(candidates, list) and len(candidates) > 0

    try:
        # Step 2: POST /api/screen with valid jobId, jobDetails, weightage
        screen_url = f"{BASE_URL}/api/screen"
        job_details = {
            "title": "Software Engineer",
            "description": "Develop and maintain software applications.",
            "skills": ["Python", "AWS", "NVIDIA NIM"],
        }
        weightage = {"skills": 60, "experience": 40}
        screen_payload = {
            "jobId": job_id,
            "jobDetails": job_details,
            "weightage": weightage
        }
        screen_resp = requests.post(screen_url, json=screen_payload, timeout=TIMEOUT)
        assert screen_resp.status_code == 200
        screen_json = screen_resp.json()
        assert screen_json.get("success") is True
        total_candidates = screen_json.get("totalCandidates")
        role_match_count = screen_json.get("roleMatchCount")
        candidates_scored = screen_json.get("candidates")
        assert isinstance(total_candidates, int) and total_candidates > 0
        assert isinstance(role_match_count, int) and 0 <= role_match_count <= total_candidates
        assert isinstance(candidates_scored, list) and len(candidates_scored) > 0
        for c in candidates_scored:
            # Validate candidate scoring and classification fields
            assert isinstance(c.get("candidateId"), str) and len(c["candidateId"]) > 0
            assert isinstance(c.get("role"), str) and len(c["role"]) > 0
            assert isinstance(c.get("weighted_score"), (int, float))
            assert isinstance(c.get("skills_score"), (int, float))
            assert isinstance(c.get("rank"), int)

        # Step 3: GET /api/screen/:jobId to get ranked candidate list
        get_screen_url = f"{BASE_URL}/api/screen/{job_id}"
        get_screen_resp = requests.get(get_screen_url, timeout=TIMEOUT)
        assert get_screen_resp.status_code == 200
        get_screen_json = get_screen_resp.json()
        assert get_screen_json.get("success") is True
        ranked_candidates = get_screen_json.get("candidates")
        assert isinstance(ranked_candidates, list) and len(ranked_candidates) > 0

    finally:
        # Clean up: Delete job resources if such endpoint existed (not given in PRD)
        # As no delete endpoint is specified, skipping deletion.
        pass

test_screening_api_ai_powered_candidate_scoring_and_classification()
import requests
import io
import time

BASE_URL = "http://localhost:5001"
TIMEOUT = 30

def test_upload_api_excel_file_parsing_and_candidate_record_creation():
    # Prepare a valid Excel file in memory with required columns: Name, Email, Resume Link
    from openpyxl import Workbook
    wb = Workbook()
    ws = wb.active
    ws.append(["Name", "Email", "Resume Link"])
    ws.append(["Alice Johnson", "alice.johnson@example.com", "http://example.com/resume/alice.pdf"])
    ws.append(["Bob Smith", "bob.smith@example.com", "http://example.com/resume/bob.pdf"])
    excel_stream = io.BytesIO()
    wb.save(excel_stream)
    excel_stream.seek(0)

    upload_url = f"{BASE_URL}/api/upload"
    dashboard_stats_url = f"{BASE_URL}/api/dashboard/stats"

    # POST /api/upload with the Excel file
    files = {
        "file": ("candidates.xlsx", excel_stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    }
    try:
        upload_resp = requests.post(upload_url, files=files, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Upload request failed: {e}"

    assert upload_resp.status_code == 200, f"Expected 200, got {upload_resp.status_code} with body {upload_resp.text}"
    upload_json = upload_resp.json()
    assert upload_json.get("success") is True, f"Upload API response success!=True: {upload_json}"
    job_id = upload_json.get("jobId")
    assert isinstance(job_id, str) and len(job_id) > 0, "jobId missing or invalid in upload response"
    count = upload_json.get("count")
    assert isinstance(count, int) and count == 2, f"Expected count 2, got {count}"
    candidates_preview = upload_json.get("candidates")
    assert isinstance(candidates_preview, list) and len(candidates_preview) > 0, "Candidates preview missing or empty"

    # Poll dashboard stats and confirm totalCandidates increased (or includes) the new jobId count
    max_attempts = 5
    sleep_sec = 3
    stats_resp = None
    for _ in range(max_attempts):
        try:
            stats_resp = requests.get(dashboard_stats_url, timeout=TIMEOUT)
            if stats_resp.status_code == 200:
                stats_json = stats_resp.json()
                total_candidates = stats_json.get("totalCandidates")
                if isinstance(total_candidates, int) and total_candidates >= count:
                    break
        except requests.RequestException:
            pass
        time.sleep(sleep_sec)
    else:
        assert False, f"Dashboard stats did not reflect uploaded candidates after {max_attempts} attempts"

    assert stats_resp is not None and stats_resp.status_code == 200, f"Failed to get dashboard stats: {stats_resp}"
    stats_json = stats_resp.json()
    assert "totalCandidates" in stats_json, "totalCandidates missing in dashboard stats response"
    assert stats_json["totalCandidates"] >= count, (
        f"Dashboard totalCandidates {stats_json['totalCandidates']} less than uploaded count {count}"
    )

test_upload_api_excel_file_parsing_and_candidate_record_creation()
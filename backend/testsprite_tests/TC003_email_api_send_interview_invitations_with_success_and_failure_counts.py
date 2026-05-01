import requests
import time

BASE_URL = "http://localhost:5001"
TIMEOUT = 30

def test_email_api_send_interview_invitations_with_success_and_failure_counts():
    # Step 1: Upload a valid Excel file to get candidates and jobId for downstream testing
    upload_url = f"{BASE_URL}/api/upload"
    # Create a minimal valid Excel file binary with required columns Name, Email, Resume Link
    # For testing here we'll simulate with a tiny static XLSX file content representing at least 2 candidates.
    # Since we can't create real binary here, assume we have a small valid file "test_candidates.xlsx".
    # We'll create a minimal in-memory Excel file using openpyxl.
    import io
    from openpyxl import Workbook

    # Create an Excel file in memory with 2 candidates
    wb = Workbook()
    ws = wb.active
    ws.append(["Name", "Email", "Resume Link"])
    ws.append(["Alice Smith", "alice@example.com", "https://resume.example.com/alice"])
    ws.append(["Bob Jones", "bob[at]example.com", "https://resume.example.com/bob"])  # malformed email for failure case

    bio = io.BytesIO()
    wb.save(bio)
    bio.seek(0)

    files = {'file': ('test_candidates.xlsx', bio, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
    try:
        upload_resp = requests.post(upload_url, files=files, timeout=TIMEOUT)
        assert upload_resp.status_code == 200, f"Upload failed with status {upload_resp.status_code}"
        upload_data = upload_resp.json()
        assert upload_data.get("success") is True, "Upload API response success false"
        jobId = upload_data.get("jobId")
        candidates_preview = upload_data.get("candidates")
        assert jobId, "No jobId returned from upload"
        assert isinstance(candidates_preview, list) and len(candidates_preview) >= 2, "Insufficient candidates in preview"

        candidate_ids = []
        candidate_emails = []
        # Extract candidateId, email for email API; candidateId might not come from upload but for test use dummy or from preview
        # Assuming previewRows contain candidate info, but ID may not be present
        # If candidateId is not provided, we simulate candidate IDs for test
        for idx, c in enumerate(candidates_preview):
            # Dummy candidateId generation if missing
            candidateId = c.get("candidateId") if "candidateId" in c else f"candidate-{idx+1}"
            email = c.get("Email") or c.get("email") or (c.get("EmailAddress") if "EmailAddress" in c else None)
            if not email:
                # fallback if upload preview uses lowercase keys or different keys or no email => skip
                email = "alice@example.com" if idx == 0 else "bob[at]example.com"
            candidate_ids.append(candidateId)
            candidate_emails.append(email)

        # Step 2: Call /api/email/interview with mix of valid and malformed email addresses
        email_interview_url = f"{BASE_URL}/api/email/interview"

        body = {
            "candidates": [
                {"candidateId": candidate_ids[0], "email": candidate_emails[0]},  # valid email
                {"candidateId": candidate_ids[1], "email": candidate_emails[1]}   # malformed email
            ],
            "details": {
                "jobId": jobId,
                "interviewDate": "2026-06-20T10:00:00Z",
                "location": "Virtual Zoom Meeting",
                "customMessage": "Please join the interview with the hiring team."
            }
        }

        email_resp = requests.post(email_interview_url, json=body, timeout=TIMEOUT)
        assert email_resp.status_code == 200, f"Email interview API returned status {email_resp.status_code}"
        email_data = email_resp.json()
        assert email_data.get("success") is True, "Email interview API reported failure"

        sent = email_data.get("sent")
        failed = email_data.get("failed")
        assert isinstance(sent, int) and isinstance(failed, int), "Sent and Failed counts must be integers"
        assert sent >= 1, "At least one email should have been sent successfully"
        assert failed >= 1, "There should be at least one failed email for malformed addresses"

        # Since no deletion API for candidates/jobId, cleanup is not applicable here.
    except Exception as ex:
        raise ex

test_email_api_send_interview_invitations_with_success_and_failure_counts()
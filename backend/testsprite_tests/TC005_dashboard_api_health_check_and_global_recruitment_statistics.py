import requests

BASE_URL = "http://localhost:5001"
TIMEOUT = 30

def test_dashboard_api_health_and_stats():
    try:
        # Test GET /api/health
        health_resp = requests.get(f"{BASE_URL}/api/health", timeout=TIMEOUT)
        assert health_resp.status_code == 200, f"/api/health status code expected 200 but got {health_resp.status_code}"
        health_json = health_resp.json()
        # The /api/health endpoint has no specific response schema in PRD, just expecting 200 OK for healthy
        # but it may theoretically return status: "unhealthy" + details in 500 case - ignore 500 here
        assert isinstance(health_json, dict), "/api/health response is not a JSON object"

        # Test GET /api/dashboard/stats
        stats_resp = requests.get(f"{BASE_URL}/api/dashboard/stats", timeout=TIMEOUT)
        assert stats_resp.status_code == 200, f"/api/dashboard/stats status code expected 200 but got {stats_resp.status_code}"
        stats_json = stats_resp.json()
        # Validate keys based on PRD description and user flows
        # Expected keys: totalJobs, totalCandidates, avgProcessingTime
        # In-progress counts may also be included as per user flow
        assert "totalJobs" in stats_json, "Missing 'totalJobs' in /api/dashboard/stats response"
        assert "totalCandidates" in stats_json, "Missing 'totalCandidates' in /api/dashboard/stats response"
        assert "avgProcessingTime" in stats_json, "Missing 'avgProcessingTime' in /api/dashboard/stats response"
        # In-progress counts might be present optionally
        # If present, it should be a dict or int, validate type if present
        if "inProgressCounts" in stats_json:
            assert isinstance(stats_json["inProgressCounts"], (dict,int)), "'inProgressCounts' should be dict or int"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_dashboard_api_health_and_stats()
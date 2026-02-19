
resource "google_storage_bucket" "my_app_logs_123" {
  name     = "my-app-logs-123"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

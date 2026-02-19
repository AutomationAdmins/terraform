
resource "google_storage_bucket" "my_dev_logs_456" {
  name     = "my-dev-logs-456"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

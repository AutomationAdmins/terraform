
resource "google_storage_bucket" "dev_log_data" {
  name     = "dev-log-data"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

resource "google_storage_bucket" "test_bucket_456" {
  name     = "test-bucket-456"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

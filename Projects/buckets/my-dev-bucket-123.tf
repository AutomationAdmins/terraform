resource "google_storage_bucket" "my-dev-bucket-123" {
  name     = "my-dev-bucket-123"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

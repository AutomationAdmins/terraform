
resource "google_storage_bucket" "dev-bucket-908" {
  name     = "dev-bucket-908"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

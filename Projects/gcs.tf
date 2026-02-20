
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

resource "google_storage_bucket" "dev_dav" {
  name     = "dev-dav"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

resource "google_storage_bucket" "chumma_for_testing" {
  name     = "chumma_for_testing"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "test"
    owner = "selfservice"
  }
}



resource "google_storage_bucket" "poc_lab_week_bucket" {
  name     = "poc-lab-week-bucket"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

resource "google_storage_bucket" "dev_log_data_567" {
  name     = "dev-log-data-567"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

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

resource "google_storage_bucket" "test_bucket" {
  name     = "${var.project_id}-tf-test-bucket-ram-001"
  location = var.region

  uniform_bucket_level_access = true
}
resource "google_storage_bucket" "my_dev_bucket_1" {
  name     = "my-dev-bucket-1"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

resource "google_storage_bucket" "my_dev_bucket_2" {
  name     = "my-dev-bucket-2"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

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

resource "google_storage_bucket" "first_dev_bucket" {
  name     = "first-dev-bucket"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

resource "google_storage_bucket" "first_dev_bucket" {
  name     = "first-dev-bucket"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

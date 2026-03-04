

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

resource "google_storage_bucket" "my_testing_bucket_987" {
  name     = "my-testing-bucket-987"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

resource "google_storage_bucket" "nainar_maheswari_dev_bucket" {
  name     = "nainar-maheswari-dev-bucket"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

resource "google_storage_bucket" "testing_12_bucket_123" {
  name     = "testing-12-bucket-123"
  location = "us-central1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

resource "google_storage_bucket" "ir_bucket_demo" {
  name     = "ir-bucket-demo"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

resource "google_storage_bucket" "testing_01_bucket_10323" {
  name     = "testing-01-bucket-10323"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

resource "google_storage_bucket" "my_first_demo_bucket" {
  name     = "my-first-demo-bucket"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

resource "google_storage_bucket" "testing_01_3234343" {
  name     = "testing-01-3234343"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

resource "google_storage_bucket" "this_is_my_bucket_2921019019" {
  name     = "this-is-my-bucket-2921019019"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

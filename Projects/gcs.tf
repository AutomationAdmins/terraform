resource "google_storage_bucket" "test_bucket" {
  name     = "${var.project_id}-tf-test-bucket-ram-001"
  location = var.region

  uniform_bucket_level_access = true
}
resource "google_storage_bucket" "my_dev_bucket_245" {
  name     = "my-dev-bucket-245"
  location = "ap-southeast-2"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

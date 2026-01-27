resource "google_storage_bucket" "test_bucket" {
  name     = "${var.project_id}-tf-test-bucket-ram-001"
  location = var.region

  uniform_bucket_level_access = true
}
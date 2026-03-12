
resource "google_storage_bucket" "my_bket_sys_1435" {
  name     = "my-bket-sys-1435"
  location = "asia-south1"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env   = "dev"
    owner = "selfservice"
  }
}

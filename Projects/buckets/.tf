resource "google_storage_bucket" "" {
  name     = ""
  location = ""

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  labels = {
    env = ""
    owner = "selfservice"
  }
}

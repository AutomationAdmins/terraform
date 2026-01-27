terraform {
  backend "gcs" {
    bucket = "avid-invention-484506-g9-tf-state"
    prefix = "dev"
  }
}
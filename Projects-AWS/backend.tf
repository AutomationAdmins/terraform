terraform {
  backend "s3" {
    bucket = "infra-provisioner-state-bucket"
    key    = "dev/terraform.tfstate"
    region = "ap-southeast-2"
  }
}

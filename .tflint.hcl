# Terraform core rules
config {
  format = "default"
}

# Google Cloud ruleset
plugin "google" {
  enabled = true
  version = "0.29.0"
  source  = "github.com/terraform-linters/tflint-ruleset-google"
}

# AWS ruleset
plugin "aws" {
  enabled = true
  version = "0.32.0"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}

# Soft governance: enable useful rules but not blocking
rule "google_resource_missing_labels" {
  enabled = true
}

rule "terraform_naming_convention" {
  enabled = true
  format = "^[a-z0-9-]+$"
}

rule "google_invalid_region" {
  enabled = true
  allowed_regions = ["asia-south1", "asia-south2"]
}
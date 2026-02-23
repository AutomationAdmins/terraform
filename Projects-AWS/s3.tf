
resource "aws_s3_bucket" "my_dev_logs_678" {
  bucket = "my-dev-logs-678"

  tags = {
    Environment = "dev"
    Owner       = "selfservice"
  }
}

resource "aws_s3_bucket_public_access_block" "my_dev_logs_678_public_access" {
  bucket = aws_s3_bucket.my_dev_logs_678.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

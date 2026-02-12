# AWS S3 Buckets - Add your S3 bucket resources here

resource "aws_s3_bucket" "my_dev_bucket_456" {
  bucket = "my-dev-bucket-456"

  tags = {
    Environment = "dev"
    Owner       = "selfservice"
  }
}

resource "aws_s3_bucket_public_access_block" "my_dev_bucket_456_public_access" {
  bucket = aws_s3_bucket.my_dev_bucket_456.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "my_dev_bucket_2" {
  bucket = "my-dev-bucket-2"

  tags = {
    Environment = "dev"
    Owner       = "selfservice"
  }
}

resource "aws_s3_bucket_public_access_block" "my_dev_bucket_2_public_access" {
  bucket = aws_s3_bucket.my_dev_bucket_2.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "my_dev_bucket_09" {
  bucket = "my-dev-bucket-09"

  tags = {
    Environment = "dev"
    Owner       = "selfservice"
  }
}

resource "aws_s3_bucket_public_access_block" "my_dev_bucket_09_public_access" {
  bucket = aws_s3_bucket.my_dev_bucket_09.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

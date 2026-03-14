
resource "aws_s3_bucket" "my_sys_aws_app_1324" {
  bucket = "my-sys-aws-app-1324"

  tags = {
    Environment = "dev"
    Owner       = "selfservice"
  }
}

resource "aws_s3_bucket_public_access_block" "my_sys_aws_app_1324_public_access" {
  bucket = aws_s3_bucket.my_sys_aws_app_1324.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

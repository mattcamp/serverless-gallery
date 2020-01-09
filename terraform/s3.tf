resource "aws_s3_bucket" "gallery-uploads" {
  bucket = "${var.s3_prefix}-gallery-uploads"
  acl    = "private"

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]
    max_age_seconds = 600
  }

  tags = {
    Name        = "gallery-uploads"
  }
}

resource "aws_s3_bucket" "gallery-public" {
  bucket = "${var.s3_prefix}-gallery-public"
  acl    = "public-read"

  tags = {
    Name        = "gallery-public"
  }

  website {
    index_document = "index.html"
  }
}

resource "aws_dynamodb_table" "gallery-uploads-table" {
  name           = "gallery-uploads"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "filename"

  attribute {
    name = "filename"
    type = "S"
  }

}

resource "aws_dynamodb_table" "gallery-albums-table" {
  name           = "gallery-albums"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "name"

  attribute {
    name = "name"
    type = "S"
  }

}

resource "aws_dynamodb_table" "gallery-images-table" {
  name           = "gallery-images"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "filepath"

  attribute {
    name = "filepath"
    type = "S"
  }

}
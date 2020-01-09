resource "aws_cloudwatch_log_group" "galleryAdminLogGroup" {
  name              = "/aws/lambda/${aws_lambda_function.galleryAdmin_lambda.function_name}"
  retention_in_days = 14
}

# See also the following AWS managed policy: AWSLambdaBasicExecutionRole
resource "aws_iam_policy" "galleryAdmin_logging_policy" {
  name = "galleryAdmin_lambda_logging"
  path = "/"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*",
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "galleryAdmin_lambda_logs" {
  role = aws_iam_role.gallery_admin_lambda_role.name
  policy_arn = aws_iam_policy.galleryAdmin_logging_policy.arn
}

resource "aws_lambda_function" "galleryAdmin_lambda" {
  filename      = "../lambda/gallery-admin/lambda.zip"
  function_name = "gallery-admin"
  role          = aws_iam_role.gallery_admin_lambda_role.arn
  handler       = "index.handler"
  depends_on    = [aws_iam_role_policy_attachment.galleryAdmin_lambda_logs]

  # The filebase64sha256() function is available in Terraform 0.11.12 and later
  # For Terraform 0.11.11 and earlier, use the base64sha256() function and the file() function:
  # source_code_hash = "${base64sha256(file("lambda_function_payload.zip"))}"
  source_code_hash = filebase64sha256("../lambda/gallery-admin/lambda.zip")

  runtime = "nodejs12.x"
  timeout = 60
  memory_size = 256

  environment {
    variables = {
      s3_src_bucket = aws_s3_bucket.gallery-uploads.bucket,
      s3_target_bucket = aws_s3_bucket.gallery-public.bucket,
      uploadsTable = aws_dynamodb_table.gallery-uploads-table.name,
      imagesTable = aws_dynamodb_table.gallery-images-table.name,
      albumsTable = aws_dynamodb_table.gallery-albums-table.name
    }
  }
}